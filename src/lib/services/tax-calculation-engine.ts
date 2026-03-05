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
  basicPersonalAmountMin: 14156,
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
  
  // Basic Personal Amount income scaling logic
  // Starts scaling down at bottom of 4th bracket (e.g. $173,205 in 2024, but usually 150k+ in earlier years. We use bracket 3 upTo for 2024).
  // Actually, CRA rules: The enhanced BPA is reduced for net income above the 4th tax bracket threshold (e.g., $173,205 in 2024), reaching minimum at the top bracket ($246,752 in 2024).
  // Using the bracket configurations from params:
  // Bracket 3 upTo is the start of the 4th bracket. Bracket 4 upTo is the start of the 5th bracket.
  let bpa = params.basicPersonalAmount;
  const bpaMin = params.basicPersonalAmountMin;
  if (params.federalBrackets.length >= 4) {
    const threshold1 = params.federalBrackets[2]?.upTo ?? 0;
    const threshold2 = params.federalBrackets[3]?.upTo ?? 0;
    if (netIncome > threshold1 && threshold2 > threshold1) {
      if (netIncome >= threshold2) {
        bpa = bpaMin;
      } else {
        const ratio = (netIncome - threshold1) / (threshold2 - threshold1);
        bpa = bpa - (bpa - bpaMin) * ratio;
      }
    }
  }
  const basicPersonalCredit = round2(bpa * 0.15);

  const totalCreditAmounts = Object.values(creditItems).reduce((a, b) => a + b, 0);
  const nonRefundableCredits = round2(basicPersonalCredit + totalCreditAmounts * 0.15);

  let netFederalTax = Math.max(round2(federalTax - nonRefundableCredits), 0);
  
  // Quebec Abatement (16.5% reduction of basic federal tax for QC residents)
  if (provParams?.provinceCode === "QC") {
    const quebecAbatement = round2(netFederalTax * 0.165);
    netFederalTax = Math.max(round2(netFederalTax - quebecAbatement), 0);
  }

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

interface CppEiResult {
  cppEmployeeCredit: number;
  cppSelfEmployedDeduction: number;
  cppSelfEmployedCredit: number;
  eiCredit: number;
}

function computeCppEi(
  payload: Record<string, unknown>,
  isSelfEmployed: boolean,
  params: TaxYearParams
): CppEiResult {
  const cppEmployeeContributions = num(payload.cppEmployeeContributions);
  const cppSelfEmployedContributions = num(payload.cppSelfEmployedContributions);

  // Employee CPP: full amount is a non-refundable credit at 15%
  const cppEmployeeCredit = cppEmployeeContributions;

  // Self-employed CPP: half is deductible (Step 3), half is a credit (Step 5)
  let cppSelfEmployedDeduction = 0;
  let cppSelfEmployedCredit = 0;
  if (isSelfEmployed && cppSelfEmployedContributions > 0) {
    cppSelfEmployedDeduction = round2(cppSelfEmployedContributions / 2);
    cppSelfEmployedCredit = round2(cppSelfEmployedContributions / 2);
  }

  // EI premiums: T4 box 18, full amount is a credit
  // Max EI = insurable earnings * employee rate (1.66% for 2024)
  const eiMaxPremium = round2(params.eiMaxInsurableEarnings * 0.0166);
  const eiPaid = Math.min(num(payload.eiPremiums ?? payload.eiBenefits ?? 0), eiMaxPremium);
  // For individuals, the EI credit is based on premiums paid (from T4), not benefits received
  const eiCredit = num(payload.cppEiOverpayment) > 0 ? num(payload.cppEiOverpayment) : 0;

  return { cppEmployeeCredit, cppSelfEmployedDeduction, cppSelfEmployedCredit, eiCredit };
}

