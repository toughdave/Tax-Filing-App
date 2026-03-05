"use client";

import { useCallback, useEffect, useState } from "react";
import { textFor, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { TaxSummary, CorporateTaxSummary, CalculationResult } from "@/lib/services/tax-calculation-engine";

interface YoyRow {
  key: string;
  priorValue: unknown;
  currentValue: unknown;
  change: "added" | "removed" | "changed" | "unchanged";
}

interface YoyData {
  currentYear: number;
  priorYear: number;
  filingMode: string;
  rows: YoyRow[];
  currentSummary: CalculationResult | null;
  priorSummary: CalculationResult | null;
}

interface YoyComparisonProps {
  locale: Locale;
  returnId: string;
}

const CHANGE_COLORS: Record<string, string> = {
  added: "#16a34a",
  removed: "#dc2626",
  changed: "#ca8a04",
  unchanged: "#6b7280"
};

const CHANGE_BG: Record<string, string> = {
  added: "#f0fdf4",
  removed: "#fef2f2",
  changed: "#fefce8",
  unchanged: "transparent"
};

function displayValue(value: unknown, locale: Locale): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return formatCurrency(value, locale);
  return String(value);
}

export function YoyComparison({ locale, returnId }: YoyComparisonProps) {
  const t = textFor(locale);
  const [data, setData] = useState<YoyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const fetchComparison = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/returns/${returnId}/compare`);
      if (res.ok) {
        const json = (await res.json()) as { comparison: YoyData };
        setData(json.comparison);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    void fetchComparison();
  }, [fetchComparison]);

  if (isLoading) {
    return (
      <section className="surface" style={{ padding: "1rem" }}>
        <div className="muted" style={{ fontSize: "0.9rem" }}>Loading comparison...</div>
      </section>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.5rem" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.yoyTitle}</h3>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t.yoyNoData}</p>
      </section>
    );
  }

  const changedRows = data.rows.filter((r) => r.change !== "unchanged");
  const unchangedRows = data.rows.filter((r) => r.change === "unchanged");
  const visibleRows = showUnchanged ? data.rows : changedRows;

  // Summary comparison
  function summaryDelta(): { label: string; prior: string; current: string; delta: string }[] {
    if (!data?.currentSummary || !data?.priorSummary) return [];
    if (data.currentSummary.mode === "COMPANY" && data.priorSummary.mode === "COMPANY") {
      const cs = data.currentSummary.summary as CorporateTaxSummary;
      const ps = data.priorSummary.summary as CorporateTaxSummary;
      return [
        { label: "Revenue", prior: formatCurrency(ps.corporateRevenue, locale), current: formatCurrency(cs.corporateRevenue, locale), delta: formatCurrency(cs.corporateRevenue - ps.corporateRevenue, locale) },
        { label: "Total Tax", prior: formatCurrency(ps.totalCorporateTax, locale), current: formatCurrency(cs.totalCorporateTax, locale), delta: formatCurrency(cs.totalCorporateTax - ps.totalCorporateTax, locale) },
      ];
    }
    if (data.currentSummary.mode !== "COMPANY" && data.priorSummary.mode !== "COMPANY") {
      const cs = data.currentSummary.summary as TaxSummary;
      const ps = data.priorSummary.summary as TaxSummary;
      return [
        { label: "Total Income", prior: formatCurrency(ps.totalIncome, locale), current: formatCurrency(cs.totalIncome, locale), delta: formatCurrency(cs.totalIncome - ps.totalIncome, locale) },
        { label: "Net Income", prior: formatCurrency(ps.netIncome, locale), current: formatCurrency(cs.netIncome, locale), delta: formatCurrency(cs.netIncome - ps.netIncome, locale) },
        { label: "Net Federal Tax", prior: formatCurrency(ps.netFederalTax, locale), current: formatCurrency(cs.netFederalTax, locale), delta: formatCurrency(cs.netFederalTax - ps.netFederalTax, locale) },
        { label: "Balance Owing", prior: formatCurrency(ps.balanceOwing, locale), current: formatCurrency(cs.balanceOwing, locale), delta: formatCurrency(cs.balanceOwing - ps.balanceOwing, locale) },
      ];
    }
    return [];
  }

  const deltas = summaryDelta();

  return (
    <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.yoyTitle}</h3>
        <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
          {t.yoySubtitle} ({data.priorYear} → {data.currentYear})
        </p>
      </div>

      {/* Summary delta cards */}
      {deltas.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" }}>
          {deltas.map((d) => (
            <div key={d.label} style={{ background: "var(--bg-alt, #f8fafc)", borderRadius: "10px", padding: "0.7rem", display: "grid", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{d.label}</span>
              <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>{d.current}</span>
              <span style={{ fontSize: "0.78rem", color: d.delta.includes("-") ? "#dc2626" : "#16a34a" }}>
                {d.delta.startsWith("-") ? "" : "+"}{d.delta} vs {data.priorYear}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Field-level comparison table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>{t.yoyField}</th>
              <th style={{ padding: "0.5rem" }}>{t.yoyPrior} ({data.priorYear})</th>
              <th style={{ padding: "0.5rem" }}>{t.yoyCurrent} ({data.currentYear})</th>
              <th style={{ padding: "0.5rem" }}>{t.yoyChange}</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const label = t[`field${row.key.charAt(0).toUpperCase()}${row.key.slice(1)}`] ?? row.key;
              return (
                <tr key={row.key} style={{ borderBottom: "1px solid var(--line)", background: CHANGE_BG[row.change] }}>
                  <td style={{ padding: "0.5rem", fontWeight: 500 }}>{label}</td>
                  <td style={{ padding: "0.5rem" }}>{displayValue(row.priorValue, locale)}</td>
                  <td style={{ padding: "0.5rem" }}>{displayValue(row.currentValue, locale)}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <span style={{ color: CHANGE_COLORS[row.change], fontWeight: 600, fontSize: "0.82rem", textTransform: "capitalize" }}>
                      {row.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unchangedRows.length > 0 && (
        <button
          className="btn btn-secondary"
          style={{ justifySelf: "start", fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
          onClick={() => setShowUnchanged(!showUnchanged)}
          type="button"
        >
          {showUnchanged ? `Hide ${unchangedRows.length} unchanged` : `Show ${unchangedRows.length} unchanged`}
        </button>
      )}

      <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
        {changedRows.length} changed · {unchangedRows.length} unchanged
      </p>
    </section>
  );
}
