import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
  initials: string;
};

export type TestimonialsProps = {
  items: readonly Testimonial[];
  title?: string;
  subtitle?: string;
};

export function Testimonials({
  items,
  title = "Students who stuck with the process",
  subtitle = "Real preparation takes time — here's what learners say about studying on Savadli.",
}: TestimonialsProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">{title}</h2>
          <p className="mt-3 text-base text-[var(--muted)]">{subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <TestimonialCard key={item.name} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, name, meta, initials }: Testimonial) {
  return (
    <Card padding="lg" className="flex h-full flex-col">
      <blockquote className="flex-1 text-[17px] leading-relaxed text-[var(--text)]">&ldquo;{quote}&rdquo;</blockquote>
      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-xs font-semibold text-[var(--muted)]",
            )}
            aria-hidden
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{name}</p>
            <p className="text-xs text-[var(--muted)]">{meta}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
