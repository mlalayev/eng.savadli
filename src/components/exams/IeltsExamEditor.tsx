"use client";

import { useEffect, useMemo, useState } from "react";
import { choiceDisplayText, normalizeExamChoices } from "@/lib/exams/choices";
import type { ExamChoice, ExamQuestion, QuestionType } from "@/lib/exams/types";
import type { Exam, IeltsGroup, IeltsMaterialsMap, IELTS_LISTENING_AUDIO_KEY } from "./shared/types";
import { api, uploadImageFile, uploadAudioFile } from "./shared/api";
import {
  uid,
  questionTypeLabel,
  formatRichText,
  emptyChoiceRow,
  ieltsGroupForSectionId,
  ieltsGroupLabel,
} from "./shared/helpers";
import { ExamHeader } from "./shared/ExamHeader";

type IeltsExamEditorProps = {
  exam: Exam;
  onUpdate: () => Promise<void>;
};

const IELTS_LISTENING_AUDIO_KEY_VALUE = "__ielts_listening_audio__";

export function IeltsExamEditor({ exam, onUpdate }: IeltsExamEditorProps) {
  const [localQuestions, setLocalQuestions] = useState<ExamQuestion[]>(exam.questions);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // IELTS-specific state
  const [ieltsGroup, setIeltsGroup] = useState<IeltsGroup>("listening");
  const [ieltsMaterials, setIeltsMaterials] = useState<IeltsMaterialsMap>({});
  const [savingMaterials, setSavingMaterials] = useState(false);

  // Section selection
  const [sectionId, setSectionId] = useState<string>("drill");

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

  const isIeltsFull = exam?.program === "ielts" && exam?.mode === "full" && Boolean(exam?.structure?.sections?.length);
  const firstSectionId = exam?.structure?.sections?.[0]?.id ?? "";

  // Auto-select first section if needed
  useEffect(() => {
    const sections = exam?.structure?.sections;
    if (!sections?.length) return;
    setSectionId((prev) => (sections.some((s) => s.id === prev) ? prev : sections[0].id));
  }, [exam?.id, exam?.structure]);

  // Load materials from structure
  useEffect(() => {
    if (!exam?.structure) return;
    const anyStructure = exam.structure as unknown as { materials?: IeltsMaterialsMap };
    setIeltsMaterials(anyStructure.materials ?? {});
  }, [exam?.id]);

  // Update group when section changes
  useEffect(() => {
    if (!isIeltsFull) return;
    const g = ieltsGroupForSectionId(sectionId);
    if (g) setIeltsGroup(g);
  }, [isIeltsFull, sectionId]);

  const ieltsSections = useMemo(() => {
    if (!isIeltsFull || !exam?.structure?.sections) return [];
    return exam.structure.sections.filter((s) => ieltsGroupForSectionId(s.id) !== null);
  }, [isIeltsFull, exam?.structure]);

  const ieltsSubsectionsByGroup = useMemo(() => {
    const grouped: Record<IeltsGroup, typeof ieltsSections> = {
      listening: [],
      reading: [],
      writing: [],
      speaking: [],
    };
    for (const s of ieltsSections) {
      const g = ieltsGroupForSectionId(s.id);
      if (g) grouped[g].push(s);
    }
    return grouped;
  }, [ieltsSections]);

  const ieltsActiveSubsections = isIeltsFull ? ieltsSubsectionsByGroup[ieltsGroup] : [];
  const currentMaterial = ieltsMaterials[sectionId]?.text ?? "";
  const listeningAudioUrl = ieltsMaterials[IELTS_LISTENING_AUDIO_KEY_VALUE]?.audioUrl ?? "";

  async function saveCurrentSectionMaterial() {
    if (!exam || !exam.structure || !isIeltsFull) return;
    setSavingMaterials(true);
    setError(null);
    try {
      const structureAny = exam.structure as unknown;
      await api(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          structure: {
            ...(structureAny as { program: string; mode: string; sections: unknown[] }),
            materials: { ...(structureAny as { materials?: IeltsMaterialsMap }).materials, ...ieltsMaterials },
          },
        }),
      });
      await onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save materials");
    } finally {
      setSavingMaterials(false);
    }
  }

  const allowedTypes: QuestionType[] = useMemo(() => {
    if (exam.program === "ielts" && exam.mode === "full") {
      if (sectionId.startsWith("writing_") || sectionId.startsWith("speaking_")) return ["writing"];
      return ["mcq_single", "short_text", "numeric", "rich_text"];
    }
    if (exam.program === "ielts" && exam.mode === "drill") {
      if (sectionId === "writing" || sectionId === "speaking") return ["writing"];
      return ["mcq_single", "short_text", "numeric", "rich_text"];
    }
    return ["mcq_single", "short_text", "numeric", "rich_text"];
  }, [exam.program, exam.mode, sectionId]);

  const totalPoints = useMemo(() => localQuestions.reduce((sum, q) => sum + q.points, 0), [localQuestions]);

  const sectionQuestionCounts = useMemo(() => {
    if (!exam?.structure?.sections?.length) return {} as Record<string, number>;
    const fallback = exam.structure.sections[0]?.id ?? "";
    const counts: Record<string, number> = {};
    for (const s of exam.structure.sections) counts[s.id] = 0;
    for (const q of localQuestions) {
      const sid = q.sectionId ?? fallback;
      if (Object.prototype.hasOwnProperty.call(counts, sid)) counts[sid]++;
    }
    return counts;
  }, [exam, localQuestions]);

  const questionsInCurrentSection = useMemo(() => {
    if (!exam || !isIeltsFull || !exam.structure?.sections?.length) return localQuestions;
    return localQuestions.filter((q) => (q.sectionId ?? firstSectionId) === sectionId);
  }, [exam, isIeltsFull, firstSectionId, sectionId, localQuestions]);

  const pointsInCurrentSection = useMemo(
    () => questionsInCurrentSection.reduce((s, q) => s + q.points, 0),
    [questionsInCurrentSection],
  );

  const dirty = useMemo(() => {
    return JSON.stringify(localQuestions) !== JSON.stringify(exam.questions);
  }, [exam.questions, localQuestions]);

  function sectionLabelForQuestion(sectionIdValue: string | undefined): string {
    if (!sectionIdValue || !exam?.structure?.sections?.length) return "";
    const sec = exam.structure.sections.find((s) => s.id === sectionIdValue);
    return sec?.label ?? sectionIdValue;
  }

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
      sectionId: exam.structure?.sections?.length ? sectionId : undefined,
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

  const currentSectionLabel = exam?.structure?.sections?.find((s) => s.id === sectionId)?.label ?? "Section";
  const currentSection = exam?.structure?.sections?.find((s) => s.id === sectionId);

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

      {/* IELTS section/subsection navigation */}
      {isIeltsFull ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">IELTS sections</p>
            <p className="text-sm text-[var(--muted)]">
              Pick a section and subsection. New questions will be added to the selected subsection.
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--faint)]">Section</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["listening", "reading", "writing", "speaking"] as const).map((g) => {
                    const on = ieltsGroup === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setIeltsGroup(g);
                          const first = ieltsSubsectionsByGroup[g][0]?.id;
                          if (first) setSectionId(first);
                        }}
                        className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                          on
                            ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)]"
                        }`}
                      >
                        {ieltsGroupLabel(g)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--faint)]">Subsection</p>
                  <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {ieltsActiveSubsections.map((s) => {
                      const on = sectionId === s.id;
                      const count = sectionQuestionCounts[s.id] ?? 0;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSectionId(s.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                            on
                              ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--hover)]"
                          }`}
                        >
                          <span className="min-w-0 truncate">{s.label}</span>
                          <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    {ieltsActiveSubsections.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No subsections found.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                      {currentSection?.label ?? "Section material"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Add the passage / script / prompt for this subsection.</p>
                  </div>
                  <button
                    type="button"
                    disabled={saving || savingMaterials}
                    onClick={() => void saveCurrentSectionMaterial()}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                  >
                    {savingMaterials ? "Saving…" : "Save"}
                  </button>
                </div>

                <textarea
                  className="mt-3 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={currentMaterial}
                  onChange={(e) => {
                    const v = e.target.value;
                    setIeltsMaterials((prev) => ({
                      ...prev,
                      [sectionId]: { ...(prev[sectionId] ?? {}), text: v },
                    }));
                  }}
                  placeholder={
                    ieltsGroup === "reading"
                      ? "Paste the Reading passage here…"
                      : ieltsGroup === "listening"
                        ? "Paste the Listening script / notes here…"
                        : ieltsGroup === "writing"
                          ? "Paste the Writing task prompt here…"
                          : "Paste the Speaking prompts / bullet points here…"
                  }
                />

                {ieltsGroup === "listening" ? (
                  <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Listening audio</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      One audio for the whole Listening section (shared across Sections 1–4).
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]">
                        <input
                          type="file"
                          accept="audio/*"
                          className="sr-only"
                          disabled={Boolean(imageUploadBusy) || savingMaterials || saving}
                          onChange={(e) => {
                            const input = e.currentTarget;
                            const file = input.files?.[0];
                            input.value = "";
                            if (!file) return;
                            setError(null);
                            setImageUploadBusy(`audio:${IELTS_LISTENING_AUDIO_KEY_VALUE}`);
                            void uploadAudioFile(file)
                              .then((url) =>
                                setIeltsMaterials((prev) => ({
                                  ...prev,
                                  [IELTS_LISTENING_AUDIO_KEY_VALUE]: {
                                    ...(prev[IELTS_LISTENING_AUDIO_KEY_VALUE] ?? {}),
                                    audioUrl: url,
                                  },
                                })),
                              )
                              .catch((err) => setError(err instanceof Error ? err.message : "Upload failed"))
                              .finally(() => setImageUploadBusy(null));
                          }}
                        />
                        {imageUploadBusy === `audio:${IELTS_LISTENING_AUDIO_KEY_VALUE}` ? "Uploading…" : "Choose file"}
                      </label>
                      <span className="text-xs text-[var(--muted)]">or</span>
                      <input
                        className="min-w-[14rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                        type="text"
                        placeholder="/uploads/… or https://…"
                        value={listeningAudioUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setIeltsMaterials((prev) => ({
                            ...prev,
                            [IELTS_LISTENING_AUDIO_KEY_VALUE]: {
                              ...(prev[IELTS_LISTENING_AUDIO_KEY_VALUE] ?? {}),
                              audioUrl: url,
                            },
                          }));
                        }}
                      />
                    </div>

                    {listeningAudioUrl.trim() ? (
                      <audio className="mt-3 w-full" controls src={listeningAudioUrl.trim()} />
                    ) : (
                      <p className="mt-3 text-xs text-[var(--muted)]">No audio attached yet.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Add question form */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text)]">Add question</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {exam?.structure?.sections?.length ? (
                <>
                  New question goes to <span className="font-semibold text-[var(--text)]">{currentSectionLabel}</span>. Add
                  it to the list, then click <span className="font-semibold text-[var(--text)]">Save exam</span> to store it.
                </>
              ) : (
                <>
                  Add a question below, then click <span className="font-semibold text-[var(--text)]">Save exam</span> to
                  store it.
                </>
              )}
            </p>
          </div>
          {exam?.structure?.sections?.length ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                Target: {currentSectionLabel}
              </span>
              {isIeltsFull ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  IELTS · {ieltsGroupLabel(ieltsGroup)}
                </span>
              ) : null}
            </div>
          ) : null}
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

          {newType !== "rich_text" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <label className="block text-sm font-medium text-[var(--text)]">
                Description / Context (optional)
                <textarea
                  className="mt-1.5 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context or instructions for this question (e.g., 'Do the following statements agree with the information given in Reading Passage 1?')"
                />
              </label>
            </div>
          ) : null}

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

          <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-[var(--text)] sm:col-span-2">
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
            <h2 className="text-base font-semibold text-[var(--text)]">
              {isIeltsFull ? `Questions · ${currentSectionLabel}` : "Questions"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isIeltsFull
                ? `${questionsInCurrentSection.length} in this subsection · ${pointsInCurrentSection} pts`
                : `${localQuestions.length} total`}
            </p>
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
          {(isIeltsFull ? questionsInCurrentSection : localQuestions).map((q, idx) => (
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
                        value={"prompt" in editBuf ? editBuf.prompt : ""}
                        onChange={(e) => {
                          if ("prompt" in editBuf) {
                            setEditBuf({ ...editBuf, prompt: e.target.value });
                          }
                        }}
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
                        {q.sectionId ? (
                          <span className="text-xs text-[var(--faint)]">{sectionLabelForQuestion(q.sectionId)}</span>
                        ) : null}
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
          {(isIeltsFull ? questionsInCurrentSection : localQuestions).length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">
              No questions yet{isIeltsFull ? " in this subsection" : ""}. Add one above to get started.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
