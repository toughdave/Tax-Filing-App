"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  filingModes, parseFilingMode, getWizardSections,
  PROFILE_FLAGS, TAX_YEARS,
  individualWizardSections, companyWizardSections,
  type FilingMode, type TaxField, type WizardSection
} from "@/lib/tax-field-config";
import { textFor, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import type { TaxSummary, CorporateTaxSummary, CalculationResult } from "@/lib/services/tax-calculation-engine";
import type { CarryForwardDiffEntry } from "@/lib/carry-forward-config";
import { DocumentPanel } from "@/components/document-panel";
import { TaxSlipImportStub, NoaImportStub } from "@/components/import-stubs";
import { LucideIcon } from "@/components/lucide-icon";

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

type WizardStep = "setup" | "profile" | "documents" | "section" | "review";

function formDefaultsFromPayload(payload: Record<string, unknown> | undefined): Record<string, string> {
  if (!payload) return {};
  const defaults: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") { defaults[key] = value; continue; }
    if (typeof value === "number" || typeof value === "boolean") { defaults[key] = String(value); }
  }
  return defaults;
}

function allSectionFields(section: WizardSection): TaxField[] {
  const fields = [...section.fields];
  if (section.subsections) {
    for (const sub of section.subsections) {
      fields.push(...sub.fields);
    }
  }
  return fields;
}

function isSectionComplete(section: WizardSection, values: Record<string, string>): boolean {
  const required = allSectionFields(section).filter((f) => f.required);
  if (required.length === 0) return true;
  return required.every((f) => {
    const v = values[f.key];
    return v !== undefined && v.trim() !== "";
  });
}

