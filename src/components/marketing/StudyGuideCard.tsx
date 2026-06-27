"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type StudyGuideCardProps = {
  title: string;
  description: string;
  program: string;
  className?: string;
};

export function StudyGuideCard({ title, description, program, className }: StudyGuideCardProps) {
  return (
    <Card variant="default" padding="lg" className={cn("flex h-full flex-col", className)}>
      <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-[var(--faint)]">{program}</p>
      <CardTitle className="mt-3">{title}</CardTitle>
      <CardDescription className="mt-2 flex-1 text-[0.9375rem] leading-relaxed">{description}</CardDescription>
    </Card>
  );
}
