"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type StudentRow = { id: string; name: string; email: string };

type Lesson = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  body: string;
  links: Array<{ label: string; url: string }>;
  studentIds: string[];
  updatedAt: string;
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

export default function EditLessonPage() {
  const params = useParams();
  const lessonId = typeof params?.id === "string" ? params.id : "";
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [program, setProgram] = useState<Lesson["program"]>("ielts");
  const [body, setBody] = useState("");
  const [linksRaw, setLinksRaw] = useState("");
  const [visibility, setVisibility] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedStudentIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected],
  );

  const load = useCallback(async () => {
    setError(null);
    if (!lessonId) return;
    const [l, s] = await Promise.all([
      api<{ lesson: Lesson }>(`/api/lessons/${lessonId}`),
      api<{ students: StudentRow[] }>("/api/students"),
    ]);
    setLesson(l.lesson);
    setStudents(s.students);
    setTitle(l.lesson.title);
    setProgram(l.lesson.program);
    setBody(l.lesson.body);
    setLinksRaw((l.lesson.links ?? []).map((x) => `${x.label} | ${x.url}`).join("\n"));
    setVisibility(l.lesson.studentIds.length === 0 ? "all" : "selected");
    setSelected(Object.fromEntries((l.lesson.studentIds ?? []).map((id) => [id, true])));
  }, [lessonId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  function parseLinks() {
    const lines = linksRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const links: Array<{ label: string; url: string }> = [];
    for (const line of lines) {
      const [label, url] = line.split("|").map((s) => s.trim());
      if (!label || !url) continue;
      links.push({ label, url });
    }
    return links;
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title,
        program,
        body,
        links: parseLinks(),
        studentIds: visibility === "all" ? [] : selectedStudentIds,
      };
      const data = await api<{ lesson: Lesson }>(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setLesson(data.lesson);
      window.alert("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div>
        <Link href="/dashboard/manage-lessons" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Manage lessons
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">Edit lesson</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {lesson ? `Last updated ${new Date(lesson.updatedAt).toLocaleString()}` : "Loading…"}
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Content</h2>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                Save
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="text-sm font-medium text-[var(--text)]">
                Title
                <input
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="text-sm font-medium text-[var(--text)]">
                Program
                <select
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={program}
                  onChange={(e) => setProgram(e.target.value as Lesson["program"])}
                >
                  <option value="ielts">ielts</option>
                  <option value="dsat">dsat</option>
                  <option value="general">general</option>
                </select>
              </label>

              <label className="text-sm font-medium text-[var(--text)]">
                Body (plain text for now)
                <textarea
                  className="mt-1 block min-h-60 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </label>

              <label className="text-sm font-medium text-[var(--text)]">
                Links (one per line as: label | url)
                <textarea
                  className="mt-1 block min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm font-mono"
                  value={linksRaw}
                  onChange={(e) => setLinksRaw(e.target.value)}
                  placeholder={"Google Doc | https://...\nWorksheet | https://..."}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Visibility</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">If set to “all”, every student can see it.</p>

            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <input
                  type="radio"
                  name="vis"
                  checked={visibility === "all"}
                  onChange={() => setVisibility("all")}
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text)]">All students</span>
                  <span className="block text-xs text-[var(--muted)]">No per-student assignment.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <input
                  type="radio"
                  name="vis"
                  checked={visibility === "selected"}
                  onChange={() => setVisibility("selected")}
                />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text)]">Selected students</span>
                  <span className="block text-xs text-[var(--muted)]">Only checked students can see it.</span>
                </span>
              </label>
            </div>

            {visibility === "selected" ? (
              <div className="mt-4 space-y-2">
                {students.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selected[s.id])}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--text)]">{s.name}</span>
                      <span className="block truncate text-xs text-[var(--muted)]">{s.email}</span>
                    </span>
                  </label>
                ))}
                {students.length === 0 ? <p className="text-sm text-[var(--muted)]">No students found.</p> : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </RoleGuard>
  );
}

