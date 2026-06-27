"use client";

import { CTABanner } from "@/components/marketing/CTABanner";
import { PageHero } from "@/components/marketing/PageHero";
import { ProgramComparisonSection } from "@/components/marketing/ProgramComparison";
import { ProgramDetailCard } from "@/components/marketing/ProgramDetailCard";
import {
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { Card, CardDescription, CardIcon, CardTitle } from "@/components/ui/Card";
import {
  PROGRAM_COMPARISON,
  PROGRAMS_PAGE_ITEMS,
  PROGRAMS_WHY_FEATURES,
} from "@/lib/programs-page";
import { cn } from "@/lib/cn";

function FeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

export function ProgramsPage() {
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
          eyebrow="Programs"
          title="Choose the right program for your goals."
          description="Prepare for IELTS, Digital SAT, and General English through structured lessons, practice exams, homework, teacher feedback, and progress tracking."
          primaryHref="/login"
          primaryLabel="Start Learning"
          secondaryHref="#compare"
          secondaryLabel="Compare Programs"
        />

        <Section id="programs">
          <SectionHeader
            eyebrow="Our programs"
            title="Three paths. One platform."
            subtitle="Each program includes structured lessons, practice, homework, and teacher support — built for serious preparation."
          />
          <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "lg:grid-cols-3")}>
            {PROGRAMS_PAGE_ITEMS.map((program) => (
              <StaggerItem key={program.slug}>
                <ProgramDetailCard
                  id={program.slug}
                  accent={program.accent}
                  title={program.title}
                  summary={program.summary}
                  features={program.features}
                  ctaLabel={program.ctaLabel}
                  ctaHref={program.ctaHref}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section tone="muted">
          <ProgramComparisonSection rows={PROGRAM_COMPARISON} />
        </Section>

        <Section>
          <SectionHeader
            eyebrow="Why Savadli"
            title="Built for results, not noise."
            subtitle="Everything you need to prepare seriously — without the clutter of a typical education center."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {PROGRAMS_WHY_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card variant="default" padding="lg" className="h-full">
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

        <CTABanner
          title="Start your learning journey today."
          subtitle="Join students preparing with structure, feedback, and a platform designed for focus."
          primaryLabel="Get Started"
          showSecondary={false}
        />
      </main>
    </>
  );
}
