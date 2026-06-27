"use client";

import { ArrowRightIcon, Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import type { BillingInterval, PricingPlan } from "@/lib/pricing-page";
import { cn } from "@/lib/cn";

export type PricingCardProps = {
  plan: PricingPlan;
  interval: BillingInterval;
  className?: string;
};

function formatPrice(amount: number, interval: BillingInterval) {
  if (amount === 0) return { price: "Free", suffix: "" };
  const price = interval === "monthly" ? amount : amount;
  const suffix = interval === "monthly" ? "/mo" : "/yr";
  return { price: `$${price}`, suffix };
}

export function PricingCard({ plan, interval, className }: PricingCardProps) {
  const amount = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const { price, suffix } = formatPrice(amount, interval);

  return (
    <Card
      variant={plan.highlighted ? "default" : "muted"}
      padding="lg"
      className={cn(
        "flex h-full flex-col",
        plan.highlighted && "border-[var(--accent-soft)] ring-1 ring-[var(--accent)]/10",
        className,
      )}
    >
      {plan.highlighted ? (
        <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.05em] text-[var(--accent)]">
          Most popular
        </p>
      ) : (
        <div className="mb-4 h-[18px]" aria-hidden />
      )}

      <CardTitle className="text-xl">{plan.name}</CardTitle>
      <CardDescription className="mt-2 text-[0.9375rem] leading-relaxed">{plan.description}</CardDescription>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-mono text-[2rem] font-semibold tracking-tight text-[var(--text)]">{price}</span>
        {suffix ? <span className="text-sm text-[var(--muted)]">{suffix}</span> : null}
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-[var(--muted)]">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Button
          href={plan.ctaHref}
          variant={plan.highlighted ? "primary" : "outline"}
          size="lg"
          className="w-full"
        >
          {plan.ctaLabel}
          <ArrowRightIcon />
        </Button>
      </div>
    </Card>
  );
}
