"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { LANDING_CONTAINER } from "@/components/marketing/Section";
import { TRUSTED_BY } from "@/lib/marketing";

export function TrustedBy() {
  return (
    <section aria-label="Trusted by" className="border-b border-[var(--border)] bg-[var(--background)] py-12 sm:py-14">
      <div className={LANDING_CONTAINER}>
        <FadeIn>
          <p className="text-center text-[13px] font-medium tracking-wide text-[var(--faint)]">
            Trusted by students from leading institutions
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
            {TRUSTED_BY.map((name) => (
              <li
                key={name}
                className="text-sm font-medium tracking-tight text-[var(--faint)] transition hover:text-[var(--muted)]"
              >
                {name}
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
