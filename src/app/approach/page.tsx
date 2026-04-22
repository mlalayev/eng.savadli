import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { APPROACH_STEPS, APPROACH_VALUES } from "@/lib/approach";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Approach",
  description: `How lessons work at ${siteConfig.name} — diagnose, practice, and adjust with clear goals.`,
};

export default function ApproachPage() {
  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)]">
          <div
            className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-[var(--blob-soft)] blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Approach
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl lg:text-[2.5rem]">
              A simple loop: diagnose, practice, adjust
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              Lessons are structured but not rigid — we repeat this cycle so you always know why we
              are doing a task and how it connects to your outcome.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/programs"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)] sm:h-12 sm:px-7"
              >
                View programs
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-6 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--muted)] sm:h-12 sm:px-7"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              How sessions work
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              Three phases you will see in every season of prep — from first lesson to exam week.
            </p>

            <ol className="mt-12 flex flex-col gap-8">
              {APPROACH_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:border-[var(--accent)]/20 hover:shadow-md"
                >
                  <div className="grid gap-0 md:grid-cols-[auto_minmax(0,1fr)]">
                    <div className="flex flex-row items-start gap-4 border-b border-[var(--border)] bg-[var(--background)]/60 p-6 sm:p-8 md:flex-col md:border-b-0 md:border-r">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent)]">
                        {item.step}
                      </span>
                      <div className="min-w-0 md:pt-2">
                        <h3 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--accent)] sm:text-[15px]">
                          {item.summary}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8">
                      <p className="text-sm leading-relaxed text-[var(--text)] sm:text-[15px]">
                        {item.detail}
                      </p>
                      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                        In practice
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {item.bullets.map((line) => (
                          <li
                            key={line}
                            className="flex gap-3 text-sm leading-relaxed text-[var(--muted)]"
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                              aria-hidden
                            />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)] py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              What stays constant
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              Beyond the three-step loop, these principles guide how we work together.
            </p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-3">
              {APPROACH_VALUES.map((v) => (
                <li
                  key={v.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/40 p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-[var(--text)]">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{v.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Ready to map your first month?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)] sm:text-base">
              Share your goal and deadline — we will suggest a realistic weekly rhythm before you
              commit.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-8 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
            >
              Get in touch
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
