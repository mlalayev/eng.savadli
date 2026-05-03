"use client";

import { useCallback, useEffect, useRef } from "react";

function collectFromDocument(doc: Document): Record<string, string> {
  const out: Record<string, string> = {};
  const byName = new Map<string, HTMLInputElement[]>();
  doc.querySelectorAll("input").forEach((el) => {
    const input = el as HTMLInputElement;
    const name = input.name?.trim();
    if (!name) return;
    const list = byName.get(name) ?? [];
    list.push(input);
    byName.set(name, list);
  });
  for (const [name, inputs] of byName) {
    const radios = inputs.filter((i) => i.type === "radio");
    if (radios.length) {
      const checked = radios.find((r) => r.checked);
      out[name] = checked?.value ?? "";
    } else {
      const t = inputs.find((i) => i.type === "text" || !i.type);
      if (t) out[name] = t.value ?? "";
    }
  }
  return out;
}

function applyToDocument(doc: Document, values: Record<string, string>) {
  for (const [name, val] of Object.entries(values)) {
    const inputs = Array.from(doc.querySelectorAll<HTMLInputElement>("input")).filter((i) => i.name === name);
    if (!inputs.length) continue;
    if (inputs.some((i) => i.type === "radio")) {
      inputs.forEach((r) => {
        if (r.type === "radio") r.checked = r.value === val;
      });
    } else {
      const t = inputs.find((i) => i.type === "text" || !i.type);
      if (t) t.value = val;
    }
  }
}

export function parseHtmlInteractiveStored(v: unknown): Record<string, string> {
  if (v && typeof v === "object" && !Array.isArray(v)) return { ...(v as Record<string, string>) };
  if (typeof v === "string" && v.trim()) {
    try {
      const j = JSON.parse(v) as unknown;
      if (j && typeof j === "object" && !Array.isArray(j)) return j as Record<string, string>;
    } catch {
      /* ignore */
    }
  }
  return {};
}

type HtmlInteractiveRunnerProps = {
  questionId: string;
  htmlContent: string;
  cssContent?: string;
  disabled?: boolean;
  /** JSON-serialized answers for this question only (stable string from parent useMemo). */
  storedAnswersJson: string;
  onValuesChange: (answers: Record<string, string>) => void;
};

export function HtmlInteractiveRunner({
  questionId,
  htmlContent,
  cssContent,
  disabled,
  storedAnswersJson,
  onValuesChange,
}: HtmlInteractiveRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppliedJson = useRef<string | null>(null);
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;
  const storedAnswersJsonRef = useRef(storedAnswersJson);
  storedAnswersJsonRef.current = storedAnswersJson;

  const flush = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    onValuesChangeRef.current(collectFromDocument(doc));
  }, []);

  // Build iframe document (HTML/CSS) — not tied to live answer edits.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    lastAppliedJson.current = null;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 12px; font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.5; color: #222; }
    input[type="text"] { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; max-width: 100%; }
    input[type="radio"] { margin: 0 6px 0 0; }
    ${cssContent ?? ""}
  </style>
</head>
<body>${htmlContent || "<p>No HTML</p>"}</body>
</html>`;
    doc.open();
    doc.write(fullHtml);
    doc.close();

    queueMicrotask(() => {
      const d = iframeRef.current?.contentDocument;
      if (!d?.body) return;
      try {
        const parsed = JSON.parse(storedAnswersJsonRef.current) as Record<string, string>;
        if (parsed && typeof parsed === "object") {
          applyToDocument(d, parsed);
          lastAppliedJson.current = storedAnswersJsonRef.current;
        }
      } catch {
        /* ignore */
      }
    });

    const onInput = () => {
      if (disabled) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => flush(), 200);
    };
    doc.body.addEventListener("input", onInput);
    doc.body.addEventListener("change", onInput);
    return () => {
      doc.body.removeEventListener("input", onInput);
      doc.body.removeEventListener("change", onInput);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [questionId, htmlContent, cssContent, disabled, flush]);

  // Apply saved answers when iframe exists (load / restore) without rebuilding the document.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body?.querySelector("input")) return;
    if (storedAnswersJson === lastAppliedJson.current) return;
    try {
      const parsed = JSON.parse(storedAnswersJson) as Record<string, string>;
      if (parsed && typeof parsed === "object") {
        applyToDocument(doc, parsed);
        lastAppliedJson.current = storedAnswersJson;
      }
    } catch {
      /* ignore */
    }
  }, [storedAnswersJson]);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <iframe
        ref={iframeRef}
        title={`HTML question ${questionId}`}
        sandbox="allow-same-origin"
        className="min-h-[200px] w-full"
        style={{ border: "none" }}
      />
    </div>
  );
}
