"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type PracticeAreaCardProps = {
  title: string;
  description: string;
  className?: string;
};

export function PracticeAreaCard({ title, description, className }: PracticeAreaCardProps) {
  return (
    <Card variant="default" padding="md" className={cn("h-full", className)}>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2 text-[0.9375rem] leading-relaxed">{description}</CardDescription>
    </Card>
  );
}
