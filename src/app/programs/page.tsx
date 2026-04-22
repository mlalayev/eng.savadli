import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PROGRAMS } from "@/lib/programs";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Programs",
  description: `General English, IELTS, and Digital SAT — programs at ${siteConfig.name}.`,
};

export default function ProgramsPage() {
  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)]">
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--blob-soft)] blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Programs
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl lg:text-[2.5rem]">
              Clear tracks for General English, IELTS, and Digital SAT
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              Every program is one-to-one, goal-led, and paced to your timeline — with materials and
              feedback you can reuse between sessions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)] sm:h-12 sm:px-7"
              >
                Book a consultation
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
              What we offer
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              Pick the track that matches your next milestone — we can blend skills when your goals
              overlap.
            </p>

            <ul className="mt-12 flex flex-col gap-8">
              {PROGRAMS.map((p, i) => (
                <li
                  key={p.slug}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:border-[var(--accent)]/20 hover:shadow-md"
                >
                  <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                    <div className="border-b border-[var(--border)] bg-[var(--background)]/60 p-6 sm:p-8 md:border-b-0 md:border-r">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                        {p.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-[15px]">
                        {p.summary}
                      </p>
                    </div>
                    <div className="p-6 sm:p-8">
                      <p className="text-sm leading-relaxed text-[var(--text)] sm:text-[15px]">
                        {p.description}
                      </p>
                      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                        You will work on
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {p.outcomes.map((line) => (
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
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Not sure which program fits?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)] sm:text-base">
              Tell me your deadline and target — we will map a plan that can combine exam prep with
              general skills.
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
