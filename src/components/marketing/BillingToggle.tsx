"use client";

import { cn } from "@/lib/cn";
import type { BillingInterval } from "@/lib/pricing-page";

export type BillingToggleProps = {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  className?: string;
};

export function BillingToggle({ value, onChange, className }: BillingToggleProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="inline-flex rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1"
        role="group"
        aria-label="Billing interval"
      >
        <button
          type="button"
          onClick={() => onChange("monthly")}
          aria-pressed={value === "monthly"}
          className={cn(
            "rounded-xl px-5 py-2 text-sm font-medium transition",
            value === "monthly"
              ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--text)]",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("yearly")}
          aria-pressed={value === "yearly"}
          className={cn(
            "rounded-xl px-5 py-2 text-sm font-medium transition",
            value === "yearly"
              ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--text)]",
          )}
        >
          Yearly
        </button>
      </div>
      <p className="text-xs text-[var(--faint)]">Save 2 months with yearly billing</p>
    </div>
  );
}
