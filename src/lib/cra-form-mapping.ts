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

const individualMappings2024: FormLineMapping[] = [
  { fieldKey: "legalName", formId: "T1", lineNumber: "—", description: "Name (identification section)" },
  { fieldKey: "sinLast4", formId: "T1", lineNumber: "—", description: "Social insurance number (last 4)" },
  { fieldKey: "birthDate", formId: "T1", lineNumber: "—", description: "Date of birth" },
  { fieldKey: "residencyProvince", formId: "T1", lineNumber: "—", description: "Province of residence on Dec 31" },
  { fieldKey: "maritalStatus", formId: "T1", lineNumber: "—", description: "Marital status" },
  // Income
  { fieldKey: "employmentIncome", formId: "T1", lineNumber: "10100", description: "Employment income (line 10100)" },
  { fieldKey: "otherIncome", formId: "T1", lineNumber: "13000", description: "Other income (line 13000)" },
  { fieldKey: "interestIncome", formId: "T1", lineNumber: "12100", description: "Interest and investment income (line 12100)" },
  { fieldKey: "dividendIncome", formId: "T1", lineNumber: "12000", description: "Taxable dividends (line 12000)" },
  { fieldKey: "capitalGains", formId: "S3", lineNumber: "12700", description: "Net capital gains (line 12700)" },
  { fieldKey: "rentalIncome", formId: "T1", lineNumber: "12600", description: "Net rental income (line 12600)" },
  { fieldKey: "pensionIncome", formId: "T1", lineNumber: "11500", description: "Pension income (lines 11300–11600)" },
  { fieldKey: "eiBenefits", formId: "T1", lineNumber: "11900", description: "EI benefits (line 11900)" },
  // Deductions
  { fieldKey: "rrsp", formId: "T1", lineNumber: "20800", description: "RRSP/PRPP deduction (line 20800)" },
  { fieldKey: "fhsa", formId: "T1", lineNumber: "20805", description: "FHSA deduction (line 20805)" },
  { fieldKey: "unionDues", formId: "T1", lineNumber: "21200", description: "Union/professional dues (line 21200)" },
  { fieldKey: "childCareExpenses", formId: "T1", lineNumber: "21400", description: "Child care expenses (line 21400)" },
  { fieldKey: "movingExpenses", formId: "T1", lineNumber: "21900", description: "Moving expenses (line 21900)" },
  { fieldKey: "supportPaymentsMade", formId: "T1", lineNumber: "22000", description: "Support payments made (line 22000)" },
  { fieldKey: "carryingCharges", formId: "T1", lineNumber: "22100", description: "Carrying charges (line 22100)" },
  { fieldKey: "northernResidents", formId: "T1", lineNumber: "25500", description: "Northern residents deduction (line 25500)" },
  // Non-refundable credits
  { fieldKey: "tuition", formId: "S11", lineNumber: "32300", description: "Tuition amounts (line 32300)" },
  { fieldKey: "medical", formId: "T1", lineNumber: "33099", description: "Medical expenses (line 33099)" },
  { fieldKey: "donations", formId: "S9", lineNumber: "34900", description: "Donations and gifts (line 34900)" },
  { fieldKey: "ageAmount", formId: "S1", lineNumber: "30100", description: "Age amount (line 30100)" },
  { fieldKey: "spouseAmount", formId: "S1", lineNumber: "30300", description: "Spouse/common-law partner amount (line 30300)" },
  { fieldKey: "eligibleDependantAmount", formId: "S1", lineNumber: "30400", description: "Eligible dependant amount (line 30400)" },
  { fieldKey: "canadaCaregiverAmount", formId: "S1", lineNumber: "30450", description: "Canada caregiver amount (line 30450)" },
  { fieldKey: "disabilityAmount", formId: "T1", lineNumber: "31600", description: "Disability amount (line 31600)" },
  { fieldKey: "cppEiOverpayment", formId: "S8", lineNumber: "30800", description: "CPP/EI overpayment (Schedule 8)" },
  { fieldKey: "canadaEmploymentAmount", formId: "S1", lineNumber: "31260", description: "Canada employment amount (line 31260)" },
  { fieldKey: "homeBuyersAmount", formId: "S1", lineNumber: "31270", description: "Home buyers' amount (line 31270)" },
  { fieldKey: "pensionIncomeAmount", formId: "S1", lineNumber: "31400", description: "Pension income amount (line 31400)" },
  { fieldKey: "studentLoanInterest", formId: "S1", lineNumber: "31900", description: "Student loan interest (line 31900)" },
  // Refundable credits & payments
  { fieldKey: "canadaWorkersAmount", formId: "S6", lineNumber: "45300", description: "Canada workers benefit (line 45300)" },
  { fieldKey: "canadaTrainingCredit", formId: "S11", lineNumber: "45350", description: "Canada training credit (line 45350)" },
  { fieldKey: "refundableMedical", formId: "T1", lineNumber: "45200", description: "Refundable medical supplement (line 45200)" },
  { fieldKey: "taxPaidByInstalments", formId: "T1", lineNumber: "47600", description: "Tax paid by instalments (line 47600)" },
  { fieldKey: "totalIncomeTaxDeducted", formId: "T1", lineNumber: "43700", description: "Total income tax deducted (line 43700)" }
];

const formConfig2024: TaxYearFormConfig = {
  taxYear: 2024,
  forms: {
    T1: { name: "T1 General", description: "Income Tax and Benefit Return" },
    T2125: { name: "T2125", description: "Statement of Business or Professional Activities" },
    T2: { name: "T2", description: "Corporation Income Tax Return" },
    S1: { name: "Schedule 1", description: "Federal Tax" },
    S3: { name: "Schedule 3", description: "Capital Gains (or Losses)" },
    S6: { name: "Schedule 6", description: "Working Income Tax Benefit" },
    S8: { name: "Schedule 8", description: "CPP Contributions and Overpayment" },
    S9: { name: "Schedule 9", description: "Donations and Gifts" },
    S11: { name: "Schedule 11", description: "Tuition, Education, and Textbook Amounts" }
  },
  mappings: {
    INDIVIDUAL: individualMappings2024,
    SELF_EMPLOYED: [
      ...individualMappings2024,
      { fieldKey: "businessIncome", formId: "T2125", lineNumber: "8299", description: "Gross business income (line 8299)" },
      { fieldKey: "businessExpenses", formId: "T2125", lineNumber: "9369", description: "Total business expenses (line 9369)" },
      { fieldKey: "gstHst", formId: "T2125", lineNumber: "8299-GST", description: "GST/HST collected or collectible" },
      { fieldKey: "businessUseHome", formId: "T2125", lineNumber: "9945", description: "Business-use-of-home expenses (line 9945)" }
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
  forms: formConfig2024.forms,
  mappings: {
    INDIVIDUAL: formConfig2024.mappings.INDIVIDUAL,
    SELF_EMPLOYED: formConfig2024.mappings.SELF_EMPLOYED,
    COMPANY: formConfig2024.mappings.COMPANY
  }
};

const formConfig2026: TaxYearFormConfig = {
  taxYear: 2026,
  forms: formConfig2025.forms,
  mappings: {
    INDIVIDUAL: formConfig2025.mappings.INDIVIDUAL,
    SELF_EMPLOYED: formConfig2025.mappings.SELF_EMPLOYED,
    COMPANY: formConfig2025.mappings.COMPANY
  }
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const formConfigsByYear: Record<number, TaxYearFormConfig> = {
  2024: formConfig2024,
  2025: formConfig2025,
  2026: formConfig2026
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
