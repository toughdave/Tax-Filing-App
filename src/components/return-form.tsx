"use client";

import { useMemo, useState } from "react";
import { baseFieldGroups, filingModes, modeSpecificFieldGroups, parseFilingMode, type FilingMode } from "@/lib/tax-field-config";
import { textFor, type Locale } from "@/lib/i18n";

interface ReturnFormProps {
  locale: Locale;
  defaultTaxYear: number;
  defaultMode?: FilingMode;
}

interface SaveResponse {
  record: {
    id: string;
    status: string;
  };
  missingRequired: string[];
  carryForwardFromYear: number | null;
}

export function ReturnForm({ locale, defaultTaxYear, defaultMode = "INDIVIDUAL" }: ReturnFormProps) {
  const t = textFor(locale);
  const [taxYear, setTaxYear] = useState(String(defaultTaxYear));
  const [filingMode, setFilingMode] = useState<FilingMode>(defaultMode);
  const [values, setValues] = useState<Record<string, string>>({});
  const [returnId, setReturnId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [carryForwardYear, setCarryForwardYear] = useState<number | null>(null);

  const activeGroups = useMemo(
    () => [...baseFieldGroups, ...(modeSpecificFieldGroups[filingMode] ?? [])],
    [filingMode]
  );

  function handleValueChange(fieldKey: string, value: string) {
    setValues((current) => ({ ...current, [fieldKey]: value }));
  }

  function payloadFromValues() {
    const payload: Record<string, string | number | null> = {};

    for (const group of activeGroups) {
      for (const field of group.fields) {
        const raw = values[field.key];
        if (raw === undefined || raw === "") {
          payload[field.key] = null;
          continue;
        }

        if (field.type === "number") {
          const numeric = Number(raw);
          payload[field.key] = Number.isFinite(numeric) ? numeric : null;
          continue;
        }

        payload[field.key] = raw;
      }
    }

    return payload;
  }

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

      if (data.missingRequired.length > 0) {
        setInfoMessage(`${t.filingSaved} ${data.missingRequired.length} required field(s) still need values.`);
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

      setInfoMessage(t.filingSubmitReady);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("RETURN_INCOMPLETE")) {
        setErrorMessage("Required fields are still missing for this filing mode.");
      } else {
        setErrorMessage(t.filingSubmitError);
      }
    } finally {
      setIsPreparing(false);
    }
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
            onChange={(event) => setFilingMode(parseFilingMode(event.target.value))}
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
            <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{group.title}</h3>
            <div className="grid-cards">
              {group.fields.map((field) => (
                <div key={field.key} className="field">
                  <label htmlFor={field.key}>
                    {t[field.labelKey]}
                    {field.required ? " *" : ""}
                  </label>
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(event) => handleValueChange(field.key, event.target.value)}
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
