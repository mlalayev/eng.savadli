import { RoleGuard } from "@/components/dashboard/RoleGuard";

export default function StudentGeneralEnglishPage() {
  return (
    <RoleGuard allow={["student"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">General English</h1>
        <p className="mt-2 text-[var(--muted)]">
          Conversation, vocabulary, writing for school or work — themes and homework tailored to
          your level.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          Lesson themes and speaking logs will show here once connected.
        </div>
      </div>
    </RoleGuard>
  );
}
