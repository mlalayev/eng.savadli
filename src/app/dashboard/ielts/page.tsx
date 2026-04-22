import { RoleGuard } from "@/components/dashboard/RoleGuard";

export default function StudentIeltsPage() {
  return (
    <RoleGuard allow={["student"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">IELTS</h1>
        <p className="mt-2 text-[var(--muted)]">
          Listening, Reading, Writing, and Speaking — band goals, mock tests, and feedback will live
          here.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          Connect your IELTS materials and progress tracking when the backend is ready.
        </div>
      </div>
    </RoleGuard>
  );
}
