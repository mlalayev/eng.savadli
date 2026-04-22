"use client";

import { useMemo } from "react";
import type { HomeworkTask } from "@/lib/homework/types";

function newTaskId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `t${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function countInputs(prompt: string): number {
  return (prompt.match(/\[input\]/g) ?? []).length;
}

function parseBlankLine(line: string): string[] {
  return line
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  tasks: HomeworkTask[];
  onChange: (next: HomeworkTask[]) => void;
};

export function HomeworkTasksBuilder({ tasks, onChange }: Props) {
  const moveTask = (from: number, to: number) => {
    if (to < 0 || to >= tasks.length) return;
    const next = [...tasks];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  const add = (kind: HomeworkTask["kind"]) => {
    let t: HomeworkTask;
    switch (kind) {
      case "paragraph":
        t = { id: newTaskId(), kind: "paragraph", text: "Notes for students (edit this text)." };
        break;
      case "image":
        t = { id: newTaskId(), kind: "image", url: "", caption: "" };
        break;
      case "essay":
        t = { id: newTaskId(), kind: "essay", prompt: "Write a short essay on the following topic (edit this line)." };
        break;
      case "choice":
        t = {
          id: newTaskId(),
          kind: "choice",
          prompt: "Your question here?",
          options: ["First answer", "Second answer"],
          correctIndex: 0,
        };
        break;
      case "fill":
        t = { id: newTaskId(), kind: "fill", prompt: "I [input] a soldier.", blanks: [["was"]] };
        break;
      case "wordOrder":
        t = { id: newTaskId(), kind: "wordOrder", sentence: "I am 21 years old" };
        break;
      default:
        return;
    }
    onChange([...tasks, t]);
  };

  const removeAt = (i: number) => {
    onChange(tasks.filter((_, j) => j !== i));
  };

  const patchAt = (i: number, task: HomeworkTask) => {
    const next = [...tasks];
    next[i] = task;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">Activity blocks</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Add pictures, multiple choice, writing prompts, fill-ins (use{" "}
          <code className="rounded bg-[var(--background)] px-1">[input]</code> in the sentence), or word-order
          sentences. Students complete these below your main instructions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["paragraph", "Text"],
            ["image", "Image"],
            ["essay", "Essay"],
            ["choice", "Multiple choice"],
            ["fill", "Fill blanks"],
            ["wordOrder", "Word order"],
          ] as const
        ).map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            onClick={() => add(kind)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
          >
            + {label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">No blocks yet — optional if instructions alone are enough.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task, i) => (
            <li key={task.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                  {task.kind === "paragraph"
                    ? "Text"
                    : task.kind === "image"
                      ? "Image"
                      : task.kind === "essay"
                        ? "Essay"
                        : task.kind === "choice"
                          ? "Multiple choice"
                          : task.kind === "fill"
                            ? "Fill blanks"
                            : "Word order"}
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveTask(i, i - 1)}
                    className="rounded border border-[var(--border)] px-2 py-0.5 text-xs disabled:opacity-40"
                  >
                    Block ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === tasks.length - 1}
                    onClick={() => moveTask(i, i + 1)}
                    className="rounded border border-[var(--border)] px-2 py-0.5 text-xs disabled:opacity-40"
                  >
                    Block ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-red-800 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {task.kind === "paragraph" ? (
                <textarea
                  className="mt-2 min-h-[72px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={task.text}
                  onChange={(e) => patchAt(i, { ...task, text: e.target.value })}
                  placeholder="Paragraph for students…"
                />
              ) : null}

              {task.kind === "image" ? (
                <div className="mt-2 space-y-2">
                  <label className="block text-xs font-medium text-[var(--text)]">
                    Image URL
                    <input
                      className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      value={task.url.startsWith("data:") ? "" : task.url}
                      onChange={(e) => patchAt(i, { ...task, url: e.target.value })}
                      placeholder="https://…"
                      disabled={task.url.startsWith("data:")}
                    />
                  </label>
                  <label className="block text-xs font-medium text-[var(--text)]">
                    Or upload (under 400 KB; stored in the assignment)
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-xs"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 400_000) {
                          window.alert("Please choose an image under 400 KB, or use a URL instead.");
                          e.target.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const url = typeof reader.result === "string" ? reader.result : "";
                          patchAt(i, { ...task, url });
                        };
                        reader.readAsDataURL(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {task.url.startsWith("data:") ? (
                    <div className="flex flex-wrap items-end gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={task.url} alt="" className="max-h-24 rounded-lg border border-[var(--border)]" />
                      <button
                        type="button"
                        className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
                        onClick={() => patchAt(i, { ...task, url: "" })}
                      >
                        Remove upload
                      </button>
                    </div>
                  ) : task.url ? (
                    <div className="mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={task.url} alt="" className="max-h-24 rounded-lg border border-[var(--border)]" />
                    </div>
                  ) : null}
                  <input
                    className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    value={task.caption ?? ""}
                    onChange={(e) => patchAt(i, { ...task, caption: e.target.value || undefined })}
                    placeholder="Caption (optional)"
                  />
                </div>
              ) : null}

              {task.kind === "essay" ? (
                <textarea
                  className="mt-2 min-h-[88px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={task.prompt}
                  onChange={(e) => patchAt(i, { ...task, prompt: e.target.value })}
                  placeholder="Essay topic / instructions for students…"
                />
              ) : null}

              {task.kind === "choice" ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    className="min-h-[64px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    value={task.prompt}
                    onChange={(e) => patchAt(i, { ...task, prompt: e.target.value })}
                    placeholder="Question…"
                  />
                  {task.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                        value={opt}
                        onChange={(e) => {
                          const options = [...task.options];
                          options[oi] = e.target.value;
                          let correctIndex = task.correctIndex;
                          if (correctIndex >= options.length) correctIndex = options.length - 1;
                          patchAt(i, { ...task, options, correctIndex });
                        }}
                        placeholder={`Option ${oi + 1}`}
                      />
                      <button
                        type="button"
                        className="shrink-0 rounded-lg border border-[var(--border)] px-2 text-xs"
                        disabled={task.options.length <= 2}
                        onClick={() => {
                          const options = task.options.filter((_, j) => j !== oi);
                          let correctIndex = task.correctIndex;
                          if (oi === correctIndex) correctIndex = 0;
                          else if (oi < correctIndex) correctIndex -= 1;
                          patchAt(i, { ...task, options, correctIndex });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    disabled={task.options.length >= 12}
                    onClick={() => patchAt(i, { ...task, options: [...task.options, ""] })}
                  >
                    + Add option
                  </button>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--muted)]">Correct</span>
                    <select
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
                      value={task.correctIndex}
                      onChange={(e) => patchAt(i, { ...task, correctIndex: Number(e.target.value) })}
                    >
                      {task.options.map((_, oi) => (
                        <option key={oi} value={oi}>
                          Option {oi + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {task.kind === "fill" ? (
                <FillEditor task={task} onPatch={(next) => patchAt(i, next)} />
              ) : null}

              {task.kind === "wordOrder" ? (
                <textarea
                  className="mt-2 min-h-[56px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={task.sentence}
                  onChange={(e) => patchAt(i, { ...task, sentence: e.target.value })}
                  placeholder="Correct sentence (words will be shuffled for students)…"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FillEditor({
  task,
  onPatch,
}: {
  task: Extract<HomeworkTask, { kind: "fill" }>;
  onPatch: (next: Extract<HomeworkTask, { kind: "fill" }>) => void;
}) {
  const n = countInputs(task.prompt);
  const blankLines = useMemo(() => task.blanks.map((accepted) => accepted.join(", ")), [task.blanks]);

  const syncBlanks = (prompt: string, prevBlanks: string[][]) => {
    const c = countInputs(prompt);
    const next = [...prevBlanks];
    while (next.length < c) next.push([""]);
    return next.slice(0, c);
  };

  return (
    <div className="mt-2 space-y-2">
      <textarea
        className="min-h-[72px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        value={task.prompt}
        onChange={(e) => {
          const prompt = e.target.value;
          const blanks = syncBlanks(prompt, task.blanks);
          onPatch({ ...task, prompt, blanks });
        }}
        placeholder={'Example: 1) I [input] a soldier'}
      />
      <p className="text-xs text-[var(--muted)]">
        Use the exact marker <code className="rounded bg-[var(--surface)] px-1">[input]</code> once per blank.
      </p>
      {n === 0 ? (
        <p className="text-xs text-amber-800">Add at least one [input] in the sentence.</p>
      ) : (
        <ul className="space-y-2">
          {task.blanks.map((_, bi) => (
            <li key={bi}>
              <label className="block text-xs font-medium text-[var(--text)]">
                Accepted answers for blank {bi + 1} (comma = alternatives)
                <input
                  className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={blankLines[bi] ?? ""}
                  onChange={(e) => {
                    const line = e.target.value;
                    const accepted = parseBlankLine(line);
                    const blanks = task.blanks.map((row, j) => (j === bi ? (accepted.length ? accepted : [""]) : row));
                    onPatch({ ...task, blanks });
                  }}
                  placeholder="was, were"
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
