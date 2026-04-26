import Link from "next/link";
import { Footer } from "@/components/Footer";
import { APPROACH_STEPS } from "@/lib/approach";
import { PROGRAMS } from "@/lib/programs";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)]">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Private instruction
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--text)] sm:text-5xl">
              English for school, exams, and everyday confidence.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
              {siteConfig.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)]"
              >
                Book a consultation
              </Link>
              <Link
                href="/programs"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-7 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--muted)]"
              >
                View programs
              </Link>
            </div>
          </div>
        </section>

        <section id="programs" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-10">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Programs</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                      What we focus on
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                      One-to-one sessions tailored to your timeline — whether you are preparing for an exam or
                      strengthening foundations.
                    </p>
                  </div>
                  <Link
                    href="/programs"
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)]"
                  >
                    Explore all programs
                  </Link>
                </div>

                <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                  {PROGRAMS.map((p) => (
                    <li
                      key={p.slug}
                      className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-[var(--text)] sm:text-lg">{p.title}</h3>
                        <span
                          className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--accent)] transition group-hover:border-[var(--accent)]/35"
                          aria-hidden
                        >
                          →
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{p.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="approach" className="scroll-mt-20 border-y border-[var(--border)] bg-[var(--background)] py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-10">
              <div
                className="pointer-events-none absolute -left-16 -bottom-24 h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Approach</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                      How sessions work
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                      Diagnose, practice, and adjust — a loop that keeps lessons tied to your outcome.
                    </p>
                  </div>
                  <Link
                    href="/approach"
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)]"
                  >
                    Read full approach
                  </Link>
                </div>

                <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                  {APPROACH_STEPS.map((item) => (
                    <li
                      key={item.step}
                      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 transition hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/35"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-bold text-[var(--accent)] transition group-hover:border-[var(--accent)]/35">
                          {item.step}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.summary}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                Start with a conversation
              </h2>
              <p className="mt-2 max-w-xl text-[var(--muted)]">
                Share your exam date or learning goals. I will reply with availability and how we can
                structure your prep.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                >
                  Contact page
                </Link>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-7 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--muted)]"
                >
                  Email {siteConfig.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
