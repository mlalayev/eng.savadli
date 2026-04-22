"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoleGuard } from "@/components/dashboard/RoleGuard";

type Role = "creator" | "admin" | "teacher" | "student" | "parent";
type Status = "active" | "disabled";
type ProgramCategory = "dsat" | "ielts" | "general";

type PublicUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  surname: string;
  phone: string;
  dateOfBirth: string;
  category: ProgramCategory | null;
  role: Role;
  status: Status;
  createdAt?: string;
};

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
      {children}
    </span>
  );
}

function categoryLabel(c: ProgramCategory | null): string {
  if (!c) return "—";
  switch (c) {
    case "dsat":
      return "SAT";
    case "ielts":
      return "IELTS";
    case "general":
      return "General English";
    default:
      return c;
  }
}

function resetCreateFormState(
  setters: {
    setFirstName: (v: string) => void;
    setSurname: (v: string) => void;
    setEmail: (v: string) => void;
    setPhone: (v: string) => void;
    setDateOfBirth: (v: string) => void;
    setCategory: (v: ProgramCategory) => void;
    setRole: (v: Role) => void;
    setPassword: (v: string) => void;
  },
) {
  setters.setFirstName("");
  setters.setSurname("");
  setters.setEmail("");
  setters.setPhone("");
  setters.setDateOfBirth("");
  setters.setCategory("dsat");
  setters.setRole("student");
  setters.setPassword("");
}

/** National mobile digits after +994 (max 9), e.g. pasted +994 50 123 45 67 or 0501234567 */
function extractAz994NationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("994")) d = d.slice(3);
  d = d.replace(/^0+/, "");
  return d.slice(0, 9);
}

/** Display +994 xx xxx xx xx (2-3-2-2) */
function formatAz994Display(nationalDigits: string): string {
  const n = nationalDigits.slice(0, 9);
  if (n.length === 0) return "";
  let s = "+994 ";
  s += n.slice(0, 2);
  if (n.length > 2) s += ` ${n.slice(2, 5)}`;
  if (n.length > 5) s += ` ${n.slice(5, 7)}`;
  if (n.length > 7) s += ` ${n.slice(7, 9)}`;
  return s;
}

function toAz994E164(nationalDigits: string): string {
  const n = extractAz994NationalDigits(nationalDigits);
  return n.length === 9 ? `+994${n}` : "";
}

