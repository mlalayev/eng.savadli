"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";

type AccountUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  imageUrl: string;
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

export function AccountProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<AccountUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = useMemo(() => {
    const parts = (name || user?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
  }, [name, user?.name]);

  useEffect(() => {
    if (!user) return;
    setError(null);
    void api<{ user: AccountUser }>("/api/account")
      .then((d) => {
        setProfile(d.user);
        setName(d.user.name ?? user.name ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function uploadAvatar(file: File) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const up = await api<{ url: string }>("/api/uploads/avatar", { method: "POST", body: form });
      const saved = await api<{ user: AccountUser }>("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageUrl: up.url }),
      });
      setProfile(saved.user);
      setMessage("Profile photo updated.");
      // NextAuth session won't update until refresh; keep it simple.
      window.setTimeout(() => window.location.reload(), 350);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {};
      if (name.trim() && name.trim() !== (profile?.name ?? user.name ?? "")) payload.name = name.trim();
      if (newPassword.trim()) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      if (Object.keys(payload).length === 0) {
        setMessage("Nothing to update.");
        return;
      }
      const saved = await api<{ user: AccountUser }>("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setProfile(saved.user);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Saved.");
      window.setTimeout(() => window.location.reload(), 350);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Profile settings</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Update your photo, display name, and security details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void saveProfile()}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Save changes
        </button>
      </div>

      {(error || message) && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-[var(--error-border)] bg-[var(--error-surface)] text-[var(--error-text)]"
              : "border-[var(--border)] bg-[var(--accent-soft)] text-[var(--accent)]"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent-soft)] blur-2xl"
            aria-hidden
          />
          <p className="relative text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Photo</p>
          <div className="relative mt-4 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)]">
              {profile?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-[var(--muted)]">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text)]">{name || user.name}</p>
              <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--hover)] disabled:opacity-50"
            >
              Upload photo
            </button>
          </div>
          <p className="relative mt-3 text-xs text-[var(--faint)]">JPG/PNG/WebP up to 3MB.</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Profile</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text)]">Basic info</h2>
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                {user.role}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/15"
                  placeholder="Your name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Email</label>
                <input
                  value={user.email}
                  readOnly
                  className="mt-2 h-11 w-full cursor-not-allowed rounded-2xl border border-[var(--border)] bg-[var(--hover)] px-4 text-sm text-[var(--muted)]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Security</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text)]">Password</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Use a strong password you don’t reuse elsewhere.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Current</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/15"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">New</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--text)] focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/15"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--faint)]">Changing your password will keep you signed in.</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveProfile()}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--hover)] disabled:opacity-50"
              >
                Update password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
