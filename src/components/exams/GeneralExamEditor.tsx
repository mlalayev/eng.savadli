"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { choiceDisplayText, normalizeExamChoices } from "@/lib/exams/choices";
import type { ExamChoice, ExamQuestion, QuestionType } from "@/lib/exams/types";
import type { Exam } from "./shared/types";
import { api, uploadImageFile } from "./shared/api";
import {
  uid,
  questionTypeLabel,
  formatRichText,
  emptyChoiceRow,
  satSkillLabel,
  choiceDisplayText as choiceText,
} from "./shared/helpers";
import { ExamHeader } from "./shared/ExamHeader";

type GeneralExamEditorProps = {
  exam: Exam;
  onUpdate: () => Promise<void>;
};

export function GeneralExamEditor({ exam, onUpdate }: GeneralExamEditorProps) {
  const [localQuestions, setLocalQuestions] = useState<ExamQuestion[]>(exam.questions);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add question form state
  const [newType, setNewType] = useState<ExamQuestion["type"]>("mcq_single");
  const [prompt, setPrompt] = useState("");
  const [promptImageUrl, setPromptImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [richTextContent, setRichTextContent] = useState("");
  const [points, setPoints] = useState(1);
  const [choiceRows, setChoiceRows] = useState<ExamChoice[]>([
    { ...emptyChoiceRow(), text: "" },
    { ...emptyChoiceRow(), text: "" },
    { ...emptyChoiceRow(), text: "" },
    { ...emptyChoiceRow(), text: "" },
  ]);
  const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [correctNumber, setCorrectNumber] = useState<number>(0);
  const [rubric, setRubric] = useState("");
  const [imageUploadBusy, setImageUploadBusy] = useState<string | null>(null);

  // Edit question state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<ExamQuestion | null>(null);
  const [editChoiceRows, setEditChoiceRows] = useState<ExamChoice[]>([]);
  const [editCorrectChoiceIndex, setEditCorrectChoiceIndex] = useState(0);

  const allowedTypes: QuestionType[] = ["mcq_single", "short_text", "numeric", "writing", "rich_text"];

  const totalPoints = useMemo(() => localQuestions.reduce((sum, q) => sum + q.points, 0), [localQuestions]);

  const dirty = useMemo(() => {
    return JSON.stringify(localQuestions) !== JSON.stringify(exam.questions);
  }, [exam.questions, localQuestions]);

  async function saveExam() {
    if (!exam) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questions: localQuestions }),
      });
      await onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!exam) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !exam.active }),
      });
      await onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExam() {
    if (!exam || !window.confirm("Delete this exam? This cannot be undone.")) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/exams/${exam.id}`, { method: "DELETE" });
      window.location.href = "/dashboard/exams";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setSaving(false);
    }
  }

  function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!exam) return;
    setError(null);

    const stemImage = promptImageUrl.trim() || undefined;
    const desc = description.trim() || undefined;
    const base = {
      id: uid(),
      promptImageUrl: stemImage,
      description: desc,
      points: Math.max(1, Number(points) || 1),
    };

    let q: ExamQuestion;
    if (newType === "mcq_single") {
      const choices: ExamChoice[] = choiceRows
        .map((row) => ({
          id: row.id || uid(),
          text: row.text.trim(),
          imageUrl: row.imageUrl?.trim() || undefined,
        }))
        .filter((row) => row.text.length > 0 || Boolean(row.imageUrl));
      if (choices.length < 2) {
        setError("Add at least two answer choices (text and/or image each).");
        return;
      }
      const safeIndex = Math.max(0, Math.min(correctChoiceIndex, choices.length - 1));
      q = { ...base, type: "mcq_single", prompt: prompt.trim(), choices, correctChoiceIndex: safeIndex };
    } else if (newType === "short_text") {
      q = { ...base, type: "short_text", prompt: prompt.trim(), correctAnswer: correctAnswer.trim() };
    } else if (newType === "numeric") {
      q = { ...base, type: "numeric", prompt: prompt.trim(), correctNumber: Number(correctNumber) };
    } else if (newType === "rich_text") {
      if (!richTextContent.trim()) {
        setError("Rich text content is required.");
        return;
      }
      q = { ...base, type: "rich_text", content: richTextContent.trim() };
    } else {
      q = { ...base, type: "writing", prompt: prompt.trim(), rubric: rubric.trim() || undefined };
    }

    setLocalQuestions((prev) => [...prev, q]);
    setPrompt("");
    setPromptImageUrl("");
    setDescription("");
    setRichTextContent("");
    setChoiceRows([
      { ...emptyChoiceRow(), text: "" },
      { ...emptyChoiceRow(), text: "" },
      { ...emptyChoiceRow(), text: "" },
      { ...emptyChoiceRow(), text: "" },
    ]);
    setCorrectChoiceIndex(0);
    setCorrectAnswer("");
    setCorrectNumber(0);
    setRubric("");
  }

  function removeQuestionLocal(questionId: string) {
    setLocalQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (editingId === questionId) {
      setEditingId(null);
      setEditBuf(null);
    }
  }

  function startEdit(q: ExamQuestion) {
    setEditingId(q.id);
    setEditBuf(structuredClone(q));
    if (q.type === "mcq_single") {
      setEditChoiceRows(q.choices.length ? q.choices.map((c) => ({ ...c })) : [emptyChoiceRow(), emptyChoiceRow()]);
      setEditCorrectChoiceIndex(q.correctChoiceIndex);
    } else {
      setEditChoiceRows([]);
      setEditCorrectChoiceIndex(0);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBuf(null);
    setEditChoiceRows([]);
  }

  function applyEdit() {
    if (!editBuf || !editingId || !exam) return;
    setError(null);

    let next: ExamQuestion = editBuf;

    if (editBuf.type === "mcq_single") {
      const choices: ExamChoice[] = editChoiceRows
        .map((row) => ({
          id: row.id || uid(),
          text: row.text.trim(),
          imageUrl: row.imageUrl?.trim() || undefined,
        }))
        .filter((row) => row.text.length > 0 || Boolean(row.imageUrl));
      if (choices.length < 2) {
        setError("Edit: add at least two answer choices.");
        return;
      }
      const safeIndex = Math.max(0, Math.min(editCorrectChoiceIndex, choices.length - 1));
      next = { ...editBuf, choices, correctChoiceIndex: safeIndex };
    }

    setLocalQuestions((prev) => prev.map((x) => (x.id === editingId ? next : x)));
    cancelEdit();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ExamHeader
        exam={exam}
        totalQuestions={localQuestions.length}
        totalPoints={totalPoints}
        dirty={dirty}
        saving={saving}
        onSave={() => void saveExam()}
        onToggleActive={() => void toggleActive()}
        onDelete={() => void deleteExam()}
      />

      {error ? (
        <p className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">
          {error}
        </p>
      ) : null}

      {/* Add question form */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text)]">Add question</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add a question below, then click <span className="font-semibold text-[var(--text)]">Save exam</span> to store
              it.
            </p>
          </div>
        </div>

        <form className="mt-5 space-y-5" onSubmit={addQuestion}>
          {newType !== "rich_text" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Prompt
                <textarea
                  className="mt-1.5 block min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </label>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <label className="block text-sm font-medium text-[var(--text)]">
              Description / Context (optional)
              <textarea
                className="mt-1.5 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context or instructions for this question"
              />
            </label>
          </div>

          {newType === "rich_text" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Rich text content
                <textarea
                  className="mt-1.5 block min-h-48 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-mono"
                  value={richTextContent}
                  onChange={(e) => setRichTextContent(e.target.value)}
                  placeholder="Use **text** for bold, *text* for italic, _text_ for underline. Write your question content with formatting."
                  required
                />
              </label>
              <p className="mt-2 text-xs text-[var(--muted)]">Markdown-style formatting: **bold**, *italic*, _underline_</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-sm font-medium text-[var(--text)]">Question image (optional)</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  disabled={Boolean(imageUploadBusy)}
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    input.value = "";
                    if (!file) return;
                    setError(null);
                    setImageUploadBusy("prompt");
                    void uploadImageFile(file)
                      .then((url) => setPromptImageUrl(url))
                      .catch((err) => setError(err instanceof Error ? err.message : "Upload failed"))
                      .finally(() => setImageUploadBusy(null));
                  }}
                />
                {imageUploadBusy === "prompt" ? "Uploading…" : "Choose file"}
              </label>
              <span className="text-xs text-[var(--muted)]">or URL</span>
              <input
                className="min-w-[12rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                type="text"
                placeholder="/uploads/… or https://…"
                value={promptImageUrl}
                onChange={(e) => setPromptImageUrl(e.target.value)}
              />
            </div>
            {promptImageUrl.trim() ? (
              <img
                src={promptImageUrl.trim()}
                alt=""
                className="mt-2 max-h-40 w-auto max-w-full rounded-lg border border-[var(--border)] object-contain"
              />
            ) : null}
          </div>

          <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[var(--text)]">
              Question format
              <select
                className="mt-1.5 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ExamQuestion["type"])}
              >
                {allowedTypes.map((t) => (
                  <option key={t} value={t}>
                    {questionTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-[var(--text)]">
              Points
              <input
                className="mt-1.5 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </label>
          </div>

          {newType === "mcq_single" ? (
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--text)]">Answer choices</p>
                <button
                  type="button"
                  onClick={() => setChoiceRows((rows) => [...rows, emptyChoiceRow()])}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
                >
                  + Add choice
                </button>
              </div>
              <ul className="space-y-3">
                {choiceRows.map((row, idx) => (
                  <li key={row.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 pt-2 text-xs font-semibold text-[var(--muted)]">
                        <input
                          type="radio"
                          name="correct_choice_new"
                          checked={correctChoiceIndex === idx}
                          onChange={() => setCorrectChoiceIndex(idx)}
                        />
                        Correct
                      </label>
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-[var(--faint)]">
                          Text
                          <input
                            className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-sm"
                            value={row.text}
                            onChange={(e) =>
                              setChoiceRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)))
                            }
                            placeholder="Choice text"
                          />
                        </label>
                        <div className="text-xs font-semibold text-[var(--faint)]">
                          Choice image (optional)
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[11px] font-semibold">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="sr-only"
                                disabled={Boolean(imageUploadBusy)}
                                onChange={(ev) => {
                                  const input = ev.currentTarget;
                                  const file = input.files?.[0];
                                  input.value = "";
                                  if (!file) return;
                                  setError(null);
                                  setImageUploadBusy(row.id);
                                  void uploadImageFile(file)
                                    .then((url) =>
                                      setChoiceRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, imageUrl: url } : r))),
                                    )
                                    .catch((err) => setError(err instanceof Error ? err.message : "Upload failed"))
                                    .finally(() => setImageUploadBusy(null));
                                }}
                              />
                              {imageUploadBusy === row.id ? "…" : "Upload"}
                            </label>
                            <input
                              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                              type="text"
                              value={row.imageUrl ?? ""}
                              onChange={(e) =>
                                setChoiceRows((rows) =>
                                  rows.map((r) => (r.id === row.id ? { ...r, imageUrl: e.target.value || undefined } : r)),
                                )
                              }
                              placeholder="Image URL"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={choiceRows.length <= 2}
                        onClick={() => {
                          setChoiceRows((rows) => {
                            const next = rows.filter((r) => r.id !== row.id);
                            const removedIdx = rows.findIndex((r) => r.id === row.id);
                            setCorrectChoiceIndex((i) => {
                              if (removedIdx < 0) return i;
                              if (i === removedIdx) return 0;
                              if (i > removedIdx) return Math.max(0, i - 1);
                              return Math.min(i, next.length - 1);
                            });
                            return next;
                          });
                        }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--muted)] disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {newType === "short_text" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Correct answer
                <span className="ml-2 text-xs font-semibold text-[var(--muted)]">(exact match, case-insensitive)</span>
                <input
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                />
              </label>
            </div>
          ) : null}

          {newType === "numeric" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Correct number
                <input
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                  type="number"
                  value={correctNumber}
                  onChange={(e) => setCorrectNumber(Number(e.target.value))}
                />
              </label>
            </div>
          ) : null}

          {newType === "writing" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Rubric (optional)
                <textarea
                  className="mt-1.5 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--muted)]">
              Adds to the local list only. Click <span className="font-semibold text-[var(--text)]">Save exam</span> to persist.
            </p>
            <button
              type="submit"
              disabled={!exam}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              Add question
            </button>
          </div>
        </form>
      </section>

      {/* Questions list */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Questions</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{localQuestions.length} total</p>
          </div>
          <button
            type="button"
            disabled={!exam || saving || !dirty}
            onClick={() => void saveExam()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Save exam
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {localQuestions.map((q, idx) => (
            <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              {editingId === q.id && editBuf ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                    Editing Q{idx + 1} · {questionTypeLabel(editBuf.type)}
                  </p>
                  {editBuf.type !== "rich_text" ? (
                    <label className="text-sm font-medium text-[var(--text)]">
                      Prompt
                      <textarea
                        className="mt-1 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                        value={editBuf.prompt}
                        onChange={(e) => setEditBuf({ ...editBuf, prompt: e.target.value })}
                      />
                    </label>
                  ) : null}
                  <label className="text-sm font-medium text-[var(--text)]">
                    Description / Context (optional)
                    <textarea
                      className="mt-1 block min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                      value={editBuf.description ?? ""}
                      onChange={(e) => setEditBuf({ ...editBuf, description: e.target.value || undefined })}
                    />
                  </label>
                  {editBuf.type === "rich_text" ? (
                    <label className="text-sm font-medium text-[var(--text)]">
                      Rich text content
                      <textarea
                        className="mt-1 block min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-mono"
                        value={editBuf.content}
                        onChange={(e) => setEditBuf({ ...editBuf, content: e.target.value })}
                      />
                    </label>
                  ) : null}
                  <label className="text-sm font-medium text-[var(--text)]">
                    Points
                    <input
                      className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                      type="number"
                      min={1}
                      value={editBuf.points}
                      onChange={(e) => setEditBuf({ ...editBuf, points: Number(e.target.value) })}
                    />
                  </label>

                  {editBuf.type === "mcq_single" ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--text)]">Choices</p>
                      {editChoiceRows.map((row, i) => (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2"
                        >
                          <label className="flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
                            <input
                              type="radio"
                              name="edit_correct"
                              checked={editCorrectChoiceIndex === i}
                              onChange={() => setEditCorrectChoiceIndex(i)}
                            />
                            OK
                          </label>
                          <input
                            className="min-w-0 flex-1 rounded border border-[var(--border)] px-2 py-1.5 text-sm"
                            value={row.text}
                            onChange={(e) =>
                              setEditChoiceRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {editBuf.type === "short_text" ? (
                    <label className="text-sm font-medium text-[var(--text)]">
                      Correct answer
                      <input
                        className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                        value={editBuf.correctAnswer}
                        onChange={(e) => setEditBuf({ ...editBuf, correctAnswer: e.target.value })}
                      />
                    </label>
                  ) : null}

                  {editBuf.type === "numeric" ? (
                    <label className="text-sm font-medium text-[var(--text)]">
                      Correct number
                      <input
                        className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                        type="number"
                        value={editBuf.correctNumber}
                        onChange={(e) => setEditBuf({ ...editBuf, correctNumber: Number(e.target.value) } as ExamQuestion)}
                      />
                    </label>
                  ) : null}

                  {editBuf.type === "writing" ? (
                    <label className="text-sm font-medium text-[var(--text)]">
                      Rubric
                      <textarea
                        className="mt-1 block min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                        value={editBuf.rubric ?? ""}
                        onChange={(e) => setEditBuf({ ...editBuf, rubric: e.target.value || undefined })}
                      />
                    </label>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => applyEdit()}
                      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEdit()}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--faint)]">Q{idx + 1}</span>
                        <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
                          {questionTypeLabel(q.type)}
                        </span>
                        <span className="text-xs text-[var(--faint)]">{q.points} pts</span>
                      </div>
                      {q.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs font-medium text-[var(--muted)] italic border-l-2 border-[var(--border)] pl-2">
                          {q.description}
                        </p>
                      ) : null}
                      {q.type !== "rich_text" && "prompt" in q ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">{q.prompt}</p>
                      ) : null}
                      {q.type === "rich_text" && "content" in q ? (
                        <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                          {formatRichText(q.content)}
                        </div>
                      ) : null}
                      {q.type === "mcq_single" ? (
                        <ol className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                          {normalizeExamChoices(q.choices as unknown).map((c, i) => (
                            <li key={c.id}>
                              {String.fromCharCode(65 + i)}. {choiceDisplayText(c)}
                              {i === q.correctChoiceIndex ? (
                                <span className="ml-2 text-xs font-semibold text-[var(--accent)]">(correct)</span>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      {q.type === "short_text" ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">Answer: {q.correctAnswer}</p>
                      ) : null}
                      {q.type === "numeric" ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">Value: {q.correctNumber}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(q)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestionLocal(q.id)}
                        className="rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--error-text)] hover:opacity-80"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {localQuestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">No questions yet. Add one above to get started.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
