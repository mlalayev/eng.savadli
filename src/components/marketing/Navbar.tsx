"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
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
        "sticky top-0 z-50 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-150",
        scrolled
          ? "border-b border-[var(--border)]/80 bg-[var(--header-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-[180%]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="relative flex h-9 w-[120px] shrink-0 items-center">
          <Image
            src="/logooSmall.png"
            alt={siteConfig.name}
            fill
            sizes="120px"
            className="object-contain object-left"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/login" variant="ghost" size="sm">
            Login
          </Button>
          <Button href="/login" variant="primary" size="sm">
            Get Started
          </Button>
        </div>

        <IconButton
          label={menuOpen ? "Close menu" : "Open menu"}
          className="lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </div>

      {menuOpen ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-6 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-[var(--text)] hover:bg-[var(--hover)]"
              >
                {link.label}
              </Link>
            ))}
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
