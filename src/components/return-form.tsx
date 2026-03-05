"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  filingModes, parseFilingMode, getWizardSections,
  PROFILE_FLAGS, TAX_YEARS,
  type FilingMode, type TaxField, type WizardSection
} from "@/lib/tax-field-config";
import { textFor, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { TaxSummary, CorporateTaxSummary, CalculationResult } from "@/lib/services/tax-calculation-engine";
import type { CarryForwardDiffEntry } from "@/lib/carry-forward-config";
import { DocumentPanel } from "@/components/document-panel";
import { TaxSlipImportStub, NoaImportStub } from "@/components/import-stubs";

interface ReturnFormProps {
  locale: Locale;
  defaultTaxYear: number;
  defaultMode?: FilingMode;
  initialReturnId?: string;
  initialPayload?: Record<string, unknown>;
  initialTaxSummary?: CalculationResult | null;
}

interface SaveResponse {
  record: { id: string; status: string };
  missingRequired: string[];
  carryForwardFromYear: number | null;
  carryForwardDiff: CarryForwardDiffEntry[];
  taxSummary: CalculationResult;
}

type WizardStep = "setup" | "profile" | "section" | "documents" | "review";

function formDefaultsFromPayload(payload: Record<string, unknown> | undefined): Record<string, string> {
  if (!payload) return {};
  const defaults: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") { defaults[key] = value; continue; }
    if (typeof value === "number" || typeof value === "boolean") { defaults[key] = String(value); }
  }
  return defaults;
}

function isSectionComplete(section: WizardSection, values: Record<string, string>): boolean {
  const required = section.fields.filter((f) => f.required);
  if (required.length === 0) return true;
  return required.every((f) => {
    const v = values[f.key];
    return v !== undefined && v.trim() !== "";
  });
}

