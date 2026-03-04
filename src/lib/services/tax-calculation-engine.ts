import type { FilingMode } from "@/lib/tax-field-config";
import { getTaxYearParams, type TaxYearParams, type TaxBracket } from "@/lib/tax-year-config";
import { getProvincialTaxParams, type ProvincialTaxParams } from "@/lib/provincial-tax-config";

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

export interface ProvincialTaxDetail {
  provinceCode: string;
  provinceName: string;
  provincialTax: number;
  provincialBasicPersonalCredit: number;
  provincialNonRefundableCredits: number;
  netProvincialTax: number;
  provincialSurtax: number;
}

export interface TaxSummary {
  totalIncome: number;
  totalDeductions: number;
  netIncome: number;
  taxableIncome: number;
  federalTax: number;
  basicPersonalCredit: number;
  nonRefundableCredits: number;
  netFederalTax: number;
  provincial: ProvincialTaxDetail | null;
  totalTax: number;
  refundableCredits: number;
  totalPayments: number;
  balanceOwing: number;
  breakdown: {
    incomeItems: Record<string, number>;
    deductionItems: Record<string, number>;
    creditItems: Record<string, number>;
    refundableCreditItems: Record<string, number>;
    paymentItems: Record<string, number>;
  };
}

function computeProvincialTax(
  taxableIncome: number,
  totalCreditAmounts: number,
  provParams: ProvincialTaxParams
): ProvincialTaxDetail {
  const provincialTax = calculateFederalTax(taxableIncome, provParams.brackets);
  const lowestRate = provParams.brackets[0]?.rate ?? 0;
  const provincialBasicPersonalCredit = round2(provParams.basicPersonalAmount * lowestRate);
  const provincialNonRefundableCredits = round2(
    provincialBasicPersonalCredit + totalCreditAmounts * lowestRate
  );
  const basicProvTax = Math.max(round2(provincialTax - provincialNonRefundableCredits), 0);

  let provincialSurtax = 0;
  if (provParams.surtax) {
    const s = provParams.surtax;
    if (basicProvTax > s.threshold1) {
      provincialSurtax += round2((basicProvTax - s.threshold1) * s.rate1);
    }
    if (basicProvTax > s.threshold2) {
      provincialSurtax += round2((basicProvTax - s.threshold2) * s.rate2);
    }
  }

  const netProvincialTax = round2(basicProvTax + provincialSurtax);

  return {
    provinceCode: provParams.provinceCode,
    provinceName: provParams.provinceName,
    provincialTax,
    provincialBasicPersonalCredit,
    provincialNonRefundableCredits,
    netProvincialTax,
    provincialSurtax
  };
}

