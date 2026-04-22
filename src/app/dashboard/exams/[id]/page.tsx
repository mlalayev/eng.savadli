"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { choiceDisplayText, normalizeExamChoices } from "@/lib/exams/choices";
import {
  isValidSatSkill,
  satSkillDomainForSection,
  subtopicsForTopic,
  taxonomyForDomain,
  type SatSkillDomain,
} from "@/lib/exams/sat-taxonomy";
import type { ExamChoice, ExamQuestion, ExamStructure, QuestionType, SatQuestionSkill } from "@/lib/exams/types";

type Exam = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  mode: "full" | "drill";
  active: boolean;
  questions: ExamQuestion[];
  structure?: ExamStructure;
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

async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads/image", { method: "POST", body: fd });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Upload failed";
    throw new Error(message);
  }
  if (typeof data !== "object" || data === null || !("url" in data) || typeof (data as { url: unknown }).url !== "string") {
    throw new Error("Invalid upload response");
  }
  return (data as { url: string }).url;
}

function uid() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

function questionTypeLabel(type: QuestionType): string {
  switch (type) {
    case "mcq_single":
      return "Multiple choice";
    case "short_text":
      return "Short answer";
    case "numeric":
      return "Student-produced response (number)";
    case "writing":
      return "Written response";
    default:
      return type;
  }
}

function emptyChoiceRow(): ExamChoice {
  return { id: uid(), text: "", imageUrl: undefined };
}

function attachSatSkill<T extends ExamQuestion>(q: T, skill: SatQuestionSkill | undefined): T {
  if (!skill) return q;
  return { ...q, satSkill: skill };
}

