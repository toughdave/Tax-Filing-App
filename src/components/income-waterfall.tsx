"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { textFor } from "@/lib/i18n";
import type { TaxSummary } from "@/lib/services/tax-calculation-engine";

interface IncomeWaterfallProps {
  summary: TaxSummary;
  locale: Locale;
}

export function IncomeWaterfall({ summary, locale }: IncomeWaterfallProps) {
  const t = textFor(locale);
  if (summary.totalIncome <= 0) return null;

  const creditsPayments = summary.refundableCredits + summary.totalPayments;
  const provincialTax = summary.provincial?.netProvincialTax ?? 0;

  const steps = [
    { name: t.liveBannerIncome, value: summary.totalIncome, base: 0, color: "#22c55e" },
    { name: t.liveBannerDeductions, value: summary.totalDeductions, base: summary.totalIncome - summary.totalDeductions, color: "#f97316" },
    { name: t.liveBannerFederalTax, value: summary.netFederalTax, base: summary.netIncome - summary.netFederalTax, color: "#ef4444" },
  ];

  if (provincialTax > 0) {
    const afterFed = summary.netIncome - summary.netFederalTax;
    steps.push({ name: t.liveBannerProvincialTax, value: provincialTax, base: afterFed - provincialTax, color: "#dc2626" });
  }

  if (creditsPayments > 0) {
    const afterTax = summary.netIncome - summary.netFederalTax - provincialTax;
    steps.push({ name: t.liveBannerCredits, value: creditsPayments, base: afterTax, color: "#2679c8" });
  }

  const finalAmount = Math.abs(summary.balanceOwing);
  steps.push({
    name: t.liveBannerNet,
    value: finalAmount,
    base: 0,
    color: summary.balanceOwing < 0 ? "#1f6b57" : "#ca5a2f"
  });

  const data = steps.map((s) => ({
    name: s.name,
    base: s.base,
    value: s.value,
    color: s.color
  }));

  return (
    <div className="chart-card animate-fade-in" role="img" aria-label={t.chartWaterfall}>
      <h4>{t.chartWaterfall}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 10, right: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ink-soft)" }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10, fill: "var(--ink-soft)" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), locale)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              fontSize: "0.85rem"
            }}
          />
          <Bar dataKey="base" stackId="stack" fill="transparent" />
          <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
