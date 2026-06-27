"use client";

import { AudienceCard } from "@/components/marketing/AudienceCard";
import { ContentSection } from "@/components/marketing/ContentSection";
import { CTABanner } from "@/components/marketing/CTABanner";
import { PageHero } from "@/components/marketing/PageHero";
import { TeamPlaceholder } from "@/components/marketing/TeamPlaceholder";
import {
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import { Card, CardDescription, CardIcon, CardTitle } from "@/components/ui/Card";
import {
  ABOUT_AUDIENCES,
  ABOUT_MISSION,
  ABOUT_VISION,
  ABOUT_WHY_FEATURES,
  TEAM_PLACEHOLDERS,
} from "@/lib/about-page";
import { cn } from "@/lib/cn";

function FeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

export function AboutPage() {
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
          eyebrow="About"
          title="Building a smarter way to learn."
          description="Savadli is a modern learning platform helping students prepare for IELTS, Digital SAT, and General English."
        />

        <ContentSection
          id="mission"
          eyebrow="Mission"
          title={ABOUT_MISSION.title}
          paragraphs={ABOUT_MISSION.body}
        />

        <ContentSection
          id="vision"
          eyebrow="Vision"
          title={ABOUT_VISION.title}
          paragraphs={ABOUT_VISION.body}
          tone="muted"
        />

        <Section id="why-savadli">
          <SectionHeader
            eyebrow="Why Savadli"
            title="Built differently."
            subtitle="We focus on what actually helps students prepare — and leave out what doesn't."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {ABOUT_WHY_FEATURES.map((feature) => (
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

        <Section tone="muted" id="who-we-help">
          <SectionHeader
            eyebrow="Who we help"
            title="For everyone in the learning journey."
            subtitle="Students, teachers, parents, and institutions — Savadli connects the whole ecosystem."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {ABOUT_AUDIENCES.map((audience) => (
              <StaggerItem key={audience.title}>
                <AudienceCard title={audience.title} description={audience.description} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="team">
          <TeamPlaceholder members={TEAM_PLACEHOLDERS} />
        </Section>

        <CTABanner
          title="Join thousands of learners."
          subtitle="Start preparing with structure, feedback, and a platform designed for real results."
          primaryLabel="Get Started"
          showSecondary={false}
        />
      </main>
    </>
  );
}
