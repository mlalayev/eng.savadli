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
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
      aria-hidden
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-[var(--faint)]">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p> : null}
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
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-[var(--background)]">
      <div className={cn(LANDING_CONTAINER, "relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28 xl:py-32")}>
        <Stagger immediate className="max-w-xl">
          <StaggerItem>
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--accent)]">
              IELTS · Digital SAT · General English
            </span>
          </StaggerItem>

          <StaggerItem>
            <h1
              id="hero-heading"
              className="mt-6 text-balance text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--text)] sm:text-[3rem] lg:text-[3.5rem]"
            >
              The premium way to prepare for international exams.
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-6 max-w-lg text-pretty text-lg leading-8 text-[var(--muted)]">
              Interactive lessons, realistic practice exams, and teacher feedback — one calm platform
              built for students who want real results.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            <p className="mt-10 flex items-center gap-2 text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--text)]">500+</span>
              students preparing on Savadli
            </p>
          </StaggerItem>
        </Stagger>

        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none">
          <p className="sr-only">
            Illustrative progress: IELTS band 7.5, Digital SAT 1420, daily progress 85%, study streak 12
            days.
          </p>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(100%,28rem)] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-subtle)]"
            aria-hidden
          />

          <motion.div
            className="relative z-[1] aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          >
            <Image
              src={HERO_IMAGE}
              alt="Student studying with focus"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              priority
            />
          </motion.div>

          <StatCard
            label="IELTS Band"
            value="7.5"
            sub="Target"
            delay={0}
            className="absolute -right-2 top-6 z-[2] w-36 sm:-right-4 sm:w-40"
          />
          <StatCard
            label="Digital SAT"
            value="1420"
            sub="Average"
            delay={1}
            className="absolute -left-2 top-[42%] z-[2] hidden w-36 sm:-left-4 sm:block sm:w-40"
          />
          <StatCard
            label="Daily progress"
            value="85%"
            delay={2}
            className="absolute bottom-6 right-0 z-[2] hidden w-36 sm:block sm:w-40"
          />
          <StatCard
            label="Study streak"
            value="12 days"
            delay={1.5}
            className="absolute left-2 top-4 z-[2] hidden w-32 sm:block"
          />
        </div>
      </div>
    </section>
  );
}
