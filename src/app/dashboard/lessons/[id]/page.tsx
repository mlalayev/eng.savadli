"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type Lesson = {
  id: string;
  title: string;
  program: "ielts" | "dsat" | "general";
  body: string;
  links: Array<{ label: string; url: string }>;
  createdAt: string;
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

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = typeof params?.id === "string" ? params.id : "";
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    queueMicrotask(() => {
      void api<{ lesson: Lesson }>(`/api/lessons/${lessonId}`)
        .then((d) => setLesson(d.lesson))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
    });
  }, [lessonId]);

  return (
    <RoleGuard allow={["student"]}>
      <div>
        <Link href="/dashboard/lessons" className="text-sm font-medium text-[var(--accent)] hover:underline">
          ← Lessons
        </Link>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
          {lesson?.title ?? "Loading…"}
        </h1>
        {lesson ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {lesson.program} · {new Date(lesson.createdAt).toLocaleString()}
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">{error}</p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--text)]">Lesson notes</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
            {lesson?.body ?? ""}
          </div>
        </section>

        {lesson?.links?.length ? (
          <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[var(--text)]">Links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {lesson.links.map((l) => (
                <li key={l.url}>
                  <a className="font-medium text-[var(--accent)] hover:underline" href={l.url} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                  <span className="ml-2 text-xs text-[var(--faint)]">{l.url}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </RoleGuard>
  );
}

