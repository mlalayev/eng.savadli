import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { CONTACT_CHECKLIST, CONTACT_FAQ } from "@/lib/contact";
import { siteConfig } from "@/lib/site";

const mailtoHref = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`Inquiry — ${siteConfig.name}`)}`;

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${siteConfig.name} — goals, timeline, and next steps.`,
};

export default function ContactPage() {
  return (
    <>
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)]">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-8 right-0 h-40 w-40 rounded-full bg-[var(--blob-soft)] blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
              Contact
            </p>
            <h1 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-4xl lg:text-[2.5rem]">
              Tell me what you are working toward
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              One email is enough to start. Share your goal and timeline — I will reply with availability
              and a suggested structure for your prep.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={mailtoHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)] sm:h-12 sm:px-8"
              >
                Email {siteConfig.contactEmail}
              </a>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-6 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--muted)] sm:h-12 sm:px-7"
              >
                Back to home
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-[var(--faint)]">
              Prefer a booking link? Replace the mailto with Calendly or another scheduler in{" "}
              <code className="rounded bg-[var(--blob-soft)] px-1 py-0.5 font-mono text-[11px] text-[var(--muted)]">
                src/app/contact/page.tsx
              </code>{" "}
              when you are ready.
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
              What to include
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              The more concrete you can be, the faster we can propose a realistic weekly plan.
            </p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-3">
              {CONTACT_CHECKLIST.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--accent)]/25 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--surface)] py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]/50 shadow-sm md:grid md:grid-cols-[1fr_1.15fr]">
              <div className="border-b border-[var(--border)] p-8 md:border-b-0 md:border-r">
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Direct email
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Best for first contact, attaching a writing sample, or listing several questions.
                </p>
                <a
                  href={mailtoHref}
                  className="mt-6 inline-flex break-all text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {siteConfig.contactEmail}
                </a>
                <p className="mt-4 text-xs text-[var(--faint)]">Replies usually within 1–2 business days.</p>
              </div>
              <div className="p-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--faint)]">
                  Before you write
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <li className="flex gap-3">
                    <span className="text-[var(--accent)]" aria-hidden>
                      →
                    </span>
                    <span>
                      Skim{" "}
                      <Link href="/programs" className="font-medium text-[var(--accent)] hover:underline">
                        Programs
                      </Link>{" "}
                      so we use the same vocabulary (IELTS vs DSAT vs general).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[var(--accent)]" aria-hidden>
                      →
                    </span>
                    <span>
                      Read{" "}
                      <Link href="/approach" className="font-medium text-[var(--accent)] hover:underline">
                        Approach
                      </Link>{" "}
                      if you want a preview of how lessons are structured.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Common questions
            </h2>
            <dl className="mt-10 space-y-8">
              {CONTACT_FAQ.map((item) => (
                <div key={item.q} className="border-b border-[var(--border)] pb-8 last:border-0 last:pb-0">
                  <dt className="font-semibold text-[var(--text)]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-12 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <p className="text-sm text-[var(--muted)]">Ready when you are.</p>
            <a
              href={mailtoHref}
              className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-8 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
            >
              Send an email
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
