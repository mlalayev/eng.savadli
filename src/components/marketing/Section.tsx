import type { ReactNode } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/cn";

export const LANDING_CONTAINER = "mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-10";
export const LANDING_SECTION_PY = "py-24 sm:py-28 lg:py-32 xl:py-36";
export const LANDING_SCROLL_MT = "scroll-mt-20";
export const LANDING_GRID_GAP = "gap-6";
export const LANDING_HEADER_TO_CONTENT = "mt-16";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "muted";
  bordered?: boolean;
};

const toneStyles = {
  default: "bg-[var(--background)]",
  muted: "bg-[var(--card)]",
};

export function Section({
  id,
  children,
  className,
  tone = "default",
  bordered = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        LANDING_SCROLL_MT,
        LANDING_SECTION_PY,
        toneStyles[tone],
        bordered && "border-y border-[var(--border)]",
        className,
      )}
    >
      <div className={LANDING_CONTAINER}>{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  variant?: "light" | "dark";
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  variant = "light",
}: SectionHeaderProps) {
  const centered = align === "center";
  const dark = variant === "dark";

  return (
    <FadeIn className={cn(centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-[13px] font-medium tracking-wide",
            dark ? "text-[var(--footer-heading)]/80" : "text-[var(--accent)]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance font-semibold tracking-[-0.025em]",
          dark ? "text-[var(--footer-heading)]" : "text-[var(--text)]",
          eyebrow ? "mt-3" : "",
          "text-[2rem] leading-[1.12] sm:text-[2.75rem] lg:text-[3rem]",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-5 text-pretty text-[1.0625rem] leading-8 text-[var(--muted)] sm:text-lg",
            centered && "mx-auto max-w-2xl",
            dark && "text-[var(--footer-text)]",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </FadeIn>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
