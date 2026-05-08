"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExamQuestion } from "@/lib/exams/types";
import type { Exam, IeltsGroup, IeltsMaterialsMap } from "./shared/types";
import { api, uploadImageFile, uploadAudioFile } from "./shared/api";
import { uid, ieltsGroupForSectionId, ieltsGroupLabel } from "./shared/helpers";
import { ExamHeader } from "./shared/ExamHeader";
import { parseHtmlInputs, countHtmlQuestions } from "@/lib/exams/html-parser";
import { HtmlPreview } from "./HtmlPreview";

type IeltsExamEditorProps = {
  exam: Exam;
  onUpdate: () => Promise<void>;
};

const LISTENING_AUDIO_KEY = "__ielts_listening_audio__";

type HtmlQ = Extract<ExamQuestion, { type: "html_interactive" }>;
type WritingQ = Extract<ExamQuestion, { type: "writing" }>;

export function IeltsExamEditor({ exam, onUpdate }: IeltsExamEditorProps) {
  const [localQuestions, setLocalQuestions] = useState<ExamQuestion[]>(exam.questions);
  const [ieltsMaterials, setIeltsMaterials] = useState<IeltsMaterialsMap>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState<string | null>(null);

  const [ieltsGroup, setIeltsGroup] = useState<IeltsGroup>("listening");
  const [sectionId, setSectionId] = useState<string>("");

  // Sync local state with exam props (after save / reload)
  useEffect(() => {
    setLocalQuestions(exam.questions);
  }, [exam.questions]);

  useEffect(() => {
    const m =
      (exam.structure as unknown as { materials?: IeltsMaterialsMap } | undefined)?.materials ?? {};
    setIeltsMaterials(m);
    // intentionally only depend on exam.id — refreshing the exam shouldn't blow away unsaved edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.id]);

  const sections = exam.structure?.sections ?? [];
  const groupSections = useMemo(
    () => sections.filter((s) => ieltsGroupForSectionId(s.id) === ieltsGroup),
    [sections, ieltsGroup],
  );

  // Auto-pick the first subsection whenever the group changes
  useEffect(() => {
    if (groupSections.length === 0) return;
    setSectionId((prev) => (groupSections.some((s) => s.id === prev) ? prev : groupSections[0].id));
  }, [groupSections]);

  const currentSection = sections.find((s) => s.id === sectionId);
  const currentSectionLabel = currentSection?.label ?? "";

  // ---------- Derived counts / dirty / totals ----------
  const totalPoints = useMemo(
    () => localQuestions.reduce((sum, q) => sum + q.points, 0),
    [localQuestions],
  );

  const initialMaterialsJson = useMemo(() => {
    const initial =
      (exam.structure as unknown as { materials?: IeltsMaterialsMap } | undefined)?.materials ?? {};
    return JSON.stringify(initial);
  }, [exam.id, exam.structure]);

  const dirty = useMemo(() => {
    const qChanged = JSON.stringify(localQuestions) !== JSON.stringify(exam.questions);
    const mChanged = JSON.stringify(ieltsMaterials) !== initialMaterialsJson;
    return qChanged || mChanged;
  }, [localQuestions, exam.questions, ieltsMaterials, initialMaterialsJson]);

  const sectionStatus = useMemo(() => {
    const status: Record<string, { filled: boolean; count: number }> = {};
    for (const s of sections) {
      const group = ieltsGroupForSectionId(s.id);
      const qs = localQuestions.filter((q) => q.sectionId === s.id);
      if (group === "listening" || group === "reading") {
        const html = qs.find((q) => q.type === "html_interactive") as HtmlQ | undefined;
        status[s.id] = { filled: Boolean(html?.htmlContent?.trim()), count: html ? 1 : 0 };
      } else if (group === "writing") {
        const w = qs.find((q) => q.type === "writing") as WritingQ | undefined;
        status[s.id] = { filled: Boolean(w?.prompt?.trim()), count: w ? 1 : 0 };
      } else {
        status[s.id] = { filled: qs.length > 0, count: qs.length };
      }
    }
    return status;
  }, [sections, localQuestions]);

  // ---------- Mutators ----------
  function getHtml(sid: string): HtmlQ | undefined {
    return localQuestions.find(
      (q) => q.sectionId === sid && q.type === "html_interactive",
    ) as HtmlQ | undefined;
  }

  function getWriting(sid: string): WritingQ | undefined {
    return localQuestions.find((q) => q.sectionId === sid && q.type === "writing") as
      | WritingQ
      | undefined;
  }

  function upsertHtml(sid: string, patch: Partial<HtmlQ>) {
    setLocalQuestions((prev) => {
      const idx = prev.findIndex((q) => q.sectionId === sid && q.type === "html_interactive");
      if (idx < 0) {
        const created: HtmlQ = {
          id: uid(),
          sectionId: sid,
          type: "html_interactive",
          prompt: "",
          htmlContent: "",
          cssContent: undefined,
          correctAnswers: [],
          points: 1,
          ...patch,
        };
        return [...prev, created];
      }
      const next = { ...(prev[idx] as HtmlQ), ...patch } as ExamQuestion;
      return prev.map((q, i) => (i === idx ? next : q));
    });
  }

  function upsertWriting(sid: string, patch: Partial<WritingQ>) {
    setLocalQuestions((prev) => {
      const idx = prev.findIndex((q) => q.sectionId === sid && q.type === "writing");
      if (idx < 0) {
        const created: WritingQ = {
          id: uid(),
          sectionId: sid,
          type: "writing",
          prompt: "",
          points: 1,
          ...patch,
        };
        return [...prev, created];
      }
      const next = { ...(prev[idx] as WritingQ), ...patch } as ExamQuestion;
      return prev.map((q, i) => (i === idx ? next : q));
    });
  }

  function addSpeakingQuestion(sid: string) {
    const q: WritingQ = {
      id: uid(),
      sectionId: sid,
      type: "writing",
      prompt: "",
      points: 1,
    };
    setLocalQuestions((prev) => [...prev, q]);
  }

  function updateQuestion(qid: string, patch: Partial<WritingQ>) {
    setLocalQuestions((prev) =>
      prev.map((q) => (q.id === qid ? ({ ...(q as WritingQ), ...patch } as ExamQuestion) : q)),
    );
  }

  function removeQuestion(qid: string) {
    setLocalQuestions((prev) => prev.filter((q) => q.id !== qid));
  }

  // ---------- API ----------
  async function saveExam() {
    setSaving(true);
    setError(null);
    try {
      const structureBase = (exam.structure as unknown as Record<string, unknown>) ?? {};
      await api(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questions: localQuestions,
          structure: { ...structureBase, materials: ieltsMaterials },
        }),
      });
      await onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
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
    if (!window.confirm("Delete this exam? This cannot be undone.")) return;
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

  // ---------- Render ----------
  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
        <p
          role="alert"
          className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]"
        >
          {error}
        </p>
      ) : null}

      <SectionNav
        ieltsGroup={ieltsGroup}
        setIeltsGroup={setIeltsGroup}
        groupSections={groupSections}
        sectionId={sectionId}
        setSectionId={setSectionId}
        sectionStatus={sectionStatus}
      />

      {(ieltsGroup === "listening" || ieltsGroup === "reading") && currentSection ? (
        <HtmlSectionPanel
          group={ieltsGroup}
          sectionId={sectionId}
          sectionLabel={currentSectionLabel}
          materialText={ieltsMaterials[sectionId]?.text ?? ""}
          onMaterialTextChange={(text) =>
            setIeltsMaterials((prev) => ({
              ...prev,
              [sectionId]: { ...(prev[sectionId] ?? {}), text },
            }))
          }
          listeningAudioUrl={ieltsMaterials[LISTENING_AUDIO_KEY]?.audioUrl ?? ""}
          onListeningAudioUrlChange={(url) =>
            setIeltsMaterials((prev) => ({
              ...prev,
              [LISTENING_AUDIO_KEY]: { ...(prev[LISTENING_AUDIO_KEY] ?? {}), audioUrl: url },
            }))
          }
          html={getHtml(sectionId)}
          onHtmlPatch={(patch) => upsertHtml(sectionId, patch)}
          uploadBusy={uploadBusy}
          setUploadBusy={setUploadBusy}
          onError={(msg) => setError(msg)}
        />
      ) : null}

      {ieltsGroup === "writing" && currentSection ? (
        <WritingTaskPanel
          sectionId={sectionId}
          sectionLabel={currentSectionLabel}
          writing={getWriting(sectionId)}
          onWritingPatch={(patch) => upsertWriting(sectionId, patch)}
          uploadBusy={uploadBusy}
          setUploadBusy={setUploadBusy}
          onError={(msg) => setError(msg)}
        />
      ) : null}

      {ieltsGroup === "speaking" && currentSection ? (
        <SpeakingPartPanel
          sectionId={sectionId}
          sectionLabel={currentSectionLabel}
          questions={localQuestions.filter(
            (q) => q.sectionId === sectionId && q.type === "writing",
          ) as WritingQ[]}
          onAdd={() => addSpeakingQuestion(sectionId)}
          onUpdate={(qid, patch) => updateQuestion(qid, patch)}
          onRemove={(qid) => removeQuestion(qid)}
          uploadBusy={uploadBusy}
          setUploadBusy={setUploadBusy}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </div>
  );
}

