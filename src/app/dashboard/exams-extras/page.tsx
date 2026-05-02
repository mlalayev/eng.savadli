"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

/** Legacy URL from bookmarks — students go to Exams; everyone else to dashboard. */
export default function ExamsExtrasLegacyRedirect() {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (user?.role === "student") {
      router.replace("/dashboard/my-exams");
    } else {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
      Redirecting…
    </div>
  );
}
