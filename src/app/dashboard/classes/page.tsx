"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { HomeworkTasksBuilder } from "@/components/homework/HomeworkTasksBuilder";
import { useAuth } from "@/context/auth-context";
import type { HomeworkTask } from "@/lib/homework/types";
import { HOMEWORK_META_TASK_ID, requiredSubmissionIds, submittedCount } from "@/lib/homework/progress-types";

type ProgramCategory = "dsat" | "ielts" | "general";

type ClassRow = {
  id: string;
  title: string;
  category: ProgramCategory | null;
  teacherIds: string[];
  studentIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  surname?: string;
  role: "creator" | "admin" | "teacher" | "student" | "parent";
  status: "active" | "disabled";
};

type MemberMeta = { name: string; email: string };

type HomeworkRow = {
  id: string;
  classId: string;
  classTitle: string;
  title: string;
  instructions: string;
  tasks?: HomeworkTask[];
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type HomeworkProgressRow = {
  studentId: string;
  updatedAt: string;
  submitted: Record<string, { submittedAt: string; payload: unknown }>;
};

type HomeworkSubmissionsPayload = {
  homework: HomeworkRow;
  students: string[];
  progress: HomeworkProgressRow[];
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

function categoryLabel(c: ProgramCategory | null): string {
  if (!c) return "—";
  switch (c) {
    case "dsat":
      return "SAT";
    case "ielts":
      return "IELTS";
    case "general":
      return "General English";
    default:
      return c;
  }
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function useStudentEmailSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  const [results, setResults] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (debounced.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    void (async () => {
      try {
        const d = await api<{ users: UserRow[] }>(`/api/users?search=${encodeURIComponent(debounced)}`);
        if (!cancelled) setResults(d.users);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const reset = useCallback(() => {
    setQuery("");
    setDebounced("");
    setResults([]);
    setSearching(false);
  }, []);

  return { query, setQuery, results, searching, reset };
}

function StudentSearchAddBlock(props: {
  label: string;
  hint: string;
  search: ReturnType<typeof useStudentEmailSearch>;
  onPick: (u: UserRow) => void;
  pickedIds: Set<string>;
  /** Higher when rendered inside a modal so the list appears above the dialog. */
  resultsZClass?: string;
}) {
  const { label, hint, search, onPick, pickedIds, resultsZClass = "z-30" } = props;
  const showPanel = search.query.trim().length > 0;

  return (
    <div>
      <p className="text-sm font-medium text-[var(--text)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
      <div className="relative mt-2">
        <input
          type="search"
          autoComplete="off"
          placeholder="Type email or name…"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          className="block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
        />
        {showPanel ? (
          <ul
            className={`absolute left-0 right-0 mt-1 max-h-52 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg ${resultsZClass}`}
          >
            {search.searching ? (
              <li className="px-3 py-2 text-sm text-[var(--muted)]">Searching…</li>
            ) : search.results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--muted)]">No active students match that text.</li>
            ) : (
              search.results.map((u) => {
                const already = pickedIds.has(u.id);
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => onPick(u)}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-medium text-[var(--text)]">{u.name}</span>
                      <span className="text-xs text-[var(--muted)]">{u.email}</span>
                      {already ? <span className="text-xs text-[var(--faint)]">Already in list</span> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const { user } = useAuth();
  const isCreator = user?.role === "creator";

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [directory, setDirectory] = useState<UserRow[]>([]);
  const [memberMeta, setMemberMeta] = useState<Record<string, MemberMeta>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addClassOpen, setAddClassOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ProgramCategory>("dsat");
  const [newTeacherIds, setNewTeacherIds] = useState<string[]>([]);
  const [newStudentIds, setNewStudentIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const newClassSearch = useStudentEmailSearch();
  const rosterSearch = useStudentEmailSearch();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"roster" | "homework">("roster");
  const [draftRoster, setDraftRoster] = useState<Record<string, string[]>>({});
  const [savingRosterId, setSavingRosterId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [homeworkByClass, setHomeworkByClass] = useState<Record<string, HomeworkRow[]>>({});
  const [homeworkLoadingClassId, setHomeworkLoadingClassId] = useState<string | null>(null);
  const [homeworkError, setHomeworkError] = useState<string | null>(null);

  const [addHwOpen, setAddHwOpen] = useState(false);
  const [addHwClassId, setAddHwClassId] = useState("");
  const [addHwClassTitle, setAddHwClassTitle] = useState("");
  const [hwTitle, setHwTitle] = useState("");
  const [hwInstructions, setHwInstructions] = useState("");
  const [hwDueAt, setHwDueAt] = useState("");
  const [hwTasks, setHwTasks] = useState<HomeworkTask[]>([]);
  const [hwSubmitting, setHwSubmitting] = useState(false);
  const [hwSubmitError, setHwSubmitError] = useState<string | null>(null);
  const [deletingHwId, setDeletingHwId] = useState<string | null>(null);

  const [subsOpen, setSubsOpen] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subsData, setSubsData] = useState<HomeworkSubmissionsPayload | null>(null);
  const [subsStudentQuery, setSubsStudentQuery] = useState("");
  const [subsOnlyMissing, setSubsOnlyMissing] = useState(false);
  const [subsSelectedStudentId, setSubsSelectedStudentId] = useState<string | null>(null);

  const closeAddClass = useCallback(() => {
    setAddClassOpen(false);
    setCreateError(null);
    setNewTitle("");
    setNewCategory("dsat");
    setNewStudentIds([]);
    newClassSearch.reset();
    if (user?.id && isCreator) setNewTeacherIds([user.id]);
    else if (user?.id) setNewTeacherIds([user.id]);
  }, [user?.id, isCreator, newClassSearch]);

  const openAddClass = useCallback(() => {
    setCreateError(null);
    setAddClassOpen(true);
  }, []);

  const rememberUser = useCallback((u: UserRow) => {
    setMemberMeta((prev) => ({ ...prev, [u.id]: { name: u.name, email: u.email } }));
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const cl = await api<{ classes: ClassRow[] }>("/api/classes");
      setClasses(cl.classes);
      setSelectedClassId((prev) => {
        if (prev && cl.classes.some((c) => c.id === prev)) return prev;
        return cl.classes[0]?.id ?? null;
      });

      const allStudentIds = [...new Set(cl.classes.flatMap((c) => c.studentIds))];
      if (allStudentIds.length > 0) {
        try {
          const res = await api<{ users: UserRow[] }>("/api/users/resolve", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ids: allStudentIds }),
          });
          setMemberMeta((prev) => {
            const next = { ...prev };
            for (const u of res.users) {
              next[u.id] = { name: u.name, email: u.email };
            }
            return next;
          });
        } catch {
          /* roster labels are optional */
        }
      }

      if (user?.role === "creator") {
        const us = await api<{ users: UserRow[] }>("/api/users");
        setDirectory(us.users);
      } else {
        setDirectory([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user?.id) return;
    void load();
  }, [user?.id, user?.role, load]);

  useEffect(() => {
    if (!user?.id) return;
    if (isCreator) {
      setNewTeacherIds((prev) => (prev.length ? prev : [user.id]));
    } else {
      setNewTeacherIds([user.id]);
    }
  }, [user?.id, isCreator]);

  useEffect(() => {
    if (!addClassOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAddClass();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addClassOpen, closeAddClass]);

  const closeAddHomework = useCallback(() => {
    setAddHwOpen(false);
    setHwSubmitError(null);
    setHwTitle("");
    setHwInstructions("");
    setHwDueAt("");
    setHwTasks([]);
    setAddHwClassId("");
    setAddHwClassTitle("");
  }, []);

  const closeSubmissions = useCallback(() => {
    setSubsOpen(false);
    setSubsLoading(false);
    setSubsError(null);
    setSubsData(null);
    setSubsStudentQuery("");
    setSubsOnlyMissing(false);
    setSubsSelectedStudentId(null);
  }, []);

  useEffect(() => {
    if (!addHwOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAddHomework();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addHwOpen, closeAddHomework]);

  useEffect(() => {
    if (!subsOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSubmissions();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [subsOpen, closeSubmissions]);

  const fetchHomeworkForClass = useCallback(async (classId: string) => {
    setHomeworkError(null);
    setHomeworkLoadingClassId(classId);
    try {
      const d = await api<{ homework: HomeworkRow[] }>(`/api/homework?classId=${encodeURIComponent(classId)}`);
      setHomeworkByClass((prev) => ({ ...prev, [classId]: d.homework }));
    } catch (e) {
      setHomeworkError(e instanceof Error ? e.message : "Failed to load homework");
    } finally {
      setHomeworkLoadingClassId(null);
    }
  }, []);

  const teachersAndCreators = useMemo(
    () => directory.filter((u) => (u.role === "teacher" || u.role === "creator") && u.status === "active"),
    [directory],
  );

  function toggleTeacher(id: string) {
    setNewTeacherIds((prev) => {
      const on = prev.includes(id);
      if (on) {
        const next = prev.filter((x) => x !== id);
        if (next.length === 0 && user?.id) return [user.id];
        return next;
      }
      return [...prev, id];
    });
  }

  function rosterFor(classId: string, fallback: string[]) {
    return draftRoster[classId] ?? fallback;
  }

  function addStudentToRosterDraft(classId: string, u: UserRow, serverIds: string[]) {
    rememberUser(u);
    setDraftRoster((prev) => {
      const cur = prev[classId] ?? [...serverIds];
      if (cur.includes(u.id)) return prev;
      return { ...prev, [classId]: [...cur, u.id] };
    });
    rosterSearch.reset();
  }

  function removeStudentFromRosterDraft(classId: string, studentId: string, serverIds: string[]) {
    setDraftRoster((prev) => {
      const cur = prev[classId] ?? [...serverIds];
      return { ...prev, [classId]: cur.filter((x) => x !== studentId) };
    });
  }

  function pickStudentForNewClass(u: UserRow) {
    rememberUser(u);
    setNewStudentIds((prev) => (prev.includes(u.id) ? prev : [...prev, u.id]));
    newClassSearch.reset();
  }

  function removeStudentFromNewClass(id: string) {
    setNewStudentIds((prev) => prev.filter((x) => x !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const teacherIds = isCreator && newTeacherIds.length ? newTeacherIds : user?.id ? [user.id] : [];
      await api("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          teacherIds: isCreator ? teacherIds : undefined,
          studentIds: newStudentIds.length ? newStudentIds : undefined,
        }),
      });
      closeAddClass();
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create class");
    } finally {
      setCreating(false);
    }
  }

  async function saveRoster(classRow: ClassRow) {
    setError(null);
    setSavingRosterId(classRow.id);
    try {
      const studentIds = rosterFor(classRow.id, classRow.studentIds);
      await api(`/api/classes/${classRow.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentIds }),
      });
      setDraftRoster((prev) => {
        const next = { ...prev };
        delete next[classRow.id];
        return next;
      });
      rosterSearch.reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save roster");
    } finally {
      setSavingRosterId(null);
    }
  }

  async function removeClass(id: string) {
    const ok = window.confirm("Delete this class? Student enrollments will be removed.");
    if (!ok) return;
    setError(null);
    setDeletingId(id);
    try {
      await api(`/api/classes/${id}`, { method: "DELETE" });
      setSelectedClassId((prev) => (prev === id ? null : prev));
      rosterSearch.reset();
      setDraftRoster((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setHomeworkByClass((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateHomework(e: React.FormEvent) {
    e.preventDefault();
    const classId = addHwClassId;
    if (!classId) return;
    setHwSubmitError(null);

    const instr = hwInstructions.trim();
    if (instr.length === 0 && hwTasks.length === 0) {
      setHwSubmitError("Add instructions or at least one activity block.");
      return;
    }

    for (const t of hwTasks) {
      if (t.kind === "image" && !t.url.trim()) {
        setHwSubmitError("Each image block needs a URL or an upload (or remove that block).");
        return;
      }
      if (t.kind === "essay" && !t.prompt.trim()) {
        setHwSubmitError("Each essay block needs a prompt (or remove that block).");
        return;
      }
      if (t.kind === "choice") {
        if (!t.prompt.trim()) {
          setHwSubmitError("Each multiple-choice block needs a question.");
          return;
        }
        if (t.options.some((o) => !o.trim())) {
          setHwSubmitError("Fill every answer option, or remove an extra option line.");
          return;
        }
      }
      if (t.kind === "paragraph" && !t.text.trim()) {
        setHwSubmitError("Remove empty text blocks or add text to them.");
        return;
      }
    }

    setHwSubmitting(true);
    try {
      await api("/api/homework", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId,
          title: hwTitle.trim(),
          instructions: instr,
          dueAt: hwDueAt.trim() || undefined,
          tasks: hwTasks.length ? hwTasks : undefined,
        }),
      });
      closeAddHomework();
      await fetchHomeworkForClass(classId);
    } catch (err) {
      setHwSubmitError(err instanceof Error ? err.message : "Failed to add homework");
    } finally {
      setHwSubmitting(false);
    }
  }

  async function deleteHomeworkItem(hwId: string, classId: string) {
    const ok = window.confirm("Delete this homework? Students will no longer see it.");
    if (!ok) return;
    setHomeworkError(null);
    setDeletingHwId(hwId);
    try {
      await api(`/api/homework/${hwId}`, { method: "DELETE" });
      await fetchHomeworkForClass(classId);
    } catch (e) {
      setHomeworkError(e instanceof Error ? e.message : "Failed to delete homework");
    } finally {
      setDeletingHwId(null);
    }
  }

  const userNameById = useMemo(() => {
    const m = new Map<string, string>();
    if (user?.id && user?.name) m.set(user.id, user.name);
    for (const u of directory) {
      m.set(u.id, u.name || `${u.firstName ?? ""} ${u.surname ?? ""}`.trim() || u.email);
    }
    return m;
  }, [directory, user?.id, user?.name]);

  function labelForStudent(id: string) {
    const meta = memberMeta[id];
    if (meta) return `${meta.name} · ${meta.email}`;
    return userNameById.get(id) ?? id;
  }

  async function openSubmissionsForHomework(hwId: string) {
    setSubsError(null);
    setSubsOpen(true);
    setSubsLoading(true);
    try {
      const data = await api<HomeworkSubmissionsPayload>(`/api/homework/${encodeURIComponent(hwId)}/submissions`);
      setSubsData(data);
      setSubsSelectedStudentId(data.students[0] ?? null);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to load submissions");
      setSubsData(null);
    } finally {
      setSubsLoading(false);
    }
  }

  const newPickedSet = useMemo(() => new Set(newStudentIds), [newStudentIds]);

  return (
    <RoleGuard allow={["creator", "teacher"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Classes</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Your classes are listed below. Use Add class to create one. Edit roster to manage students, or Homework to
            post tasks—students see homework on their Homework tab. Creators can assign co-teachers when creating a
            class.
          </p>
        </div>

        {error ? (
          <p
            className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {(() => {
          const selectedClass = selectedClassId ? classes.find((c) => c.id === selectedClassId) ?? null : null;
          return (
            <div className="grid gap-6 lg:grid-cols-12">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm lg:col-span-4">
                <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[var(--text)]">Your classes</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openAddClass()}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => void load()}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)]">Pick a class to manage roster and homework.</p>
                </div>

                {loading ? (
                  <p className="px-5 py-4 text-sm text-[var(--muted)]">Loading…</p>
                ) : classes.length === 0 ? (
                  <div className="px-5 py-6">
                    <p className="text-sm font-medium text-[var(--text)]">No classes yet</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Create your first class to start assigning homework.</p>
                  </div>
                ) : (
                  <div className="max-h-[68vh] overflow-y-auto p-3">
                    <ul className="space-y-2">
                      {classes.map((c) => {
                        const active = c.id === selectedClassId;
                        const hwList = homeworkByClass[c.id];
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClassId(c.id);
                                setActivePanel("roster");
                                rosterSearch.reset();
                                setDraftRoster((prev) => ({ ...prev, [c.id]: prev[c.id] ?? [...c.studentIds] }));
                              }}
                              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                active
                                  ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
                                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="min-w-0 truncate text-sm font-semibold text-[var(--text)]">{c.title}</p>
                                <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                                  {categoryLabel(c.category)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {c.studentIds.length} students · {c.teacherIds.length} teacher(s)
                                {typeof hwList?.length === "number" ? ` · ${hwList.length} hw` : ""}
                              </p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm lg:col-span-8">
                {!selectedClass ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-medium text-[var(--text)]">Select a class</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Choose a class from the left to view roster and homework.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                          {categoryLabel(selectedClass.category)}
                        </p>
                        <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-[var(--text)]">
                          {selectedClass.title}
                        </h2>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {selectedClass.studentIds.length} students · {selectedClass.teacherIds.length} teacher(s) · Teachers:{" "}
                          {selectedClass.teacherIds.map((id) => userNameById.get(id) ?? id).join(", ") || "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePanel("roster");
                            rosterSearch.reset();
                            setDraftRoster((prev) => ({
                              ...prev,
                              [selectedClass.id]: prev[selectedClass.id] ?? [...selectedClass.studentIds],
                            }));
                          }}
                          className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                            activePanel === "roster"
                              ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)]"
                          }`}
                        >
                          Roster
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePanel("homework");
                            void fetchHomeworkForClass(selectedClass.id);
                          }}
                          className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                            activePanel === "homework"
                              ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)]"
                          }`}
                        >
                          Homework
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === selectedClass.id}
                          onClick={() => void removeClass(selectedClass.id)}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--error-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--error-text)] transition hover:bg-[var(--danger-hover)] disabled:opacity-50"
                        >
                          {deletingId === selectedClass.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {activePanel === "roster" ? (
                        (() => {
                          const roster = rosterFor(selectedClass.id, selectedClass.studentIds);
                          const dirty =
                            JSON.stringify([...roster].sort()) !== JSON.stringify([...selectedClass.studentIds].sort());
                          const rosterPicked = new Set(roster);
                          return (
                            <div className="space-y-4">
                              <StudentSearchAddBlock
                                label="Add students"
                                hint="Type part of an email or name, then pick a student from the list."
                                search={rosterSearch}
                                onPick={(u) => addStudentToRosterDraft(selectedClass.id, u, selectedClass.studentIds)}
                                pickedIds={rosterPicked}
                              />

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                                  Students in this class ({roster.length})
                                </p>
                                {roster.length === 0 ? (
                                  <p className="mt-2 text-sm text-[var(--muted)]">No students yet. Add some above.</p>
                                ) : (
                                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {roster.map((sid) => (
                                      <li
                                        key={sid}
                                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                                      >
                                        <span className="min-w-0 truncate text-[var(--text)]">{labelForStudent(sid)}</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeStudentFromRosterDraft(selectedClass.id, sid, selectedClass.studentIds)
                                          }
                                          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[var(--danger-text)] hover:bg-[var(--danger-hover)]"
                                        >
                                          Remove
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={!dirty || savingRosterId === selectedClass.id}
                                  onClick={() => void saveRoster(selectedClass)}
                                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                                >
                                  {savingRosterId === selectedClass.id ? "Saving…" : "Save roster"}
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        (() => {
                          const hwList = homeworkByClass[selectedClass.id] ?? [];
                          return (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[var(--text)]">Homework</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddHwClassId(selectedClass.id);
                                    setAddHwClassTitle(selectedClass.title);
                                    setHwSubmitError(null);
                                    setHwTasks([]);
                                    setAddHwOpen(true);
                                  }}
                                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                                >
                                  Add homework
                                </button>
                              </div>

                              {homeworkError ? (
                                <p
                                  className="rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)]"
                                  role="alert"
                                >
                                  {homeworkError}
                                </p>
                              ) : null}

                              {homeworkLoadingClassId === selectedClass.id ? (
                                <p className="text-sm text-[var(--muted)]">Loading homework…</p>
                              ) : hwList.length === 0 ? (
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-center">
                                  <p className="text-sm font-medium text-[var(--text)]">No homework yet</p>
                                  <p className="mt-2 text-sm text-[var(--muted)]">
                                    Post a homework item for students in this class.
                                  </p>
                                </div>
                              ) : (
                                <ul className="space-y-2">
                                  {hwList.map((h) => (
                                    <li key={h.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="font-semibold text-[var(--text)]">{h.title}</p>
                                          <p className="mt-1 text-xs text-[var(--muted)]">
                                            {h.dueAt
                                              ? `Due ${new Date(h.dueAt).toLocaleString(undefined, {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "numeric",
                                                  minute: "2-digit",
                                                })}`
                                              : "No due date"}
                                            {h.tasks?.length ? ` · ${h.tasks.length} activities` : ""}
                                          </p>
                                          {h.instructions.trim() ? (
                                            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-[var(--muted)]">
                                              {h.instructions}
                                            </p>
                                          ) : null}
                                        </div>
                                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => void openSubmissionsForHomework(h.id)}
                                            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
                                          >
                                            Submissions
                                          </button>
                                          <button
                                            type="button"
                                            disabled={deletingHwId === h.id}
                                            onClick={() => void deleteHomeworkItem(h.id, selectedClass.id)}
                                            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--error-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--error-text)] transition hover:bg-[var(--danger-hover)] disabled:opacity-50"
                                          >
                                            {deletingHwId === h.id ? "…" : "Delete"}
                                          </button>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          );
        })()}

        {subsOpen ? (
          <div className="fixed inset-0 z-50" aria-hidden={!subsOpen}>
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
              aria-label="Close dialog"
              onClick={() => closeSubmissions()}
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="submissions-title"
                className="pointer-events-auto flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl sm:max-h-[min(88vh,860px)] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <h2 id="submissions-title" className="text-base font-semibold tracking-tight text-[var(--text)]">
                      Homework submissions
                    </h2>
                    {subsData?.homework?.title ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        {subsData.homework.classTitle} · {subsData.homework.title}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => closeSubmissions()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {subsError ? (
                  <p
                    className="m-4 rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)] sm:m-5"
                    role="alert"
                  >
                    {subsError}
                  </p>
                ) : null}

                {subsLoading ? (
                  <p className="px-4 py-4 text-sm text-[var(--muted)] sm:px-5">Loading…</p>
                ) : !subsData ? (
                  <p className="px-4 py-4 text-sm text-[var(--muted)] sm:px-5">No data.</p>
                ) : (
                  <SubmissionsPanel
                    data={subsData}
                    labelForStudent={labelForStudent}
                    studentQuery={subsStudentQuery}
                    setStudentQuery={setSubsStudentQuery}
                    onlyMissing={subsOnlyMissing}
                    setOnlyMissing={setSubsOnlyMissing}
                    selectedStudentId={subsSelectedStudentId}
                    setSelectedStudentId={setSubsSelectedStudentId}
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}

        {addClassOpen ? (
          <div className="fixed inset-0 z-50" aria-hidden={!addClassOpen}>
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
              aria-label="Close dialog"
              onClick={() => closeAddClass()}
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-class-title"
                className="pointer-events-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl sm:max-h-[min(88vh,760px)] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <h2 id="add-class-title" className="text-base font-semibold tracking-tight text-[var(--text)]">
                      Add class
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Create a class and optionally add students now.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => closeAddClass()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

              {createError ? (
                <p
                  className="m-4 rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)] sm:m-5"
                  role="alert"
                >
                  {createError}
                </p>
              ) : null}

              <form className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" onSubmit={handleCreate}>
                <div className="space-y-5">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Title
                  <input
                    className="mt-1 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Saturday DSAT cohort"
                    required
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Category
                  <select
                    className="mt-1 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProgramCategory)}
                  >
                    <option value="dsat">SAT</option>
                    <option value="ielts">IELTS</option>
                    <option value="general">General English</option>
                  </select>
                </label>

                {isCreator ? (
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)]">Teachers on this class</p>
                    <p className="mt-1 text-[11px] text-[var(--faint)]">Include yourself or any teacher/creator accounts.</p>
                    <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                      {teachersAndCreators.map((t) => (
                        <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newTeacherIds.includes(t.id)}
                            onChange={() => toggleTeacher(t.id)}
                          />
                          <span className="truncate">{t.name}</span>
                          <span className="truncate text-xs text-[var(--muted)]">{t.email}</span>
                        </label>
                      ))}
                      {teachersAndCreators.length === 0 ? (
                        <p className="text-xs text-[var(--muted)]">No teacher accounts found.</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <StudentSearchAddBlock
                  label="Students (optional)"
                  hint="Results update as you type. Pick a row to add them to this class."
                  search={newClassSearch}
                  onPick={pickStudentForNewClass}
                  pickedIds={newPickedSet}
                  resultsZClass="z-[100]"
                />

                {newStudentIds.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Added students</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {newStudentIds.map((id) => (
                        <li
                          key={id}
                          className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] py-1 pl-3 pr-1 text-xs text-[var(--text)]"
                        >
                          <span className="truncate">{labelForStudent(id)}</span>
                          <button
                            type="button"
                            onClick={() => removeStudentFromNewClass(id)}
                            className="rounded-full px-2 py-0.5 font-semibold text-[var(--muted)] hover:bg-[var(--hover-strong)] hover:text-[var(--text)]"
                            aria-label="Remove student"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                </div>

                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => closeAddClass()}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || loading}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
                    >
                      {creating ? "Creating…" : "Create class"}
                    </button>
                  </div>
                </div>
              </form>
              </div>
            </div>
          </div>
        ) : null}

        {addHwOpen ? (
          <div className="fixed inset-0 z-50" aria-hidden={!addHwOpen}>
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
              aria-label="Close dialog"
              onClick={() => closeAddHomework()}
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-homework-title"
                className="pointer-events-auto flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl sm:max-h-[min(88vh,760px)] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <h2 id="add-homework-title" className="text-base font-semibold tracking-tight text-[var(--text)]">
                      Add homework
                    </h2>
                    {addHwClassTitle ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">Class: {addHwClassTitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => closeAddHomework()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

              {hwSubmitError ? (
                <p
                  className="m-4 rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)] sm:m-5"
                  role="alert"
                >
                  {hwSubmitError}
                </p>
              ) : null}

              <form className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" onSubmit={handleCreateHomework}>
                <div className="space-y-5">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Title
                  <input
                    className="mt-1 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    placeholder="e.g. Read module 2 + exercises"
                    required
                  />
                </label>
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Instructions
                  <textarea
                    className="mt-1 block min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                    value={hwInstructions}
                    onChange={(e) => setHwInstructions(e.target.value)}
                    placeholder="What students should do, links, page numbers…"
                    required={hwTasks.length === 0}
                  />
                </label>

                <HomeworkTasksBuilder tasks={hwTasks} onChange={setHwTasks} />
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Due (optional)
                  <input
                    type="datetime-local"
                    className="mt-1 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                    value={hwDueAt}
                    onChange={(e) => setHwDueAt(e.target.value)}
                  />
                </label>
                </div>

                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => closeAddHomework()}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={hwSubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
                    >
                      {hwSubmitting ? "Saving…" : "Post homework"}
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

function SubmissionsPanel({
  data,
  labelForStudent,
  studentQuery,
  setStudentQuery,
  onlyMissing,
  setOnlyMissing,
  selectedStudentId,
  setSelectedStudentId,
}: {
  data: HomeworkSubmissionsPayload;
  labelForStudent: (id: string) => string;
  studentQuery: string;
  setStudentQuery: (v: string) => void;
  onlyMissing: boolean;
  setOnlyMissing: (v: boolean) => void;
  selectedStudentId: string | null;
  setSelectedStudentId: (v: string | null) => void;
}) {
  const tasks = data.homework.tasks ?? [];
  const requiredIds = requiredSubmissionIds(tasks);
  const progressByStudent = new Map(data.progress.map((p) => [p.studentId, p]));

  const rows = data.students.map((studentId) => {
    const p = progressByStudent.get(studentId);
    const submitted = p?.submitted ?? {};
    const done = requiredIds.every((id) => Object.prototype.hasOwnProperty.call(submitted, id));
    const count = submittedCount(tasks, submitted);
    const last = p?.updatedAt ?? null;
    return { studentId, done, count, total: requiredIds.length, last, submitted };
  });

  rows.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const at = a.last ? new Date(a.last).getTime() : 0;
    const bt = b.last ? new Date(b.last).getTime() : 0;
    return bt - at;
  });

  function taskLabel(tid: string): string {
    if (tid === HOMEWORK_META_TASK_ID) return "Homework";
    const idx = tasks.findIndex((t) => t.id === tid);
    if (idx === -1) return tid;
    const t = tasks[idx];
    switch (t.kind) {
      case "essay":
        return `Essay ${idx + 1}`;
      case "choice":
        return `Choice ${idx + 1}`;
      case "fill":
        return `Fill ${idx + 1}`;
      case "wordOrder":
        return `Word order ${idx + 1}`;
      case "image":
        return `Image ${idx + 1}`;
      case "paragraph":
        return `Text ${idx + 1}`;
      default:
        return `Task ${idx + 1}`;
    }
  }

  function renderAnswer(tid: string, payload: unknown): ReactNode {
    if (tid === HOMEWORK_META_TASK_ID) return <span className="text-xs text-[var(--muted)]">Submitted</span>;
    const task = tasks.find((t) => t.id === tid);
    if (!task) return <span className="text-xs text-[var(--muted)]">—</span>;
    if (task.kind === "essay") {
      const text =
        payload && typeof payload === "object" && "text" in (payload as Record<string, unknown>)
          ? String((payload as { text: unknown }).text ?? "")
          : "";
      return <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{text}</p>;
    }
    if (task.kind === "choice") {
      const idx =
        payload && typeof payload === "object" && "selectedIndex" in (payload as Record<string, unknown>)
          ? Number((payload as { selectedIndex: unknown }).selectedIndex)
          : NaN;
      const picked = Number.isFinite(idx) ? task.options[idx] : "—";
      const correct = Number.isFinite(idx) ? idx === task.correctIndex : false;
      return (
        <p className="text-sm text-[var(--text)]">
          {picked}{" "}
          <span
            className={`text-xs font-semibold ${
              correct ? "text-[var(--success-badge-text)]" : "text-[var(--danger-text)]"
            }`}
          >
            {correct ? "✓" : "✗"}
          </span>
        </p>
      );
    }
    if (task.kind === "fill") {
      const values =
        payload && typeof payload === "object" && "values" in (payload as Record<string, unknown>)
          ? (payload as { values: unknown }).values
          : [];
      const arr = Array.isArray(values) ? values.map((v) => String(v)) : [];
      return <p className="text-sm text-[var(--text)]">{arr.join(" · ")}</p>;
    }
    if (task.kind === "wordOrder") {
      const words =
        payload && typeof payload === "object" && "words" in (payload as Record<string, unknown>)
          ? (payload as { words: unknown }).words
          : [];
      const arr = Array.isArray(words) ? words.map((v) => String(v)) : [];
      return <p className="text-sm text-[var(--text)]">{arr.join(" ")}</p>;
    }
    return <span className="text-xs text-[var(--muted)]">Marked complete</span>;
  }

  const query = studentQuery.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (onlyMissing && r.done) return false;
    if (!query) return true;
    return labelForStudent(r.studentId).toLowerCase().includes(query);
  });

  const selected =
    filtered.find((r) => r.studentId === selectedStudentId) ?? filtered[0] ?? rows[0] ?? null;

  useEffect(() => {
    if (!selected) {
      setSelectedStudentId(null);
      return;
    }
    if (selectedStudentId && selected.studentId === selectedStudentId) return;
    setSelectedStudentId(selected.studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.studentId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)] sm:px-5">
        <span>
          Students: <span className="font-semibold text-[var(--text)]">{rows.length}</span> · Required parts:{" "}
          <span className="font-semibold text-[var(--text)]">{requiredIds.length}</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Search student…"
            className="h-9 w-48 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--faint)]"
          />
          <label className="inline-flex h-9 select-none items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(e) => setOnlyMissing(e.target.checked)}
            />
            Missing only
          </label>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-5 text-sm text-[var(--muted)] sm:px-5">No students in this class.</div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="min-h-0 overflow-y-auto">
            <ul className="p-2 sm:p-3">
              {filtered.length === 0 ? (
                <li className="px-2 py-3 text-sm text-[var(--muted)]">No students match.</li>
              ) : (
                filtered.map((r) => {
                  const active = r.studentId === (selected?.studentId ?? null);
                  return (
                    <li key={r.studentId}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(r.studentId)}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
                            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-semibold text-[var(--text)]">
                            {labelForStudent(r.studentId)}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              r.done
                                ? "bg-[var(--success-badge-bg)] text-[var(--success-badge-text)]"
                                : "bg-[var(--warning-badge-bg)] text-[var(--warning-badge-text)]"
                            }`}
                          >
                            {r.done ? "Done" : "To do"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {r.count}/{r.total} parts · Updated {formatWhen(r.last)}
                        </p>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="min-h-0 overflow-y-auto sm:col-span-2">
            {!selected ? (
              <div className="px-4 py-5 text-sm text-[var(--muted)] sm:px-5">Pick a student to view answers.</div>
            ) : (
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Student</p>
                    <p className="mt-1 truncate text-lg font-semibold text-[var(--text)]">
                      {labelForStudent(selected.studentId)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {selected.done ? "Done" : "In progress"} · {selected.count}/{selected.total} required parts · Last
                      update {formatWhen(selected.last)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {requiredIds.map((tid) => {
                    const rec = selected.submitted[tid];
                    return (
                      <div key={tid} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                            {taskLabel(tid)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {rec ? formatWhen(rec.submittedAt) : "Not submitted"}
                          </p>
                        </div>
                        {rec ? <div className="mt-2">{renderAnswer(tid, rec.payload)}</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

