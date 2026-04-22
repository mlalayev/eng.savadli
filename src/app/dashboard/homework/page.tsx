"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import type { HomeworkTask } from "@/lib/homework/types";

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
  isComplete?: boolean;
  submittedCount?: number;
  totalRequired?: number;
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

function formatDue(iso: string | null): string {
  if (!iso) return "No due date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HomeworkListCard({ h }: { h: HomeworkRow }) {
  const done = h.isComplete === true;
  const progress =
    typeof h.submittedCount === "number" && typeof h.totalRequired === "number" && h.totalRequired > 0
      ? `${h.submittedCount}/${h.totalRequired} parts`
      : null;

  return (
    <li>
      <Link
        href={`/dashboard/homework/${h.id}`}
        className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]/30"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">{h.classTitle}</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">{h.title}</h2>
            {progress ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {progress}
                {done ? " · finished" : ""}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <p className="text-sm text-[var(--muted)]">{formatDue(h.dueAt)}</p>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                done
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
              }`}
            >
              {done ? "Done" : "To do"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-[var(--accent)]">Open →</p>
      </Link>
    </li>
  );
}

export default function HomeworkPage() {
  const [items, setItems] = useState<HomeworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ homework: HomeworkRow[] }>("/api/homework");
      setItems(data.homework);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load homework");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [items]);

  const { todo, done } = useMemo(() => {
    const t: HomeworkRow[] = [];
    const d: HomeworkRow[] = [];
    for (const h of sorted) {
      if (h.isComplete === true) d.push(h);
      else t.push(h);
    }
    return { todo: t, done: d };
  }, [sorted]);

  return (
    <RoleGuard allow={["student"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Homework</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Open an assignment to work through it step by step. Each activity has its own submit button; finished work
            moves to the Done list.
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

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-[var(--text)]">No homework yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              When you are added to a class and your teacher posts homework, it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-[var(--text)]">Not finished</h2>
              {todo.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">You are all caught up.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {todo.map((h) => (
                    <HomeworkListCard key={h.id} h={h} />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-[var(--text)]">Done</h2>
              {done.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">No completed homework yet.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {done.map((h) => (
                    <HomeworkListCard key={h.id} h={h} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
