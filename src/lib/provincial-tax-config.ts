// ---------------------------------------------------------------------------
// Provincial / territorial tax brackets and basic personal amounts.
// Source: CRA — Canadian income tax rates for individuals (current and
// previous years).  Each province/territory gets its own entry per tax year.
// Quebec filers file a separate TP-1 return; the brackets here are for the
// federal Form 428 equivalent calculation used for combined-rate estimates.
// ---------------------------------------------------------------------------

import type { TaxBracket } from "@/lib/tax-year-config";

export interface ProvincialTaxParams {
  provinceCode: string;
  provinceName: string;
  brackets: TaxBracket[];
  basicPersonalAmount: number;
  /** Ontario surtax thresholds — only applies to ON */
  surtax?: {
    rate1: number;
    threshold1: number;
    rate2: number;
    threshold2: number;
  };
}

// ---------------------------------------------------------------------------
// 2024 provincial / territorial brackets
// ---------------------------------------------------------------------------

const on2024: ProvincialTaxParams = {
  provinceCode: "ON",
  provinceName: "Ontario",
  brackets: [
    { upTo: 51446, rate: 0.0505 },
    { upTo: 102894, rate: 0.0915 },
    { upTo: 150000, rate: 0.1116 },
    { upTo: 220000, rate: 0.1216 },
    { upTo: Infinity, rate: 0.1316 }
  ],
  basicPersonalAmount: 11865,
  surtax: {
    rate1: 0.20,
    threshold1: 4991,
    rate2: 0.36,
    threshold2: 6387
  }
};

const bc2024: ProvincialTaxParams = {
  provinceCode: "BC",
  provinceName: "British Columbia",
  brackets: [
    { upTo: 47937, rate: 0.0506 },
    { upTo: 95875, rate: 0.077 },
    { upTo: 110076, rate: 0.105 },
    { upTo: 133664, rate: 0.1229 },
    { upTo: 181232, rate: 0.147 },
    { upTo: 252752, rate: 0.168 },
    { upTo: Infinity, rate: 0.205 }
  ],
  basicPersonalAmount: 12580
};

const ab2024: ProvincialTaxParams = {
  provinceCode: "AB",
  provinceName: "Alberta",
  brackets: [
    { upTo: 148269, rate: 0.10 },
    { upTo: 177922, rate: 0.12 },
    { upTo: 237230, rate: 0.13 },
    { upTo: 355845, rate: 0.14 },
    { upTo: Infinity, rate: 0.15 }
  ],
  basicPersonalAmount: 21003
};

const sk2024: ProvincialTaxParams = {
  provinceCode: "SK",
  provinceName: "Saskatchewan",
  brackets: [
    { upTo: 52057, rate: 0.105 },
    { upTo: 148734, rate: 0.125 },
    { upTo: Infinity, rate: 0.145 }
  ],
  basicPersonalAmount: 17661
};

const mb2024: ProvincialTaxParams = {
  provinceCode: "MB",
  provinceName: "Manitoba",
  brackets: [
    { upTo: 47000, rate: 0.108 },
    { upTo: 100000, rate: 0.1275 },
    { upTo: Infinity, rate: 0.174 }
  ],
  basicPersonalAmount: 15780
};

const qc2024: ProvincialTaxParams = {
  provinceCode: "QC",
  provinceName: "Quebec",
  brackets: [
    { upTo: 51780, rate: 0.14 },
    { upTo: 103545, rate: 0.19 },
    { upTo: 126000, rate: 0.24 },
    { upTo: Infinity, rate: 0.2575 }
  ],
  basicPersonalAmount: 18056
};

const nb2024: ProvincialTaxParams = {
  provinceCode: "NB",
  provinceName: "New Brunswick",
  brackets: [
    { upTo: 49958, rate: 0.094 },
    { upTo: 99916, rate: 0.14 },
    { upTo: 185064, rate: 0.16 },
    { upTo: Infinity, rate: 0.195 }
  ],
  basicPersonalAmount: 13044
};

