"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { LANDING_CONTAINER } from "@/components/marketing/Section";
import { cn } from "@/lib/cn";
import { NAV_LINKS } from "@/lib/marketing";
import { siteConfig } from "@/lib/site";

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const menuId = useId();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-[var(--border)] bg-[var(--header-bg)] shadow-[0_1px_3px_rgb(0_0_0/0.04)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className={cn(LANDING_CONTAINER, "grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 lg:h-[4.5rem]")}>
        <Link
          href="/"
          className="relative flex h-9 w-[7.5rem] items-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]/25"
        >
          <Image
            src="/logooSmall.png"
            alt={siteConfig.name}
            fill
            sizes="120px"
            className="object-contain object-left"
            priority
          />
        </Link>

        <nav className="hidden justify-center lg:flex" aria-label="Main">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-2xl px-4 py-2 text-[0.9375rem] font-medium text-[var(--muted)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/25"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center justify-end gap-2 lg:flex">
          <Button href="/login" variant="ghost" size="sm">
            Login
          </Button>
          <Button href="/login" variant="primary" size="sm">
            Get Started
          </Button>
        </div>

        <div className="flex justify-end lg:hidden">
          <IconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </div>
      </div>

      {menuOpen ? (
        <div id={menuId} className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-6 lg:hidden">
          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-2xl px-3 py-3 text-[0.9375rem] font-medium text-[var(--text)] hover:bg-[var(--hover)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Button href="/login" variant="outline" size="lg" className="w-full">
              Login
            </Button>
            <Button href="/login" variant="primary" size="lg" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
