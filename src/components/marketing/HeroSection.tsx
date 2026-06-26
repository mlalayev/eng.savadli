"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, Button } from "@/components/ui/Button";
import { Floating } from "@/components/motion/Floating";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { fadeUpHidden, fadeUpTransition, fadeUpVisible } from "@/lib/motion";
import { cn } from "@/lib/cn";

function HeroFloatingCard({
  label,
  value,
  sub,
  className,
  delay = 0,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
  delay?: number;
  accent?: "ielts" | "sat" | "progress" | "streak";
}) {
  const reduceMotion = useReducedMotion();

  const card = (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        accent === "sat" && "border-l-[3px] border-l-[var(--program-dsat)]",
        className,
      )}
      aria-hidden
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--faint)]">{label}</p>
      <p className="mt-1 font-mono text-[28px] font-semibold leading-8 text-[var(--text)]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p> : null}
      {accent === "ielts" ? (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
          <div className="h-full w-3/4 rounded-full bg-[var(--accent)]" />
        </div>
      ) : null}
      {accent === "progress" ? (
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[var(--surface-sunken)]"
            style={{
              background: `conic-gradient(var(--accent) 68%, var(--surface-sunken) 0)`,
            }}
          />
          <span className="text-xs text-[var(--muted)]">Complete</span>
        </div>
      ) : null}
    </div>
  );

  if (reduceMotion) return <div className={className}>{card}</div>;

  return (
    <Floating delay={delay} className={className}>
      <motion.div
        initial={fadeUpHidden}
        animate={fadeUpVisible}
        transition={fadeUpTransition(0.3 + delay * 0.15)}
      >
        {card}
      </motion.div>
    </Floating>
  );
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[680px] overflow-hidden border-b border-[var(--border)] lg:min-h-[720px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[600px] translate-x-1/4 rounded-full bg-[var(--accent)] opacity-[0.06] blur-[120px]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-20 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-24">
        <Stagger immediate className="max-w-[520px]">
          <StaggerItem>
            <span className="inline-flex h-7 items-center rounded-full border border-[var(--accent-soft)] bg-[var(--accent-subtle)] px-3 text-[13px] font-medium text-[var(--accent-pressed)]">
              IELTS · Digital SAT · General English
            </span>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.11] tracking-[-0.03em] text-[var(--text)] sm:text-5xl lg:text-[52px] lg:leading-[58px]">
              Prepare for international exams with{" "}
              <span className="text-[var(--accent)]">structure</span> — not stress.
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-6 max-w-[480px] text-lg leading-7 text-[var(--muted)]">
              Savadli combines guided lessons, realistic practice exams, and teacher feedback in one calm
              workspace — built for students targeting real scores.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="/login" variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRightIcon />
              </Button>
              <Button href="/#programs" variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Programs
              </Button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
              {["Realistic exam formats", "Teacher-reviewed feedback", "Built for timed practice"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
                    <svg
                      className="shrink-0 text-[var(--accent)]"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </StaggerItem>
        </Stagger>

        <div className="relative mx-auto w-full max-w-[448px] lg:mx-0 lg:ml-auto lg:max-w-none">
          <motion.div
            className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0, 0, 0.2, 1], delay: 0.12 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-subtle)] via-[var(--surface)] to-[var(--surface-sunken)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text)]">Your study workspace</p>
              <p className="text-xs text-[var(--muted)]">Replace with a student photo in production</p>
            </div>
          </motion.div>

          <HeroFloatingCard
            label="IELTS"
            value="7.5"
            sub="Target band"
            accent="ielts"
            delay={0}
            className="absolute -right-4 top-6 z-[3] w-[148px] sm:-right-6 sm:w-[172px]"
          />
          <HeroFloatingCard
            label="Digital SAT"
            value="1420"
            sub="Practice average"
            accent="sat"
            delay={1.2}
            className="absolute -left-4 top-[38%] z-[2] hidden w-[156px] sm:-left-8 sm:block"
          />
          <HeroFloatingCard
            label="This week"
            value="68%"
            accent="progress"
            delay={2.4}
            className="absolute bottom-8 right-2 z-[4] hidden w-[156px] sm:right-4 sm:block"
          />
          <HeroFloatingCard
            label="Streak"
            value="12 days"
            delay={1.8}
            className="absolute left-3 top-3 z-[1] w-[130px] opacity-90 sm:left-5 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
