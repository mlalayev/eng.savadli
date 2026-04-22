"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type ExamRow = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  mode: "full" | "drill";
  active: boolean;
  questionsCount: number;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "creator" | "admin" | "teacher" | "student" | "parent";
  status: "active" | "disabled";
};

type Program = ExamRow["program"];

type AttemptStatus = {
  exists: boolean;
  status: "none" | "in_progress" | "submitted" | "graded";
  startedAt: string | null;
  submittedAt: string | null;
};

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AssignExamsPage() {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [students, setStudents] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [openStudent, setOpenStudent] = useState<UserRow | null>(null);
  const [modalProgram, setModalProgram] = useState<Program>("dsat");
  const [modalExamId, setModalExamId] = useState<string>("");
  const [modalTitle, setModalTitle] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const [ex, us] = await Promise.all([
      api<{ exams: ExamRow[] }>("/api/exams"),
      api<{ users: UserRow[] }>("/api/users"),
    ]);
    setExams(ex.exams.filter((e) => e.active));
    setStudents(us.users.filter((u) => u.role === "student" && u.status === "active"));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLoading(false);
    });
  }, [load]);

  useEffect(() => {
    if (!openStudent) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenStudent(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openStudent]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q));
  }, [students, query]);

  const examsForProgram = useMemo(() => {
    return exams.filter((e) => e.program === modalProgram);
  }, [exams, modalProgram]);

  const selectedExam = useMemo(() => exams.find((e) => e.id === modalExamId) ?? null, [exams, modalExamId]);

  useEffect(() => {
    if (!openStudent) return;
    if (!modalExamId) {
      setAttemptStatus(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const st = await api<{ status: AttemptStatus }>(
          `/api/attempts/status?studentId=${encodeURIComponent(openStudent.id)}&examId=${encodeURIComponent(modalExamId)}`,
        );
        if (!cancelled) setAttemptStatus(st.status);
      } catch {
        if (!cancelled) setAttemptStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openStudent, modalExamId]);

  const openAssignModal = useCallback(
    (s: UserRow) => {
      setOpenStudent(s);
      setModalError(null);
      setAttemptStatus(null);
      setModalProgram("dsat");
      setModalExamId("");
      setModalTitle("");
    },
    [],
  );

  const closeAssignModal = useCallback(() => {
    setOpenStudent(null);
    setModalError(null);
    setAttemptStatus(null);
    setModalExamId("");
    setModalTitle("");
  }, []);

  async function assignToStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!openStudent) return;
    if (!modalExamId) return;
    setModalError(null);
    setAssigning(true);
    try {
      await api("/api/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          examId: modalExamId,
          title: modalTitle.trim() || selectedExam?.title || "Exam assignment",
          studentIds: [openStudent.id],
        }),
      });
      window.alert("Assigned.");
      closeAssignModal();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <RoleGuard allow={["creator", "admin"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Assign exams</h1>
        <p className="mt-2 text-[var(--muted)]">
          Search students and assign an exam in one click. Students will see it in their Assignments.
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">
            {error}
          </p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Students</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Click a student to assign an exam.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email…"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm sm:w-72"
              />
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
          ) : filteredStudents.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No students match that search.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <ul className="divide-y divide-[var(--border)]">
                {filteredStudents.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openAssignModal(s)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[var(--hover)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--text)]">{s.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{s.email}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">Assign →</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {openStudent ? (
          <div className="fixed inset-0 z-50" aria-hidden={!openStudent}>
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
              aria-label="Close dialog"
              onClick={() => closeAssignModal()}
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="assign-exam-title"
                className="pointer-events-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl sm:max-h-[min(88vh,720px)] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <h2 id="assign-exam-title" className="text-base font-semibold tracking-tight text-[var(--text)]">
                      Assign exam
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                      {openStudent.name} · {openStudent.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => closeAssignModal()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {modalError ? (
                  <p className="m-4 rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)] sm:m-5" role="alert">
                    {modalError}
                  </p>
                ) : null}

                <form onSubmit={assignToStudent} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Program</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["dsat", "ielts", "general"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setModalProgram(p);
                              setModalExamId("");
                              setAttemptStatus(null);
                            }}
                            className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                              modalProgram === p
                                ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)]"
                            }`}
                          >
                            {p === "dsat" ? "Digital SAT" : p === "ielts" ? "IELTS" : "General"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block text-xs font-medium text-[var(--muted)]">
                      Exam
                      <select
                        className="mt-1 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                        value={modalExamId}
                        onChange={(e) => {
                          setModalExamId(e.target.value);
                          setModalTitle("");
                        }}
                        required
                      >
                        <option value="" disabled>
                          Select an active exam…
                        </option>
                        {examsForProgram.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.title} ({ex.mode} · {ex.questionsCount} q)
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[11px] text-[var(--faint)]">
                        Only active exams are shown.
                      </span>
                    </label>

                    {modalExamId ? (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text)]">{selectedExam?.title ?? "Exam"}</p>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {selectedExam ? `${selectedExam.program}/${selectedExam.mode} · ${selectedExam.questionsCount} questions` : ""}
                            </p>
                          </div>
                          {attemptStatus?.exists ? (
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                attemptStatus.status === "in_progress"
                                  ? "bg-[var(--warning-badge-bg)] text-[var(--warning-badge-text)]"
                                  : "bg-[var(--success-badge-bg)] text-[var(--success-badge-text)]"
                              }`}
                            >
                              {attemptStatus.status === "in_progress" ? "Already started" : "Already taken"}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                              Not taken
                            </span>
                          )}
                        </div>
                        {attemptStatus?.exists ? (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Started: {formatWhen(attemptStatus.startedAt)} · Submitted: {formatWhen(attemptStatus.submittedAt)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <label className="block text-xs font-medium text-[var(--muted)]">
                      Title shown to student (optional)
                      <input
                        className="mt-1 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        placeholder={selectedExam?.title ?? "Exam assignment"}
                      />
                    </label>
                  </div>

                  <div className="mt-5 border-t border-[var(--border)] pt-4">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => closeAssignModal()}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={assigning || !modalExamId}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
                      >
                        {assigning ? "Assigning…" : attemptStatus?.exists ? "Assign anyway" : "Assign exam"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}

