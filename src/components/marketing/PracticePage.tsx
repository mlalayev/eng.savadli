"use client";

import { CTABanner } from "@/components/marketing/CTABanner";
import { PageHero } from "@/components/marketing/PageHero";
import { PracticeAreaCard } from "@/components/marketing/PracticeAreaCard";
import { PracticeFlow } from "@/components/marketing/PracticeFlow";
import {
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { Card, CardDescription, CardIcon, CardTitle } from "@/components/ui/Card";
import {
  DSAT_PRACTICE,
  GENERAL_ENGLISH_PRACTICE,
  IELTS_PRACTICE,
  PRACTICE_FLOW_STEPS,
  PRACTICE_PLATFORM_FEATURES,
} from "@/lib/practice-page";
import type { PracticeArea } from "@/lib/practice-page";
import { cn } from "@/lib/cn";

function FeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

function PracticeAreaGrid({ areas, columns }: { areas: readonly PracticeArea[]; columns: string }) {
  return (
    <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, columns)}>
      {areas.map((area) => (
        <StaggerItem key={area.title}>
          <PracticeAreaCard title={area.title} description={area.description} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function PracticePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-2xl focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>

      <main id="main-content" className="flex-1 bg-[var(--background)]">
        <PageHero
          eyebrow="Practice"
          title="Practice Smarter. Improve Faster."
          description="Build confidence with realistic practice tests, timed exercises, homework, teacher feedback, and detailed progress tracking."
          primaryHref="/login"
          primaryLabel="Start Practicing"
        />

        <Section id="ielts-practice">
          <SectionHeader
            eyebrow="IELTS"
            title="IELTS practice"
            subtitle="Train every section with realistic formats, timing, and feedback."
            align="left"
          />
          <PracticeAreaGrid areas={IELTS_PRACTICE} columns="sm:grid-cols-2 lg:grid-cols-4" />
        </Section>

        <Section tone="muted" id="dsat-practice">
          <SectionHeader
            eyebrow="Digital SAT"
            title="Digital SAT practice"
            subtitle="Bluebook-style modules, adaptive difficulty, and full timed exams."
            align="left"
          />
          <PracticeAreaGrid areas={DSAT_PRACTICE} columns="sm:grid-cols-2 lg:grid-cols-4" />
        </Section>

        <Section id="general-english-practice">
          <SectionHeader
            eyebrow="General English"
            title="General English practice"
            subtitle="Build fluency across grammar, vocabulary, and communication skills."
            align="left"
          />
          <PracticeAreaGrid areas={GENERAL_ENGLISH_PRACTICE} columns="sm:grid-cols-2 lg:grid-cols-3" />
        </Section>

        <Section tone="muted" id="platform-features">
          <SectionHeader
            eyebrow="Platform"
            title="Everything you need to practice effectively."
            subtitle="Tools that help you prepare seriously — not just complete exercises."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {PRACTICE_PLATFORM_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card variant="default" padding="lg" className="h-full bg-[var(--background)]">
                  <CardIcon>
                    <FeatureIcon />
                  </CardIcon>
                  <CardTitle className="mt-5">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="learning-flow">
          <SectionHeader
            eyebrow="Learning flow"
            title="A cycle built for improvement."
            subtitle="Practice, review, and refine — until you're ready."
          />
          <PracticeFlow steps={PRACTICE_FLOW_STEPS} />
        </Section>

        <CTABanner
          title="Ready to improve your score?"
          subtitle="Start practicing with realistic exams, clear feedback, and progress you can measure."
          primaryLabel="Start Practicing"
          showSecondary={false}
        />
      </main>
    </>
  );
}
