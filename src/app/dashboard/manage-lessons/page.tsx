"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type LessonRow = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  createdAt: string;
  updatedAt: string;
  studentIds: string[];
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

export default function ManageLessonsPage() {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [program, setProgram] = useState<LessonRow["program"]>("ielts");
  const [body, setBody] = useState("");

  async function refresh() {
    setError(null);
    const data = await api<{ lessons: LessonRow[] }>("/api/lessons");
    setRows(data.lessons);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void refresh().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    });
  }, []);

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api("/api/lessons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, program, body }),
      });
      setTitle("");
      setBody("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Manage lessons</h1>
        <p className="mt-2 text-[var(--muted)]">
          Create lesson notes/materials and assign them to specific students (or leave unassigned to show all students).
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">New lesson</h2>
            <form className="mt-4 flex flex-col gap-3" onSubmit={createLesson}>
              <label className="text-sm font-medium text-[var(--text)]">
                Title
                <input
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>
              <label className="text-sm font-medium text-[var(--text)]">
                Program
                <select
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={program}
                  onChange={(e) => setProgram(e.target.value as LessonRow["program"])}
                >
                  <option value="ielts">ielts</option>
                  <option value="dsat">dsat</option>
                  <option value="general">general</option>
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--text)]">
                Body
                <textarea
                  className="mt-1 block min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {busy ? "Creating…" : "Create lesson"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">All lessons</h2>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
              >
                Refresh
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {rows.map((l) => (
                <div key={l.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">{l.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {l.program} · Updated {new Date(l.updatedAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--faint)]">
                        Visibility: {l.studentIds.length === 0 ? "all students" : `${l.studentIds.length} student(s)`}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/manage-lessons/${l.id}`}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
              {rows.length === 0 ? <p className="text-sm text-[var(--muted)]">No lessons yet.</p> : null}
            </div>
            <p className="mt-6 text-xs text-[var(--faint)]">
              Students see lessons at <Link className="underline" href="/dashboard/lessons">Lessons</Link>.
            </p>
          </section>
        </div>
      </div>
    </RoleGuard>
  );
}