export default function ExamDetailPage() {
  const params = useParams();
  const examId = typeof params?.id === "string" ? params.id : "";
  const [exam, setExam] = useState<Exam | null>(null);
  const [localQuestions, setLocalQuestions] = useState<ExamQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newType, setNewType] = useState<ExamQuestion["type"]>("mcq_single");
  const [sectionId, setSectionId] = useState<string>("drill");
  const [prompt, setPrompt] = useState("");
  const [promptImageUrl, setPromptImageUrl] = useState("");
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
  const [satTopic, setSatTopic] = useState("");
  const [satSubtopic, setSatSubtopic] = useState("");
  const [imageUploadBusy, setImageUploadBusy] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<ExamQuestion | null>(null);
  const [editChoiceRows, setEditChoiceRows] = useState<ExamChoice[]>([]);
  const [editCorrectChoiceIndex, setEditCorrectChoiceIndex] = useState(0);
  const [editSatTopic, setEditSatTopic] = useState("");
  const [editSatSubtopic, setEditSatSubtopic] = useState("");

  const load = useCallback(async () => {
    setError(null);
    if (!examId) return;
    const data = await api<{ exam: Exam }>(`/api/exams/${examId}`);
    setExam(data.exam);
    setLocalQuestions(data.exam.questions);
    setEditingId(null);
    setEditBuf(null);
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load, examId]);

  useEffect(() => {
    const sections = exam?.structure?.sections;
    if (!sections?.length) return;
    setSectionId((prev) => (sections.some((s) => s.id === prev) ? prev : sections[0].id));
  }, [exam?.id, exam?.structure]);

  const isDsat = exam?.program === "dsat";
  const firstSectionId = exam?.structure?.sections?.[0]?.id ?? "";

  const currentSection = exam?.structure?.sections?.find((s) => s.id === sectionId);
  const skillDomain: SatSkillDomain | null = currentSection ? satSkillDomainForSection(currentSection) : null;

  useEffect(() => {
    if (!isDsat || !skillDomain) {
      setSatTopic("");
      setSatSubtopic("");
      return;
    }
    const tax = taxonomyForDomain(skillDomain);
    const t0 = tax[0]?.topic ?? "";
    const s0 = tax[0]?.subtopics[0] ?? "";
    setSatTopic(t0);
    setSatSubtopic(s0);
  }, [isDsat, skillDomain, sectionId]);

  const allowedTypes = useMemo((): QuestionType[] => {
    if (!exam) return ["mcq_single", "short_text", "numeric", "writing"];
    if (exam.program === "ielts" && exam.mode === "full") {
      if (sectionId === "writing" || sectionId === "speaking") return ["writing"];
      return ["mcq_single", "short_text", "numeric"];
    }
    if (exam.program === "dsat") return ["mcq_single", "short_text", "numeric"];
    if (exam.program === "general") return ["mcq_single", "short_text", "numeric", "writing"];
    return ["mcq_single", "short_text", "numeric"];
  }, [exam?.program, exam?.mode, sectionId]);

  useEffect(() => {
    setNewType((prev) =>
      allowedTypes.includes(prev as QuestionType) ? prev : ((allowedTypes[0] ?? "mcq_single") as ExamQuestion["type"]),
    );
  }, [allowedTypes]);

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
    if (!exam) return [];
    if (!isDsat || !exam.structure?.sections?.length) return localQuestions;
    return localQuestions.filter((q) => (q.sectionId ?? firstSectionId) === sectionId);
  }, [exam, isDsat, firstSectionId, sectionId, localQuestions]);

  const pointsInCurrentSection = useMemo(
    () => questionsInCurrentSection.reduce((s, q) => s + q.points, 0),
    [questionsInCurrentSection],
  );

  const dirty = useMemo(() => {
    if (!exam) return false;
    return JSON.stringify(localQuestions) !== JSON.stringify(exam.questions);
  }, [exam, localQuestions]);

  const editSectionRow = useMemo(() => {
    if (!editBuf || !exam?.structure?.sections?.length) return undefined;
    return exam.structure.sections.find((s) => s.id === (editBuf.sectionId ?? sectionId));
  }, [editBuf, exam, sectionId]);

  const editSkillDomain: SatSkillDomain | null = editSectionRow ? satSkillDomainForSection(editSectionRow) : null;

  function sectionLabelForQuestion(sectionIdValue: string | undefined): string {
    const sid = sectionIdValue ?? firstSectionId;
    const s = exam?.structure?.sections?.find((x) => x.id === sid);
    return s?.label ?? sid;
  }

  function satSkillLabel(skill: SatQuestionSkill | undefined): string {
    if (!skill) return "";
    return `${skill.topic} → ${skill.subtopic}`;
  }

  async function patchExam(extra: Partial<Pick<Exam, "title" | "active" | "questions">> = {}) {
    if (!examId || !exam) return;
    setError(null);
    setSaving(true);
    try {
      const body = { ...extra, questions: extra.questions ?? localQuestions };
      const data = await api<{ exam: Exam }>(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setExam(data.exam);
      setLocalQuestions(data.exam.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveExam() {
    await patchExam({ questions: localQuestions });
  }

  function buildSatSkillForNewQuestion(): SatQuestionSkill | undefined {
    if (!isDsat || !skillDomain || !satTopic || !satSubtopic) return undefined;
    if (!isValidSatSkill(skillDomain, satTopic, satSubtopic)) {
      setError("Pick a valid SAT topic and subtopic for this module.");
      return undefined;
    }
    return { domain: skillDomain, topic: satTopic, subtopic: satSubtopic };
  }

  function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!exam) return;
    setError(null);

    const stemImage = promptImageUrl.trim() || undefined;
    const base = {
      id: uid(),
      sectionId: exam.structure?.sections?.length ? sectionId : undefined,
      prompt: prompt.trim(),
      promptImageUrl: stemImage,
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
      q = { ...base, type: "mcq_single", choices, correctChoiceIndex: safeIndex };
    } else if (newType === "short_text") {
      q = { ...base, type: "short_text", correctAnswer: correctAnswer.trim() };
    } else if (newType === "numeric") {
      q = { ...base, type: "numeric", correctNumber: Number(correctNumber) };
    } else {
      q = { ...base, type: "writing", rubric: rubric.trim() || undefined };
    }

    if (isDsat && skillDomain) {
      const sk = buildSatSkillForNewQuestion();
      if (!sk) return;
      q = attachSatSkill(q, sk);
    }

    setLocalQuestions((prev) => [...prev, q]);
    setPrompt("");
    setPromptImageUrl("");
    setChoiceRows([
      { ...emptyChoiceRow(), text: "" },
      { ...emptyChoiceRow(), text: "" },
      { ...emptyChoiceRow(), text: "" },
      { ...emptyChoiceRow(), text: "" },
    ]);
    setCorrectChoiceIndex(0);
    setCorrectAnswer("");
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
    const sk = "satSkill" in q ? q.satSkill : undefined;
    const sec = exam?.structure?.sections?.find((s) => s.id === (q.sectionId ?? sectionId));
    const dom = sec ? satSkillDomainForSection(sec) : null;
    if (sk) {
      setEditSatTopic(sk.topic);
      setEditSatSubtopic(sk.subtopic);
    } else if (exam?.program === "dsat" && dom) {
      const tax = taxonomyForDomain(dom);
      setEditSatTopic(tax[0]?.topic ?? "");
      setEditSatSubtopic(tax[0]?.subtopics[0] ?? "");
    } else {
      setEditSatTopic("");
      setEditSatSubtopic("");
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

    const sec = exam.structure?.sections?.find((s) => s.id === (next.sectionId ?? sectionId));
    const dom = sec ? satSkillDomainForSection(sec) : null;

    if (exam.program === "dsat" && dom) {
      if (!editSatTopic || !editSatSubtopic || !isValidSatSkill(dom, editSatTopic, editSatSubtopic)) {
        setError("Edit: pick a valid SAT topic and subtopic for this question’s module.");
        return;
      }
      next = attachSatSkill(next, { domain: dom, topic: editSatTopic, subtopic: editSatSubtopic });
    } else if (exam.program !== "dsat") {
      const cleaned = { ...(next as ExamQuestion & { satSkill?: SatQuestionSkill }) };
      delete cleaned.satSkill;
      next = cleaned as ExamQuestion;
    }

    setLocalQuestions((prev) => prev.map((x) => (x.id === editingId ? next : x)));
    cancelEdit();
  }

  const currentSectionLabel = exam?.structure?.sections?.find((s) => s.id === sectionId)?.label ?? "Module";
  const formGridClass = "mt-4 grid gap-4";
  const fullRow = "";

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
              {isDsat ? "Digital SAT · Exam editor" : "Exam"}
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-[var(--text)]">
              {exam?.title ?? "Loading…"}
            </h1>
            {exam ? (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {exam.program} · {exam.mode} · {localQuestions.length} questions in editor · {totalPoints} pts ·{" "}
                {exam.active ? "active" : "inactive"}
                {dirty ? <span className="font-semibold text-[var(--warning-badge-text)]"> · Unsaved changes</span> : null}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/exams"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
            >
              ← All exams
            </Link>
            <button
              type="button"
              disabled={!exam || saving || !dirty}
              onClick={() => void saveExam()}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save exam"}
            </button>
            <button
              type="button"
              disabled={!exam || saving}
              onClick={() => {
                if (!exam) return;
                void patchExam({ active: !exam.active });
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--hover)]"
            >
              {exam?.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]" role="alert">
            {error}
          </p>
        ) : null}

        {isDsat && exam?.structure?.sections?.length ? (
          <nav className="flex flex-wrap items-center gap-2" aria-label="SAT modules">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Module</span>
            {exam.structure.sections.map((s) => {
              const count = sectionQuestionCounts[s.id] ?? 0;
              const active = sectionId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSectionId(s.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]/30"
                  }`}
                >
                  {s.label}
                  <span className="tabular-nums text-xs text-[var(--muted)]">({count})</span>
                </button>
              );
            })}
          </nav>
        ) : null}

        {/* Add question — always on top */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-[var(--text)]">Add question</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isDsat && exam?.structure?.sections?.length
              ? `New items go into “${currentSectionLabel}”. Choose the SAT skill so reports and roadmaps stay accurate.`
              : "Add a question below, then use Save exam to write everything to the database."}
          </p>

          {isDsat && skillDomain ? (
            <div className="mt-4 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--text)]">
                SAT topic ({skillDomain === "rw" ? "Reading & Writing" : "Math"})
                <select
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={satTopic}
                  onChange={(e) => {
                    const t = e.target.value;
                    setSatTopic(t);
                    const subs = subtopicsForTopic(skillDomain, t);
                    setSatSubtopic(subs[0] ?? "");
                  }}
                >
                  {taxonomyForDomain(skillDomain).map((row) => (
                    <option key={row.topic} value={row.topic}>
                      {row.topic}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--text)]">
                Subtopic
                <select
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={satSubtopic}
                  onChange={(e) => setSatSubtopic(e.target.value)}
                >
                  {subtopicsForTopic(skillDomain, satTopic).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <form className={formGridClass} onSubmit={addQuestion}>
            <label className={`text-sm font-medium text-[var(--text)] ${fullRow}`}>
              Prompt
              <textarea
                className="mt-1 block min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </label>

            <div className={fullRow}>
              <p className="text-sm font-medium text-[var(--text)]">Question image (optional)</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]">
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
                  className="min-w-[12rem] flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
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

            <div className={fullRow}>
              <p className="text-sm font-medium text-[var(--text)]">Question format</p>
              <select
                className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ExamQuestion["type"])}
              >
                {allowedTypes.map((t) => (
                  <option key={t} value={t}>
                    {questionTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>

            {exam?.structure?.sections?.length && !isDsat ? (
              <label className="text-sm font-medium text-[var(--text)]">
                Section
                <select
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  {exam.structure.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="text-sm font-medium text-[var(--text)]">
              Points
              <input
                className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </label>

            {newType === "mcq_single" ? (
              <div className={`${fullRow} space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text)]">Answer choices</p>
                  <button
                    type="button"
                    onClick={() => setChoiceRows((rows) => [...rows, emptyChoiceRow()])}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40"
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
                                setChoiceRows((rows) =>
                                  rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)),
                                )
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
                                        setChoiceRows((rows) =>
                                          rows.map((r) => (r.id === row.id ? { ...r, imageUrl: url } : r)),
                                        ),
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
                                    rows.map((r) =>
                                      r.id === row.id ? { ...r, imageUrl: e.target.value || undefined } : r,
                                    ),
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
              <label className={`text-sm font-medium text-[var(--text)] ${fullRow}`}>
                Correct answer (exact match, case-insensitive)
                <input
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                />
              </label>
            ) : null}

            {newType === "numeric" ? (
              <label className={`text-sm font-medium text-[var(--text)] ${fullRow}`}>
                Correct number
                <input
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  type="number"
                  value={correctNumber}
                  onChange={(e) => setCorrectNumber(Number(e.target.value))}
                />
              </label>
            ) : null}

            {newType === "writing" ? (
              <label className={`text-sm font-medium text-[var(--text)] ${fullRow}`}>
                Rubric (optional)
                <textarea
                  className="mt-1 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                />
              </label>
            ) : null}

            <div className={fullRow}>
              <button
                type="submit"
                disabled={!exam}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--text)] px-6 text-sm font-semibold text-[var(--surface)] transition hover:opacity-90"
              >
                Add to list
              </button>
              <p className="mt-2 text-xs text-[var(--muted)]">
                This only updates the editor. Use <span className="font-semibold">Save exam</span> to persist to the
                database.
              </p>
            </div>
          </form>
        </section>

        {/* Questions list + edit */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">
                {isDsat ? `Questions · ${currentSectionLabel}` : "Questions"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {isDsat
                  ? `${questionsInCurrentSection.length} in this module · ${pointsInCurrentSection} pts`
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
            {(isDsat ? questionsInCurrentSection : localQuestions).map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                {editingId === q.id && editBuf ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                      Editing Q{idx + 1} · {questionTypeLabel(editBuf.type)}
                    </p>
                    <label className="text-sm font-medium text-[var(--text)]">
                      Prompt
                      <textarea
                        className="mt-1 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                        value={editBuf.prompt}
                        onChange={(e) => setEditBuf({ ...editBuf, prompt: e.target.value })}
                      />
                    </label>
                    <label className="text-sm font-medium text-[var(--text)]">
                      Points
                      <input
                        className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                        type="number"
                        min={1}
                        value={editBuf.points}
                        onChange={(e) =>
                          setEditBuf({ ...editBuf, points: Math.max(1, Number(e.target.value) || 1) } as ExamQuestion)
                        }
                      />
                    </label>

                    {isDsat && editSkillDomain ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-medium text-[var(--text)]">
                          SAT topic
                          <select
                            className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                            value={editSatTopic}
                            onChange={(e) => {
                              const t = e.target.value;
                              setEditSatTopic(t);
                              const subs = subtopicsForTopic(editSkillDomain, t);
                              setEditSatSubtopic(subs[0] ?? "");
                            }}
                          >
                            {taxonomyForDomain(editSkillDomain).map((row) => (
                              <option key={row.topic} value={row.topic}>
                                {row.topic}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-[var(--text)]">
                          Subtopic
                          <select
                            className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                            value={editSatSubtopic}
                            onChange={(e) => setEditSatSubtopic(e.target.value)}
                          >
                            {subtopicsForTopic(editSkillDomain, editSatTopic).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}

                    {editBuf.type === "mcq_single" ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[var(--text)]">Choices</p>
                        {editChoiceRows.map((row, i) => (
                          <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
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
                                setEditChoiceRows((rows) =>
                                  rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)),
                                )
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
                          onChange={(e) =>
                            setEditBuf({ ...editBuf, correctNumber: Number(e.target.value) } as ExamQuestion)
                          }
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
                        {"satSkill" in q && q.satSkill ? (
                          <p className="mt-2 text-xs font-semibold text-[var(--accent)]">{satSkillLabel(q.satSkill)}</p>
                        ) : isDsat ? (
                          <p className="mt-2 text-xs font-semibold text-[var(--warning-badge-text)]">SAT skill not set — edit to add</p>
                        ) : null}
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">{q.prompt}</p>
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
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--accent-soft)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestionLocal(q.id)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--danger-text)] hover:bg-[var(--danger-hover)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {(isDsat ? questionsInCurrentSection : localQuestions).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No questions yet. Add one above.</p>
            ) : null}
          </div>
        </section>

        <p className="text-xs text-[var(--faint)]">
          Multiple choice, short answer, and numeric items can auto-grade. SAT topic and subtopic are stored on each
          question for analytics and student roadmaps.
        </p>
      </div>
    </RoleGuard>
  );
}
