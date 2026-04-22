"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type ExamRow = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  mode: "full" | "drill";
  active: boolean;
  questionsCount: number;
  updatedAt: string;
};

type ProgramFilter = "all" | ExamRow["program"];

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

function programLabel(p: ExamRow["program"]): string {
  switch (p) {
    case "ielts":
      return "IELTS";
    case "dsat":
      return "Digital SAT";
    case "general":
      return "General English";
    default:
      return p;
  }
}

function modeLabel(m: ExamRow["mode"]): string {
  return m === "full" ? "Full" : "Drill";
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 14) return `${days} d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function programAccentClass(p: ExamRow["program"]): string {
  switch (p) {
    case "dsat":
      return "bg-[var(--accent)]";
    case "ielts":
      return "bg-[var(--program-ielts)]";
    case "general":
      return "bg-[var(--program-general)]";
    default:
      return "bg-[var(--program-muted)]";
  }
}

export default function ExamsPage() {
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<ProgramFilter>("all");

  const fetchExams = useCallback(async (opts?: { silent?: boolean }) => {
    setError(null);
    if (opts?.silent) setRefreshing(true);
    try {
      const data = await api<{ exams: ExamRow[] }>("/api/exams");
      setRows(data.exams);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchExams();
  }, [fetchExams]);

  const filtered = useMemo(() => {
    let list = rows;
    if (programFilter !== "all") list = list.filter((r) => r.program === programFilter);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || programLabel(r.program).toLowerCase().includes(q),
      );
    return list;
  }, [rows, query, programFilter]);

  async function toggleActive(row: ExamRow) {
    setError(null);
    setMutatingId(row.id);
    try {
      await api(`/api/exams/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      await fetchExams({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setMutatingId(null);
    }
  }

  async function deleteExam(row: ExamRow) {
    const ok = window.confirm(`Delete “${row.title}”? This cannot be undone from here.`);
    if (!ok) return;
    setError(null);
    setMutatingId(row.id);
    try {
      await api(`/api/exams/${row.id}`, { method: "DELETE" });
      await fetchExams({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setMutatingId(null);
    }
  }

  const filterPills: { id: ProgramFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "dsat", label: "Digital SAT" },
    { id: "ielts", label: "IELTS" },
    { id: "general", label: "General" },
  ];

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div className="w-full space-y-6">
        {/* Controls — separate panel */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">Exams</h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Published exams can be assigned.{" "}
                  <Link href="/dashboard/assign-exams" className="text-[var(--accent)] underline-offset-2 hover:underline">
                    Assign exams
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href="/dashboard/exams/new"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                >
                  New exam
                </Link>
                <button
                  type="button"
                  onClick={() => void fetchExams({ silent: true })}
                  disabled={refreshing || initialLoad}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)] disabled:opacity-50"
                >
                  {refreshing ? "Updating…" : "Refresh"}
                </button>
              </div>
            </div>

            {!initialLoad && rows.length > 0 ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by program">
                  {filterPills.map((pill) => {
                    const on = programFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setProgramFilter(pill.id)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          on
                            ? "bg-[var(--text)] text-[var(--surface)]"
                            : "bg-[var(--background)] text-[var(--muted)] ring-1 ring-[var(--border)] hover:text-[var(--text)]"
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="search"
                  placeholder="Search by title…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 lg:max-w-md xl:max-w-lg"
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="border-t border-[var(--error-border-soft)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)] sm:px-6" role="alert">
              {error}
            </div>
          ) : null}
        </section>

        {/* Exam list — its own panel */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="flex flex-col gap-1 border-b border-[var(--border)] bg-[var(--background)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-sm font-semibold text-[var(--text)]">Exam list</h2>
            {!initialLoad ? (
              <p className="text-xs text-[var(--muted)]">
                {filtered.length} of {rows.length} shown
              </p>
            ) : null}
          </div>

          <div className={refreshing ? "pointer-events-none opacity-60" : ""}>
            {initialLoad ? (
              <div className="divide-y divide-[var(--border)]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 px-4 py-4 sm:px-6">
                    <div className="h-10 w-1 animate-pulse rounded-full bg-[var(--skeleton)]" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-[var(--skeleton)]" />
                      <div className="h-3 w-full max-w-lg animate-pulse rounded bg-[var(--skeleton-muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-16 text-center sm:px-6">
                <p className="text-sm font-medium text-[var(--text)]">No exams yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">
                  Create an exam to add questions. Use Activate / Deactivate to control whether it can be assigned and taken.
                </p>
                <Link
                  href="/dashboard/exams/new"
                  className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                >
                  New exam
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-[var(--muted)] sm:px-6">
                Nothing matches this filter or search.{" "}
                <button
                  type="button"
                  className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                  onClick={() => {
                    setQuery("");
                    setProgramFilter("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {filtered.map((row) => {
                  const busy = mutatingId === row.id;
                  return (
                    <li key={row.id}>
                      <div className="flex gap-0 sm:gap-1">
                        <div className={`w-1 shrink-0 self-stretch sm:w-1.5 ${programAccentClass(row.program)}`} aria-hidden />
                        <div className="flex min-w-0 flex-1 flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="truncate text-[15px] font-semibold text-[var(--text)] sm:text-lg">
                                {row.title}
                              </span>
                              <span className="shrink-0 text-xs text-[var(--faint)]">·</span>
                              <span className="text-xs text-[var(--muted)] sm:text-sm">
                                {programLabel(row.program)} · {modeLabel(row.mode)} · {row.questionsCount} Q
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--faint)]">Edited {formatRelative(row.updatedAt)}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-3">
                            <span className="text-xs font-medium text-[var(--muted)] sm:text-sm">
                              {row.active ? (
                                <span className="text-[var(--success-badge-text)]">Active</span>
                              ) : (
                                <span className="text-[var(--inactive-text)]">Inactive</span>
                              )}
                            </span>
                            <div className="flex items-center gap-1 border-l border-[var(--border)] pl-3 sm:gap-2 sm:pl-4">
                              <Link
                                href={`/dashboard/exams/${row.id}`}
                                className="rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] sm:px-3"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggleActive(row)}
                                className="rounded-md px-2 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--hover-strong)] hover:text-[var(--text)] disabled:opacity-40 sm:px-3"
                              >
                                {busy ? "…" : row.active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void deleteExam(row)}
                                className="rounded-md px-2 py-1.5 text-sm font-medium text-[var(--danger-text)] hover:bg-[var(--danger-hover)] disabled:opacity-40 sm:px-3"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
