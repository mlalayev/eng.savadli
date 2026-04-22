"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type AttemptRow = {
  id: string;
  submittedAt: string | null;
  needsManual: boolean;
  status: string;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  assignment: null | { id: string; title: string };
  exam: null | { id: string; title: string; program: string; mode: string };
  student: null | { id: string; name: string; email: string };
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

export default function GradebookPage() {
  const [filter, setFilter] = useState<"all" | "needs_manual">("needs_manual");
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh(nextFilter = filter) {
    setError(null);
    const data = await api<{ attempts: AttemptRow[] }>(`/api/gradebook?filter=${nextFilter}`);
    setRows(data.attempts);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void refresh().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Gradebook</h1>
            <p className="mt-2 text-[var(--muted)]">Review submitted attempts and finalize manual grades.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => {
                const next = e.target.value as "all" | "needs_manual";
                setFilter(next);
                void refresh(next).catch((err) =>
                  setError(err instanceof Error ? err.message : "Failed to load"),
                );
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
            >
              <option value="needs_manual">Needs manual grading</option>
              <option value="all">All submitted</option>
            </select>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-[var(--border)]">
              <tr className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Scores</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--text)]">{r.student?.name ?? "—"}</p>
                    <p className="text-xs text-[var(--muted)]">{r.student?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">{r.assignment?.title ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text)]">{r.exam?.title ?? "—"}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {r.exam ? `${r.exam.program}/${r.exam.mode}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    Auto {r.autoScore} · Manual {r.manualScore} · Total{" "}
                    <span className="font-semibold text-[var(--text)]">{r.totalScore}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.needsManual && r.status !== "graded" ? (
                      <span className="rounded-full bg-[var(--warning-badge-bg)] px-2.5 py-1 font-semibold text-[var(--warning-badge-text)]">
                        needs manual
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--success-badge-bg)] px-2.5 py-1 font-semibold text-[var(--success-badge-text)]">
                        {r.status}
                      </span>
                    )}
                    <div className="mt-1 text-[11px] text-[var(--faint)]">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/gradebook/${r.id}`}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                    No submitted attempts.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
}

