import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{siteConfig.name}</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">{siteConfig.description}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <Link href="/programs" className="hover:text-[var(--text)]">
            Programs
          </Link>
          <Link href="/approach" className="hover:text-[var(--text)]">
            Approach
          </Link>
          <Link href="/contact" className="hover:text-[var(--text)]">
            Contact
          </Link>
          <Link href="/login" className="hover:text-[var(--text)]">
            Student login
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-5xl px-4 text-center text-xs text-[var(--faint)] sm:px-6">
        © {new Date().getFullYear()} {siteConfig.name}
      </p>
    </footer>
  );
}
