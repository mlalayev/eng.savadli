"use client";

import { useAuth } from "@/context/auth-context";

export function AccountProfile() {
  const { user } = useAuth();
  if (!user) return null;

  const roleNote =
    user.role === "admin"
      ? "Admin profile — manage platform access and billing when backend is connected."
      : user.role === "teacher"
        ? "Teacher profile — bio, availability, and class links will go here."
        : "Student profile — goals, exam dates, and materials will sync here.";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Account</h1>
      <p className="mt-2 text-[var(--muted)]">{roleNote}</p>

      <div className="mt-10 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Display name
          </label>
          <p className="mt-1 text-[var(--text)]">{user.name}</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Email
          </label>
          <p className="mt-1 text-[var(--text)]">{user.email}</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
            Role
          </label>
          <p className="mt-1 capitalize text-[var(--text)]">{user.role}</p>
        </div>
      </div>
    </div>
  );
}
