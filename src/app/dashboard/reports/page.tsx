import { RoleGuard } from "@/components/dashboard/RoleGuard";

export default function ReportsPage() {
  return (
    <RoleGuard allow={["creator", "admin"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Reports</h1>
        <p className="mt-2 text-[var(--muted)]">
          Static placeholder for enrollment, attendance, and revenue summaries.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          Charts and exports will appear here.
        </div>
      </div>
    </RoleGuard>
  );
}
