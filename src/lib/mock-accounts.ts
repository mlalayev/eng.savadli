export type ProfileRole = "admin" | "teacher" | "student";

export type MockAccount = {
  id: string;
  email: string;
  /** Demo only — replace with hashed auth later */
  password: string;
  name: string;
  role: ProfileRole;
};

/** Static demo accounts (no backend). */
export const MOCK_ACCOUNTS: readonly MockAccount[] = [
  {
    id: "acc_admin",
    email: "admin@admin.com",
    password: "murad123",
    name: "Sam Admin",
    role: "admin",
  },
  {
    id: "acc_teacher",
    email: "teacher@teacher.com",
    password: "murad123",
    name: "Taylor Chen",
    role: "teacher",
  },
  {
    id: "acc_student",
    email: "student@student.com",
    password: "murad123",
    name: "Jordan Lee",
    role: "student",
  },
] as const;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: ProfileRole;
};

export function findSessionUser(email: string, password: string): SessionUser | null {
  const row = MOCK_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}
