"use client";

import { textFor, type Locale } from "@/lib/i18n";
import type { FieldGroup } from "@/lib/tax-field-config";

interface FilingProgressProps {
  locale: Locale;
  groups: FieldGroup[];
  values: Record<string, string>;
}

interface SectionProgress {
  groupId: string;
  titleKey: string;
  filled: number;
  required: number;
  total: number;
  complete: boolean;
}

function computeSectionProgress(
  groups: FieldGroup[],
  values: Record<string, string>
): SectionProgress[] {
  return groups.map((group) => {
    const requiredFields = group.fields.filter((f) => f.required);
    const filled = requiredFields.filter((f) => {
      const v = values[f.key];
      return v !== undefined && v !== null && v.trim() !== "";
    }).length;
    return {
      groupId: group.id,
      titleKey: group.titleKey,
      filled,
      required: requiredFields.length,
      total: group.fields.length,
      complete: requiredFields.length > 0 ? filled >= requiredFields.length : true
    };
  });
}

export function FilingProgress({ locale, groups, values }: FilingProgressProps) {
  const t = textFor(locale);
  const sections = computeSectionProgress(groups, values);
  const completedCount = sections.filter((s) => s.complete).length;
  const totalSections = sections.length;
  const overallPct = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={overallPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${t.filingProgressLabel}: ${overallPct}%`}
      style={{ display: "grid", gap: "0.6rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontSize: "0.95rem" }}>{t.filingProgressLabel}</strong>
        <span className="muted" style={{ fontSize: "0.85rem" }}>
          {completedCount}/{totalSections} {t.filingProgressSections}
        </span>
      </div>

      <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${overallPct}%`,
            background: overallPct === 100 ? "var(--brand)" : "var(--brand-2)",
            borderRadius: "3px",
            transition: "width 0.3s ease"
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {sections.map((section) => (
          <span
            key={section.groupId}
            className="pill"
            style={{
              fontSize: "0.78rem",
              padding: "0.15rem 0.55rem",
              background: section.complete ? "rgba(31, 107, 87, 0.1)" : "rgba(202, 90, 47, 0.08)",
              borderColor: section.complete ? "rgba(31, 107, 87, 0.25)" : "rgba(202, 90, 47, 0.2)",
              color: section.complete ? "var(--brand)" : "var(--alert)"
            }}
          >
            {section.complete ? "✓" : "○"} {t[section.titleKey] ?? section.groupId}
            {section.required > 0 && !section.complete && (
              <span style={{ marginLeft: "0.3rem", opacity: 0.7 }}>
                ({section.filled}/{section.required})
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
