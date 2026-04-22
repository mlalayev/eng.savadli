"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import type { ProfileRole } from "@/context/auth-context";

export function RoleGuard({
  allow,
  children,
}: {
  allow: readonly ProfileRole[];
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  if (!user) {
    return null;
  }

  if (!allow.includes(user.role)) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
        <p className="font-semibold text-[var(--text)]">This page is not available for your role.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Signed in as <span className="font-medium text-[var(--text)]">{user.name}</span> (
          {user.role}).
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Back to overview
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
