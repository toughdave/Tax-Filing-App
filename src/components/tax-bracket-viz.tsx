"use client";

import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { textFor } from "@/lib/i18n";
import type { TaxBracket } from "@/lib/tax-year-config";

const BRACKET_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

interface TaxBracketVizProps {
  brackets: TaxBracket[];
  taxableIncome: number;
  locale: Locale;
}

export function TaxBracketViz({ brackets, taxableIncome, locale }: TaxBracketVizProps) {
  const t = textFor(locale);
  if (!brackets.length || taxableIncome <= 0) return null;

  const maxIncome = Math.max(
    taxableIncome * 1.2,
    brackets.length > 1 ? (brackets[brackets.length - 2]?.upTo ?? 0) * 1.1 : 300000
  );

  const segments = brackets.map((b, i) => {
    const prevUpTo = i > 0 ? (brackets[i - 1]?.upTo ?? 0) : 0;
    const segEnd = Math.min(b.upTo, maxIncome);
    const width = ((segEnd - prevUpTo) / maxIncome) * 100;
    return {
      rate: b.rate,
      start: prevUpTo,
      end: b.upTo,
      widthPct: Math.max(width, 0),
      color: BRACKET_COLORS[i % BRACKET_COLORS.length]
    };
  }).filter((s) => s.widthPct > 0);

  const markerPct = Math.min((taxableIncome / maxIncome) * 100, 100);

  return (
    <div className="chart-card animate-fade-in" role="img" aria-label={t.chartTaxBracket}>
      <h4>{t.chartTaxBracket}</h4>
      <div style={{ position: "relative", marginTop: "1.2rem", marginBottom: "0.5rem" }}>
        {/* Bracket bar */}
        <div style={{ display: "flex", height: "28px", borderRadius: "6px", overflow: "hidden" }}>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                width: `${seg.widthPct}%`,
                background: seg.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#fff",
                minWidth: seg.widthPct > 5 ? undefined : 0,
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
              title={`${(seg.rate * 100).toFixed(1)}% — ${formatCurrency(seg.start, locale)} to ${seg.end === Infinity ? "∞" : formatCurrency(seg.end, locale)}`}
            >
              {seg.widthPct > 8 ? `${(seg.rate * 100).toFixed(1)}%` : ""}
            </div>
          ))}
        </div>

        {/* Income marker */}
        <div
          style={{
            position: "absolute",
            left: `${markerPct}%`,
            top: "-8px",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "var(--ink)",
            background: "var(--surface)",
            padding: "0.1rem 0.35rem",
            borderRadius: "4px",
            border: "1px solid var(--line)",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            {formatCurrency(taxableIncome, locale)}
          </div>
          <div style={{
            width: "2px",
            height: "36px",
            background: "var(--ink)",
            marginTop: "2px"
          }} />
        </div>
      </div>

      {/* Bracket labels below */}
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
        {segments.map((seg, i) => (
          <span key={i} style={{
            fontSize: "0.7rem",
            color: "var(--ink-soft)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.2rem"
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "2px", background: seg.color, flexShrink: 0 }} />
            {(seg.rate * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}
