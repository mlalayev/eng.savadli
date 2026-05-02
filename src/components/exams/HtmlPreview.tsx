"use client";

import { useEffect, useRef, useState } from "react";

type HtmlPreviewProps = {
  htmlContent: string;
  cssContent?: string;
  /** Optional: show detected question count */
  showQuestionCount?: boolean;
  questionCount?: number;
};

export function HtmlPreview({ htmlContent, cssContent, showQuestionCount, questionCount }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }
    input[type="text"] {
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }
    input[type="radio"] {
      margin: 0 6px 0 0;
    }
    ${cssContent || ""}
  </style>
</head>
<body>
  ${htmlContent || "<p style='color: #999;'>No HTML content yet...</p>"}
</body>
</html>
      `;
      doc.open();
      doc.write(fullHtml);
      doc.close();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to render preview");
    }
  }, [htmlContent, cssContent]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--faint)]">Live Preview</p>
        {showQuestionCount && questionCount !== undefined ? (
          <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            {questionCount} {questionCount === 1 ? "question" : "questions"}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 rounded-lg border border-[var(--error-border)] bg-[var(--error-surface)] px-3 py-2 text-xs text-[var(--error-text)]">
          {error}
        </p>
      ) : null}
      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <iframe
          ref={iframeRef}
          title="HTML Preview"
          sandbox="allow-same-origin"
          className="h-96 w-full"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
}
