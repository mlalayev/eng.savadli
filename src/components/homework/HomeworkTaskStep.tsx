"use client";

import { useMemo, useState } from "react";
import type { HomeworkTask } from "@/lib/homework/types";

function norm(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function tokenize(s: string): { id: string; word: string }[] {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => ({ id: `${i}-${word}`, word }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Saved = { submittedAt: string; payload: unknown };

function SubmittedSummary({ task, saved }: { task: HomeworkTask; saved: Saved }) {
  const p = saved.payload;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
        Submitted · {new Date(saved.submittedAt).toLocaleString()}
      </p>
      <div className="mt-2 text-sm text-[var(--text)]">
        {task.kind === "essay" && p && typeof p === "object" && "text" in p ? (
          <p className="whitespace-pre-wrap">{(p as { text: string }).text}</p>
        ) : null}
        {task.kind === "choice" && p && typeof p === "object" && "selectedIndex" in p ? (
          <p>
            Selected:{" "}
            <span className="font-medium">
              {task.options[(p as { selectedIndex: number }).selectedIndex] ?? "—"}
            </span>
          </p>
        ) : null}
        {task.kind === "fill" && p && typeof p === "object" && "values" in p ? (
          <p className="whitespace-pre-wrap">{(p as { values: string[] }).values.join(" · ")}</p>
        ) : null}
        {task.kind === "wordOrder" && p && typeof p === "object" && "words" in p ? (
          <p>{(p as { words: string[] }).words.join(" ")}</p>
        ) : null}
        {task.kind === "paragraph" || task.kind === "image" ? <p>Marked complete.</p> : null}
      </div>
    </div>
  );
}

export function HomeworkTaskStep({
  task,
  saved,
  onSubmit,
  submitting,
}: {
  task: HomeworkTask;
  saved: Saved | undefined;
  onSubmit: (payload: unknown) => Promise<void>;
  submitting: boolean;
}) {
  if (saved) return <SubmittedSummary task={task} saved={saved} />;

  switch (task.kind) {
    case "paragraph":
      return (
        <ParagraphStep task={task} onSubmit={onSubmit} submitting={submitting} />
      );
    case "image":
      return <ImageStep task={task} onSubmit={onSubmit} submitting={submitting} />;
    case "essay":
      return <EssayStep task={task} onSubmit={onSubmit} submitting={submitting} />;
    case "choice":
      return <ChoiceStep task={task} onSubmit={onSubmit} submitting={submitting} />;
    case "fill":
      return <FillStep task={task} onSubmit={onSubmit} submitting={submitting} />;
    case "wordOrder":
      return <WordOrderStep task={task} onSubmit={onSubmit} submitting={submitting} />;
    default:
      return null;
  }
}

function SubmitBar({
  disabled,
  submitting,
  onClick,
  label = "Submit",
}: {
  disabled?: boolean;
  submitting: boolean;
  onClick: () => void | Promise<void>;
  label?: string;
}) {
  return (
    <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={() => void onClick()}
        className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {submitting ? "Submitting…" : label}
      </button>
    </div>
  );
}

function ParagraphStep({
  task,
  onSubmit,
  submitting,
}: {
  task: Extract<HomeworkTask, { kind: "paragraph" }>;
  onSubmit: (p: unknown) => Promise<void>;
  submitting: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="whitespace-pre-wrap text-sm text-[var(--text)]">{task.text}</p>
      <SubmitBar submitting={submitting} onClick={() => void onSubmit({})} />
    </div>
  );
}

function ImageStep({
  task,
  onSubmit,
  submitting,
}: {
  task: Extract<HomeworkTask, { kind: "image" }>;
  onSubmit: (p: unknown) => Promise<void>;
  submitting: boolean;
}) {
  return (
    <figure className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={task.url} alt={task.caption ?? ""} className="max-h-80 max-w-full rounded-lg object-contain" />
      {task.caption ? <figcaption className="mt-2 text-xs text-[var(--muted)]">{task.caption}</figcaption> : null}
      <SubmitBar submitting={submitting} onClick={() => void onSubmit({})} />
    </figure>
  );
}

function EssayStep({
  task,
  onSubmit,
  submitting,
}: {
  task: Extract<HomeworkTask, { kind: "essay" }>;
  onSubmit: (p: unknown) => Promise<void>;
  submitting: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Writing</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text)]">{task.prompt}</p>
      <textarea
        className="mt-3 min-h-[160px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        placeholder="Write your answer here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Essay response"
      />
      <SubmitBar
        disabled={!text.trim()}
        submitting={submitting}
        onClick={() => void onSubmit({ text: text.trim() })}
        label="Submit answer"
      />
    </div>
  );
}

