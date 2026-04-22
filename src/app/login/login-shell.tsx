"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";

export function LoginShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-sm text-[var(--muted)]">
        Loading…
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-sm text-[var(--muted)]">
        Redirecting…
      </main>
    );
  }

  return <>{children}</>;
}
