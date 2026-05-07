import type { SVGProps } from "react";

export function SatChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden {...props}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SatChevronUp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden {...props}>
      <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SatEliminateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontFamily='"Arial", "Helvetica Neue", Helvetica, sans-serif'
        fontWeight="700"
        letterSpacing="0.4"
        fill="currentColor"
      >
        ABC
      </text>
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SatBookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path
        d="M5 3.5h10a.5.5 0 01.5.5v12.5L10 12.25 4.5 16.5V4a.5.5 0 01.5-.5z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SatAnnotateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25zM20.71 6.04a1 1 0 000-1.41l-1.34-1.34a1 1 0 00-1.41 0l-1.59 1.59 2.75 2.75 1.59-1.59z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SatCalculatorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="7.4" y="5.6" width="9.2" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="9" cy="12.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="12.5" r="0.9" fill="currentColor" />
      <circle cx="15" cy="12.5" r="0.9" fill="currentColor" />
      <circle cx="9" cy="15.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="15.5" r="0.9" fill="currentColor" />
      <circle cx="15" cy="15.5" r="0.9" fill="currentColor" />
      <circle cx="9" cy="18.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" />
      <circle cx="15" cy="18.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function SatReferenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="16"
        fontFamily="'Times New Roman', Times, serif"
        fontStyle="italic"
        fontWeight="500"
        fill="currentColor"
      >
        x²
      </text>
    </svg>
  );
}

export function SatCloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
