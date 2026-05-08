"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExamQuestion } from "@/lib/exams/types";
import type { Exam, IeltsGroup, IeltsMaterialsMap } from "./shared/types";
import { api, uploadImageFile, uploadAudioFile } from "./shared/api";
import { uid, ieltsGroupForSectionId, ieltsGroupLabel, formatRichText } from "./shared/helpers";
import { ExamHeader } from "./shared/ExamHeader";
import { parseHtmlInputs, countHtmlQuestions } from "@/lib/exams/html-parser";
import { HtmlPreview } from "./HtmlPreview";
import { HtmlInteractiveRunner } from "./HtmlInteractiveRunner";
import { ListeningAudioPanel } from "@/components/dashboard/ListeningAudioPanel";

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

  // Switching group also picks the first subsection synchronously to avoid a render flicker.
  function switchGroup(g: IeltsGroup) {
    setIeltsGroup(g);
    const firstInGroup = sections.find((s) => ieltsGroupForSectionId(s.id) === g);
    if (firstInGroup) setSectionId(firstInGroup.id);
  }

  const AUDIO_TAB_ID = "__audio__";
  const isAudioTab = ieltsGroup === "listening" && sectionId === AUDIO_TAB_ID;
  const currentSection = sections.find((s) => s.id === sectionId);
  const currentSectionLabel = isAudioTab ? "Listening · Audio" : currentSection?.label ?? "";

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

      <TabsShell
        ieltsGroup={ieltsGroup}
        setIeltsGroup={switchGroup}
        groupSections={groupSections}
        sectionId={sectionId}
        setSectionId={setSectionId}
        sectionStatus={sectionStatus}
        hasAudioTab={ieltsGroup === "listening"}
        audioTabId={AUDIO_TAB_ID}
        audioFilled={Boolean(ieltsMaterials[LISTENING_AUDIO_KEY]?.audioUrl?.trim())}
      >
        {isAudioTab ? (
          <AudioPanel
            sectionLabel={currentSectionLabel}
            listeningAudioUrl={ieltsMaterials[LISTENING_AUDIO_KEY]?.audioUrl ?? ""}
            onListeningAudioUrlChange={(url) =>
              setIeltsMaterials((prev) => ({
                ...prev,
                [LISTENING_AUDIO_KEY]: { ...(prev[LISTENING_AUDIO_KEY] ?? {}), audioUrl: url },
              }))
            }
            uploadBusy={uploadBusy}
            setUploadBusy={setUploadBusy}
            onError={(msg) => setError(msg)}
          />
        ) : (ieltsGroup === "listening" || ieltsGroup === "reading") && currentSection ? (
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
            html={getHtml(sectionId)}
            onHtmlPatch={(patch) => upsertHtml(sectionId, patch)}
          />
        ) : ieltsGroup === "writing" && currentSection ? (
          <WritingTaskPanel
            sectionId={sectionId}
            sectionLabel={currentSectionLabel}
            writing={getWriting(sectionId)}
            onWritingPatch={(patch) => upsertWriting(sectionId, patch)}
            uploadBusy={uploadBusy}
            setUploadBusy={setUploadBusy}
            onError={(msg) => setError(msg)}
          />
        ) : ieltsGroup === "speaking" && currentSection ? (
          <SpeakingPartPanel
            sectionId={sectionId}
            sectionLabel={currentSectionLabel}
            questions={
              localQuestions.filter(
                (q) => q.sectionId === sectionId && q.type === "writing",
              ) as WritingQ[]
            }
            onAdd={() => addSpeakingQuestion(sectionId)}
            onUpdate={(qid, patch) => updateQuestion(qid, patch)}
            onRemove={(qid) => removeQuestion(qid)}
            uploadBusy={uploadBusy}
            setUploadBusy={setUploadBusy}
            onError={(msg) => setError(msg)}
          />
        ) : null}
      </TabsShell>

      <IeltsSectionPreview
        group={ieltsGroup}
        sectionId={sectionId}
        sectionLabel={currentSectionLabel}
        questions={
          isAudioTab
            ? []
            : (localQuestions.filter((q) => q.sectionId === sectionId) as ExamQuestion[])
        }
        materialText={ieltsMaterials[sectionId]?.text ?? ""}
        listeningAudioUrl={ieltsMaterials[LISTENING_AUDIO_KEY]?.audioUrl ?? ""}
        isAudioTab={isAudioTab}
      />
    </div>
  );
}

/* =========================
   Tabs shell (group tabs + subsection bar + content)
   ========================= */

