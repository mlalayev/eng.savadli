"use client";

import { PROGRAMS } from "@/lib/programs";
import {
  FAQ_ITEMS,
  PLATFORM_FEATURES,
  STATS,
  TESTIMONIALS,
  WHY_FEATURES,
} from "@/lib/marketing";
import { CTABanner } from "@/components/marketing/CTABanner";
import { FAQ } from "@/components/marketing/FAQ";
import { HeroSection } from "@/components/marketing/HeroSection";
import { LearningProcess } from "@/components/marketing/LearningProcess";
import { ProgramCard, programSlugToAccent } from "@/components/marketing/ProgramCard";
import { StatisticsSection } from "@/components/marketing/StatCard";
import { Testimonials } from "@/components/marketing/Testimonials";
import { TrustedBy } from "@/components/marketing/TrustedBy";
import {
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { Card, CardDescription, CardIcon, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const PROGRAM_FEATURES: Record<string, string[]> = {
  ielts: ["Listening, Reading, Writing, Speaking", "Band-focused practice", "Teacher-reviewed writing"],
  "digital-sat": ["Bluebook-style interface", "Module timing", "Score analytics"],
  "general-english": ["Grammar & vocabulary", "Guided lessons", "Progress tracking"],
};

function FeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-2xl focus:bg-[var(--surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>

      <main id="main-content" className="flex-1 bg-[var(--background)]">
        <HeroSection />
        <TrustedBy />

        <Section id="programs">
          <SectionHeader
            eyebrow="Programs"
            title="Three paths. One ecosystem."
            subtitle="IELTS, Digital SAT, and General English — each with structured lessons, practice, and feedback."
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

        <Section tone="muted">
          <SectionHeader
            eyebrow="Why Savadli"
            title="A complete learning ecosystem."
            subtitle="Not just videos and PDFs — a platform built for preparation that actually works."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            )}
          >
            {WHY_FEATURES.map((feature) => (
              <StaggerItem key={feature.title} className={feature.title === "Teacher feedback" ? "xl:col-span-1" : undefined}>
                <Card interactive variant="default" padding="lg" className="h-full bg-[var(--background)]">
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

        <LearningProcess />

        <Section id="features" tone="muted">
          <SectionHeader
            eyebrow="Platform"
            title="Everything you need to succeed."
            subtitle="From practice exams to progress reports — all in one calm workspace."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {PLATFORM_FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card interactive variant="default" padding="md" className="h-full bg-[var(--background)]">
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.description}</CardDescription>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <StatisticsSection stats={STATS} />

        <Testimonials items={TESTIMONIALS} />

        <FAQ items={FAQ_ITEMS} />

        <CTABanner />
      </main>
    </>
  );
}
