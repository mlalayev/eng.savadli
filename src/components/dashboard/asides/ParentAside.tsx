"use client";

import type { SessionUser } from "@/context/auth-context";
import { ParentAsideNav } from "../ParentAsideNav";

export function ParentAside({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
  return <ParentAsideNav user={user} onSignOut={onSignOut} />;
}

