import { RoleGuard } from "@/components/dashboard/RoleGuard";

export default function StudentExamsExtrasPage() {
  return (
    <RoleGuard allow={["student"]}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Exams & extras</h1>
        <p className="mt-2 text-[var(--muted)]">
          Add-on drills, booster packs, and resources outside your main track — timed sprints, vocab
          decks, and bonus readings.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          List extra packs and unlock rules here when you add payments or enrollment rules.
        </div>
      </div>
    </RoleGuard>
  );
}