export default function UsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [category, setCategory] = useState<ProgramCategory>("dsat");
  const [role, setRole] = useState<Role>("student");
  const [password, setPassword] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const closeAddUser = useCallback(() => {
    setAddUserOpen(false);
    setCreateError(null);
  }, []);

  const openAddUser = useCallback(() => {
    setCreateError(null);
    setAddUserOpen(true);
  }, []);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ users: PublicUser[] }>("/api/users");
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!addUserOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAddUser();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addUserOpen, closeAddUser]);

  useEffect(() => {
    if (!addUserOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [addUserOpen]);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => a.email.localeCompare(b.email));
  }, [users]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const national = extractAz994NationalDigits(phone);
    const phoneE164 = toAz994E164(national);
    if (!phoneE164) {
      setCreateError("Enter a full mobile number: +994 and 9 digits (pattern +994 xx xxx xx xx).");
      return;
    }
    setCreating(true);
    try {
      await api("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          surname,
          email,
          phone: phoneE164,
          dateOfBirth,
          category,
          role,
          password,
        }),
      });
      resetCreateFormState({
        setFirstName,
        setSurname,
        setEmail,
        setPhone,
        setDateOfBirth,
        setCategory,
        setRole,
        setPassword,
      });
      closeAddUser();
      await refresh();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(userId: string, status: Status) {
    setError(null);
    try {
      await api(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    }
  }

  async function resetPassword(userId: string) {
    const newPassword = window.prompt("New password (min 6 chars):");
    if (!newPassword) return;
    setError(null);
    try {
      await api(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resetPassword: newPassword }),
      });
      window.alert("Password updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    }
  }

  return (
    <RoleGuard allow={["creator", "admin"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Users & roles</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Manage accounts, disable access, and reset passwords. There is no public signup—use Add user to create
          profiles.
        </p>

        {error ? (
          <p
            className="mt-6 rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">All users</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openAddUser()}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
              >
                Add user
              </button>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Mobile</th>
                    <th className="px-3 py-2">DOB</th>
                    <th className="px-3 py-2">Track</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u) => (
                    <tr key={u.id} className="rounded-xl bg-[var(--background)]">
                      <td className="rounded-l-xl border-y border-l border-[var(--border)] px-3 py-3">
                        <p className="font-semibold text-[var(--text)]">
                          {u.firstName || u.surname ? `${u.firstName} ${u.surname}`.trim() : u.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">{u.email}</p>
                      </td>
                      <td className="border-y border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                        {u.phone || "—"}
                      </td>
                      <td className="border-y border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                        {u.dateOfBirth || "—"}
                      </td>
                      <td className="border-y border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                        {categoryLabel(u.category)}
                      </td>
                      <td className="border-y border-[var(--border)] px-3 py-3">
                        <Pill>{u.role}</Pill>
                      </td>
                      <td className="border-y border-[var(--border)] px-3 py-3">
                        <Pill>{u.status}</Pill>
                      </td>
                      <td className="rounded-r-xl border-y border-r border-[var(--border)] px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void resetPassword(u.id)}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]"
                          >
                            Reset password
                          </button>
                          {u.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => void setStatus(u.id, "disabled")}
                              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--hover-strong)] hover:text-[var(--text)]"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void setStatus(u.id, "active")}
                              className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {addUserOpen ? (
          <div className="fixed inset-0 z-50" aria-hidden={!addUserOpen}>
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[3px] transition-opacity"
              aria-label="Close dialog"
              onClick={() => closeAddUser()}
            />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-user-title"
                aria-describedby="add-user-desc"
                className="pointer-events-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg sm:max-h-[min(85vh,640px)] sm:rounded-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <h2 id="add-user-title" className="text-base font-semibold tracking-tight text-[var(--text)]">
                      Add user
                    </h2>
                    <p id="add-user-desc" className="mt-0.5 text-xs leading-snug text-[var(--muted)]">
                      Email + password for sign-in. No public signup.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => closeAddUser()}
                    className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleCreate}>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
                    {createError ? (
                      <p
                        className="mb-3 rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)]"
                        role="alert"
                      >
                        {createError}
                      </p>
                    ) : null}

                    <div className="space-y-5">
                      <fieldset className="space-y-2">
                        <legend className="text-[10px] font-medium uppercase tracking-wide text-[var(--faint)]">
                          Profile
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="block text-xs font-medium text-[var(--muted)]">
                            First name
                            <input
                              ref={firstFieldRef}
                              className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              autoComplete="given-name"
                              required
                            />
                          </label>
                          <label className="block text-xs font-medium text-[var(--muted)]">
                            Surname
                            <input
                              className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                              value={surname}
                              onChange={(e) => setSurname(e.target.value)}
                              autoComplete="family-name"
                              required
                            />
                          </label>
                        </div>
                        <label className="block text-xs font-medium text-[var(--muted)]">
                          Date of birth
                          <input
                            className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            type="date"
                            required
                          />
                        </label>
                      </fieldset>

                      <fieldset className="space-y-2 border-t border-[var(--border)] pt-4">
                        <legend className="text-[10px] font-medium uppercase tracking-wide text-[var(--faint)]">
                          Contact
                        </legend>
                        <label className="block text-xs font-medium text-[var(--muted)]">
                          Email
                          <input
                            className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            autoComplete="email"
                            required
                          />
                        </label>
                        <label className="block text-xs font-medium text-[var(--muted)]">
                          Mobile number
                          <input
                            className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm tracking-wide transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                            value={phone}
                            onChange={(e) =>
                              setPhone(formatAz994Display(extractAz994NationalDigits(e.target.value)))
                            }
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="+994 xx xxx xx xx"
                            title="Azerbaijan mobile: +994 and 9 digits, shown as +994 xx xxx xx xx"
                            maxLength={22}
                            required
                          />
                          <span className="mt-1 block text-[11px] leading-snug text-[var(--faint)]">
                            +994 fixed; 9 digits format as xx xxx xx xx.
                          </span>
                        </label>
                      </fieldset>

                      <fieldset className="space-y-2 border-t border-[var(--border)] pt-4">
                        <legend className="text-[10px] font-medium uppercase tracking-wide text-[var(--faint)]">
                          Access
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="block text-xs font-medium text-[var(--muted)]">
                            Program track
                            <select
                              className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                              value={category}
                              onChange={(e) => setCategory(e.target.value as ProgramCategory)}
                            >
                              <option value="dsat">Digital SAT</option>
                              <option value="ielts">IELTS</option>
                              <option value="general">General English</option>
                            </select>
                          </label>
                          <label className="block text-xs font-medium text-[var(--muted)]">
                            Role
                            <select
                              className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                              value={role}
                              onChange={(e) => setRole(e.target.value as Role)}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="parent">Parent</option>
                              <option value="admin">Admin</option>
                              <option value="creator">Creator</option>
                            </select>
                          </label>
                        </div>
                        <label className="block text-xs font-medium text-[var(--muted)]">
                          Temporary password
                          <input
                            className="mt-1 block h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 text-sm transition focus:border-[var(--accent)]/45 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            autoComplete="new-password"
                            minLength={6}
                            required
                          />
                          <span className="mt-1 block text-[11px] text-[var(--faint)]">Min. 6 characters.</span>
                        </label>
                      </fieldset>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-2.5 sm:px-5">
                    <button
                      type="button"
                      onClick={() => closeAddUser()}
                      className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="inline-flex h-8 items-center rounded-md bg-[var(--accent)] px-3 text-xs font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
                    >
                      {creating ? "Creating…" : "Create user"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
