import type { ReactNode } from "react";

export function NavSection({
  title,
  children,
  first,
}: {
  title: string;
  children: ReactNode;
  /** First section has no top divider */
  first?: boolean;
}) {
  return (
    <div
      className={
        first
          ? ""
          : "mt-4 border-t border-[var(--border)] pt-4"
      }
    >
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">
        {title}
      </p>
      {children}
    </div>
  );
}
