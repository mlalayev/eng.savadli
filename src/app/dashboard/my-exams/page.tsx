"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type AssignmentRow = {
  id: string;
  title: string;
  dueAt: string | null;
  createdAt: string;
  exam: null | {
    id: string;
    title: string;
    program: string;
    mode: string;
    questionsCount: number;
  };
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

export default function MyExamsPage() {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const data = await api<{ assignments: AssignmentRow[] }>("/api/assignments");
    setRows(data.assignments);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    });
  }, [refresh]);

  return (
    <RoleGuard allow={["student"]}>
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Exams</h1>
            <p className="mt-2 text-[var(--muted)]">
              Exams your teacher or admin assigned to you. Open one to start or continue. The full list also appears
              under <span className="font-semibold text-[var(--text)]">Assignments</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          {rows.map((a) => (
            <div key={a.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-[var(--text)]">{a.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {a.exam ? `${a.exam.title} · ${a.exam.program}/${a.exam.mode} · ${a.exam.questionsCount} questions` : "Exam missing"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--faint)]">
                    Due: {a.dueAt ? new Date(a.dueAt).toLocaleString() : "—"} · Assigned{" "}
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/assignments/${a.id}`}
                  className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                >
                  Open exam
                </Link>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              <p>No assigned exams yet.</p>
              <p className="mt-2 text-xs">
                When a teacher or admin assigns an exam to your account, it will show up here after you click Refresh or
                reload the page.
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-xs text-[var(--faint)]">
          Tip: IELTS exams open in a dedicated layout with section navigation at the bottom.
        </p>
      </div>
    </RoleGuard>
  );
}
