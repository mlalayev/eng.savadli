"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

function isFullscreenExamRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard/assignments/ielts/") ||
    pathname.startsWith("/dashboard/assignments/dsat/")
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isFullscreenExamRoute(pathname)) {
    return <div className="min-h-dvh bg-[var(--background)]">{children}</div>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
