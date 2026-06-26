import type { ReactNode } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/cn";

/** Shared landing layout tokens — keep all sections aligned to one grid */
export const LANDING_CONTAINER = "mx-auto w-full max-w-[1120px] px-6 sm:px-8";
export const LANDING_SECTION_PY = "py-20 sm:py-28";
export const LANDING_SCROLL_MT = "scroll-mt-20";
export const LANDING_GRID_GAP = "gap-6";
export const LANDING_HEADER_TO_CONTENT = "mt-14";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** subtle band backgrounds */
  tone?: "default" | "surface" | "sunken";
  bordered?: boolean;
};

const toneStyles = {
  default: "bg-[var(--background)]",
  surface: "bg-[var(--surface)]",
  sunken: "bg-[var(--surface-sunken)]",
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
  /** For dark bands (statistics, footer-adjacent) */
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
    <FadeIn
      className={cn(
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-[13px] font-medium tracking-wide",
            dark ? "text-[var(--footer-heading)] opacity-80" : "text-[var(--accent)]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance font-semibold tracking-[-0.02em]",
          dark ? "text-[var(--footer-heading)]" : "text-[var(--text)]",
          eyebrow ? "mt-3" : "",
          "text-[2rem] leading-[1.15] sm:text-[2.5rem]",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-pretty text-[1.0625rem] leading-7 sm:text-lg sm:leading-8",
            dark ? "text-[var(--footer-text)]" : "text-[var(--muted)]",
            centered && "mx-auto max-w-xl",
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
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
