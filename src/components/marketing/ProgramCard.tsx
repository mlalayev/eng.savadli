"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type ProgramAccent = "ielts" | "dsat" | "general";

const accentStyles: Record<
  ProgramAccent,
  { badge: string; border: string; icon: string; stripe: string }
> = {
  ielts: {
    badge: "bg-[var(--program-ielts-soft)] text-[var(--program-ielts)]",
    border: "group-hover:border-[var(--program-ielts)]/30",
    icon: "bg-[var(--program-ielts-soft)] text-[var(--program-ielts)]",
    stripe: "bg-[var(--program-ielts)]",
  },
  dsat: {
    badge: "bg-[var(--program-dsat-soft)] text-[var(--program-dsat)]",
    border: "group-hover:border-[var(--program-dsat)]/30",
    icon: "bg-[var(--program-dsat-soft)] text-[var(--program-dsat)]",
    stripe: "bg-[var(--program-dsat)]",
  },
  general: {
    badge: "bg-[var(--program-general-soft)] text-[var(--program-general)]",
    border: "group-hover:border-[var(--program-general)]/30",
    icon: "bg-[var(--program-general-soft)] text-[var(--program-general)]",
    stripe: "bg-[var(--program-general)]",
  },
};

export type ProgramCardProps = {
  accent: ProgramAccent;
  title: string;
  tagline: string;
  features: readonly string[];
  href: string;
  icon?: ReactNode;
};

export function ProgramCard({
  accent,
  title,
  tagline,
  features,
  href,
  icon,
}: ProgramCardProps) {
  const styles = accentStyles[accent];
  const reduceMotion = useReducedMotion();

  const inner = (
    <Card
      interactive
      padding="lg"
      className={cn(
        "relative flex h-full flex-col overflow-hidden",
        styles.border,
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 scale-x-0 transition duration-200 group-hover:scale-x-100",
          styles.stripe,
        )}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
            styles.badge,
          )}
        >
          {accent === "dsat" ? "Digital SAT" : accent === "ielts" ? "IELTS" : "General"}
        </span>
        {icon ? (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", styles.icon)}>
            {icon}
          </div>
        ) : null}
      </div>

      <CardTitle className="mt-5">{title}</CardTitle>
      <CardDescription className="mt-2 text-[15px]">{tagline}</CardDescription>

      <ul className="mt-6 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-[var(--muted)]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <p className="mt-8 flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition group-hover:gap-2.5">
        Learn more
        <ArrowRightIcon className="transition group-hover:translate-x-0.5" />
      </p>
    </Card>
  );

  return (
    <Link href={href} className="group block h-full">
      {reduceMotion ? (
        inner
      ) : (
        <motion.div className="h-full" whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}>
          {inner}
        </motion.div>
      )}
    </Link>
  );
}

export function programSlugToAccent(slug: string): ProgramAccent {
  if (slug === "ielts") return "ielts";
  if (slug === "digital-sat") return "dsat";
  return "general";
}
