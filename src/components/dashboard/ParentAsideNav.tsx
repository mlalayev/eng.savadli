"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/context/auth-context";
import { AsideFooterActions } from "./AsideFooterActions";
import { NavSection } from "./NavSection";

type NavItem = { href: string; label: string; hint?: string };

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
              <div className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                {item.hint ? <span className="text-xs text-[var(--faint)]">{item.hint}</span> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const overviewItems = [{ href: "/dashboard", label: "Overview" }] as const;
const supportItems = [
  { href: "/dashboard/assignments", label: "Assignments", hint: "view" },
  { href: "/dashboard/gradebook", label: "Gradebook", hint: "view" },
] as const;
const accountItems = [{ href: "/dashboard/account", label: "Account" }] as const;

export function ParentAsideNav({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Parent</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{user.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="Parent">
        <NavSection title="Overview" first>
          <NavList items={overviewItems} />
        </NavSection>

        <NavSection title="Support">
          <NavList items={supportItems} />
        </NavSection>

        <NavSection title="Profile">
          <NavList items={accountItems} />
        </NavSection>
      </nav>

      <AsideFooterActions onSignOut={onSignOut} />
    </div>
  );
}

