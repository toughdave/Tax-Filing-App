"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { baseFieldGroups, filingModes, modeSpecificFieldGroups, parseFilingMode, type FilingMode, type TaxField } from "@/lib/tax-field-config";
import { textFor, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { TaxSummary, CorporateTaxSummary, CalculationResult } from "@/lib/services/tax-calculation-engine";

interface ReturnFormProps {
  locale: Locale;
  defaultTaxYear: number;
  defaultMode?: FilingMode;
  initialReturnId?: string;
  initialPayload?: Record<string, unknown>;
  initialTaxSummary?: CalculationResult | null;
}

interface SaveResponse {
  record: {
    id: string;
    status: string;
  };
  missingRequired: string[];
  carryForwardFromYear: number | null;
  taxSummary: CalculationResult;
}

function htmlInputType(field: TaxField): string {
  if (field.type === "number") return "number";
  if (field.type === "date") return "date";
  return "text";
}

function formDefaultsFromPayload(payload: Record<string, unknown> | undefined): Record<string, string> {
  if (!payload) {
    return {};
  }

  const defaults: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      defaults[key] = value;
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      defaults[key] = String(value);
    }
  }

  return defaults;
}

export function ReturnForm({
  locale,
  defaultTaxYear,
  defaultMode = "INDIVIDUAL",
  initialReturnId,
  initialPayload,
  initialTaxSummary = null
}: ReturnFormProps) {
  const t = textFor(locale);
  const formDefaults = useMemo(() => formDefaultsFromPayload(initialPayload), [initialPayload]);
  const [taxYear, setTaxYear] = useState(String(defaultTaxYear));
  const [filingMode, setFilingMode] = useState<FilingMode>(defaultMode);
  const [returnId, setReturnId] = useState<string | null>(initialReturnId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [carryForwardYear, setCarryForwardYear] = useState<number | null>(null);
  const [taxSummary, setTaxSummary] = useState<CalculationResult | null>(initialTaxSummary);

  const { register, getValues, reset } = useForm<Record<string, string>>({
    mode: "onBlur",
    defaultValues: formDefaults
  });

  const activeGroups = useMemo(
    () => [...baseFieldGroups, ...(modeSpecificFieldGroups[filingMode] ?? [])],
    [filingMode]
  );

  const payloadFromValues = useCallback(() => {
    const raw = getValues();
    const payload: Record<string, string | number | null> = {};

    for (const group of activeGroups) {
      for (const field of group.fields) {
        const value = raw[field.key];
        if (value === undefined || value === "") {
          payload[field.key] = null;
          continue;
        }

        if (field.type === "number") {
          const numeric = Number(value);
          payload[field.key] = Number.isFinite(numeric) ? numeric : null;
          continue;
        }

        payload[field.key] = value;
      }
    }

    return payload;
  }, [activeGroups, getValues]);

  async function saveDraft(): Promise<SaveResponse | null> {
    setIsSaving(true);
    setInfoMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxYear,
          filingMode,
          payload: payloadFromValues()
        })
      });

      if (!response.ok) {
        throw new Error("SAVE_FAILED");
      }

      const data = (await response.json()) as SaveResponse;
      setReturnId(data.record.id);
      setCarryForwardYear(data.carryForwardFromYear);
      setTaxSummary(data.taxSummary);

      if (data.missingRequired.length > 0) {
        setInfoMessage(`${t.filingSaved} ${data.missingRequired.length} ${t.filingMissingCount}`);
      } else {
        setInfoMessage(t.filingSaved);
      }

      return data;
    } catch {
      setErrorMessage(t.filingSaveError);
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function prepareSubmission() {
    setErrorMessage(null);
    setInfoMessage(null);

    let activeReturnId = returnId;
    if (!activeReturnId) {
      const saved = await saveDraft();
      activeReturnId = saved?.record.id ?? null;
    }

    if (!activeReturnId) {
      return;
    }

    setIsPreparing(true);

    try {
      const response = await fetch(`/api/returns/${activeReturnId}/prepare`, {
        method: "POST"
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message ?? "PREPARE_FAILED");
      }

      const result = (await response.json()) as { status?: string; message?: string };

      if (result.status === "REJECTED") {
        setErrorMessage(result.message ?? t.filingSubmitRejected);
      } else {
        setInfoMessage(t.filingSubmitReady);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("RETURN_INCOMPLETE")) {
        setErrorMessage(t.filingMissingForMode);
      } else if (message.startsWith("PREFLIGHT_FAILED")) {
        setErrorMessage(t.filingPreflightFailed);
      } else if (message === "PROVIDER_NOT_CONFIGURED") {
        setErrorMessage(t.filingProviderUnavailable);
      } else if (message === "NETFILE_INDIVIDUAL_ONLY") {
        setErrorMessage(t.filingNetfileIndividualOnly);
      } else {
        setErrorMessage(t.filingSubmitError);
      }
    } finally {
      setIsPreparing(false);
    }
  }

  function handleModeChange(newMode: FilingMode) {
    setFilingMode(newMode);
    reset();
    setReturnId(null);
    setCarryForwardYear(null);
    setTaxSummary(null);
    setInfoMessage(null);
    setErrorMessage(null);
  }

  function renderIndividualSummary(s: TaxSummary) {
    return (
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryTotalIncome}</span><strong>{formatCurrency(s.totalIncome, locale)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryTotalDeductions}</span><strong>{formatCurrency(s.totalDeductions, locale)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryNetIncome}</span><strong>{formatCurrency(s.netIncome, locale)}</strong>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "0.3rem 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryFederalTax}</span><span>{formatCurrency(s.federalTax, locale)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryPersonalCredit}</span><span>−{formatCurrency(s.basicPersonalCredit, locale)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem" }}>
          <span>{t.taxSummaryNetFederalTax}</span><span>{formatCurrency(s.netFederalTax, locale)}</span>
        </div>
      </div>
    );
  }

  function renderCorporateSummary(s: CorporateTaxSummary) {
    return (
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryCorporateRevenue}</span><strong>{formatCurrency(s.corporateRevenue, locale)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryTotalDeductions}</span><strong>{formatCurrency(s.totalDeductions, locale)}</strong>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "0.3rem 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummarySmallBusinessTax}</span><span>{formatCurrency(s.smallBusinessTax, locale)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{t.taxSummaryGeneralTax}</span><span>{formatCurrency(s.generalTax, locale)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem" }}>
          <span>{t.taxSummaryTotalCorporateTax}</span><span>{formatCurrency(s.totalCorporateTax, locale)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "1.1rem" }}>
      <div>
        <h2 style={{ marginTop: 0, marginBottom: "0.35rem", fontFamily: "var(--font-title)" }}>{t.filingTitle}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {t.filingSubtitle}
        </p>
      </div>

      <div className="grid-cards">
        <div className="field">
          <label htmlFor="taxYear">{t.filingTaxYear}</label>
          <input
            id="taxYear"
            type="number"
            min={2010}
            max={new Date().getFullYear()}
            value={taxYear}
            onChange={(event) => setTaxYear(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="filingMode">{t.filingMode}</label>
          <select
            id="filingMode"
            value={filingMode}
            onChange={(event) => handleModeChange(parseFilingMode(event.target.value))}
          >
            {filingModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {t[mode.labelKey]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carryForwardYear ? (
        <div className="notice-success">
          {t.filingCarryForward}: {carryForwardYear}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        {activeGroups.map((group) => (
          <section key={group.id} className="surface" style={{ padding: "0.95rem", display: "grid", gap: "0.8rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t[group.titleKey]}</h3>
            <div className="grid-cards">
              {group.fields.map((field) => (
                <div key={field.key} className="field">
                  <label htmlFor={field.key}>
                    {t[field.labelKey]}
                    {field.required ? " *" : ""}
                  </label>
                  <input
                    id={field.key}
                    type={htmlInputType(field)}
                    {...register(field.key)}
                  />
                  <small>{t[field.helpKey]}</small>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.03rem" }}>{t.filingChecklist}</h3>
        <div className="checklist">
          <label>
            <input type="checkbox" /> {t.checklistIdentity}
          </label>
          <label>
            <input type="checkbox" /> {t.checklistDocuments}
          </label>
          <label>
            <input type="checkbox" /> {t.checklistModeSpecific}
          </label>
          <label>
            <input type="checkbox" /> {t.checklistReview}
          </label>
        </div>
      </section>

      {taxSummary ? (
        <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.taxSummaryTitle}</h3>
          {taxSummary.mode === "COMPANY"
            ? renderCorporateSummary(taxSummary.summary as CorporateTaxSummary)
            : renderIndividualSummary(taxSummary.summary as TaxSummary)}
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{t.taxSummaryNotice}</p>
        </section>
      ) : null}

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={() => void saveDraft()} disabled={isSaving || isPreparing} type="button">
          {isSaving ? t.filingSaving : t.filingSaveDraft}
        </button>
        <button className="btn btn-primary" onClick={() => void prepareSubmission()} disabled={isPreparing || isSaving} type="button">
          {isPreparing ? t.filingSaving : t.filingPrepare}
        </button>
      </div>

      {infoMessage ? <p className="notice-success">{infoMessage}</p> : null}
      {errorMessage ? <p className="notice-error">{errorMessage}</p> : null}
    </div>
  );
}
