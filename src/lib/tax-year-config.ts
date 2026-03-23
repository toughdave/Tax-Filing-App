// ---------------------------------------------------------------------------
// Tax-year-versioned configuration for brackets, limits, and rates.
// CRA adjusts these annually for inflation. Each year gets its own entry.
// ---------------------------------------------------------------------------

export interface TaxBracket {
  upTo: number;
  rate: number;
}

export interface TaxYearParams {
  taxYear: number;
  federalBrackets: TaxBracket[];
  basicPersonalAmount: number;
  basicPersonalAmountMin: number;
  smallBusinessRate: number;
  generalCorporateRate: number;
  smallBusinessLimit: number;
  rrspLimit: number;
  tfsaLimit: number;
  cpp2MaxPensionableEarnings: number;
  eiMaxInsurableEarnings: number;
}

// ---------------------------------------------------------------------------
// 2023 tax year
// ---------------------------------------------------------------------------
const params2023: TaxYearParams = {
  taxYear: 2023,
  federalBrackets: [
    { upTo: 53359, rate: 0.15 },
    { upTo: 106717, rate: 0.205 },
    { upTo: 147350, rate: 0.26 },
    { upTo: 210371, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 }
  ],
  basicPersonalAmount: 15000,
  basicPersonalAmountMin: 13521,
  smallBusinessRate: 0.09,
  generalCorporateRate: 0.15,
  smallBusinessLimit: 500000,
  rrspLimit: 30780,
  tfsaLimit: 6500,
  cpp2MaxPensionableEarnings: 66600,
  eiMaxInsurableEarnings: 61500
};

// ---------------------------------------------------------------------------
// 2024 tax year
// ---------------------------------------------------------------------------
const params2024: TaxYearParams = {
  taxYear: 2024,
  federalBrackets: [
    { upTo: 55867, rate: 0.15 },
    { upTo: 111733, rate: 0.205 },
    { upTo: 154906, rate: 0.26 },
    { upTo: 220000, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 }
  ],
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

// ---------------------------------------------------------------------------
// 2025 tax year (projected / indexed)
// ---------------------------------------------------------------------------
const params2025: TaxYearParams = {
  taxYear: 2025,
  federalBrackets: [
    { upTo: 57375, rate: 0.145 },
    { upTo: 114750, rate: 0.205 },
    { upTo: 177882, rate: 0.26 },
    { upTo: 253414, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 }
  ],
  basicPersonalAmount: 16129,
  basicPersonalAmountMin: 14539,
  smallBusinessRate: 0.09,
  generalCorporateRate: 0.15,
  smallBusinessLimit: 500000,
  rrspLimit: 32490,
  tfsaLimit: 7000,
  cpp2MaxPensionableEarnings: 71300,
  eiMaxInsurableEarnings: 65700
};

// ---------------------------------------------------------------------------
// 2026 tax year (indexed from 2025 by 2.0%)
// ---------------------------------------------------------------------------
const params2026: TaxYearParams = {
  taxYear: 2026,
  federalBrackets: [
    { upTo: 58520, rate: 0.14 },
    { upTo: 117038, rate: 0.205 },
    { upTo: 181440, rate: 0.26 },
    { upTo: 258482, rate: 0.29 },
    { upTo: Infinity, rate: 0.33 }
  ],
  basicPersonalAmount: 16452,
  basicPersonalAmountMin: 14829,
  smallBusinessRate: 0.09,
  generalCorporateRate: 0.15,
  smallBusinessLimit: 500000,
  rrspLimit: 33140,
  tfsaLimit: 7000,
  cpp2MaxPensionableEarnings: 81200,
  eiMaxInsurableEarnings: 68900
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const paramsByYear: Record<number, TaxYearParams> = {
  2023: params2023,
  2024: params2024,
  2025: params2025,
  2026: params2026
};

export function getTaxYearParams(taxYear: number): TaxYearParams | null {
  return paramsByYear[taxYear] ?? null;
}

export function getDefaultTaxYear(): number {
  const now = new Date();
  // CRA rule: T1 returns are filed for a completed calendar year.
  // The most recently completed tax year is always the previous year.
  return now.getFullYear() - 1;
}

export function getSupportedTaxYears(): number[] {
  return Object.keys(paramsByYear).map(Number).sort((a, b) => b - a);
}