const ns2024: ProvincialTaxParams = {
  provinceCode: "NS",
  provinceName: "Nova Scotia",
  brackets: [
    { upTo: 29590, rate: 0.0879 },
    { upTo: 59180, rate: 0.1495 },
    { upTo: 93000, rate: 0.1667 },
    { upTo: 150000, rate: 0.175 },
    { upTo: Infinity, rate: 0.21 }
  ],
  basicPersonalAmount: 8481
};

const pe2024: ProvincialTaxParams = {
  provinceCode: "PE",
  provinceName: "Prince Edward Island",
  brackets: [
    { upTo: 32656, rate: 0.0965 },
    { upTo: 64313, rate: 0.1363 },
    { upTo: Infinity, rate: 0.1665 }
  ],
  basicPersonalAmount: 12000
};

const nl2024: ProvincialTaxParams = {
  provinceCode: "NL",
  provinceName: "Newfoundland and Labrador",
  brackets: [
    { upTo: 43198, rate: 0.087 },
    { upTo: 86395, rate: 0.145 },
    { upTo: 154244, rate: 0.158 },
    { upTo: 215943, rate: 0.178 },
    { upTo: 275870, rate: 0.198 },
    { upTo: 551739, rate: 0.213 },
    { upTo: Infinity, rate: 0.218 }
  ],
  basicPersonalAmount: 10818
};

const nt2024: ProvincialTaxParams = {
  provinceCode: "NT",
  provinceName: "Northwest Territories",
  brackets: [
    { upTo: 50597, rate: 0.059 },
    { upTo: 101198, rate: 0.086 },
    { upTo: 164525, rate: 0.122 },
    { upTo: Infinity, rate: 0.1405 }
  ],
  basicPersonalAmount: 16593
};

const nu2024: ProvincialTaxParams = {
  provinceCode: "NU",
  provinceName: "Nunavut",
  brackets: [
    { upTo: 53268, rate: 0.04 },
    { upTo: 106537, rate: 0.07 },
    { upTo: 173205, rate: 0.09 },
    { upTo: Infinity, rate: 0.115 }
  ],
  basicPersonalAmount: 17925
};

const yt2024: ProvincialTaxParams = {
  provinceCode: "YT",
  provinceName: "Yukon",
  brackets: [
    { upTo: 55867, rate: 0.064 },
    { upTo: 111733, rate: 0.09 },
    { upTo: 154906, rate: 0.109 },
    { upTo: 500000, rate: 0.128 },
    { upTo: Infinity, rate: 0.15 }
  ],
  basicPersonalAmount: 15705
};

// ---------------------------------------------------------------------------
// Registry — keyed by tax year → province code
// ---------------------------------------------------------------------------

const provincialParamsByYear: Record<number, Record<string, ProvincialTaxParams>> = {
  2024: {
    ON: on2024,
    BC: bc2024,
    AB: ab2024,
    SK: sk2024,
    MB: mb2024,
    QC: qc2024,
    NB: nb2024,
    NS: ns2024,
    PE: pe2024,
    NL: nl2024,
    NT: nt2024,
    NU: nu2024,
    YT: yt2024
  }
};

// 2025 inherits 2024 until CRA publishes updated indexed amounts
provincialParamsByYear[2025] = provincialParamsByYear[2024];

export function getProvincialTaxParams(
  taxYear: number,
  provinceCode: string
): ProvincialTaxParams | null {
  const yearMap = provincialParamsByYear[taxYear];
  if (!yearMap) return null;
  return yearMap[provinceCode.toUpperCase()] ?? null;
}

export function getSupportedProvinces(taxYear: number): string[] {
  const yearMap = provincialParamsByYear[taxYear];
  if (!yearMap) return [];
  return Object.keys(yearMap).sort();
}
