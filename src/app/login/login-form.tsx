"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = window.localStorage.getItem("dsat_remember_me");
      return raw === null ? true : raw === "true";
    } catch {
      return true;
    }
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("dsat_last_email") ?? "";
    } catch {
      return "";
    }
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      window.localStorage.setItem("dsat_last_email", email);
      window.localStorage.setItem("dsat_remember_me", String(rememberMe));
    } catch {
      // ignore
    }
    setPending(true);
    const result = await signIn(email, password);
    setPending(false);
    if (result.ok) {
      router.push("/dashboard");
      return;
    }
    setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <p
          className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-center text-sm text-[var(--error-text)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--text)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--faint)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text)]">
            Password
          </label>
          <span className="text-xs text-[var(--faint)]" title="Wire password reset with your auth API">
            Forgot?
          </span>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={rememberMe ? "current-password" : "off"}
          required
          placeholder="••••••••"
          className="mt-1.5 block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--faint)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        Remember me
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
