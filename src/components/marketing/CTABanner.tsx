"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { ArrowRightIcon, Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type CTABannerProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  finePrint?: string;
  className?: string;
};

export function CTABanner({
  id = "cta",
  title = "Start preparing with clarity.",
  subtitle = "Join students and teachers who use Savadli to study with structure — from first lesson to exam day.",
  primaryHref = "/login",
  primaryLabel = "Get Started",
  secondaryHref = "/contact",
  secondaryLabel = "Talk to us",
  finePrint = "No credit card required for placement.",
  className,
}: CTABannerProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-20 sm:py-24",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 75%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] opacity-[0.05] blur-[100px]"
        aria-hidden
      />

      <FadeIn className="relative mx-auto max-w-2xl px-4 text-center sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{subtitle}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={primaryHref} variant="primary" size="lg" className="w-full sm:w-auto">
            {primaryLabel}
            <ArrowRightIcon />
          </Button>
          <Button href={secondaryHref} variant="outline" size="lg" className="w-full sm:w-auto">
            {secondaryLabel}
          </Button>
        </div>

        {finePrint ? <p className="mt-6 text-xs text-[var(--faint)]">{finePrint}</p> : null}
      </FadeIn>
    </section>
  );
}
