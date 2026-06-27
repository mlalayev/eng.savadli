"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type AudienceCardProps = {
  title: string;
  description: string;
  className?: string;
};

export function AudienceCard({ title, description, className }: AudienceCardProps) {
  return (
    <Card variant="default" padding="lg" className={cn("h-full", className)}>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-3 text-[0.9375rem] leading-relaxed">{description}</CardDescription>
    </Card>
  );
}
