"use client";

import { useAuth } from "@/context/auth-context";
import { AdminAside } from "./asides/AdminAside";
import { CreatorAside } from "./asides/CreatorAside";
import { ParentAside } from "./asides/ParentAside";
import { StudentAside } from "./asides/StudentAside";
import { TeacherAside } from "./asides/TeacherAside";

export function ProfileAside() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "creator":
      return <CreatorAside user={user} onSignOut={signOut} />;
    case "admin":
      return <AdminAside user={user} onSignOut={signOut} />;
    case "teacher":
      return <TeacherAside user={user} onSignOut={signOut} />;
    case "student":
      return <StudentAside user={user} onSignOut={signOut} />;
    case "parent":
      return <ParentAside user={user} onSignOut={signOut} />;
    default:
      return null;
  }
}
