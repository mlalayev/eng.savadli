export function SatChevronDown({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SatPencilAnnotate({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
      />
    </svg>
  );
}

export function SatBookmarkOutline({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
    </svg>
  );
}

/** “Eliminate” control — stylized letter with strike (Bluebook-style). */
export function SatEliminateIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 7.5c1.2-1.5 3.8-1.2 4.5.6.4 1.1-.1 2.1-1 2.6-.6.3-1.3.5-2 .7-.8.2-1.6.5-2.1 1.1-.9 1.1-.2 2.8 1.2 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SatCalculatorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 10h2M12 10h2M16 10h2M8 13h2M12 13h2M16 13h2M8 16h2M12 16h2M16 16h2" strokeLinecap="round" />
    </svg>
  );
}

export function SatReferenceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span className={`font-serif italic leading-none text-black ${className ?? ""}`} aria-hidden>
      x<sup className="text-[10px]">2</sup>
    </span>
  );
}
