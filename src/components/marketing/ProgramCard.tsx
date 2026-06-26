"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type ProgramAccent = "ielts" | "dsat" | "general";

const accentStyles: Record<
  ProgramAccent,
  { badge: string; border: string; stripe: string }
> = {
  ielts: {
    badge: "bg-[var(--program-ielts-soft)] text-[var(--program-ielts)]",
    border: "group-hover:border-[var(--program-ielts)]/25",
    stripe: "bg-[var(--program-ielts)]",
  },
  dsat: {
    badge: "bg-[var(--program-dsat-soft)] text-[var(--program-dsat)]",
    border: "group-hover:border-[var(--program-dsat)]/25",
    stripe: "bg-[var(--program-dsat)]",
  },
  general: {
    badge: "bg-[var(--program-general-soft)] text-[var(--program-general)]",
    border: "group-hover:border-[var(--program-general)]/25",
    stripe: "bg-[var(--program-general)]",
  },
};

const accentLabels: Record<ProgramAccent, string> = {
  ielts: "IELTS",
  dsat: "Digital SAT",
  general: "General English",
};

export type ProgramCardProps = {
  accent: ProgramAccent;
  title: string;
  tagline: string;
  features: readonly string[];
  href: string;
};

export function ProgramCard({ accent, title, tagline, features, href }: ProgramCardProps) {
  const styles = accentStyles[accent];

  return (
    <Link
      href={href}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/25"
      aria-label={`${title} — learn more`}
    >
      <Card
        interactive
        padding="lg"
        className={cn("relative flex h-full flex-col overflow-hidden", styles.border)}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 scale-x-0 transition duration-200 group-hover:scale-x-100",
            styles.stripe,
          )}
          aria-hidden
        />

        <span
          className={cn(
            "inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.04em]",
            styles.badge,
          )}
        >
          {accentLabels[accent]}
        </span>

        <CardTitle className="mt-5">{title}</CardTitle>
        <CardDescription className="mt-2 text-[0.9375rem] leading-6">{tagline}</CardDescription>

        <ul className="mt-6 flex-1 space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-[var(--muted)]">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>

        <p className="mt-8 flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition group-hover:gap-2">
          Learn more
          <ArrowRightIcon className="transition group-hover:translate-x-0.5" />
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
