import { RoleGuard } from "@/components/dashboard/RoleGuard";

export default function StudentDsatPage() {
  return (
    <RoleGuard allow={["student"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Digital SAT</h1>
        <p className="mt-2 text-[var(--muted)]">
          Reading, writing, and math in the Bluebook-style flow — pacing, review sets, and score
          projections will appear here.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          Hook in practice tests and Desmos-related math notes when you wire the API.
        </div>
      </div>
    </RoleGuard>
  );
}
