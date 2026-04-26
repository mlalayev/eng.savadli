"use client";

import Link from "next/link";

export function AsideFooterActions({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
  return (
    <div className="mt-auto space-y-1 border-t border-[var(--border)] p-3">
      <Link
        href="/"
        className="flex w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        Main page
      </Link>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="flex w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        Sign out
      </button>
    </div>
  );
}
