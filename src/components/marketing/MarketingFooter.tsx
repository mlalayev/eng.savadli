import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { FOOTER_COLUMNS } from "@/lib/marketing";
import { siteConfig } from "@/lib/site";

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL = [
  { label: "LinkedIn", href: "https://linkedin.com", icon: LinkedInIcon },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com", icon: YouTubeIcon },
] as const;

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--footer-bg)] text-[var(--footer-text)]">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="relative h-9 w-[120px] brightness-0 invert">
              <Image src="/logooSmall.png" alt={siteConfig.name} fill sizes="120px" className="object-contain object-left" />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{siteConfig.description}</p>
            <p className="mt-4 text-sm">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-[var(--footer-heading)] transition hover:text-white"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-[var(--footer-heading)]">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition hover:text-[var(--footer-heading)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--footer-border)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {SOCIAL.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={cn(
                  "text-[var(--footer-text)] transition hover:text-[var(--footer-heading)]",
                )}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
