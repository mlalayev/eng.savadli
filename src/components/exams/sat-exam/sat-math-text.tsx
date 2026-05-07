"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";

type SatMathTextProps = {
  text: string;
  className?: string;
};

export function SatMathText({ text, className }: SatMathTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      el.innerHTML = katex.renderToString(text, {
        throwOnError: false,
        strict: "ignore",
        trust: false,
        displayMode: false,
      });
    } catch {
      el.textContent = text;
    }
  }, [text]);

  return <span ref={ref} className={["font-serif text-[15px] text-black", className].filter(Boolean).join(" ")} />;
}
