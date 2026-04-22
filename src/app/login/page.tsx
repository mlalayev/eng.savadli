import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { LoginShell } from "./login-shell";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your dashboard.",
};

export default function LoginPage() {
  return (
    <LoginShell>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Welcome back</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Sign in to your dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm sm:p-9">
            <LoginForm />
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left text-xs leading-relaxed text-[var(--muted)]">
            <p className="font-semibold text-[var(--text)]">Accounts</p>
            <p className="mt-1">
              Your admin account is created via <span className="font-mono">npm run seed:admin</span>.
              Students/teachers are created inside the dashboard.
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            <Link href="/" className="font-medium text-[var(--accent)] hover:underline">
              ← Back to home
            </Link>
          </p>

          <p className="mt-6 text-center text-xs leading-relaxed text-[var(--faint)]">
            Sessions are managed on the server. Keep your database credentials safe.
          </p>
        </div>
      </main>
    </LoginShell>
  );
}
