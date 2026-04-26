import Link from "next/link";
import type { Exam } from "./types";

type ExamHeaderProps = {
  exam: Exam;
  totalQuestions: number;
  totalPoints: number;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isDsat?: boolean;
};

export function ExamHeader({
  exam,
  totalQuestions,
  totalPoints,
  dirty,
  saving,
  onSave,
  onToggleActive,
  onDelete,
  isDsat = false,
}: ExamHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
          {isDsat ? "Digital SAT · Exam editor" : "Exam"}
        </p>
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-[var(--text)]">{exam.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {exam.program} · {exam.mode} · {totalQuestions} questions in editor · {totalPoints} pts ·{" "}
          {exam.active ? "active" : "inactive"}
          {dirty ? <span className="font-semibold text-[var(--warning-badge-text)]"> · Unsaved changes</span> : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/exams"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
        >
          ← Back
        </Link>
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={onSave}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save exam"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onToggleActive}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--hover)] disabled:opacity-50"
        >
          {exam.active ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onDelete}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 text-sm font-semibold text-[var(--error-text)] transition hover:opacity-80 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
