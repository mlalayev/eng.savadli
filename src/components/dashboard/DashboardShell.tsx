"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { ProfileAside } from "./ProfileAside";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-[var(--muted)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="w-full shrink-0 overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
        <ProfileAside />
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto bg-[var(--background)] md:ml-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:max-w-[90rem]">{children}</div>
      </div>
    </div>
  );
}
