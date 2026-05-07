import { Fragment, type ReactNode } from "react";

type SatMathTextProps = {
  text: string;
  className?: string;
};

const VAR_RE = /^[A-Za-z]$/;

function renderMathSegment(src: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let buf = "";
  let k = 0;

  const flushBuf = () => {
    if (!buf) return;
    out.push(
      <span key={`${keyBase}_t_${k++}`} className="font-serif italic">
        {buf}
      </span>,
    );
    buf = "";
  };

  while (i < src.length) {
    const ch = src[i];

    if (ch === "^" || ch === "_") {
      flushBuf();
      let inner: string;
      if (src[i + 1] === "{") {
        const end = src.indexOf("}", i + 2);
        if (end === -1) {
          buf += ch;
          i += 1;
          continue;
        }
        inner = src.slice(i + 2, end);
        i = end + 1;
      } else {
        inner = src.slice(i + 1, i + 2);
        i += 2;
      }
      const Tag = ch === "^" ? "sup" : "sub";
      out.push(
        <Tag key={`${keyBase}_s_${k++}`} className="font-serif italic">
          {renderMathSegment(inner, `${keyBase}_s_${k}`)}
        </Tag>,
      );
      continue;
    }

    if (ch === "\\") {
      const m = /^\\([A-Za-z]+)/.exec(src.slice(i));
      if (m) {
        flushBuf();
        const sym = greekOrSymbol(m[1]);
        out.push(
          <span key={`${keyBase}_g_${k++}`} className="font-serif italic">
            {sym}
          </span>,
        );
        i += 1 + m[1].length;
        continue;
      }
      buf += ch;
      i += 1;
      continue;
    }

    if (VAR_RE.test(ch)) {
      flushBuf();
      out.push(
        <span key={`${keyBase}_v_${k++}`} className="font-serif italic">
          {ch}
        </span>,
      );
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }
  flushBuf();
  return out;
}

function greekOrSymbol(name: string): string {
  const map: Record<string, string> = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ",
    eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ",
    nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ",
    phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
    Alpha: "Α", Beta: "Β", Gamma: "Γ", Delta: "Δ", Epsilon: "Ε", Zeta: "Ζ",
    Eta: "Η", Theta: "Θ", Iota: "Ι", Kappa: "Κ", Lambda: "Λ", Mu: "Μ",
    Nu: "Ν", Xi: "Ξ", Pi: "Π", Rho: "Ρ", Sigma: "Σ", Tau: "Τ", Upsilon: "Υ",
    Phi: "Φ", Chi: "Χ", Psi: "Ψ", Omega: "Ω",
    times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓",
    leq: "≤", geq: "≥", neq: "≠", approx: "≈",
    infty: "∞", to: "→", rightarrow: "→", leftarrow: "←",
    sqrt: "√", sum: "∑", prod: "∏", int: "∫",
  };
  return map[name] ?? name;
}

export function SatMathText({ text, className }: SatMathTextProps) {
  const parts: ReactNode[] = [];
  const re = /\\\(([\s\S]+?)\\\)|\$([^$]+)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let pIdx = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<Fragment key={`p_${pIdx++}`}>{text.slice(last, match.index)}</Fragment>);
    }
    const inner = match[1] ?? match[2] ?? "";
    parts.push(<Fragment key={`m_${pIdx++}`}>{renderMathSegment(inner, `m_${pIdx}`)}</Fragment>);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(<Fragment key={`p_${pIdx++}`}>{text.slice(last)}</Fragment>);
  }

  return <span className={className}>{parts}</span>;
}
