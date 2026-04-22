"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type LessonRow = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  createdAt: string;
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

export default function StudentLessonsPage() {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <RoleGuard allow={["student"]}>
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Lessons</h1>
            <p className="mt-2 text-[var(--muted)]">Materials, notes, and links from your sessions.</p>
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
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        <div className="mt-8 space-y-3">
          {rows.map((l) => (
            <div key={l.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-[var(--text)]">{l.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {l.program} · {new Date(l.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/lessons/${l.id}`}
                  className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              No lessons yet.
            </div>
          ) : null}
        </div>
      </div>
    </RoleGuard>
  );
}
