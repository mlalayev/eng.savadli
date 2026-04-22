"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import type { ExamMode, ExamProgram, ExamSection, ExamStructure, QuestionType } from "@/lib/exams/types";

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

function makeSections(program: ExamProgram, mode: ExamMode): ExamSection[] {
  if (program === "ielts" && mode === "full") {
    return [
      { id: "reading", label: "Reading", kind: "ielts_reading" },
      { id: "listening", label: "Listening", kind: "ielts_listening" },
      { id: "writing", label: "Writing", kind: "ielts_writing" },
      { id: "speaking", label: "Speaking", kind: "ielts_speaking" },
    ];
  }
  if (program === "dsat" && mode === "full") {
    return [
      { id: "rw1", label: "Reading & Writing 1", kind: "dsat_rw_1" },
      { id: "rw2", label: "Reading & Writing 2", kind: "dsat_rw_2" },
      { id: "math1", label: "Math 1", kind: "dsat_math_1" },
      { id: "math2", label: "Math 2", kind: "dsat_math_2" },
    ];
  }
  // drill or general
  return [{ id: "drill", label: "Drill", kind: program === "general" ? "general" : "general" }];
}

function allowedTypes(program: ExamProgram, mode: ExamMode, sectionId: string | null): QuestionType[] {
  if (program === "ielts" && mode === "full") {
    if (sectionId === "writing" || sectionId === "speaking") return ["writing"];
    return ["mcq_single", "short_text", "numeric"];
  }
  if (program === "dsat") {
    // DSAT mostly objective; allow writing only if you want later.
    return ["mcq_single", "short_text", "numeric"];
  }
  if (program === "general") return ["mcq_single", "short_text", "numeric", "writing"];
  // drill default
  return ["mcq_single", "short_text", "numeric"];
}

export default function NewExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [title, setTitle] = useState("");
  const [program, setProgram] = useState<ExamProgram>("ielts");
  const [mode, setMode] = useState<ExamMode>("full");
  const [drillSection, setDrillSection] = useState<string>("reading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sections = useMemo(() => {
    if (mode === "drill") {
      if (program === "ielts") {
        return [
          { id: "reading", label: "Reading", kind: "ielts_reading" },
          { id: "listening", label: "Listening", kind: "ielts_listening" },
          { id: "writing", label: "Writing", kind: "ielts_writing" },
          { id: "speaking", label: "Speaking", kind: "ielts_speaking" },
        ] satisfies ExamSection[];
      }
      if (program === "dsat") {
        return [
          { id: "rw", label: "Reading & Writing", kind: "dsat_rw_1" },
          { id: "math", label: "Math", kind: "dsat_math_1" },
        ] satisfies ExamSection[];
      }
      return [{ id: "general", label: "General", kind: "general" }] satisfies ExamSection[];
    }
    return makeSections(program, mode);
  }, [program, mode]);

  const selectedSectionId = mode === "drill" ? drillSection : sections[0]?.id ?? null;
  const types = useMemo(() => allowedTypes(program, mode, selectedSectionId), [program, mode, selectedSectionId]);

  const structure = useMemo((): ExamStructure => {
    const baseSections =
      mode === "full"
        ? makeSections(program, mode)
        : [
            {
              id: drillSection,
              label: sections.find((s) => s.id === drillSection)?.label ?? "Drill",
              kind: sections.find((s) => s.id === drillSection)?.kind ?? "general",
            },
          ];

    return { program, mode, sections: baseSections } as ExamStructure;
  }, [program, mode, drillSection, sections]);

  async function create() {
    setError(null);
    setBusy(true);
    try {
      const data = await api<{ id: string }>("/api/exams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          program,
          mode,
          structure,
        }),
      });
      router.push(`/dashboard/exams/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create exam");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Exams</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">Create exam</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Choose program and mode. Sections are created automatically (IELTS full: 4 sections; DSAT full: 4 sections).
            </p>
          </div>
          <Link
            href="/dashboard/exams"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
          >
            ← Back
          </Link>
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Setup</h2>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                <span className={step === 1 ? "text-[var(--accent)]" : ""}>1 Program</span>
                <span>•</span>
                <span className={step === 2 ? "text-[var(--accent)]" : ""}>2 Mode</span>
                <span>•</span>
                <span className={step === 3 ? "text-[var(--accent)]" : ""}>3 Confirm</span>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block text-sm font-medium text-[var(--text)]">
                Title
                <input
                  className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. IELTS Mock Exam 1"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { id: "ielts", label: "IELTS", sub: "4 sections (full)" },
                    { id: "dsat", label: "Digital SAT", sub: "2 RW + 2 Math (full)" },
                    { id: "general", label: "General English", sub: "Flexible" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProgram(p.id);
                      setStep(2);
                    }}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${
                      program === p.id
                        ? "border-[var(--accent)]/35 bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/25"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--text)]">{p.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{p.sub}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Step 2</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">Full exam or drill?</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      { id: "full", label: "Full exam", sub: "All sections included" },
                      { id: "drill", label: "Drill", sub: "Single section practice" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMode(m.id);
                        setStep(3);
                      }}
                      className={`rounded-2xl border bg-[var(--surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${
                        mode === m.id ? "border-[var(--accent)]/35 bg-[var(--accent-soft)]" : "border-[var(--border)]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--text)]">{m.label}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{m.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {mode === "drill" ? (
                <label className="block text-sm font-medium text-[var(--text)]">
                  Drill section
                  <select
                    className="mt-1 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                    value={drillSection}
                    onChange={(e) => setDrillSection(e.target.value)}
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </section>

          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Preview</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Program</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{program}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Mode</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{mode}</p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Sections</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text)]">
                  {structure.sections.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <span className="font-medium">{s.label}</span>
                      <span className="text-xs text-[var(--muted)]">{s.id}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Question types</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Available types for the first section:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {types.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={busy || title.trim().length === 0}
                onClick={() => void create()}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {busy ? "Creating…" : "Create exam"}
              </button>

              <p className="text-xs text-[var(--faint)]">
                After creating, you’ll add questions and assign each question to a section.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </RoleGuard>
  );
}

