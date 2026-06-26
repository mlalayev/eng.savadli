"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type ProgramAccent = "ielts" | "dsat" | "general";

function ProgramIcon({ accent }: { accent: ProgramAccent }) {
  const paths: Record<ProgramAccent, ReactNode> = {
    ielts: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" strokeLinecap="round" />
      </svg>
    ),
    dsat: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h5" strokeLinecap="round" />
      </svg>
    ),
    general: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  };
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--accent)]">
      {paths[accent]}
    </div>
  );
}

export type ProgramCardProps = {
  accent: ProgramAccent;
  title: string;
  tagline: string;
  features: readonly string[];
  href: string;
};

export function ProgramCard({ accent, title, tagline, features, href }: ProgramCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/25"
      aria-label={`${title} program`}
    >
      <Card interactive variant="muted" padding="lg" className="flex h-full flex-col">
        <ProgramIcon accent={accent} />
        <CardTitle className="mt-6">{title}</CardTitle>
        <CardDescription className="mt-2 text-[0.9375rem] leading-7">{tagline}</CardDescription>
        <ul className="mt-6 flex-1 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-[var(--muted)]">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
        <p className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition group-hover:gap-2">
          Learn more
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
      </Card>
    </Link>
  );
}

export function programSlugToAccent(slug: string): ProgramAccent {
  if (slug === "ielts") return "ielts";
  if (slug === "digital-sat") return "dsat";
  return "general";
}
