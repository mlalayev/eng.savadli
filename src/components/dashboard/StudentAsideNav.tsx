"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDENT_DESMOS_LINKS } from "@/lib/student-nav";
import { AsideFooterActions } from "./AsideFooterActions";
import { NavSection } from "./NavSection";
import type { SessionUser } from "@/context/auth-context";

type NavItem = { href: string; label: string };

function NavList({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover-strong)] hover:text-[var(--text)]"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const overviewItem: readonly NavItem[] = [{ href: "/dashboard", label: "Overview" }];

const trackItems: readonly NavItem[] = [
  { href: "/dashboard/ielts", label: "IELTS" },
  { href: "/dashboard/dsat", label: "Digital SAT" },
  { href: "/dashboard/general-english", label: "General English" },
];

const studyItems: readonly NavItem[] = [
  { href: "/dashboard/exams-extras", label: "Exams & extras" },
  { href: "/dashboard/lessons", label: "Lessons" },
  { href: "/dashboard/assignments", label: "Assignments" },
  { href: "/dashboard/homework", label: "Homework" },
];

const accountItem: readonly NavItem[] = [{ href: "/dashboard/account", label: "Account" }];

export function StudentAsideNav({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Student</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{user.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="Student">
        <NavSection title="Overview" first>
          <NavList items={overviewItem} />
        </NavSection>

        <NavSection title="Your programs">
          <NavList items={trackItems} />
        </NavSection>

        <NavSection title="Study">
          <NavList items={studyItems} />
        </NavSection>

        <NavSection title="Desmos">
          <ul className="flex flex-col gap-1.5">
            {STUDENT_DESMOS_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-xs font-semibold text-[var(--accent)] shadow-sm transition hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]"
                >
                  {link.label}
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </NavSection>

        <NavSection title="Profile">
          <NavList items={accountItem} />
        </NavSection>
      </nav>

      <AsideFooterActions onSignOut={onSignOut} />
    </div>
  );
}