function countMissingRequired(section: WizardSection, values: Record<string, string>): number {
  return section.fields.filter((f) => f.required).filter((f) => {
    const v = values[f.key];
    return !v || v.trim() === "";
  }).length;
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
  const [carryForwardDiff, setCarryForwardDiff] = useState<CarryForwardDiffEntry[]>([]);
  const [taxSummary, setTaxSummary] = useState<CalculationResult | null>(initialTaxSummary);

  const [wizardStep, setWizardStep] = useState<WizardStep>(initialReturnId ? "section" : "setup");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [profileFlags, setProfileFlags] = useState<Record<string, boolean>>(() => {
    if (!initialPayload) return {};
    const flags: Record<string, boolean> = {};
    for (const flag of PROFILE_FLAGS) {
      if (initialPayload[flag.key] === true || initialPayload[flag.key] === "true") {
        flags[flag.key] = true;
      }
    }
    return flags;
  });
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const { register, getValues, reset, watch, trigger, formState: { errors } } = useForm<Record<string, string>>({
    mode: "onBlur",
    defaultValues: formDefaults
  });

  const watchedValues = watch();

  const activeSections = useMemo(
    () => getWizardSections(filingMode, profileFlags),
    [filingMode, profileFlags]
  );

  const currentSection = activeSections[activeSectionIndex] ?? null;

  const payloadFromValues = useCallback(() => {
    const raw = getValues();
    const payload: Record<string, string | number | boolean | null> = {};
    for (const section of activeSections) {
      for (const field of section.fields) {
        const value = raw[field.key];
        if (value === undefined || value === "") { payload[field.key] = null; continue; }
        if (field.type === "number") {
          const numeric = Number(value);
          payload[field.key] = Number.isFinite(numeric) ? numeric : null;
          continue;
        }
        payload[field.key] = value;
      }
    }
    for (const flag of PROFILE_FLAGS) {
      payload[flag.key] = profileFlags[flag.key] ?? false;
    }
    return payload;
  }, [activeSections, getValues, profileFlags]);

  async function saveDraft(): Promise<SaveResponse | null> {
    setIsSaving(true);
    setInfoMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxYear, filingMode, payload: payloadFromValues() })
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      const data = (await response.json()) as SaveResponse;
      setReturnId(data.record.id);
      setCarryForwardYear(data.carryForwardFromYear);
      setCarryForwardDiff(data.carryForwardDiff ?? []);
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
    if (!activeReturnId) return;
    setIsPreparing(true);
    try {
      const response = await fetch(`/api/returns/${activeReturnId}/prepare`, { method: "POST" });
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
      if (message.startsWith("RETURN_INCOMPLETE")) setErrorMessage(t.filingMissingForMode);
      else if (message.startsWith("PREFLIGHT_FAILED")) setErrorMessage(t.filingPreflightFailed);
      else if (message === "PROVIDER_NOT_CONFIGURED") setErrorMessage(t.filingProviderUnavailable);
      else if (message === "NETFILE_INDIVIDUAL_ONLY") setErrorMessage(t.filingNetfileIndividualOnly);
      else setErrorMessage(t.filingSubmitError);
    } finally {
      setIsPreparing(false);
    }
  }

  function handleModeChange(newMode: FilingMode) {
    setFilingMode(newMode);
    reset();
    setReturnId(null);
    setCarryForwardYear(null);
    setCarryForwardDiff([]);
    setTaxSummary(null);
    setInfoMessage(null);
    setErrorMessage(null);
    setProfileFlags({});
    setCompletedSections(new Set());
    setActiveSectionIndex(0);
  }

  function handleSetupContinue() {
    if (filingMode === "COMPANY") {
      setWizardStep("section");
      setActiveSectionIndex(0);
    } else {
      setWizardStep("profile");
    }
  }

  function handleProfileContinue() {
    setWizardStep("section");
    setActiveSectionIndex(0);
  }

  async function handleSectionContinue() {
    if (!currentSection) return;

    const sectionFieldKeys = currentSection.fields.map((f) => f.key);
    const valid = await trigger(sectionFieldKeys);
    if (!valid) {
      setErrorMessage(t.wizardSectionIncomplete);
      return;
    }

    const missing = countMissingRequired(currentSection, getValues());
    if (missing > 0) {
      setErrorMessage(`${t.wizardSectionIncomplete} (${missing} ${t.wizardMissingFields})`);
      return;
    }

    const saved = await saveDraft();
    if (!saved) return;

    setCompletedSections((prev) => new Set(prev).add(currentSection.id));

    if (activeSectionIndex < activeSections.length - 1) {
      setActiveSectionIndex(activeSectionIndex + 1);
    } else {
      setWizardStep("documents");
    }
  }

  function handleSectionBack() {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(activeSectionIndex - 1);
    } else if (filingMode === "COMPANY") {
      setWizardStep("setup");
    } else {
      setWizardStep("profile");
    }
  }

  function renderField(field: TaxField) {
    if (field.type === "select" && field.options) {
      return (
        <div key={field.key} className="field">
          <label htmlFor={field.key}>
            {t[field.labelKey]}{field.required ? " *" : ""}
          </label>
          <select
            id={field.key}
            aria-invalid={!!errors[field.key]}
            aria-describedby={errors[field.key] ? `${field.key}-error` : `${field.key}-help`}
            style={errors[field.key] ? { borderColor: "var(--error, #ef4444)" } : undefined}
            {...register(field.key, {
              ...(field.required ? { required: t.validationRequired } : {})
            })}
          >
            <option value="">{t.wizardSelectOption}</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{t[opt.labelKey] ?? opt.value}</option>
            ))}
          </select>
          {errors[field.key] ? (
            <small id={`${field.key}-error`} style={{ color: "var(--error, #ef4444)" }} role="alert">
              {errors[field.key]?.message as string}
            </small>
          ) : (
            <small id={`${field.key}-help`}>{t[field.helpKey]}</small>
          )}
        </div>
      );
    }

    const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";

    return (
      <div key={field.key} className="field">
        <label htmlFor={field.key}>
          {t[field.labelKey]}{field.required ? " *" : ""}
        </label>
        <input
          id={field.key}
          type={inputType}
          aria-invalid={!!errors[field.key]}
          aria-describedby={errors[field.key] ? `${field.key}-error` : `${field.key}-help`}
          style={errors[field.key] ? { borderColor: "var(--error, #ef4444)" } : undefined}
          {...register(field.key, {
            ...(field.required ? { required: t.validationRequired } : {}),
            ...(field.type === "number" ? {
              validate: (v: string) => {
                if (!v || v.trim() === "") return true;
                return Number.isFinite(Number(v)) || t.validationNumber;
              }
            } : {}),
            ...(field.key === "sinLast4" ? {
              pattern: { value: /^\d{4}$/, message: t.validationSinLast4 }
            } : {})
          })}
        />
        {errors[field.key] ? (
          <small id={`${field.key}-error`} style={{ color: "var(--error, #ef4444)" }} role="alert">
            {errors[field.key]?.message as string}
          </small>
        ) : (
          <small id={`${field.key}-help`}>{t[field.helpKey]}</small>
        )}
      </div>
    );
  }

  function renderStepper() {
    const allSteps = [
      { id: "setup", label: t.filingTitle, icon: "⚙️" },
      ...(filingMode !== "COMPANY" ? [{ id: "profile", label: t.profileTitle, icon: "🎯" }] : []),
      ...activeSections.map((s) => ({ id: s.id, label: t[s.titleKey] ?? s.id, icon: s.icon })),
      { id: "documents", label: t.wizardDocuments, icon: "📎" },
      { id: "review", label: t.wizardReview, icon: "✅" }
    ];

    return (
      <div className="wizard-stepper">
        {allSteps.map((step) => {
          const matchingSection = activeSections.find((s) => s.id === step.id);
          const isCompleted =
            (step.id === "setup" && wizardStep !== "setup") ||
            (step.id === "profile" && wizardStep !== "setup" && wizardStep !== "profile") ||
            (matchingSection ? isSectionComplete(matchingSection, watchedValues) && completedSections.has(step.id) : completedSections.has(step.id));
          const isActive =
            (step.id === "setup" && wizardStep === "setup") ||
            (step.id === "profile" && wizardStep === "profile") ||
            (step.id === "documents" && wizardStep === "documents") ||
            (step.id === "review" && wizardStep === "review") ||
            (wizardStep === "section" && currentSection?.id === step.id);

          return (
            <button
              key={step.id}
              type="button"
              className={`wizard-step ${isActive ? "wizard-step-active" : ""} ${isCompleted ? "wizard-step-done" : ""}`}
              onClick={() => {
                if (step.id === "setup") setWizardStep("setup");
                else if (step.id === "profile") setWizardStep("profile");
                else if (step.id === "documents") setWizardStep("documents");
                else if (step.id === "review") setWizardStep("review");
                else {
                  const sIdx = activeSections.findIndex((s) => s.id === step.id);
                  if (sIdx >= 0) { setWizardStep("section"); setActiveSectionIndex(sIdx); }
                }
              }}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="wizard-step-icon">
                {isCompleted ? "✓" : step.icon}
              </span>
              <span className="wizard-step-label">{step.label}</span>
            </button>
          );
        })}
      </div>
    );
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
    <div style={{ display: "grid", gap: "1rem" }}>
      {renderStepper()}

      {/* Step: Setup */}
      {wizardStep === "setup" && (
        <div className="surface" style={{ padding: "1.4rem", display: "grid", gap: "1.2rem" }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "0.35rem", fontFamily: "var(--font-title)" }}>{t.filingTitle}</h2>
            <p className="muted" style={{ margin: 0 }}>{t.filingSubtitle}</p>
          </div>
          <div className="grid-cards">
            <div className="field">
              <label htmlFor="taxYear">{t.filingTaxYear}</label>
              <select id="taxYear" value={taxYear} onChange={(e) => setTaxYear(e.target.value)}>
                {TAX_YEARS.map((y) => (
                  <option key={y.value} value={y.value}>{t[y.labelKey]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="filingMode">{t.filingMode}</label>
              <select id="filingMode" value={filingMode} onChange={(e) => handleModeChange(parseFilingMode(e.target.value))}>
                {filingModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>{t[mode.labelKey]}</option>
                ))}
              </select>
            </div>
          </div>

          {carryForwardYear ? (
            <div className="notice-success">{t.filingCarryForward}: {carryForwardYear}</div>
          ) : null}

          {carryForwardDiff.length > 0 ? (
            <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              {carryForwardDiff.filter((d) => d.source === "carried").length > 0 && (
                <div>
                  <strong style={{ color: "var(--brand)" }}>{t.filingCarryForwardCarried}</strong>
                  <ul style={{ margin: "0.2rem 0 0.5rem 1.2rem", padding: 0 }}>
                    {carryForwardDiff.filter((d) => d.source === "carried").map((d) => (
                      <li key={d.key}>{t[`field${d.key.charAt(0).toUpperCase()}${d.key.slice(1)}`] ?? d.key}: {String(d.currentValue ?? "")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          <button className="btn btn-primary" type="button" onClick={handleSetupContinue} style={{ justifySelf: "start" }}>
            {t.wizardStepContinue}
          </button>
        </div>
      )}

      {/* Step: Profile (Individual/Self-Employed only) */}
      {wizardStep === "profile" && (
        <div className="surface" style={{ padding: "1.4rem", display: "grid", gap: "1rem" }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "0.35rem", fontFamily: "var(--font-title)" }}>{t.profileTitle}</h2>
            <p className="muted" style={{ margin: 0 }}>{t.profileSubtitle}</p>
          </div>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {PROFILE_FLAGS.map((flag) => (
              <label
                key={flag.key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.7rem",
                  padding: "0.8rem 1rem",
                  background: profileFlags[flag.key] ? "rgba(31, 107, 87, 0.06)" : "transparent",
                  border: `1px solid ${profileFlags[flag.key] ? "var(--brand)" : "var(--line)"}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s"
                }}
              >
                <input
                  type="checkbox"
                  checked={!!profileFlags[flag.key]}
                  onChange={(e) => setProfileFlags((prev) => ({ ...prev, [flag.key]: e.target.checked }))}
                  style={{ marginTop: "0.15rem", width: "18px", height: "18px", accentColor: "var(--brand)" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{t[flag.labelKey]}</div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>{t[flag.helpKey]}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.7rem" }}>
            <button className="btn btn-secondary" type="button" onClick={() => setWizardStep("setup")}>
              {t.wizardStepBack}
            </button>
            <button className="btn btn-primary" type="button" onClick={handleProfileContinue}>
              {t.wizardStepContinue}
            </button>
          </div>
        </div>
      )}

      {/* Step: Section fields */}
      {wizardStep === "section" && currentSection && (
        <div className="surface" style={{ padding: "1.4rem", display: "grid", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{currentSection.icon}</span>
              <h2 style={{ margin: 0, fontFamily: "var(--font-title)" }}>{t[currentSection.titleKey]}</h2>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t[currentSection.descriptionKey]}</p>
            <div className="muted" style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
              {t.wizardStepOf}: {activeSectionIndex + 1} / {activeSections.length}
            </div>
          </div>

          <div className="grid-cards">
            {currentSection.fields.map((field) => renderField(field))}
          </div>

          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" type="button" onClick={handleSectionBack}>
              {t.wizardStepBack}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => void handleSectionContinue()}
              disabled={isSaving}
            >
              {isSaving ? t.filingSaving : t.wizardStepContinue}
            </button>
          </div>

          {infoMessage ? <p className="notice-success" style={{ margin: 0 }}>{infoMessage}</p> : null}
          {errorMessage ? <p className="notice-error" style={{ margin: 0 }}>{errorMessage}</p> : null}
        </div>
      )}

      {/* Step: Documents */}
      {wizardStep === "documents" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <DocumentPanel locale={locale} returnId={returnId} />
          <TaxSlipImportStub locale={locale} />
          <NoaImportStub locale={locale} />
          <div style={{ display: "flex", gap: "0.7rem" }}>
            <button className="btn btn-secondary" type="button" onClick={() => { setWizardStep("section"); setActiveSectionIndex(activeSections.length - 1); }}>
              {t.wizardStepBack}
            </button>
            <button className="btn btn-primary" type="button" onClick={() => setWizardStep("review")}>
              {t.wizardStepContinue}
            </button>
          </div>
        </div>
      )}

      {/* Step: Review & Submit */}
      {wizardStep === "review" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* Completed sections overview */}
          <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.6rem" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-title)" }}>{t.wizardReview}</h2>
            <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t.wizardReviewDesc}</p>
            <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.4rem" }}>
              {activeSections.map((section) => {
                const fieldsFilled = isSectionComplete(section, watchedValues);
                const wasSaved = completedSections.has(section.id);
                const complete = wasSaved && fieldsFilled;
                const missing = countMissingRequired(section, watchedValues);
                return (
                  <div
                    key={section.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 0.9rem",
                      borderRadius: "10px",
                      border: `1px solid ${complete ? "rgba(31, 107, 87, 0.25)" : missing > 0 ? "rgba(239, 68, 68, 0.3)" : "var(--line)"}`,
                      background: complete ? "rgba(31, 107, 87, 0.04)" : missing > 0 ? "rgba(239, 68, 68, 0.03)" : "transparent",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      const sIdx = activeSections.findIndex((s) => s.id === section.id);
                      if (sIdx >= 0) { setWizardStep("section"); setActiveSectionIndex(sIdx); }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        const sIdx = activeSections.findIndex((s) => s.id === section.id);
                        if (sIdx >= 0) { setWizardStep("section"); setActiveSectionIndex(sIdx); }
                      }
                    }}
                  >
                    <span style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 700,
                      background: complete ? "var(--brand)" : missing > 0 ? "var(--error, #ef4444)" : "var(--line)",
                      color: complete ? "white" : missing > 0 ? "white" : "var(--ink-soft)"
                    }}>
                      {complete ? "✓" : missing > 0 ? "!" : section.icon}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "0.92rem", flex: 1 }}>{t[section.titleKey]}</span>
                    {complete ? (
                      <span className="pill" style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", color: "var(--brand)" }}>
                        {t.wizardStepComplete}
                      </span>
                    ) : missing > 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--error, #ef4444)", fontWeight: 600 }}>
                        {missing} {t.wizardMissingFields}
                      </span>
                    ) : !wasSaved ? (
                      <span className="muted" style={{ fontSize: "0.75rem" }}>
                        {t.wizardNotSaved}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tax Summary */}
          {taxSummary ? (
            <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.taxSummaryTitle}</h3>
              {taxSummary.mode === "COMPANY"
                ? renderCorporateSummary(taxSummary.summary as CorporateTaxSummary)
                : renderIndividualSummary(taxSummary.summary as TaxSummary)}
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{t.taxSummaryNotice}</p>
            </div>
          ) : null}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" type="button" onClick={() => setWizardStep("documents")}>
              {t.wizardStepBack}
            </button>
            <button className="btn btn-secondary" onClick={() => void saveDraft()} disabled={isSaving || isPreparing} type="button">
              {isSaving ? t.filingSaving : t.filingSaveDraft}
            </button>
            <button className="btn btn-primary" onClick={() => void prepareSubmission()} disabled={isPreparing || isSaving} type="button">
              {isPreparing ? t.filingSaving : t.filingPrepare}
            </button>
            {returnId && (
              <a href={`/api/returns/${returnId}/pdf`} className="btn btn-secondary" download style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                {t.pdfDownload}
              </a>
            )}
          </div>

          {infoMessage ? <p className="notice-success">{infoMessage}</p> : null}
          {errorMessage ? <p className="notice-error">{errorMessage}</p> : null}
        </div>
      )}
    </div>
  );
}
