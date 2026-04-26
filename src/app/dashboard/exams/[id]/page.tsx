"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { api } from "@/components/exams/shared/api";
import type { Exam } from "@/components/exams/shared/types";
import { IeltsExamEditor } from "@/components/exams/IeltsExamEditor";
import { DsatExamEditor } from "@/components/exams/DsatExamEditor";
import { GeneralExamEditor } from "@/components/exams/GeneralExamEditor";

export default function ExamDetailPage() {
  const params = useParams();
  const examId = typeof params?.id === "string" ? params.id : "";
  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    if (!examId) return;
    try {
      const data = await api<{ exam: Exam }>(`/api/exams/${examId}`);
      setExam(data.exam);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exam");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (!examId) return;
    void load();
  }, [load, examId]);

  if (loading) {
    return (
      <RoleGuard allow={["creator", "admin", "teacher"]}>
        <div className="mx-auto max-w-4xl py-8">
          <p className="text-center text-sm text-[var(--muted)]">Loading exam...</p>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allow={["creator", "admin", "teacher"]}>
        <div className="mx-auto max-w-4xl py-8">
          <p className="rounded-xl border border-[var(--error-border)] bg-[var(--error-surface)] px-4 py-3 text-sm text-[var(--error-text)]">
            {error}
          </p>
        </div>
      </RoleGuard>
    );
  }

  if (!exam) {
    return (
      <RoleGuard allow={["creator", "admin", "teacher"]}>
        <div className="mx-auto max-w-4xl py-8">
          <p className="text-center text-sm text-[var(--muted)]">Exam not found</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allow={["creator", "admin", "teacher"]}>
      {exam.program === "ielts" ? (
        <IeltsExamEditor exam={exam} onUpdate={load} />
      ) : exam.program === "dsat" ? (
        <DsatExamEditor exam={exam} onUpdate={load} />
      ) : (
        <GeneralExamEditor exam={exam} onUpdate={load} />
      )}
    </RoleGuard>
  );
}
