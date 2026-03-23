"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { textFor } from "@/lib/i18n";
import type { TaxSummary } from "@/lib/services/tax-calculation-engine";

const COLORS = [
  "#1f6b57", "#2679c8", "#ca5a2f", "#8b5cf6",
  "#059669", "#d97706", "#dc2626", "#6366f1",
  "#0891b2", "#84cc16"
];

interface IncomeDonutProps {
  summary: TaxSummary;
  locale: Locale;
}

export function IncomeDonut({ summary, locale }: IncomeDonutProps) {
  const t = textFor(locale);
  const items = summary.breakdown.incomeItems;
  const data = Object.entries(items)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: t[`field${key.charAt(0).toUpperCase()}${key.slice(1)}`] ?? key,
      value
    }));

  if (data.length === 0) return null;

  return (
    <div className="chart-card animate-fade-in" role="img" aria-label={t.chartIncomeBreakdown}>
      <h4>{t.chartIncomeBreakdown}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), locale)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              fontSize: "0.85rem"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 0.8rem", marginTop: "0.4rem" }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span style={{ color: "var(--ink-soft)" }}>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DeductionsBarProps {
  summary: TaxSummary;
  locale: Locale;
}

export function DeductionsBar({ summary, locale }: DeductionsBarProps) {
  const t = textFor(locale);
  const items = summary.breakdown.deductionItems;
  const data = Object.entries(items)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: t[`field${key.charAt(0).toUpperCase()}${key.slice(1)}`] ?? key,
      value
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <div className="chart-card animate-fade-in" role="img" aria-label={t.chartDeductions}>
      <h4>{t.chartDeductions}</h4>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} tickFormatter={(v: number) => formatCurrency(v, locale)} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), locale)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              fontSize: "0.85rem"
            }}
          />
          <Bar dataKey="value" fill="var(--brand-2)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface FedProvDonutProps {
  federalTax: number;
  provincialTax: number;
  locale: Locale;
}

export function FedProvDonut({ federalTax, provincialTax, locale }: FedProvDonutProps) {
  const t = textFor(locale);
  if (federalTax <= 0 && provincialTax <= 0) return null;

  const data = [
    { name: t.chartFederal, value: Math.max(federalTax, 0) },
    { name: t.chartProvincial, value: Math.max(provincialTax, 0) }
  ].filter((d) => d.value > 0);

  const colors = ["#1f6b57", "#2679c8"];

  return (
    <div className="chart-card animate-fade-in" role="img" aria-label={t.chartFedVsProv}>
      <h4>{t.chartFedVsProv}</h4>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), locale)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              fontSize: "0.85rem"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem", marginTop: "0.3rem" }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i % colors.length] }} />
            <span>{d.name}: {formatCurrency(d.value, locale)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