function countMissingRequired(section: WizardSection, values: Record<string, string>): number {
  return allSectionFields(section).filter((f) => f.required).filter((f) => {
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
  const [yesNoState, setYesNoState] = useState<Record<string, boolean>>(() => {
    if (!initialPayload) return {};
    const state: Record<string, boolean> = {};
    for (const section of [...individualWizardSections, ...companyWizardSections]) {
      for (const field of section.fields) {
        if (field.promptType === "yesno" && initialPayload[field.key]) {
          const v = initialPayload[field.key];
          if (v !== null && v !== undefined && v !== "" && v !== "0" && v !== 0) {
            state[field.key] = true;
          }
        }
      }
    }
    return state;
  });

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
      for (const field of allSectionFields(section)) {
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
      setWizardStep("documents");
    } else {
      setWizardStep("profile");
    }
  }

  function handleProfileContinue() {
    setWizardStep("documents");
  }

  function handleDocumentsContinue() {
    setWizardStep("section");
    setActiveSectionIndex(0);
  }

  function handleDocumentsBack() {
    if (filingMode === "COMPANY") {
      setWizardStep("setup");
    } else {
      setWizardStep("profile");
    }
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
    advanceSection();
  }

  function handleSectionNext() {
    setInfoMessage(null);
    setErrorMessage(null);
    advanceSection();
  }

  function advanceSection() {
    if (activeSectionIndex < activeSections.length - 1) {
      setActiveSectionIndex(activeSectionIndex + 1);
    } else {
      setWizardStep("review");
    }
  }

  function handleSectionBack() {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(activeSectionIndex - 1);
    } else {
      setWizardStep("documents");
    }
  }

  function renderField(field: TaxField) {
    const friendlyLabel = field.friendlyLabelKey ? t[field.friendlyLabelKey] : null;
    const officialLabel = t[field.labelKey];
    const displayLabel = friendlyLabel || officialLabel;
    const craRef = field.craLine ? `Line ${field.craLine}` : null;

    if (field.promptType === "yesno") {
      const isYes = yesNoState[field.key] ?? false;
      return (
        <div key={field.key} style={{ display: "grid", gap: "0.6rem" }}>
          <div style={{
            padding: "0.9rem 1rem",
            borderRadius: "12px",
            border: `1px solid ${isYes ? "var(--brand)" : "var(--line)"}`,
            background: isYes ? "rgba(31, 107, 87, 0.04)" : "transparent",
            transition: "border-color 0.15s, background 0.15s"
          }}>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              {displayLabel}
            </div>
            {friendlyLabel && (
              <small className="muted" style={{ display: "block", marginBottom: "0.5rem" }}>
                {officialLabel}{craRef ? ` · ${craRef}` : ""}
              </small>
            )}
            {!friendlyLabel && craRef && (
              <small className="muted" style={{ display: "block", marginBottom: "0.5rem" }}>{craRef}</small>
            )}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <label style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 1rem", borderRadius: "8px", cursor: "pointer",
                border: `1.5px solid ${isYes ? "var(--brand)" : "var(--line)"}`,
                background: isYes ? "rgba(31, 107, 87, 0.08)" : "transparent",
                fontWeight: isYes ? 700 : 500, fontSize: "0.9rem",
                transition: "all 0.15s"
              }}>
                <input
                  type="radio"
                  name={`${field.key}_yesno`}
                  checked={isYes}
                  onChange={() => setYesNoState((prev) => ({ ...prev, [field.key]: true }))}
                  style={{ accentColor: "var(--brand)" }}
                />
                {t.yesnoYes}
              </label>
              <label style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 1rem", borderRadius: "8px", cursor: "pointer",
                border: `1.5px solid ${!isYes ? "var(--line)" : "var(--line)"}`,
                background: !isYes ? "rgba(0,0,0,0.02)" : "transparent",
                fontWeight: !isYes ? 700 : 500, fontSize: "0.9rem",
                transition: "all 0.15s"
              }}>
                <input
                  type="radio"
                  name={`${field.key}_yesno`}
                  checked={!isYes}
                  onChange={() => {
                    setYesNoState((prev) => ({ ...prev, [field.key]: false }));
                  }}
                  style={{ accentColor: "var(--brand)" }}
                />
                {t.yesnoNo}
              </label>
            </div>
          </div>
          {isYes && (
            <div className="field" style={{ paddingLeft: "1rem", borderLeft: "2px solid var(--brand)" }}>
              <label htmlFor={field.key} style={{ fontSize: "0.88rem" }}>
                {t.yesnoEnterAmount}{field.required ? " *" : ""}
              </label>
              <input
                id={field.key}
                type="number"
                aria-invalid={!!errors[field.key]}
                aria-describedby={errors[field.key] ? `${field.key}-error` : `${field.key}-help`}
                style={errors[field.key] ? { borderColor: "var(--error, #ef4444)" } : undefined}
                {...register(field.key, {
                  ...(field.required ? { required: t.validationRequired } : {}),
                  validate: (v: string) => {
                    if (!v || v.trim() === "") return true;
                    return Number.isFinite(Number(v)) || t.validationNumber;
                  }
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
          )}
        </div>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <div key={field.key} className="field">
          <label htmlFor={field.key}>
            {displayLabel}{field.required ? " *" : ""}
          </label>
          {friendlyLabel && <small className="muted" style={{ marginTop: "-0.3rem", display: "block" }}>{officialLabel}{craRef ? ` · ${craRef}` : ""}</small>}
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
          {displayLabel}{field.required ? " *" : ""}
        </label>
        {friendlyLabel && <small className="muted" style={{ marginTop: "-0.3rem", display: "block" }}>{officialLabel}{craRef ? ` · ${craRef}` : ""}</small>}
        {!friendlyLabel && craRef && <small className="muted" style={{ marginTop: "-0.3rem", display: "block" }}>{craRef}</small>}
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

  function renderStepContent(stepId: string): React.ReactNode {
    if (stepId === "setup") {
      return (
        <div style={{ display: "grid", gap: "1.2rem" }}>
          <p className="timeline-desc">{t.filingSubtitle}</p>
          <div style={{ display: "grid", gap: "1rem" }}>
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
          {carryForwardDiff.length > 0 && carryForwardDiff.filter((d) => d.source === "carried").length > 0 && (
            <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              <strong style={{ color: "var(--brand)" }}>{t.filingCarryForwardCarried}</strong>
              <ul style={{ margin: "0.2rem 0 0.5rem 1.2rem", padding: 0 }}>
                {carryForwardDiff.filter((d) => d.source === "carried").map((d) => (
                  <li key={d.key}>{t[`field${d.key.charAt(0).toUpperCase()}${d.key.slice(1)}`] ?? d.key}: {String(d.currentValue ?? "")}</li>
                ))}
              </ul>
            </div>
          )}
          <button className="btn btn-primary" type="button" onClick={handleSetupContinue} style={{ justifySelf: "start" }}>
            {t.wizardStepContinue}
          </button>
        </div>
      );
    }

    if (stepId === "profile") {
      return (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p className="timeline-desc">{t.profileSubtitle}</p>
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
      );
    }

    if (stepId === "documents") {
      return (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p className="timeline-desc">{t.wizardDocumentsDesc}</p>
          <TaxSlipImportStub locale={locale} />
          <NoaImportStub locale={locale} />
          <DocumentPanel locale={locale} returnId={returnId} />
          <div style={{ display: "flex", gap: "0.7rem" }}>
            <button className="btn btn-secondary" type="button" onClick={handleDocumentsBack}>
              {t.wizardStepBack}
            </button>
            <button className="btn btn-primary" type="button" onClick={handleDocumentsContinue}>
              {t.wizardStepContinue}
            </button>
          </div>
        </div>
      );
    }

    if (stepId === "review") {
      return (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p className="timeline-desc">{t.wizardReviewDesc}</p>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            {activeSections.map((section) => {
              const fieldsFilled = isSectionComplete(section, watchedValues);
              const wasSaved = completedSections.has(section.id);
              const complete = wasSaved && fieldsFilled;
              const missingCount = countMissingRequired(section, watchedValues);
              return (
                <div
                  key={section.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.65rem 0.9rem",
                    borderRadius: "10px",
                    border: `1px solid ${complete ? "rgba(31, 107, 87, 0.25)" : missingCount > 0 ? "rgba(239, 68, 68, 0.3)" : "var(--line)"}`,
                    background: complete ? "rgba(31, 107, 87, 0.04)" : missingCount > 0 ? "rgba(239, 68, 68, 0.03)" : "transparent",
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
                    background: complete ? "var(--brand)" : missingCount > 0 ? "var(--error, #ef4444)" : "var(--line)",
                    color: complete ? "white" : missingCount > 0 ? "white" : "var(--ink-soft)"
                  }}>
                    {complete ? "✓" : missingCount > 0 ? "!" : <LucideIcon name={section.icon} size={12} />}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "0.92rem", flex: 1 }}>{t[section.titleKey]}</span>
                  {complete ? (
                    <span className="pill" style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", color: "var(--brand)" }}>
                      {t.wizardStepComplete}
                    </span>
                  ) : missingCount > 0 ? (
                    <span style={{ fontSize: "0.75rem", color: "var(--error, #ef4444)", fontWeight: 600 }}>
                      {missingCount} {t.wizardMissingFields}
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
          {taxSummary ? (
            <div style={{ display: "grid", gap: "0.6rem", padding: "1rem", borderRadius: "10px", border: "1px solid var(--line)" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.taxSummaryTitle}</h3>
              {taxSummary.mode === "COMPANY"
                ? renderCorporateSummary(taxSummary.summary as CorporateTaxSummary)
                : renderIndividualSummary(taxSummary.summary as TaxSummary)}
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{t.taxSummaryNotice}</p>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" type="button" onClick={() => { setWizardStep("section"); setActiveSectionIndex(activeSections.length - 1); }}>
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
          {infoMessage ? <p className="notice-success" style={{ margin: 0 }}>{infoMessage}</p> : null}
          {errorMessage ? <p className="notice-error" style={{ margin: 0 }}>{errorMessage}</p> : null}
        </div>
      );
    }

    // Form section content
    const matchedSection = activeSections.find((s) => s.id === stepId);
    if (matchedSection) {
      const sectionIdx = activeSections.findIndex((s) => s.id === stepId);
      return (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p className="timeline-desc">{t[matchedSection.descriptionKey]}</p>
          {matchedSection.craFormRef && (
            <span className="pill" style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", justifySelf: "start" }}>
              {matchedSection.craFormRef}
            </span>
          )}
          <p className="timeline-step-counter">
            {t.wizardStepOf}: {sectionIdx + 1} / {activeSections.length}
          </p>
          <div style={{ display: "grid", gap: "1rem" }}>
            {matchedSection.fields.map((field) => renderField(field))}
          </div>
          {matchedSection.subsections && matchedSection.subsections.length > 0 && (
            <div style={{ display: "grid", gap: "1.2rem" }}>
              {matchedSection.subsections
                .filter((sub) => {
                  if (sub.mode && !sub.mode.includes(filingMode)) return false;
                  if (sub.profileFlag && !profileFlags[sub.profileFlag]) return false;
                  return true;
                })
                .map((sub) => (
                  <div key={sub.id} style={{
                    display: "grid", gap: "0.8rem",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    background: "rgba(255,255,255,0.03)"
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "0.98rem" }}>
                        {t[sub.titleKey]}
                      </h4>
                      {sub.descriptionKey && (
                        <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                          {t[sub.descriptionKey]}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {sub.fields.map((field) => renderField(field))}
                    </div>
                  </div>
                ))}
            </div>
          )}
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
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleSectionNext}
            >
              {t.wizardNext} →
            </button>
          </div>
          {infoMessage ? <p className="notice-success" style={{ margin: 0 }}>{infoMessage}</p> : null}
          {errorMessage ? <p className="notice-error" style={{ margin: 0 }}>{errorMessage}</p> : null}
        </div>
      );
    }

    return null;
  }

  function renderTimeline() {
    const allSteps = [
      { id: "setup", label: t.filingTitle, icon: "settings" },
      ...(filingMode !== "COMPANY" ? [{ id: "profile", label: t.profileTitle, icon: "target" }] : []),
      { id: "documents", label: t.wizardDocuments, icon: "paperclip" },
      ...activeSections.map((s) => ({ id: s.id, label: t[s.titleKey] ?? s.id, icon: s.icon })),
      { id: "review", label: t.wizardReview, icon: "check-square" }
    ];

    return (
      <div className="timeline surface" style={{ padding: "1rem 1rem 0.5rem" }}>
        {allSteps.map((step) => {
          const matchingSection = activeSections.find((s) => s.id === step.id);
          const isCompleted =
            (step.id === "setup" && wizardStep !== "setup") ||
            (step.id === "profile" && wizardStep !== "setup" && wizardStep !== "profile") ||
            (step.id === "documents" && (wizardStep === "section" || wizardStep === "review")) ||
            (matchingSection ? isSectionComplete(matchingSection, watchedValues) && completedSections.has(step.id) : completedSections.has(step.id));
          const isActive =
            (step.id === "setup" && wizardStep === "setup") ||
            (step.id === "profile" && wizardStep === "profile") ||
            (step.id === "documents" && wizardStep === "documents") ||
            (step.id === "review" && wizardStep === "review") ||
            (wizardStep === "section" && currentSection?.id === step.id);
          const missing = matchingSection ? countMissingRequired(matchingSection, watchedValues) : 0;

          return (
            <div
              key={step.id}
              className={`timeline-item ${isActive ? "timeline-item-active" : ""} ${isCompleted ? "timeline-item-done" : ""}`}
            >
              <div className="timeline-node">
                {isCompleted
                  ? <LucideIcon name="check" size={14} />
                  : <LucideIcon name={step.icon} size={14} />
                }
              </div>
              <button
                type="button"
                className="timeline-header"
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
                <span className="timeline-header-title">{step.label}</span>
                {isCompleted && (
                  <span className="timeline-header-status timeline-header-status-complete">
                    {t.wizardStepComplete}
                  </span>
                )}
                {!isCompleted && missing > 0 && (
                  <span className="timeline-header-status timeline-header-status-missing">
                    {missing} {t.wizardMissingFields}
                  </span>
                )}
                <LucideIcon
                  name="chevron-right"
                  size={16}
                  className={`timeline-header-chevron ${isActive ? "timeline-header-chevron-open" : ""}`}
                />
              </button>
              <div className={`timeline-body ${isActive ? "timeline-body-open" : ""}`}>
                {isActive && renderStepContent(step.id)}
              </div>
            </div>
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

  return renderTimeline();
}
