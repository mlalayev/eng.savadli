"use client";

import type { SessionUser } from "@/context/auth-context";
import { StudentAsideNav } from "../StudentAsideNav";

export function StudentAside({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
  return <StudentAsideNav user={user} onSignOut={onSignOut} />;
}
