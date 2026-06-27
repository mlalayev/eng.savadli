"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { LANDING_HEADER_TO_CONTENT, SectionHeader } from "@/components/marketing/Section";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type TeamPlaceholderProps = {
  members: readonly { role: string }[];
  className?: string;
};

export function TeamPlaceholder({ members, className }: TeamPlaceholderProps) {
  return (
    <>
      <SectionHeader
        eyebrow="Team"
        title="The people behind Savadli."
        subtitle="Profiles coming soon — we are growing a team passionate about education and craft."
      />
      <FadeIn
        className={cn(
          LANDING_HEADER_TO_CONTENT,
          "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
          className,
        )}
      >
        {members.map((member) => (
          <Card key={member.role} variant="muted" padding="lg" className="text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[var(--border)] bg-[var(--background)]"
              aria-hidden
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--faint)]"
              >
                <path
                  d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-5 text-sm font-semibold text-[var(--text)]">Coming soon</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{member.role}</p>
          </Card>
        ))}
      </FadeIn>
    </>
  );
}
