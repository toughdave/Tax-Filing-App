import type { FilingMode } from "@/lib/tax-field-config";

// ---------------------------------------------------------------------------
// CRA form-line mapping — maps internal field keys to official CRA form lines.
// Each tax year can have its own mapping since line numbers change.
// ---------------------------------------------------------------------------

export interface FormLineMapping {
  fieldKey: string;
  formId: string;
  lineNumber: string;
  description: string;
}

export interface TaxYearFormConfig {
  taxYear: number;
  forms: Record<string, { name: string; description: string }>;
  mappings: Record<FilingMode, FormLineMapping[]>;
}

// ---------------------------------------------------------------------------
// 2024 CRA form-line mappings
// ---------------------------------------------------------------------------

const formConfig2024: TaxYearFormConfig = {
  taxYear: 2024,
  forms: {
    T1: { name: "T1 General", description: "Income Tax and Benefit Return" },
    T2125: { name: "T2125", description: "Statement of Business or Professional Activities" },
    T2: { name: "T2", description: "Corporation Income Tax Return" },
    S1: { name: "Schedule 1", description: "Federal Tax" },
    S8: { name: "Schedule 8", description: "CPP Contributions and Overpayment" }
  },
  mappings: {
    INDIVIDUAL: [
      { fieldKey: "legalName", formId: "T1", lineNumber: "—", description: "Name (identification section)" },
      { fieldKey: "sinLast4", formId: "T1", lineNumber: "—", description: "Social insurance number (last 4)" },
      { fieldKey: "birthDate", formId: "T1", lineNumber: "—", description: "Date of birth" },
      { fieldKey: "residencyProvince", formId: "T1", lineNumber: "—", description: "Province of residence on Dec 31" },
      { fieldKey: "maritalStatus", formId: "T1", lineNumber: "—", description: "Marital status" },
      { fieldKey: "employmentIncome", formId: "T1", lineNumber: "10100", description: "Employment income (line 10100)" },
      { fieldKey: "otherIncome", formId: "T1", lineNumber: "13000", description: "Other income (line 13000)" },
      { fieldKey: "rrsp", formId: "T1", lineNumber: "20800", description: "RRSP/PRPP deduction (line 20800)" },
      { fieldKey: "tuition", formId: "S11", lineNumber: "32300", description: "Tuition amounts (line 32300)" },
      { fieldKey: "medical", formId: "T1", lineNumber: "33099", description: "Medical expenses (line 33099)" }
    ],
    SELF_EMPLOYED: [
      { fieldKey: "legalName", formId: "T1", lineNumber: "—", description: "Name (identification section)" },
      { fieldKey: "sinLast4", formId: "T1", lineNumber: "—", description: "Social insurance number (last 4)" },
      { fieldKey: "birthDate", formId: "T1", lineNumber: "—", description: "Date of birth" },
      { fieldKey: "residencyProvince", formId: "T1", lineNumber: "—", description: "Province of residence on Dec 31" },
      { fieldKey: "employmentIncome", formId: "T1", lineNumber: "10100", description: "Employment income (line 10100)" },
      { fieldKey: "otherIncome", formId: "T1", lineNumber: "13000", description: "Other income (line 13000)" },
      { fieldKey: "businessIncome", formId: "T2125", lineNumber: "8299", description: "Gross business income (line 8299)" },
      { fieldKey: "businessExpenses", formId: "T2125", lineNumber: "9369", description: "Total business expenses (line 9369)" },
      { fieldKey: "gstHst", formId: "T2125", lineNumber: "8299-GST", description: "GST/HST collected or collectible" },
      { fieldKey: "businessUseHome", formId: "T2125", lineNumber: "9945", description: "Business-use-of-home expenses (line 9945)" },
      { fieldKey: "rrsp", formId: "T1", lineNumber: "20800", description: "RRSP/PRPP deduction (line 20800)" },
      { fieldKey: "tuition", formId: "S11", lineNumber: "32300", description: "Tuition amounts (line 32300)" },
      { fieldKey: "medical", formId: "T1", lineNumber: "33099", description: "Medical expenses (line 33099)" }
    ],
    COMPANY: [
      { fieldKey: "corporationName", formId: "T2", lineNumber: "001", description: "Corporation name" },
      { fieldKey: "businessNumber", formId: "T2", lineNumber: "002", description: "Business number (BN)" },
      { fieldKey: "corporateRevenue", formId: "T2", lineNumber: "299", description: "Total revenue (line 299)" },
      { fieldKey: "corporatePayroll", formId: "T2", lineNumber: "240", description: "Salaries and wages (line 240)" },
      { fieldKey: "corporateDeductions", formId: "T2", lineNumber: "312", description: "Total deductions (line 312)" }
    ]
  }
};

// ---------------------------------------------------------------------------
// 2025 CRA form-line mappings (example of year-over-year changes)
// ---------------------------------------------------------------------------

const formConfig2025: TaxYearFormConfig = {
  taxYear: 2025,
  forms: {
    T1: { name: "T1 General", description: "Income Tax and Benefit Return" },
    T2125: { name: "T2125", description: "Statement of Business or Professional Activities" },
    T2: { name: "T2", description: "Corporation Income Tax Return" },
    S1: { name: "Schedule 1", description: "Federal Tax" },
    S8: { name: "Schedule 8", description: "CPP Contributions and Overpayment" }
  },
  mappings: {
    INDIVIDUAL: [
      { fieldKey: "legalName", formId: "T1", lineNumber: "—", description: "Name (identification section)" },
      { fieldKey: "sinLast4", formId: "T1", lineNumber: "—", description: "Social insurance number (last 4)" },
      { fieldKey: "birthDate", formId: "T1", lineNumber: "—", description: "Date of birth" },
      { fieldKey: "residencyProvince", formId: "T1", lineNumber: "—", description: "Province of residence on Dec 31" },
      { fieldKey: "maritalStatus", formId: "T1", lineNumber: "—", description: "Marital status" },
      { fieldKey: "employmentIncome", formId: "T1", lineNumber: "10100", description: "Employment income (line 10100)" },
      { fieldKey: "otherIncome", formId: "T1", lineNumber: "13000", description: "Other income (line 13000)" },
      { fieldKey: "rrsp", formId: "T1", lineNumber: "20800", description: "RRSP/PRPP deduction (line 20800)" },
      { fieldKey: "tuition", formId: "S11", lineNumber: "32300", description: "Tuition amounts (line 32300)" },
      { fieldKey: "medical", formId: "T1", lineNumber: "33099", description: "Medical expenses (line 33099)" }
    ],
    SELF_EMPLOYED: formConfig2024.mappings.SELF_EMPLOYED,
    COMPANY: formConfig2024.mappings.COMPANY
  }
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const formConfigsByYear: Record<number, TaxYearFormConfig> = {
  2024: formConfig2024,
  2025: formConfig2025
};

export function getFormConfig(taxYear: number): TaxYearFormConfig | null {
  return formConfigsByYear[taxYear] ?? null;
}

export function getFormMappings(taxYear: number, mode: FilingMode): FormLineMapping[] {
  const config = getFormConfig(taxYear);
  if (!config) return [];
  return config.mappings[mode] ?? [];
}

export function getSupportedTaxYears(): number[] {
  return Object.keys(formConfigsByYear).map(Number).sort((a, b) => b - a);
}

export function getFormLineForField(taxYear: number, mode: FilingMode, fieldKey: string): FormLineMapping | null {
  const mappings = getFormMappings(taxYear, mode);
  return mappings.find((m) => m.fieldKey === fieldKey) ?? null;
}