function ChoiceStep({
  task,
  onSubmit,
  submitting,
}: {
  task: Extract<HomeworkTask, { kind: "choice" }>;
  onSubmit: (p: unknown) => Promise<void>;
  submitting: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean | null>(null);

  const check = () => {
    if (picked === null) return;
    setChecked(picked === task.correctIndex);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Multiple choice</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text)]">{task.prompt}</p>
      <ul className="mt-3 space-y-2">
        {task.options.map((opt, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name={task.id}
                checked={picked === i}
                onChange={() => {
                  setPicked(i);
                  setChecked(null);
                }}
                className="mt-1"
              />
              <span className="text-[var(--text)]">{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => check()}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
        >
          Check
        </button>
        {checked === true ? (
          <span className="text-xs font-medium text-emerald-700">Correct</span>
        ) : checked === false ? (
          <span className="text-xs font-medium text-red-700">Not quite — try again</span>
        ) : null}
      </div>
      <SubmitBar
        disabled={picked === null}
        submitting={submitting}
        onClick={() => {
          if (picked === null) return;
          void onSubmit({ selectedIndex: picked });
        }}
        label="Submit answer"
      />
    </div>
  );
}

function FillStep({
  task,
  onSubmit,
  submitting,
}: {
  task: Extract<HomeworkTask, { kind: "fill" }>;
  onSubmit: (p: unknown) => Promise<void>;
  submitting: boolean;
}) {
  const [values, setValues] = useState<string[]>(() => Array.from({ length: task.blanks.length }, () => ""));
  const [checked, setChecked] = useState<boolean | null>(null);

  const parts = task.prompt.split("[input]");
  const runCheck = () => {
    const ok = task.blanks.every((accepted, i) => {
      const v = norm(values[i] ?? "");
      if (!v) return false;
      return accepted.some((a) => norm(a) === v);
    });
    setChecked(ok);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Fill in the blanks</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm text-[var(--text)]">
        {parts.map((chunk, i) => (
          <span key={`${task.id}-p${i}`} className="inline-flex flex-wrap items-center gap-x-1 gap-y-2">
            {chunk ? <span className="whitespace-pre-wrap">{chunk}</span> : null}
            {i < task.blanks.length ? (
              <input
                aria-label={`Blank ${i + 1}`}
                className="inline-block min-w-[5rem] max-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
                value={values[i] ?? ""}
                onChange={(e) => {
                  setChecked(null);
                  const next = [...values];
                  next[i] = e.target.value;
                  setValues(next);
                }}
              />
            ) : null}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => runCheck()}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
        >
          Check
        </button>
        {checked === true ? (
          <span className="text-xs font-medium text-emerald-700">Correct</span>
        ) : checked === false ? (
          <span className="text-xs font-medium text-red-700">Not quite — try again</span>
        ) : null}
      </div>
      <SubmitBar
        disabled={values.some((v) => !v.trim())}
        submitting={submitting}
        onClick={() => onSubmit({ values })}
        label="Submit answer"
      />
    </div>
  );
}

function WordOrderStep({
  task,
  onSubmit,
  submitting,
}: {
  task: Extract<HomeworkTask, { kind: "wordOrder" }>;
  onSubmit: (p: unknown) => Promise<void>;
  submitting: boolean;
}) {
  const initial = useMemo(() => shuffle(tokenize(task.sentence)), [task.id, task.sentence]);
  const [order, setOrder] = useState(initial);
  const [checked, setChecked] = useState<boolean | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    setChecked(null);
    setOrder((prev) => {
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  const target = task.sentence.trim().replace(/\s+/g, " ");
  const runCheck = () => {
    const got = order.map((t) => t.word).join(" ");
    setChecked(got === target);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Put the words in order</p>
      <p className="mt-1 text-xs text-[var(--muted)]">Use the arrows to build the correct sentence.</p>
      <ol className="mt-3 space-y-2">
        {order.map((tok, idx) => (
          <li
            key={tok.id}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
          >
            <span className="min-w-0 flex-1 font-medium">{tok.word}</span>
            <button
              type="button"
              aria-label="Move up"
              disabled={idx === 0}
              onClick={() => move(idx, idx - 1)}
              className="rounded border border-[var(--border)] px-2 py-0.5 text-xs disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={idx === order.length - 1}
              onClick={() => move(idx, idx + 1)}
              className="rounded border border-[var(--border)] px-2 py-0.5 text-xs disabled:opacity-40"
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => runCheck()}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
        >
          Check
        </button>
        {checked === true ? (
          <span className="text-xs font-medium text-emerald-700">Correct</span>
        ) : checked === false ? (
          <span className="text-xs font-medium text-red-700">Not quite — try again</span>
        ) : null}
      </div>
      <SubmitBar
        submitting={submitting}
        onClick={() => onSubmit({ words: order.map((t) => t.word) })}
        label="Submit answer"
      />
    </div>
  );
}
