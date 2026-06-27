"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type FeaturedArticleCardProps = {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  className?: string;
};

export function FeaturedArticleCard({
  title,
  excerpt,
  category,
  readTime,
  className,
}: FeaturedArticleCardProps) {
  return (
    <article className={cn("h-full", className)}>
      <Card variant="muted" padding="lg" className="flex h-full flex-col">
        <p className="text-[13px] font-medium tracking-wide text-[var(--accent)]">{category}</p>
        <CardTitle className="mt-4 text-xl leading-snug sm:text-[1.375rem]">{title}</CardTitle>
        <CardDescription className="mt-4 flex-1 text-[0.9375rem] leading-7">{excerpt}</CardDescription>
        <p className="mt-6 text-sm text-[var(--faint)]">{readTime}</p>
      </Card>
    </article>
  );
}
