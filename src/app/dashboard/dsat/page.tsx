import { RoleGuard } from "@/components/dashboard/RoleGuard";
import Link from "next/link";

export default function StudentDsatPage() {
  return (
    <RoleGuard allow={["student"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Digital SAT</h1>
        <p className="mt-2 text-[var(--muted)]">
          Reading, writing, and math in the Bluebook-style flow — pacing, review sets, and score
          projections will appear here.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/dsat/practice"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
          >
            Reading &amp; Writing (Bluebook UI)
          </Link>
          <Link
            href="/dashboard/dsat/practice?mode=math"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
          >
            Math (Bluebook UI)
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