function TabsShell({
  ieltsGroup,
  setIeltsGroup,
  groupSections,
  sectionId,
  setSectionId,
  sectionStatus,
  hasAudioTab,
  audioTabId,
  audioFilled,
  children,
}: {
  ieltsGroup: IeltsGroup;
  setIeltsGroup: (g: IeltsGroup) => void;
  groupSections: { id: string; label: string }[];
  sectionId: string;
  setSectionId: (sid: string) => void;
  sectionStatus: Record<string, { filled: boolean; count: number }>;
  hasAudioTab: boolean;
  audioTabId: string;
  audioFilled: boolean;
  children: React.ReactNode;
}) {
  const groups: IeltsGroup[] = ["listening", "reading", "writing", "speaking"];

  const subTabs: { id: string; label: string; isAudio?: boolean }[] = [
    ...groupSections.map((s) => ({ id: s.id, label: shortSubsectionLabel(s.label) })),
    ...(hasAudioTab ? [{ id: audioTabId, label: "Audio", isAudio: true }] : []),
  ];

  return (
    <div>
      {/* Group tabs row */}
      <div className="flex flex-wrap gap-1 px-1">
        {groups.map((g) => {
          const on = ieltsGroup === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setIeltsGroup(g)}
              className={`relative -mb-px inline-flex h-10 min-w-[7rem] items-center justify-center rounded-t-xl px-5 text-sm font-semibold transition ${
                on
                  ? "z-10 border border-[var(--border)] border-b-[var(--surface)] bg-[var(--surface)] text-[var(--text)] shadow-[0_-1px_0_var(--shadow-ring)]"
                  : "border border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              }`}
            >
              {ieltsGroupLabel(g)}
            </button>
          );
        })}
      </div>

      {/* Panel attached to the active group tab */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        {/* Subsection bar */}
        <div className="flex flex-wrap items-stretch border-b border-[var(--border)] bg-[var(--background)] px-1.5">
          {subTabs.map((s) => {
            const on = sectionId === s.id;
            const status = s.isAudio
              ? { filled: audioFilled, count: 0 }
              : sectionStatus[s.id] ?? { filled: false, count: 0 };
            const showCount = ieltsGroup === "speaking" && !s.isAudio;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSectionId(s.id)}
                className={`relative inline-flex h-11 items-center gap-2 px-4 text-xs font-semibold transition ${
                  on
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                <span>{s.label}</span>
                {showCount ? (
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
                    className={`h-1.5 w-1.5 rounded-full ${
                      status.filled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                    }`}
                  />
                )}
                {on ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--accent)]"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Active panel content */}
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
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
  html,
  onHtmlPatch,
}: {
  group: "listening" | "reading";
  sectionId: string;
  sectionLabel: string;
  materialText: string;
  onMaterialTextChange: (text: string) => void;
  html: HtmlQ | undefined;
  onHtmlPatch: (patch: Partial<HtmlQ>) => void;
}) {
  const detected = useMemo(
    () => parseHtmlInputs(html?.htmlContent ?? ""),
    [html?.htmlContent],
  );
  const correctAnswers = html?.correctAnswers ?? [];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
          {sectionLabel}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {group === "listening"
            ? "Add the listening script / notes (optional) and write the section's HTML/CSS. Manage the shared audio in the Audio tab."
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
    </div>
  );
}

function AudioPanel({
  sectionLabel,
  listeningAudioUrl,
  onListeningAudioUrlChange,
  uploadBusy,
  setUploadBusy,
  onError,
}: {
  sectionLabel: string;
  listeningAudioUrl: string;
  onListeningAudioUrlChange: (url: string) => void;
  uploadBusy: string | null;
  setUploadBusy: (key: string | null) => void;
  onError: (msg: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
          {sectionLabel}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          One audio file shared across all four listening sections. Students play this while
          answering Sections 1–4.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
        <p className="text-sm font-semibold text-[var(--text)]">Audio file</p>
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
          <span className="text-xs text-[var(--muted)]">or URL</span>
          <input
            className="min-w-[16rem] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            type="text"
            placeholder="/uploads/… or https://…"
            value={listeningAudioUrl}
            onChange={(e) => onListeningAudioUrlChange(e.target.value)}
          />
        </div>
        {listeningAudioUrl.trim() ? (
          <audio className="mt-4 w-full" controls src={listeningAudioUrl.trim()} />
        ) : (
          <p className="mt-3 text-xs text-[var(--muted)]">No audio attached yet.</p>
        )}
      </div>
    </div>
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
    <div className="space-y-5">
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
    </div>
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
    <div className="space-y-5">
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
    </div>
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

/* =========================
   Question preview (mirrors student-side IELTS rendering)
   ========================= */

function IeltsSectionPreview({
  group,
  sectionId,
  sectionLabel,
  questions,
  materialText,
  listeningAudioUrl,
  isAudioTab,
}: {
  group: IeltsGroup;
  sectionId: string;
  sectionLabel: string;
  questions: ExamQuestion[];
  materialText: string;
  listeningAudioUrl: string;
  isAudioTab: boolean;
}) {
  const empty = (() => {
    if (isAudioTab) return null;
    if (questions.length === 0) {
      if (group === "listening" || group === "reading")
        return "Add HTML content above to see how this section will render for students.";
      if (group === "writing") return "Add a task prompt above to see the preview.";
      if (group === "speaking") return "Add at least one prompt above to see the preview.";
    }
    return null;
  })();

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--background)] px-5 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Question preview
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--text)]">{sectionLabel || "—"}</p>
        </div>
        <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          Student view
        </span>
      </header>

      <div className="bg-[var(--background)] p-4 sm:p-6">
        {empty ? (
          <p className="py-10 text-center text-sm text-[var(--muted)]">{empty}</p>
        ) : isAudioTab ? (
          <ListeningAudioPanel src={listeningAudioUrl} subtitle="Shared across Sections 1–4" />
        ) : group === "listening" ? (
          <PreviewListeningSplit
            sectionId={sectionId}
            sectionLabel={sectionLabel}
            materialText={materialText}
            questions={questions}
            listeningAudioUrl={listeningAudioUrl}
          />
        ) : (
          <PreviewQuestionStack questions={questions} sectionId={sectionId} />
        )}
      </div>
    </section>
  );
}

function PreviewListeningSplit({
  sectionId,
  sectionLabel,
  materialText,
  questions,
  listeningAudioUrl,
}: {
  sectionId: string;
  sectionLabel: string;
  materialText: string;
  questions: ExamQuestion[];
  listeningAudioUrl: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(260px,320px)_1fr]">
      <aside className="space-y-4">
        <ListeningAudioPanel src={listeningAudioUrl} subtitle={sectionLabel || undefined} />
        {materialText.trim() ? (
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[var(--accent-soft)]/60 blur-2xl"
            />
            <div className="relative border-b border-[var(--border)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Materials
              </p>
              <h3 className="mt-1 text-sm font-semibold text-[var(--text)]">
                Script and directions
              </h3>
            </div>
            <div className="relative max-h-[28rem] overflow-y-auto px-5 py-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                {formatRichText(materialText)}
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        {questions.map((q, i) =>
          q.type === "html_interactive" ? (
            <div
              key={q.id}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
            >
              <HtmlInteractiveRunner
                questionId={q.id}
                htmlContent={q.htmlContent}
                cssContent={q.cssContent}
                disabled
                storedAnswersJson="{}"
                onValuesChange={() => {}}
                bare
                iframeId={`preview-q-${sectionId}-${i + 1}`}
              />
            </div>
          ) : (
            <PreviewQuestionCard key={q.id} q={q} localN={i + 1} appearance="listening" />
          ),
        )}
      </div>
    </div>
  );
}

function PreviewQuestionStack({
  questions,
  sectionId,
}: {
  questions: ExamQuestion[];
  sectionId: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {questions.map((q, i) => (
        <PreviewQuestionCard
          key={q.id}
          q={q}
          localN={i + 1}
          appearance="default"
          sectionId={sectionId}
        />
      ))}
    </div>
  );
}

function PreviewQuestionCard({
  q,
  localN,
  appearance,
  sectionId,
}: {
  q: ExamQuestion;
  localN: number;
  appearance: "default" | "listening";
  sectionId?: string;
}) {
  const cardShell =
    appearance === "listening"
      ? "scroll-mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--shadow-ring)]"
      : "scroll-mt-4 rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface)] p-5 shadow-sm ring-1 ring-[var(--accent)]/15";

  return (
    <div className={cardShell}>
      <p
        className={
          appearance === "listening"
            ? "text-xs font-semibold uppercase tracking-wider text-[var(--accent)]"
            : "text-xs font-semibold uppercase tracking-wider text-[var(--faint)]"
        }
      >
        Question <span className="text-[var(--text)]">{localN}</span>
        <span className="font-normal text-[var(--faint)]"> · {q.points} pts</span>
      </p>

      {q.description ? (
        <div className="mt-2 whitespace-pre-wrap border-l-2 border-[var(--border)] pl-2 text-xs font-medium italic text-[var(--muted)]">
          {formatRichText(q.description)}
        </div>
      ) : null}

      {q.type !== "rich_text" && "prompt" in q ? (
        <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
          {formatRichText(q.prompt)}
        </div>
      ) : null}

      {q.type === "rich_text" && "content" in q ? (
        <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
          {formatRichText(q.content)}
        </div>
      ) : null}

      {"promptImageUrl" in q && q.promptImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={q.promptImageUrl}
          alt=""
          className="mt-3 max-h-64 w-auto max-w-full rounded-lg border border-[var(--border)] object-contain"
        />
      ) : null}

      {q.type === "writing" ? (
        <textarea
          className="mt-4 block min-h-40 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
          placeholder="Student response goes here…"
          disabled
        />
      ) : null}

      {q.type === "html_interactive" ? (
        <HtmlInteractiveRunner
          questionId={q.id}
          htmlContent={q.htmlContent}
          cssContent={q.cssContent}
          disabled
          storedAnswersJson="{}"
          onValuesChange={() => {}}
          iframeId={
            sectionId ? `preview-q-${sectionId}-${localN}` : `preview-q-${q.id}-${localN}`
          }
        />
      ) : null}

      {q.type === "short_text" ? (
        <input
          className="mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
          placeholder="Type your answer…"
          disabled
        />
      ) : null}

      {q.type === "numeric" ? (
        <input
          className="mt-4 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
          type="number"
          placeholder="0"
          disabled
        />
      ) : null}
    </div>
  );
}