/* =========================
   Section navigator
   ========================= */

function SectionNav({
  ieltsGroup,
  setIeltsGroup,
  groupSections,
  sectionId,
  setSectionId,
  sectionStatus,
}: {
  ieltsGroup: IeltsGroup;
  setIeltsGroup: (g: IeltsGroup) => void;
  groupSections: { id: string; label: string }[];
  sectionId: string;
  setSectionId: (sid: string) => void;
  sectionStatus: Record<string, { filled: boolean; count: number }>;
}) {
  const groups: IeltsGroup[] = ["listening", "reading", "writing", "speaking"];

  const groupHelp: Record<IeltsGroup, string> = {
    listening: "4 sections · one HTML/CSS question per section · one shared audio file",
    reading: "3 passages · one HTML/CSS question per passage",
    writing: "2 tasks · prompt + optional image attachment per task",
    speaking: "3 parts · add as many prompts as you like per part",
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
          IELTS sections
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">{groupHelp[ieltsGroup]}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {groups.map((g) => {
          const on = ieltsGroup === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setIeltsGroup(g)}
              className={`inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
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

      <div className="mt-4 flex flex-wrap gap-2">
        {groupSections.map((s) => {
          const on = sectionId === s.id;
          const status = sectionStatus[s.id] ?? { filled: false, count: 0 };
          const shortLabel = shortSubsectionLabel(s.label);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition ${
                on
                  ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--text)] hover:bg-[var(--hover)]"
              }`}
            >
              <span>{shortLabel}</span>
              {ieltsGroup === "speaking" ? (
                <span
                  className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    status.count > 0
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "bg-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {status.count}
                </span>
              ) : (
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    status.filled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function shortSubsectionLabel(full: string): string {
  // "Listening · Section 1" -> "Section 1"
  const dot = full.indexOf("·");
  return dot >= 0 ? full.slice(dot + 1).trim() : full;
}

/* =========================
   Listening / Reading panel
   ========================= */

function HtmlSectionPanel({
  group,
  sectionId,
  sectionLabel,
  materialText,
  onMaterialTextChange,
  listeningAudioUrl,
  onListeningAudioUrlChange,
  html,
  onHtmlPatch,
  uploadBusy,
  setUploadBusy,
  onError,
}: {
  group: "listening" | "reading";
  sectionId: string;
  sectionLabel: string;
  materialText: string;
  onMaterialTextChange: (text: string) => void;
  listeningAudioUrl: string;
  onListeningAudioUrlChange: (url: string) => void;
  html: HtmlQ | undefined;
  onHtmlPatch: (patch: Partial<HtmlQ>) => void;
  uploadBusy: string | null;
  setUploadBusy: (key: string | null) => void;
  onError: (msg: string) => void;
}) {
  const detected = useMemo(
    () => parseHtmlInputs(html?.htmlContent ?? ""),
    [html?.htmlContent],
  );
  const correctAnswers = html?.correctAnswers ?? [];

  return (
    <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
          {sectionLabel}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {group === "listening"
            ? "Add the listening script / notes (optional) and write the section's HTML/CSS. The audio file below is shared across all four listening sections."
            : "Paste the reading passage and write the section's HTML/CSS. Only one HTML question lives in this passage."}
        </p>
      </div>

      {/* Passage / script */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
        <label className="block text-sm font-semibold text-[var(--text)]">
          {group === "reading" ? "Passage" : "Script / notes (optional)"}
          <textarea
            key={`material-${sectionId}`}
            className="mt-2 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            value={materialText}
            onChange={(e) => onMaterialTextChange(e.target.value)}
            placeholder={
              group === "reading"
                ? "Paste the reading passage here…"
                : "Paste the listening script / notes here (optional — students don't see it during the test unless you display it)."
            }
          />
        </label>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Formatting: <span className="font-semibold text-[var(--text)]">**bold**</span>,{" "}
          <span className="font-semibold text-[var(--text)]">__italic__</span>,{" "}
          <span className="font-semibold text-[var(--text)]">~underline~</span>,{" "}
          <span className="font-semibold text-[var(--text)]">~~strikethrough~~</span>,{" "}
          <span className="font-semibold text-[var(--text)]">[title] … [title]</span>.
        </p>
      </div>

      {/* Listening audio (shared) */}
      {group === "listening" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Listening audio (shared across Sections 1–4)
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]">
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                disabled={Boolean(uploadBusy)}
                onChange={(e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0];
                  input.value = "";
                  if (!file) return;
                  setUploadBusy("listening_audio");
                  void uploadAudioFile(file)
                    .then((url) => onListeningAudioUrlChange(url))
                    .catch((err) =>
                      onError(err instanceof Error ? err.message : "Upload failed"),
                    )
                    .finally(() => setUploadBusy(null));
                }}
              />
              {uploadBusy === "listening_audio" ? "Uploading…" : "Choose file"}
            </label>
            <span className="text-xs text-[var(--muted)]">or</span>
            <input
              className="min-w-[16rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              type="text"
              placeholder="/uploads/… or https://…"
              value={listeningAudioUrl}
              onChange={(e) => onListeningAudioUrlChange(e.target.value)}
            />
          </div>
          {listeningAudioUrl.trim() ? (
            <audio className="mt-3 w-full" controls src={listeningAudioUrl.trim()} />
          ) : (
            <p className="mt-3 text-xs text-[var(--muted)]">No audio attached yet.</p>
          )}
        </div>
      ) : null}

      {/* HTML / CSS editor */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Question (HTML / CSS)</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Use <code className="rounded bg-[var(--surface)] px-1 py-0.5">{`<input type="text" name="q1"/>`}</code>{" "}
              or <code className="rounded bg-[var(--surface)] px-1 py-0.5">{`<input type="radio" name="q2" value="a"/>`}</code>.
              Each unique <span className="font-semibold text-[var(--text)]">name</span> = one sub-question.
            </p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
            {countHtmlQuestions(html?.htmlContent ?? "")} sub-questions
          </span>
        </div>

        <label className="mt-4 block text-sm font-medium text-[var(--text)]">
          Prompt / instructions (shown above the HTML)
          <textarea
            className="mt-1.5 block min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            value={html?.prompt ?? ""}
            onChange={(e) => onHtmlPatch({ prompt: e.target.value })}
            placeholder="e.g. Questions 1–10. Complete the notes below."
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-[var(--text)]">
          HTML
          <textarea
            className="mt-1.5 block min-h-72 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-sm"
            value={html?.htmlContent ?? ""}
            onChange={(e) => onHtmlPatch({ htmlContent: e.target.value })}
            placeholder='<p>1. The course starts on <input type="text" name="q1"/></p>'
            spellCheck={false}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-[var(--text)]">
          CSS (optional)
          <textarea
            className="mt-1.5 block min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-sm"
            value={html?.cssContent ?? ""}
            onChange={(e) =>
              onHtmlPatch({ cssContent: e.target.value.length ? e.target.value : undefined })
            }
            placeholder="p { margin: 8px 0; }"
            spellCheck={false}
          />
        </label>

        {(html?.htmlContent ?? "").trim() ? (
          <div className="mt-4">
            <HtmlPreview
              htmlContent={html?.htmlContent ?? ""}
              cssContent={html?.cssContent ?? ""}
              showQuestionCount
              questionCount={countHtmlQuestions(html?.htmlContent ?? "")}
            />
          </div>
        ) : null}

        <CorrectAnswersConfig
          detected={detected}
          answers={correctAnswers}
          onChange={(next) => onHtmlPatch({ correctAnswers: next })}
        />

        <label className="mt-4 block text-sm font-medium text-[var(--text)] sm:max-w-[12rem]">
          Points
          <input
            className="mt-1.5 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            type="number"
            min={1}
            value={html?.points ?? 1}
            onChange={(e) => onHtmlPatch({ points: Math.max(1, Number(e.target.value) || 1) })}
          />
        </label>
      </div>
    </section>
  );
}

function CorrectAnswersConfig({
  detected,
  answers,
  onChange,
}: {
  detected: ReturnType<typeof parseHtmlInputs>;
  answers: HtmlQ["correctAnswers"];
  onChange: (next: HtmlQ["correctAnswers"]) => void;
}) {
  if (detected.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs text-[var(--muted)]">
          Add inputs to your HTML to configure correct answers here.
        </p>
      </div>
    );
  }

  function setAnswer(name: string, value: string, type: "text" | "radio") {
    const next = answers.filter((a) => a.name !== name);
    if (value.trim().length > 0) next.push({ name, value, type });
    onChange(next);
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text)]">Correct answers</p>
        <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
          {answers.length}/{detected.length} set
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        For text inputs, use <span className="font-semibold text-[var(--text)]">|</span> to allow
        multiple acceptable answers (case-insensitive).
      </p>
      <div className="mt-3 space-y-2.5">
        {detected.map((input) => {
          const existing = answers.find((a) => a.name === input.name);
          return (
            <div
              key={input.name}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                  {input.name}{" "}
                  <span className="font-normal lowercase text-[var(--muted)]">
                    ({input.type})
                  </span>
                </p>
                {existing ? (
                  <span className="text-xs font-semibold text-[var(--accent)]">Set</span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">Not set</span>
                )}
              </div>
              {input.type === "text" ? (
                <input
                  className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  type="text"
                  value={existing?.value ?? ""}
                  onChange={(e) => setAnswer(input.name, e.target.value, "text")}
                  placeholder="answer 1|answer 2|…"
                />
              ) : input.radioValues && input.radioValues.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {input.radioValues.map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`__correct_${input.name}`}
                        checked={existing?.value === v}
                        onChange={() => setAnswer(input.name, v, "radio")}
                      />
                      <span className="text-[var(--text)]">{v}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Radio inputs detected without a <code className="font-mono">value=&quot;…&quot;</code>{" "}
                  attribute. Add values so students can be graded.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   Writing task panel
   ========================= */

function WritingTaskPanel({
  sectionId,
  sectionLabel,
  writing,
  onWritingPatch,
  uploadBusy,
  setUploadBusy,
  onError,
}: {
  sectionId: string;
  sectionLabel: string;
  writing: WritingQ | undefined;
  onWritingPatch: (patch: Partial<WritingQ>) => void;
  uploadBusy: string | null;
  setUploadBusy: (key: string | null) => void;
  onError: (msg: string) => void;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
          {sectionLabel}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Write the task prompt students must respond to. Optional image (chart, diagram) and
          rubric for graders.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
        <label className="block text-sm font-semibold text-[var(--text)]">
          Task prompt
          <textarea
            key={`writing-prompt-${sectionId}`}
            className="mt-2 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
            value={writing?.prompt ?? ""}
            onChange={(e) => onWritingPatch({ prompt: e.target.value })}
            placeholder="e.g. The chart below shows… Summarise the information by selecting and reporting the main features…"
          />
        </label>
      </div>

      <ImageAttachField
        label="Diagram / image (optional)"
        value={writing?.promptImageUrl ?? ""}
        onChange={(url) => onWritingPatch({ promptImageUrl: url || undefined })}
        uploadBusy={uploadBusy}
        setUploadBusy={setUploadBusy}
        uploadKey={`writing-img-${sectionId}`}
        onError={onError}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <label className="block text-sm font-semibold text-[var(--text)]">
            Rubric (optional)
            <textarea
              className="mt-2 block min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              value={writing?.rubric ?? ""}
              onChange={(e) =>
                onWritingPatch({ rubric: e.target.value.length ? e.target.value : undefined })
              }
              placeholder="Notes for the grader: band descriptors, key features to award, etc."
            />
          </label>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <label className="block text-sm font-semibold text-[var(--text)] sm:max-w-[12rem]">
            Points
            <input
              className="mt-2 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
              type="number"
              min={1}
              value={writing?.points ?? 1}
              onChange={(e) =>
                onWritingPatch({ points: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Speaking part panel
   ========================= */

function SpeakingPartPanel({
  sectionId,
  sectionLabel,
  questions,
  onAdd,
  onUpdate,
  onRemove,
  uploadBusy,
  setUploadBusy,
  onError,
}: {
  sectionId: string;
  sectionLabel: string;
  questions: WritingQ[];
  onAdd: () => void;
  onUpdate: (qid: string, patch: Partial<WritingQ>) => void;
  onRemove: (qid: string) => void;
  uploadBusy: string | null;
  setUploadBusy: (key: string | null) => void;
  onError: (msg: string) => void;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            {sectionLabel}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add as many speaking prompts as you like for this part.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
        >
          + Add prompt
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--text)]">No prompts yet</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Click <span className="font-semibold text-[var(--text)]">Add prompt</span> to create
            the first one.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {questions.map((q, idx) => (
            <li
              key={q.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                  Prompt {idx + 1}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(q.id)}
                  className="rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--error-text)] hover:opacity-80"
                >
                  Remove
                </button>
              </div>

              <label className="mt-2 block text-sm font-medium text-[var(--text)]">
                Prompt
                <textarea
                  className="mt-1.5 block min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  value={q.prompt}
                  onChange={(e) => onUpdate(q.id, { prompt: e.target.value })}
                  placeholder="e.g. Describe a place you have visited that you found memorable…"
                />
              </label>

              <div className="mt-3">
                <ImageAttachField
                  label="Image (optional)"
                  value={q.promptImageUrl ?? ""}
                  onChange={(url) => onUpdate(q.id, { promptImageUrl: url || undefined })}
                  uploadBusy={uploadBusy}
                  setUploadBusy={setUploadBusy}
                  uploadKey={`speaking-img-${sectionId}-${q.id}`}
                  onError={onError}
                />
              </div>

              <label className="mt-3 block text-sm font-medium text-[var(--text)] sm:max-w-[10rem]">
                Points
                <input
                  className="mt-1.5 block h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                  type="number"
                  min={1}
                  value={q.points}
                  onChange={(e) =>
                    onUpdate(q.id, { points: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* =========================
   Reusable image-attach field
   ========================= */

function ImageAttachField({
  label,
  value,
  onChange,
  uploadBusy,
  setUploadBusy,
  uploadKey,
  onError,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploadBusy: string | null;
  setUploadBusy: (key: string | null) => void;
  uploadKey: string;
  onError: (msg: string) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            disabled={Boolean(uploadBusy)}
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              input.value = "";
              if (!file) return;
              setUploadBusy(uploadKey);
              void uploadImageFile(file)
                .then((url) => onChange(url))
                .catch((err) =>
                  onError(err instanceof Error ? err.message : "Upload failed"),
                )
                .finally(() => setUploadBusy(null));
            }}
          />
          {uploadBusy === uploadKey ? "Uploading…" : "Choose file"}
        </label>
        <span className="text-xs text-[var(--muted)]">or URL</span>
        <input
          className="min-w-[14rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          type="text"
          placeholder="/uploads/… or https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {value.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.trim()}
          alt=""
          className="mt-3 max-h-56 w-auto max-w-full rounded-lg border border-[var(--border)] object-contain"
        />
      ) : null}
    </div>
  );
}
