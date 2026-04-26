import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <div className="relative h-14 w-[200px]">
              <Image src="/logooSmall.png" alt={siteConfig.name} fill sizes="200px" className="object-contain" />
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">{siteConfig.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/contact"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
              >
                Book a consultation
              </Link>
              <Link
                href="/programs"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]"
              >
                View programs
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:col-span-7 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Explore</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/programs" className="text-[var(--muted)] transition hover:text-[var(--text)]">
                    Programs
                  </Link>
                </li>
                <li>
                  <Link href="/approach" className="text-[var(--muted)] transition hover:text-[var(--text)]">
                    Approach
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-[var(--muted)] transition hover:text-[var(--text)]">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Dashboard</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-[var(--muted)] transition hover:text-[var(--text)]">
                    Student login
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-[var(--muted)] transition hover:text-[var(--text)]">
                    Go to dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Contact</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <li className="leading-relaxed">
                  Questions or scheduling help?
                  <br />
                  Send a message from the Contact page.
                </li>
                <li>
                  <Link href="/contact" className="font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]">
                    Contact form →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--faint)]">© {new Date().getFullYear()} {siteConfig.name}</p>
          <p className="text-xs text-[var(--faint)]">Built with care</p>
        </div>
      </div>
    </footer>
  );
}
