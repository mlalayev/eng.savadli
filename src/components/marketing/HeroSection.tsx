"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, Button } from "@/components/ui/Button";
import { Floating } from "@/components/motion/Floating";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { LANDING_CONTAINER } from "@/components/marketing/Section";
import { fadeUpHidden, fadeUpTransition, fadeUpVisible } from "@/lib/motion";
import { cn } from "@/lib/cn";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80";

function StatCard({
  label,
  value,
  sub,
  className,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const card = (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]"
      aria-hidden
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--faint)]">{label}</p>
      <p className="mt-0.5 font-mono text-xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
      {sub ? <p className="text-[11px] text-[var(--muted)]">{sub}</p> : null}
    </div>
  );

  if (reduceMotion) return <div className={className}>{card}</div>;

  return (
    <Floating delay={delay} className={className}>
      <motion.div initial={fadeUpHidden} animate={fadeUpVisible} transition={fadeUpTransition(0.25 + delay)}>
        {card}
      </motion.div>
    </Floating>
  );
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden bg-[var(--background)] lg:min-h-[calc(100dvh-4.5rem)]"
    >
      <div
        className={cn(
          LANDING_CONTAINER,
          "grid w-full items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10",
        )}
      >
        <Stagger immediate className="max-w-xl">
          <StaggerItem>
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[12px] font-medium text-[var(--accent)]">
              IELTS · Digital SAT · General English
            </span>
          </StaggerItem>

          <StaggerItem>
            <h1
              id="hero-heading"
              className="mt-3 text-balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text)] sm:text-[2.5rem] lg:text-[2.75rem] xl:text-[3rem]"
            >
              The premium way to prepare for international exams.
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-3 max-w-md text-pretty text-base leading-7 text-[var(--muted)] sm:text-[1.0625rem]">
              Interactive lessons, realistic practice exams, and teacher feedback — one calm platform
              built for students who want real results.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/login" variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRightIcon />
              </Button>
              <Button href="/#programs" variant="outline" size="lg" className="w-full sm:w-auto">
                View Programs
              </Button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-4 text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--text)]">500+</span> students preparing on Savadli
            </p>
          </StaggerItem>
        </Stagger>

        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto lg:max-w-none">
          <p className="sr-only">
            Illustrative progress: IELTS band 7.5, Digital SAT 1420, daily progress 85%, study streak 12
            days.
          </p>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[85%] w-[85%] max-h-[22rem] max-w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-subtle)] lg:max-h-[26rem] lg:max-w-[26rem]"
            aria-hidden
          />

          <motion.div
            className="relative z-[1] mx-auto aspect-[5/4] w-full max-h-[min(280px,42dvh)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] sm:max-h-[min(340px,44dvh)] lg:mx-0 lg:ml-auto lg:aspect-[4/5] lg:max-h-[min(480px,calc(100dvh-10rem))] lg:max-w-[420px]"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          >
            <Image
              src={HERO_IMAGE}
              alt="Student studying with focus"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover object-center"
              priority
            />
          </motion.div>

          <StatCard
            label="IELTS Band"
            value="7.5"
            sub="Target"
            delay={0}
            className="absolute -right-1 top-4 z-[2] w-[7.5rem] sm:-right-3 sm:w-32 lg:top-6"
          />
          <StatCard
            label="Digital SAT"
            value="1420"
            sub="Average"
            delay={1}
            className="absolute -left-1 top-[40%] z-[2] hidden w-32 sm:-left-3 sm:block"
          />
          <StatCard
            label="Daily progress"
            value="85%"
            delay={2}
            className="absolute bottom-4 right-0 z-[2] hidden w-32 sm:block lg:bottom-8"
          />
          <StatCard
            label="Study streak"
            value="12 days"
            delay={1.5}
            className="absolute left-1 top-2 z-[2] hidden w-28 sm:block lg:left-2 lg:top-4"
          />
        </div>
      </div>
    </section>
  );
}
