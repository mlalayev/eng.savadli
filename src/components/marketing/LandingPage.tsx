"use client";

import { PROGRAMS } from "@/lib/programs";
import {
  FAQ_ITEMS,
  LEARNING_STEPS,
  PLATFORM_FEATURES,
  STATS,
  TESTIMONIALS,
  WHY_FEATURES,
} from "@/lib/marketing";
import { CTABanner } from "@/components/marketing/CTABanner";
import { FAQ } from "@/components/marketing/FAQ";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ProgramCard, programSlugToAccent } from "@/components/marketing/ProgramCard";
import { StatisticsSection } from "@/components/marketing/StatCard";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { Card, CardDescription, CardIcon, CardTitle } from "@/components/ui/Card";

const PROGRAM_FEATURES: Record<string, string[]> = {
  ielts: ["Full mock tests", "Section drills", "Writing & speaking feedback"],
  "digital-sat": ["Bluebook-style interface", "Module timing", "Score analytics"],
  "general-english": ["Grammar & vocabulary", "Guided lessons", "Progress tracking"],
};

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <FadeIn className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-[var(--muted)]">{subtitle}</p> : null}
    </FadeIn>
  );
}

export function LandingPage() {
  return (
    <main className="flex-1">
      <HeroSection />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <SectionHeader
            eyebrow="Why Savadli"
            title="Built for exams that actually matter."
            subtitle="Everything you need to study with focus — nothing you don't."
          />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card interactive padding="lg" className="h-full">
                  <CardIcon>
                    <span className="text-sm font-semibold">✓</span>
                  </CardIcon>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="programs" className="scroll-mt-24 bg-[var(--surface)] py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <SectionHeader
            title="Three paths. One platform."
            subtitle="Choose your program — every track shares the same premium study experience."
          />
          <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
            {PROGRAMS.map((program) => (
              <StaggerItem key={program.slug}>
                <ProgramCard
                  accent={programSlugToAccent(program.slug)}
                  title={program.title}
                  tagline={program.summary}
                  features={PROGRAM_FEATURES[program.slug] ?? program.outcomes.slice(0, 3)}
                  href={`/programs#${program.slug}`}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="practice" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <SectionHeader
            title="From first lesson to exam day."
            subtitle="A clear path — not a pile of random PDFs."
          />
          <FadeIn delay={0.1}>
            <ol className="relative mt-14 hidden lg:flex lg:justify-between">
              <div
                className="absolute left-0 right-0 top-3 h-0.5 bg-[var(--border)]"
                aria-hidden
              />
              {LEARNING_STEPS.map((item) => (
                <li key={item.step} className="relative flex flex-col items-center px-2 text-center">
                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--accent-soft)] bg-[var(--surface)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-[var(--text)]">{item.step}</p>
                  <p className="mt-2 max-w-[180px] text-xs leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </FadeIn>
          <Stagger className="mt-10 space-y-6 lg:hidden">
            {LEARNING_STEPS.map((item) => (
              <StaggerItem key={item.step}>
                <Card padding="md" className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
                    {item.step[0]}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{item.step}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-[var(--surface-sunken)] py-16 sm:py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <SectionHeader
            title="Everything in one place."
            subtitle="Tools students use daily — and teachers trust to assign and grade."
          />
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card interactive padding="md" className="h-full">
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <StatisticsSection
        stats={STATS}
        footnote="Based on student surveys after 8 weeks of structured preparation."
      />

      <Testimonials items={TESTIMONIALS} />

      <FAQ items={FAQ_ITEMS} />

      <CTABanner />
    </main>
  );
}