function computePersonalTax(
  incomeItems: Record<string, number>,
  deductionItems: Record<string, number>,
  creditItems: Record<string, number>,
  refundableCreditItems: Record<string, number>,
  paymentItems: Record<string, number>,
  params: TaxYearParams,
  provParams: ProvincialTaxParams | null
): TaxSummary {
  const totalIncome = Object.values(incomeItems).reduce((a, b) => a + b, 0);
  const totalDeductions = Object.values(deductionItems).reduce((a, b) => a + b, 0);
  const netIncome = Math.max(totalIncome - totalDeductions, 0);
  const taxableIncome = netIncome;

  const federalTax = calculateFederalTax(taxableIncome, params.federalBrackets);
  const basicPersonalCredit = round2(params.basicPersonalAmount * 0.15);

  const totalCreditAmounts = Object.values(creditItems).reduce((a, b) => a + b, 0);
  const nonRefundableCredits = round2(basicPersonalCredit + totalCreditAmounts * 0.15);

  const netFederalTax = Math.max(round2(federalTax - nonRefundableCredits), 0);

  const provincial = provParams
    ? computeProvincialTax(taxableIncome, totalCreditAmounts, provParams)
    : null;

  const netProvincialTax = provincial?.netProvincialTax ?? 0;
  const totalTax = round2(netFederalTax + netProvincialTax);

  const refundableCredits = round2(Object.values(refundableCreditItems).reduce((a, b) => a + b, 0));
  const totalPayments = round2(Object.values(paymentItems).reduce((a, b) => a + b, 0));
  const balanceOwing = round2(totalTax - refundableCredits - totalPayments);

  return {
    totalIncome,
    totalDeductions,
    netIncome,
    taxableIncome,
    federalTax,
    basicPersonalCredit,
    nonRefundableCredits,
    netFederalTax,
    provincial,
    totalTax,
    refundableCredits,
    totalPayments,
    balanceOwing,
    breakdown: { incomeItems, deductionItems, creditItems, refundableCreditItems, paymentItems }
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function calculateIndividualTax(payload: Record<string, unknown>, taxYear?: number): TaxSummary {
  const params = resolveParams(taxYear);

  const capitalGainsRaw = num(payload.capitalGains);
  const taxableCapitalGains = round2(Math.max(capitalGainsRaw, 0) * 0.5);

  const incomeItems: Record<string, number> = {
    employmentIncome: num(payload.employmentIncome),
    otherIncome: num(payload.otherIncome),
    interestIncome: num(payload.interestIncome),
    dividendIncome: num(payload.dividendIncome),
    taxableCapitalGains,
    rentalIncome: num(payload.rentalIncome),
    pensionIncome: num(payload.pensionIncome),
    eiBenefits: num(payload.eiBenefits)
  };

  const deductionItems: Record<string, number> = {
    rrsp: num(payload.rrsp),
    fhsa: num(payload.fhsa),
    unionDues: num(payload.unionDues),
    childCareExpenses: num(payload.childCareExpenses),
    movingExpenses: num(payload.movingExpenses),
    supportPaymentsMade: num(payload.supportPaymentsMade),
    carryingCharges: num(payload.carryingCharges),
    northernResidents: num(payload.northernResidents)
  };

  const creditItems: Record<string, number> = {
    tuition: num(payload.tuition),
    medical: num(payload.medical),
    donations: num(payload.donations),
    ageAmount: num(payload.ageAmount),
    spouseAmount: num(payload.spouseAmount),
    eligibleDependantAmount: num(payload.eligibleDependantAmount),
    canadaCaregiverAmount: num(payload.canadaCaregiverAmount),
    disabilityAmount: num(payload.disabilityAmount),
    cppEiOverpayment: num(payload.cppEiOverpayment),
    canadaEmploymentAmount: num(payload.canadaEmploymentAmount),
    homeBuyersAmount: num(payload.homeBuyersAmount),
    pensionIncomeAmount: num(payload.pensionIncomeAmount),
    studentLoanInterest: num(payload.studentLoanInterest)
  };

  const refundableCreditItems: Record<string, number> = {
    canadaWorkersAmount: num(payload.canadaWorkersAmount),
    canadaTrainingCredit: num(payload.canadaTrainingCredit),
    refundableMedical: num(payload.refundableMedical)
  };

  const paymentItems: Record<string, number> = {
    taxPaidByInstalments: num(payload.taxPaidByInstalments),
    totalIncomeTaxDeducted: num(payload.totalIncomeTaxDeducted)
  };

  const province = typeof payload.residencyProvince === "string" ? payload.residencyProvince : "";
  const provParams = province ? getProvincialTaxParams(taxYear ?? 2024, province) : null;

  return computePersonalTax(incomeItems, deductionItems, creditItems, refundableCreditItems, paymentItems, params, provParams);
}

export function calculateSelfEmployedTax(payload: Record<string, unknown>, taxYear?: number): TaxSummary {
  const params = resolveParams(taxYear);

  const capitalGainsRaw = num(payload.capitalGains);
  const taxableCapitalGains = round2(Math.max(capitalGainsRaw, 0) * 0.5);

  const incomeItems: Record<string, number> = {
    employmentIncome: num(payload.employmentIncome),
    otherIncome: num(payload.otherIncome),
    interestIncome: num(payload.interestIncome),
    dividendIncome: num(payload.dividendIncome),
    taxableCapitalGains,
    rentalIncome: num(payload.rentalIncome),
    pensionIncome: num(payload.pensionIncome),
    eiBenefits: num(payload.eiBenefits),
    businessIncome: num(payload.businessIncome)
  };

  const deductionItems: Record<string, number> = {
    rrsp: num(payload.rrsp),
    fhsa: num(payload.fhsa),
    unionDues: num(payload.unionDues),
    childCareExpenses: num(payload.childCareExpenses),
    movingExpenses: num(payload.movingExpenses),
    supportPaymentsMade: num(payload.supportPaymentsMade),
    carryingCharges: num(payload.carryingCharges),
    northernResidents: num(payload.northernResidents),
    businessExpenses: num(payload.businessExpenses),
    businessUseHome: num(payload.businessUseHome)
  };

  const creditItems: Record<string, number> = {
    tuition: num(payload.tuition),
    medical: num(payload.medical),
    donations: num(payload.donations),
    ageAmount: num(payload.ageAmount),
    spouseAmount: num(payload.spouseAmount),
    eligibleDependantAmount: num(payload.eligibleDependantAmount),
    canadaCaregiverAmount: num(payload.canadaCaregiverAmount),
    disabilityAmount: num(payload.disabilityAmount),
    cppEiOverpayment: num(payload.cppEiOverpayment),
    canadaEmploymentAmount: num(payload.canadaEmploymentAmount),
    homeBuyersAmount: num(payload.homeBuyersAmount),
    pensionIncomeAmount: num(payload.pensionIncomeAmount),
    studentLoanInterest: num(payload.studentLoanInterest)
  };

  const refundableCreditItems: Record<string, number> = {
    canadaWorkersAmount: num(payload.canadaWorkersAmount),
    canadaTrainingCredit: num(payload.canadaTrainingCredit),
    refundableMedical: num(payload.refundableMedical)
  };

  const paymentItems: Record<string, number> = {
    taxPaidByInstalments: num(payload.taxPaidByInstalments),
    totalIncomeTaxDeducted: num(payload.totalIncomeTaxDeducted)
  };

  const province = typeof payload.residencyProvince === "string" ? payload.residencyProvince : "";
  const provParams = province ? getProvincialTaxParams(taxYear ?? 2024, province) : null;

  return computePersonalTax(incomeItems, deductionItems, creditItems, refundableCreditItems, paymentItems, params, provParams);
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