export function calculateIndividualTax(payload: Record<string, unknown>, taxYear?: number): TaxSummary {
  const params = resolveParams(taxYear);

  const capitalGainsRaw = Math.max(num(payload.capitalGains), 0);
  
  // 2024+ Capital Gains Inclusion Rate rules (effective June 25, 2024, but simplified for full year in this app):
  // Individuals: 1/2 on first $250,000; 2/3 on amounts over $250,000.
  // For pre-2024, it's 1/2 on everything. We apply this rule for 2024+ years.
  let taxableCapitalGains = 0;
  if (params.taxYear >= 2024) {
    if (capitalGainsRaw <= 250000) {
      taxableCapitalGains = round2(capitalGainsRaw * 0.5);
    } else {
      taxableCapitalGains = round2(250000 * 0.5 + (capitalGainsRaw - 250000) * (2 / 3));
    }
  } else {
    taxableCapitalGains = round2(capitalGainsRaw * 0.5);
  }

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

  const cppEi = computeCppEi(payload, false, params);

  const creditItems: Record<string, number> = {
    tuition: num(payload.tuition),
    educationCarryForward: num(payload.educationCarryForward),
    medical: num(payload.medical),
    donations: num(payload.donations),
    ageAmount: num(payload.ageAmount),
    spouseAmount: num(payload.spouseAmount),
    eligibleDependantAmount: num(payload.eligibleDependantAmount),
    canadaCaregiverAmount: num(payload.canadaCaregiverAmount),
    disabilityAmount: num(payload.disabilityAmount),
    cppEiOverpayment: num(payload.cppEiOverpayment),
    cppEmployeeCredit: cppEi.cppEmployeeCredit,
    canadaEmploymentAmount: num(payload.canadaEmploymentAmount),
    homeBuyersAmount: num(payload.homeBuyersAmount),
    pensionIncomeAmount: num(payload.pensionIncomeAmount),
    studentLoanInterest: num(payload.studentLoanInterest)
  };

  const refundableCreditItems: Record<string, number> = {
    canadaWorkersAmount: num(payload.canadaWorkersAmount),
    canadaTrainingCredit: num(payload.canadaTrainingCredit),
    refundableMedical: num(payload.refundableMedical),
    onPropertyTaxCredit: num(payload.onPropertyTax) > 0 ? round2(num(payload.onPropertyTax) * 0.1) : 0,
    onEnergyCredit: num(payload.onEnergyCredit),
    onRentCredit: num(payload.onRent) > 0 ? round2(num(payload.onRent) * 0.2) : 0,
    onNorthernEnergy: num(payload.onNorthernEnergy)
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

  const capitalGainsRaw = Math.max(num(payload.capitalGains), 0);
  
  let taxableCapitalGains = 0;
  if (params.taxYear >= 2024) {
    if (capitalGainsRaw <= 250000) {
      taxableCapitalGains = round2(capitalGainsRaw * 0.5);
    } else {
      taxableCapitalGains = round2(250000 * 0.5 + (capitalGainsRaw - 250000) * (2 / 3));
    }
  } else {
    taxableCapitalGains = round2(capitalGainsRaw * 0.5);
  }

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

  const cppEi = computeCppEi(payload, true, params);

  // Self-employed CPP deduction (half of SE contributions)
  if (cppEi.cppSelfEmployedDeduction > 0) {
    deductionItems.cppSelfEmployedDeduction = cppEi.cppSelfEmployedDeduction;
  }

  const creditItems: Record<string, number> = {
    tuition: num(payload.tuition),
    educationCarryForward: num(payload.educationCarryForward),
    medical: num(payload.medical),
    donations: num(payload.donations),
    ageAmount: num(payload.ageAmount),
    spouseAmount: num(payload.spouseAmount),
    eligibleDependantAmount: num(payload.eligibleDependantAmount),
    canadaCaregiverAmount: num(payload.canadaCaregiverAmount),
    disabilityAmount: num(payload.disabilityAmount),
    cppEiOverpayment: num(payload.cppEiOverpayment),
    cppEmployeeCredit: cppEi.cppEmployeeCredit,
    cppSelfEmployedCredit: cppEi.cppSelfEmployedCredit,
    canadaEmploymentAmount: num(payload.canadaEmploymentAmount),
    homeBuyersAmount: num(payload.homeBuyersAmount),
    pensionIncomeAmount: num(payload.pensionIncomeAmount),
    studentLoanInterest: num(payload.studentLoanInterest)
  };

  const refundableCreditItems: Record<string, number> = {
    canadaWorkersAmount: num(payload.canadaWorkersAmount),
    canadaTrainingCredit: num(payload.canadaTrainingCredit),
    refundableMedical: num(payload.refundableMedical),
    onPropertyTaxCredit: num(payload.onPropertyTax) > 0 ? round2(num(payload.onPropertyTax) * 0.1) : 0,
    onEnergyCredit: num(payload.onEnergyCredit),
    onRentCredit: num(payload.onRent) > 0 ? round2(num(payload.onRent) * 0.2) : 0,
    onNorthernEnergy: num(payload.onNorthernEnergy)
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
  
  const capitalGainsRaw = Math.max(num(payload.capitalGains), 0);
  let taxableCapitalGains = 0;
  if (params.taxYear >= 2024) {
    // Corporations pay 2/3 on all capital gains in 2024+
    taxableCapitalGains = round2(capitalGainsRaw * (2 / 3));
  } else {
    taxableCapitalGains = round2(capitalGainsRaw * 0.5);
  }

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
