"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { HomeworkTaskStep } from "@/components/homework/HomeworkTaskStep";
import { HOMEWORK_META_TASK_ID, isHomeworkComplete } from "@/lib/homework/progress-types";
import type { HomeworkTask } from "@/lib/homework/types";

type SubmissionJson = {
  byTask: Record<string, { submittedAt: string; payload: unknown }>;
  updatedAt: string;
} | null;

type HomeworkDetail = {
  id: string;
  classId: string;
  classTitle: string;
  title: string;
  instructions: string;
  tasks?: HomeworkTask[];
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  submission: SubmissionJson;
};

type Step =
  | { kind: "instructions"; body: string }
  | { kind: "task"; task: HomeworkTask };

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

function totalRequiredTasks(tasks: HomeworkTask[] | undefined): number {
  return (tasks ?? []).length;
}

function buildSteps(instructions: string, tasks: HomeworkTask[] | undefined): Step[] {
  const t = tasks ?? [];
  const steps: Step[] = [];
  if (instructions.trim()) steps.push({ kind: "instructions", body: instructions.trim() });
  for (const task of t) steps.push({ kind: "task", task });
  return steps;
}

function initialStepIndex(steps: Step[], byTask: Record<string, unknown> | undefined): number {
  if (steps.length === 0) return 0;
  const anyTaskSubmitted = steps.some(
    (s) => s.kind === "task" && byTask && Object.prototype.hasOwnProperty.call(byTask, s.task.id),
  );
  if (!anyTaskSubmitted) return 0;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.kind !== "task") continue;
    if (!byTask?.[s.task.id]) return i;
  }
  return 0;
}

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

export default function HomeworkDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [hw, setHw] = useState<HomeworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const seededStep = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    seededStep.current = false;
    try {
      const data = await api<{ homework: HomeworkDetail & { submission?: SubmissionJson } }>(`/api/homework/${id}`);
      const h = data.homework;
      setHw({
        ...h,
        submission: h.submission ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setHw(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const steps = useMemo(() => (hw ? buildSteps(hw.instructions, hw.tasks) : []), [hw]);

  const byTask = hw?.submission?.byTask;

  useEffect(() => {
    if (!hw) return;
    if (isHomeworkComplete(hw.tasks, byTask)) {
      seededStep.current = true;
      return;
    }
    if (seededStep.current) return;
    setStepIndex(initialStepIndex(steps, byTask));
    seededStep.current = true;
  }, [hw, steps, byTask]);

  const complete = hw ? isHomeworkComplete(hw.tasks, byTask) : false;

  const submitTask = useCallback(
    async (taskId: string, payload: unknown) => {
      if (!id) return;
      setSubmitting(true);
      setSubmitErr(null);
      try {
        const data = await api<{ homework: HomeworkDetail & { submission?: SubmissionJson } }>(
          `/api/homework/${id}/task`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ taskId, payload }),
          },
        );
        const h = data.homework;
        const submission = h.submission ?? null;
        const nextBy = submission?.byTask;
        setHw({
          ...h,
          submission,
        });
        if (!isHomeworkComplete(h.tasks, nextBy)) {
          const nextSteps = buildSteps(h.instructions, h.tasks);
          setStepIndex((i) => Math.min(i + 1, Math.max(nextSteps.length - 1, 0)));
        }
      } catch (e) {
        setSubmitErr(e instanceof Error ? e.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [id],
  );

  const currentStep = steps[stepIndex];
  const taskStep = currentStep?.kind === "task" ? currentStep : null;
  const tasksOnly = (hw?.tasks ?? []).length;
  const instructionsOnlyHomework = Boolean(hw?.instructions.trim()) && tasksOnly === 0;
  const submittedCount = hw?.submission?.byTask ? Object.keys(hw.submission.byTask).length : 0;
  const requiredCount = totalRequiredTasks(hw?.tasks);

  return (
    <RoleGuard allow={["student"]}>
      <div className="w-full space-y-6">
        <Link href="/dashboard/homework" className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]">
          ← Homework
        </Link>

        {error ? (
          <p
            className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {loading ? <p className="text-sm text-[var(--muted)]">Loading…</p> : null}

        {!loading && hw ? (
          <>
            <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">{hw.classTitle}</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">{hw.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 font-semibold">
                      Due: {formatDue(hw.dueAt)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 font-semibold">
                      Progress: {submittedCount}/{requiredCount || steps.filter((s) => s.kind === "task").length}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${
                        complete
                          ? "bg-[var(--success-badge-bg)] text-[var(--success-badge-text)]"
                          : "bg-[var(--warning-badge-bg)] text-[var(--warning-badge-text)]"
                      }`}
                    >
                      {complete ? "Done" : "To do"}
                    </span>
                  </div>
                </div>

                {!complete ? (
                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    {steps.length > 0 && stepIndex > 0 ? (
                      <button
                        type="button"
                        onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
                      >
                        Previous
                      </button>
                    ) : null}
                    {steps.length > 0 && stepIndex < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setStepIndex((i) => Math.min(i + 1, steps.length - 1))}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                      >
                        Next
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </header>

            {complete ? (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm">
                <p className="text-base font-semibold text-[var(--text)]">Completed</p>
                <p className="mt-2 text-sm text-[var(--muted)]">You submitted every required part of this homework.</p>
                <Link
                  href="/dashboard/homework"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                >
                  Back to homework
                </Link>
              </section>
            ) : (
              <>
                {steps.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    <span>
                      Step {stepIndex + 1} of {steps.length}
                    </span>
                    <span>{submittedCount > 0 ? `${submittedCount} part(s) saved` : "Not started"}</span>
                  </div>
                ) : null}

                {submitErr ? (
                  <p className="text-sm text-[var(--error-text)]" role="alert">
                    {submitErr}
                  </p>
                ) : null}

                {steps.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                    <p className="text-sm text-[var(--text)]">This assignment has no instructions or activities.</p>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void submitTask(HOMEWORK_META_TASK_ID, {})}
                      className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit homework"}
                    </button>
                  </div>
                ) : currentStep?.kind === "instructions" ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Instructions</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--text)]">{currentStep.body}</p>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                      {instructionsOnlyHomework ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void submitTask(HOMEWORK_META_TASK_ID, {})}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                        >
                          {submitting ? "Submitting…" : "Submit homework"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStepIndex((i) => Math.min(i + 1, steps.length - 1))}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                ) : taskStep ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                    <HomeworkTaskStep
                      task={taskStep.task}
                      saved={hw.submission?.byTask[taskStep.task.id]}
                      submitting={submitting}
                      onSubmit={async (payload) => {
                        await submitTask(taskStep.task.id, payload);
                      }}
                    />
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>
    </RoleGuard>
  );
}
