import { cn } from "@/lib/cn";

export type StatCardProps = {
  value: string;
  label: string;
  className?: string;
};

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={cn("text-center", className)}>
      <p className="font-mono text-4xl font-semibold tracking-tight text-[var(--footer-heading)] sm:text-5xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--footer-text)] opacity-90">{label}</p>
    </div>
  );
}

export type StatisticsSectionProps = {
  stats: readonly { value: string; label: string }[];
  footnote?: string;
  id?: string;
};

export function StatisticsSection({ stats, footnote, id }: StatisticsSectionProps) {
  return (
    <section id={id} className="bg-[var(--footer-bg)] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
        {footnote ? (
          <p className="mt-10 text-center text-xs text-[var(--footer-text)] opacity-75">{footnote}</p>
        ) : null}
      </div>
    </section>
  );
}
