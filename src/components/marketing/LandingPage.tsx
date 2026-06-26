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
import {
  CheckIcon,
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { Card, CardDescription, CardIcon, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const PROGRAM_FEATURES: Record<string, string[]> = {
  ielts: ["Full mock tests", "Section drills", "Writing & speaking feedback"],
  "digital-sat": ["Bluebook-style interface", "Module timing", "Score analytics"],
  "general-english": ["Grammar & vocabulary", "Guided lessons", "Progress tracking"],
};

export function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>

      <main id="main-content" className="flex-1 bg-[var(--background)]">
        <HeroSection />

        <Section>
          <SectionHeader
            eyebrow="Why Savadli"
            title="Built for exams that actually matter."
            subtitle="Everything you need to study with focus — nothing you don't."
          />
          <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "sm:grid-cols-2 lg:grid-cols-4")}>
            {WHY_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card interactive padding="lg" className="h-full">
                  <CardIcon>
                    <CheckIcon />
                  </CardIcon>
                  <CardTitle className="mt-5">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="programs" tone="surface">
          <SectionHeader
            eyebrow="Programs"
            title="Three paths. One platform."
            subtitle="Choose your program — every track shares the same premium study experience."
          />
          <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "lg:grid-cols-3")}>
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
        </Section>

        <Section id="practice">
          <SectionHeader
            eyebrow="Learning path"
            title="From first lesson to exam day."
            subtitle="A clear path — not a pile of random PDFs."
          />
          <FadeIn delay={0.08} className={LANDING_HEADER_TO_CONTENT}>
            <ol className="relative hidden lg:grid lg:grid-cols-5 lg:gap-4">
              <div
                className="absolute left-[10%] right-[10%] top-3 h-px bg-[var(--border)]"
                aria-hidden
              />
              {LEARNING_STEPS.map((item, index) => (
                <li key={item.step} className="relative flex flex-col items-center px-2 text-center">
                  <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--accent-soft)] bg-[var(--surface)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-[var(--text)]">
                    <span className="sr-only">Step {index + 1}: </span>
                    {item.step}
                  </p>
                  <p className="mt-2 max-w-[11rem] text-xs leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </FadeIn>
          <Stagger className={cn("mt-8 space-y-4 lg:hidden", LANDING_HEADER_TO_CONTENT)}>
            {LEARNING_STEPS.map((item, index) => (
              <StaggerItem key={item.step}>
                <Card padding="md" className="flex gap-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-semibold text-[var(--accent)]"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[0.9375rem] font-semibold text-[var(--text)]">{item.step}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="features" tone="sunken">
          <SectionHeader
            eyebrow="Platform"
            title="Everything in one place."
            subtitle="Tools students use daily — and teachers trust to assign and grade."
          />
          <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "sm:grid-cols-2 lg:grid-cols-3")}>
            {PLATFORM_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card interactive padding="md" className="h-full">
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="mt-1.5">{feature.description}</CardDescription>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <StatisticsSection
          stats={STATS}
          footnote="Based on student surveys after 8 weeks of structured preparation."
        />

        <Testimonials items={TESTIMONIALS} />

        <FAQ items={FAQ_ITEMS} />

        <CTABanner />
      </main>
    </>
  );
}
