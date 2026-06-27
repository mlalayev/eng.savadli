"use client";

import { useState } from "react";
import { BillingToggle } from "@/components/marketing/BillingToggle";
import { CTABanner } from "@/components/marketing/CTABanner";
import { FAQ } from "@/components/marketing/FAQ";
import { PageHero } from "@/components/marketing/PageHero";
import { PricingCard } from "@/components/marketing/PricingCard";
import { PricingComparisonSection } from "@/components/marketing/PricingComparison";
import {
  LANDING_GRID_GAP,
  Section,
} from "@/components/marketing/Section";
import { Stagger, StaggerItem } from "@/components/motion/FadeIn";
import type { BillingInterval } from "@/lib/pricing-page";
import { PRICING_COMPARISON, PRICING_FAQ, PRICING_PLANS } from "@/lib/pricing-page";
import { cn } from "@/lib/cn";

export function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

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
          eyebrow="Pricing"
          title="Simple pricing for serious learners."
          description="Choose the plan that matches your learning goals."
        />

        <Section id="plans">
          <BillingToggle value={interval} onChange={setInterval} className="mb-12 sm:mb-14" />
          <Stagger className={cn("grid", LANDING_GRID_GAP, "lg:grid-cols-3")}>
            {PRICING_PLANS.map((plan) => (
              <StaggerItem key={plan.id}>
                <PricingCard plan={plan} interval={interval} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <Section tone="muted">
          <PricingComparisonSection rows={PRICING_COMPARISON} />
        </Section>

        <FAQ
          items={PRICING_FAQ}
          title="Pricing questions"
          subtitle="Clear answers about plans, billing, and cancellations."
        />

        <CTABanner
          id="cta"
          title="Ready to start preparing?"
          subtitle="Pick the plan that fits your goals and begin learning today."
          primaryLabel="Choose Your Plan"
          showSecondary={false}
          finePrint="No credit card required for the Free plan."
        />
      </main>
    </>
  );
}
