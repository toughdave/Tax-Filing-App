import type { FilingMode } from "@/lib/tax-field-config";
import { getTaxYearParams, type TaxYearParams, type TaxBracket } from "@/lib/tax-year-config";

// ---------------------------------------------------------------------------
// Fallback 2024 params used when no versioned config is available
// ---------------------------------------------------------------------------
const FALLBACK_BRACKETS: TaxBracket[] = [
  { upTo: 55867, rate: 0.15 },
  { upTo: 111733, rate: 0.205 },
  { upTo: 154906, rate: 0.26 },
  { upTo: 220000, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 }
];

const FALLBACK_PARAMS: TaxYearParams = {
  taxYear: 2024,
  federalBrackets: FALLBACK_BRACKETS,
  basicPersonalAmount: 15705,
  smallBusinessRate: 0.09,
  generalCorporateRate: 0.15,
  smallBusinessLimit: 500000,
  rrspLimit: 31560,
  tfsaLimit: 7000,
  cpp2MaxPensionableEarnings: 68500,
  eiMaxInsurableEarnings: 63200
};

function resolveParams(taxYear?: number): TaxYearParams {
  if (!taxYear) return FALLBACK_PARAMS;
  return getTaxYearParams(taxYear) ?? FALLBACK_PARAMS;
}

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

function calculateFederalTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;

  let remaining = taxableIncome;
  let tax = 0;
  let prevLimit = 0;

  for (const bracket of brackets) {
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

export function calculateIndividualTax(payload: Record<string, unknown>, taxYear?: number): TaxSummary {
  const params = resolveParams(taxYear);
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

  const federalTax = calculateFederalTax(taxableIncome, params.federalBrackets);
  const basicPersonalCredit = Math.round(params.basicPersonalAmount * 0.15 * 100) / 100;
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

export function calculateSelfEmployedTax(payload: Record<string, unknown>, taxYear?: number): TaxSummary {
  const params = resolveParams(taxYear);
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

  const federalTax = calculateFederalTax(taxableIncome, params.federalBrackets);
  const basicPersonalCredit = Math.round(params.basicPersonalAmount * 0.15 * 100) / 100;
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

export interface PayrollSummary {
  totalPayroll: number;
  employeeCount: number;
  cppContributions: number;
  eiPremiums: number;
  incomeTaxWithheld: number;
  totalRemittances: number;
}

export interface GstHstSummary {
  collected: number;
  paid: number;
  netRemittance: number;
}

export interface CorporateTaxSummary {
  corporateRevenue: number;
  totalDeductions: number;
  taxableIncome: number;
  smallBusinessTax: number;
  generalTax: number;
  totalCorporateTax: number;
  capitalCostAllowance: number;
  retainedEarnings: number;
  payroll: PayrollSummary;
  gstHst: GstHstSummary;
  breakdown: {
    deductionItems: Record<string, number>;
  };
}

export function calculateCompanyTax(payload: Record<string, unknown>, taxYear?: number): CorporateTaxSummary {
  const params = resolveParams(taxYear);
  const corporateRevenue = num(payload.corporateRevenue);
  const capitalCostAllowance = num(payload.capitalCostAllowance);
  const retainedEarnings = num(payload.retainedEarnings);

  const deductionItems: Record<string, number> = {
    corporatePayroll: num(payload.corporatePayroll),
    corporateDeductions: num(payload.corporateDeductions),
    capitalCostAllowance
  };

  const totalDeductions = Object.values(deductionItems).reduce((a, b) => a + b, 0);
  const taxableIncome = Math.max(corporateRevenue - totalDeductions, 0);

  const smallBusinessPortion = Math.min(taxableIncome, params.smallBusinessLimit);
  const generalPortion = Math.max(taxableIncome - params.smallBusinessLimit, 0);

  const smallBusinessTax = Math.round(smallBusinessPortion * params.smallBusinessRate * 100) / 100;
  const generalTax = Math.round(generalPortion * params.generalCorporateRate * 100) / 100;
  const totalCorporateTax = Math.round((smallBusinessTax + generalTax) * 100) / 100;

  // Payroll reconciliation
  const cppContributions = num(payload.cppContributions);
  const eiPremiums = num(payload.eiPremiums);
  const incomeTaxWithheld = num(payload.incomeTaxWithheld);
  const payroll: PayrollSummary = {
    totalPayroll: num(payload.corporatePayroll),
    employeeCount: num(payload.employeeCount),
    cppContributions,
    eiPremiums,
    incomeTaxWithheld,
    totalRemittances: Math.round((cppContributions + eiPremiums + incomeTaxWithheld) * 100) / 100
  };

  // GST/HST
  const gstHstCollected = num(payload.gstHstCollected);
  const gstHstPaid = num(payload.gstHstPaid);
  const gstHstNetRemittance = num(payload.gstHstNetRemittance) || Math.round((gstHstCollected - gstHstPaid) * 100) / 100;
  const gstHst: GstHstSummary = {
    collected: gstHstCollected,
    paid: gstHstPaid,
    netRemittance: gstHstNetRemittance
  };

  return {
    corporateRevenue,
    totalDeductions,
    taxableIncome,
    smallBusinessTax,
    generalTax,
    totalCorporateTax,
    capitalCostAllowance,
    retainedEarnings,
    payroll,
    gstHst,
    breakdown: { deductionItems }
  };
}

// ---------------------------------------------------------------------------
// Unified entry point
// ---------------------------------------------------------------------------

export type CalculationResult =
  | { mode: "INDIVIDUAL" | "SELF_EMPLOYED"; summary: TaxSummary }
  | { mode: "COMPANY"; summary: CorporateTaxSummary };

export function calculateTax(mode: FilingMode, payload: Record<string, unknown>, taxYear?: number): CalculationResult {
  switch (mode) {
    case "INDIVIDUAL":
      return { mode, summary: calculateIndividualTax(payload, taxYear) };
    case "SELF_EMPLOYED":
      return { mode, summary: calculateSelfEmployedTax(payload, taxYear) };
    case "COMPANY":
      return { mode, summary: calculateCompanyTax(payload, taxYear) };
  }
}
