"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type DownloadCardProps = {
  title: string;
  description: string;
  format: string;
  size: string;
  className?: string;
};

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadCard({ title, description, format, size, className }: DownloadCardProps) {
  return (
    <Card variant="default" padding="lg" className={cn(className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--accent)]">
            <FileIcon />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1.5">{description}</CardDescription>
            <p className="mt-2 text-xs text-[var(--faint)]">
              {format} · {size}
            </p>
          </div>
        </div>
        <Button href="/login" variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
          Download
        </Button>
      </div>
    </Card>
  );
}
