"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Renders plain text with inline TeX segments marked by `\\( ... \\)` or `$ ... $`. */
export function SatMathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const out: string[] = [];
    let i = 0;
    const s = text;
    while (i < s.length) {
      const dollar = s.indexOf("$", i);
      const paren = s.indexOf("\\(", i);
      if (paren !== -1 && (dollar === -1 || paren < dollar)) {
        const end = s.indexOf("\\)", paren + 2);
        if (end === -1) {
          out.push(escapeHtml(s.slice(i)));
          break;
        }
        if (paren > i) out.push(escapeHtml(s.slice(i, paren)));
        const contentStart = paren + 2;
        try {
          out.push(katex.renderToString(s.slice(contentStart, end), { throwOnError: false, displayMode: false }));
        } catch {
          out.push(escapeHtml(s.slice(paren, end + 2)));
        }
        i = end + 2;
        continue;
      }
      if (dollar !== -1) {
        const end = s.indexOf("$", dollar + 1);
        if (end === -1) {
          out.push(escapeHtml(s.slice(i)));
          break;
        }
        if (dollar > i) out.push(escapeHtml(s.slice(i, dollar)));
        try {
          out.push(katex.renderToString(s.slice(dollar + 1, end), { throwOnError: false, displayMode: false }));
        } catch {
          out.push(escapeHtml(s.slice(dollar, end + 1)));
        }
        i = end + 1;
        continue;
      }
      out.push(escapeHtml(s.slice(i)));
      break;
    }
    return out.join("");
  }, [text]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
