"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { siteConfig } from "@/lib/site";

const navPillShape =
  "h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-semibold transition sm:h-10 sm:px-5";

function navPillStyles(active: boolean) {
  if (active) {
    return `${navPillShape} border border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] shadow-sm`;
  }
  return `${navPillShape} border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]`;
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20.5c.5-4 3.5-6.5 7-6.5s6.5 2.5 7 6.5" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const profileHref = ready && user ? "/dashboard" : "/login";
  const profileLabel = ready && user ? "Open dashboard" : "Sign in or account";

  const programsActive = pathname === "/programs";
  const approachActive = pathname === "/approach";
  const contactActive = pathname === "/contact";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--text)] sm:text-base"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[13px] font-bold text-[var(--on-accent)] sm:h-9 sm:w-9">
            {siteConfig.shortName}
          </span>
          <span className="truncate transition group-hover:text-[var(--accent)]">
            {siteConfig.name}
          </span>
        </Link>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <nav
            className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3"
            aria-label="Main"
          >
            <Link href="/programs" className={`inline-flex ${navPillStyles(programsActive)}`}>
              Programs
            </Link>
            <Link
              href="/approach"
              className={`hidden sm:inline-flex ${navPillStyles(approachActive)}`}
            >
              Approach
            </Link>
            <Link
              href="/contact"
              className={`hidden sm:inline-flex ${navPillStyles(contactActive)}`}
            >
              Contact
            </Link>
          </nav>

          <Link
            href={profileHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-sm transition hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] sm:h-10 sm:w-10"
            aria-label={profileLabel}
          >
            <ProfileIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
