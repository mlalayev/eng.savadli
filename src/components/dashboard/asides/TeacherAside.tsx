"use client";

import type { SessionUser } from "@/context/auth-context";
import { AsideFooterActions } from "../AsideFooterActions";
import { NavItems } from "../NavItems";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/exams", label: "Exams" },
  { href: "/dashboard/gradebook", label: "Gradebook" },
  { href: "/dashboard/manage-lessons", label: "Manage lessons" },
  { href: "/dashboard/classes", label: "My classes" },
  { href: "/dashboard/roster", label: "Roster" },
  { href: "/dashboard/account", label: "Account" },
] as const;

export function TeacherAside({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Teacher</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{user.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Teacher">
        <NavItems items={[...items]} />
      </nav>
      <AsideFooterActions onSignOut={onSignOut} />
    </div>
  );
}
