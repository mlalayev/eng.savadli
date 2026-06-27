"use client";

import { CTABanner } from "@/components/marketing/CTABanner";
import { DownloadCard } from "@/components/marketing/DownloadCard";
import { FAQ } from "@/components/marketing/FAQ";
import { FeaturedArticleCard } from "@/components/marketing/FeaturedArticleCard";
import { PageHero } from "@/components/marketing/PageHero";
import { PracticeAreaCard } from "@/components/marketing/PracticeAreaCard";
import { StudyGuideCard } from "@/components/marketing/StudyGuideCard";
import {
  LANDING_GRID_GAP,
  LANDING_HEADER_TO_CONTENT,
  Section,
  SectionHeader,
} from "@/components/marketing/Section";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import {
  DOWNLOADS,
  DSAT_RESOURCES,
  FEATURED_ARTICLES,
  GENERAL_ENGLISH_RESOURCES,
  IELTS_RESOURCES,
  RESOURCES_FAQ,
  STUDY_GUIDES,
} from "@/lib/resources-page";
import type { ResourceItem } from "@/lib/resources-page";
import { cn } from "@/lib/cn";

function ResourceGrid({ items, columns }: { items: readonly ResourceItem[]; columns: string }) {
  return (
    <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, columns)}>
      {items.map((item) => (
        <StaggerItem key={item.title}>
          <PracticeAreaCard title={item.title} description={item.description} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function ResourcesPage() {
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
          eyebrow="Resources"
          title="Everything you need to learn better."
          description="Study guides, strategies, vocabulary, grammar, templates, and exam tips."
        />

        <Section id="ielts-resources">
          <SectionHeader
            eyebrow="IELTS"
            title="IELTS resources"
            subtitle="Templates, strategies, and reference materials for every section."
            align="left"
          />
          <ResourceGrid items={IELTS_RESOURCES} columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" />
        </Section>

        <Section tone="muted" id="dsat-resources">
          <SectionHeader
            eyebrow="Digital SAT"
            title="Digital SAT resources"
            subtitle="Grammar, math, timing, and score guidance for the DSAT."
            align="left"
          />
          <ResourceGrid items={DSAT_RESOURCES} columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" />
        </Section>

        <Section id="general-english-resources">
          <SectionHeader
            eyebrow="General English"
            title="General English resources"
            subtitle="Core skills across grammar, vocabulary, and communication."
            align="left"
          />
          <ResourceGrid items={GENERAL_ENGLISH_RESOURCES} columns="sm:grid-cols-2 lg:grid-cols-3" />
        </Section>

        <Section tone="muted" id="featured-articles">
          <SectionHeader
            eyebrow="Featured"
            title="Featured articles"
            subtitle="In-depth guides written for students who want clear, actionable advice."
          />
          <Stagger
            className={cn(LANDING_HEADER_TO_CONTENT, "grid", LANDING_GRID_GAP, "lg:grid-cols-3")}
          >
            {FEATURED_ARTICLES.map((article) => (
              <StaggerItem key={article.title}>
                <FeaturedArticleCard
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category}
                  readTime={article.readTime}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section id="study-guides">
          <SectionHeader
            eyebrow="Guides"
            title="Study guides"
            subtitle="Structured roadmaps to help you prepare with focus and direction."
          />
          <Stagger
            className={cn(
              LANDING_HEADER_TO_CONTENT,
              "grid",
              LANDING_GRID_GAP,
              "sm:grid-cols-2 lg:grid-cols-4",
            )}
          >
            {STUDY_GUIDES.map((guide) => (
              <StaggerItem key={guide.title}>
                <StudyGuideCard
                  title={guide.title}
                  description={guide.description}
                  program={guide.program}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section tone="muted" id="downloads">
          <SectionHeader
            eyebrow="Downloads"
            title="PDFs and learning materials"
            subtitle="Printable references and templates you can use offline."
            align="left"
          />
          <Stagger className={cn(LANDING_HEADER_TO_CONTENT, "flex flex-col", LANDING_GRID_GAP)}>
            {DOWNLOADS.map((item) => (
              <StaggerItem key={item.title}>
                <DownloadCard
                  title={item.title}
                  description={item.description}
                  format={item.format}
                  size={item.size}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <FAQ
          items={RESOURCES_FAQ}
          title="Resources FAQ"
          subtitle="Common questions about materials, access, and getting started."
        />

        <CTABanner
          title="Keep building your skills."
          subtitle="Put what you've learned into practice with exams, homework, and teacher feedback."
          primaryLabel="Continue Learning"
          showSecondary={false}
        />
      </main>
    </>
  );
}
