import { RoleGuard } from "@/components/dashboard/RoleGuard";

export default function RosterPage() {
  return (
    <RoleGuard allow={["teacher"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Roster</h1>
        <p className="mt-2 text-[var(--muted)]">
          Static placeholder for student lists, notes, and parent contacts.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          Searchable roster will appear here.
        </div>
      </div>
    </RoleGuard>
  );
}
