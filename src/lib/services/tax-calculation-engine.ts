import type { FilingMode } from "@/lib/tax-field-config";

// ---------------------------------------------------------------------------
// 2024 Canadian federal tax brackets (individual / self-employed)
// Source: CRA — these are simplified for the MVP engine.
// ---------------------------------------------------------------------------
const FEDERAL_BRACKETS_2024 = [
  { upTo: 55867, rate: 0.15 },
  { upTo: 111733, rate: 0.205 },
  { upTo: 154906, rate: 0.26 },
  { upTo: 220000, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 }
];

const BASIC_PERSONAL_AMOUNT_2024 = 15705;

// Small business deduction rate for eligible Canadian-Controlled Private Corps
const SMALL_BUSINESS_RATE = 0.09;
const GENERAL_CORPORATE_RATE = 0.15;
const SMALL_BUSINESS_LIMIT = 500000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Individual / Self-Employed calculation
// ---------------------------------------------------------------------------

function calculateFederalTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let remaining = taxableIncome;
  let tax = 0;
  let prevLimit = 0;

  for (const bracket of FEDERAL_BRACKETS_2024) {
    const bracketWidth = bracket.upTo - prevLimit;
    const amountInBracket = Math.min(remaining, bracketWidth);
    tax += amountInBracket * bracket.rate;
    remaining -= amountInBracket;
    prevLimit = bracket.upTo;
    if (remaining <= 0) break;
  }

  return Math.round(tax * 100) / 100;
}

export interface TaxSummary {
  totalIncome: number;
  totalDeductions: number;
  netIncome: number;
  taxableIncome: number;
  federalTax: number;
  basicPersonalCredit: number;
  netFederalTax: number;
  breakdown: {
    incomeItems: Record<string, number>;
    deductionItems: Record<string, number>;
  };
}

export function calculateIndividualTax(payload: Record<string, unknown>): TaxSummary {
  const incomeItems: Record<string, number> = {
    employmentIncome: num(payload.employmentIncome),
    otherIncome: num(payload.otherIncome)
  };

  const deductionItems: Record<string, number> = {
    rrsp: num(payload.rrsp),
    tuition: num(payload.tuition),
    medical: num(payload.medical)
  };

  const totalIncome = Object.values(incomeItems).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductionItems).reduce((a, b) => a + b, 0);
  const netIncome = Math.max(totalIncome - totalDeductions, 0);
  const taxableIncome = netIncome;

  const federalTax = calculateFederalTax(taxableIncome);
  const basicPersonalCredit = Math.round(BASIC_PERSONAL_AMOUNT_2024 * 0.15 * 100) / 100;
  const netFederalTax = Math.max(Math.round((federalTax - basicPersonalCredit) * 100) / 100, 0);

  return {
    totalIncome,
    totalDeductions,
    netIncome,
    taxableIncome,
    federalTax,
    basicPersonalCredit,
    netFederalTax,
    breakdown: { incomeItems, deductionItems }
  };
}

export function calculateSelfEmployedTax(payload: Record<string, unknown>): TaxSummary {
  const incomeItems: Record<string, number> = {
    employmentIncome: num(payload.employmentIncome),
    otherIncome: num(payload.otherIncome),
    businessIncome: num(payload.businessIncome)
  };

  const deductionItems: Record<string, number> = {
    rrsp: num(payload.rrsp),
    tuition: num(payload.tuition),
    medical: num(payload.medical),
    businessExpenses: num(payload.businessExpenses),
    businessUseHome: num(payload.businessUseHome)
  };

  const totalIncome = Object.values(incomeItems).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductionItems).reduce((a, b) => a + b, 0);
  const netIncome = Math.max(totalIncome - totalDeductions, 0);
  const taxableIncome = netIncome;

  const federalTax = calculateFederalTax(taxableIncome);
  const basicPersonalCredit = Math.round(BASIC_PERSONAL_AMOUNT_2024 * 0.15 * 100) / 100;
  const netFederalTax = Math.max(Math.round((federalTax - basicPersonalCredit) * 100) / 100, 0);

  return {
    totalIncome,
    totalDeductions,
    netIncome,
    taxableIncome,
    federalTax,
    basicPersonalCredit,
    netFederalTax,
    breakdown: { incomeItems, deductionItems }
  };
}

// ---------------------------------------------------------------------------
// Company calculation (simplified corporate tax)
// ---------------------------------------------------------------------------

export interface CorporateTaxSummary {
  corporateRevenue: number;
  totalDeductions: number;
  taxableIncome: number;
  smallBusinessTax: number;
  generalTax: number;
  totalCorporateTax: number;
  breakdown: {
    deductionItems: Record<string, number>;
  };
}

export function calculateCompanyTax(payload: Record<string, unknown>): CorporateTaxSummary {
  const corporateRevenue = num(payload.corporateRevenue);

  const deductionItems: Record<string, number> = {
    corporatePayroll: num(payload.corporatePayroll),
    corporateDeductions: num(payload.corporateDeductions)
  };

  const totalDeductions = Object.values(deductionItems).reduce((a, b) => a + b, 0);
  const taxableIncome = Math.max(corporateRevenue - totalDeductions, 0);

  const smallBusinessPortion = Math.min(taxableIncome, SMALL_BUSINESS_LIMIT);
  const generalPortion = Math.max(taxableIncome - SMALL_BUSINESS_LIMIT, 0);

  const smallBusinessTax = Math.round(smallBusinessPortion * SMALL_BUSINESS_RATE * 100) / 100;
  const generalTax = Math.round(generalPortion * GENERAL_CORPORATE_RATE * 100) / 100;
  const totalCorporateTax = Math.round((smallBusinessTax + generalTax) * 100) / 100;

  return {
    corporateRevenue,
    totalDeductions,
    taxableIncome,
    smallBusinessTax,
    generalTax,
    totalCorporateTax,
    breakdown: { deductionItems }
  };
}

// ---------------------------------------------------------------------------
// Unified entry point
// ---------------------------------------------------------------------------

export type CalculationResult =
  | { mode: "INDIVIDUAL" | "SELF_EMPLOYED"; summary: TaxSummary }
  | { mode: "COMPANY"; summary: CorporateTaxSummary };

export function calculateTax(mode: FilingMode, payload: Record<string, unknown>): CalculationResult {
  switch (mode) {
    case "INDIVIDUAL":
      return { mode, summary: calculateIndividualTax(payload) };
    case "SELF_EMPLOYED":
      return { mode, summary: calculateSelfEmployedTax(payload) };
    case "COMPANY":
      return { mode, summary: calculateCompanyTax(payload) };
  }
}
