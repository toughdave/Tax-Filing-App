import { describe, it, expect } from "vitest";
import {
  calculateIndividualTax,
  calculateSelfEmployedTax,
  calculateCompanyTax,
  calculateTax
} from "./tax-calculation-engine";

// ---------------------------------------------------------------------------
// Individual tax calculation
// ---------------------------------------------------------------------------

describe("calculateIndividualTax", () => {
  it("returns zero tax for zero income", () => {
    const result = calculateIndividualTax({});
    expect(result.totalIncome).toBe(0);
    expect(result.totalDeductions).toBe(0);
    expect(result.netFederalTax).toBe(0);
  });

  it("computes correct totals for employment + other income", () => {
    const result = calculateIndividualTax({
      employmentIncome: 60000,
      otherIncome: 5000
    });
    expect(result.totalIncome).toBe(65000);
    expect(result.netIncome).toBe(65000);
    expect(result.federalTax).toBeGreaterThan(0);
  });

  it("subtracts deductions from income", () => {
    const result = calculateIndividualTax({
      employmentIncome: 80000,
      rrsp: 10000,
      unionDues: 2000
    });
    expect(result.totalDeductions).toBe(12000);
    expect(result.netIncome).toBe(68000);
  });

  it("net income never goes below zero", () => {
    const result = calculateIndividualTax({
      employmentIncome: 5000,
      rrsp: 20000
    });
    expect(result.netIncome).toBe(0);
    expect(result.netFederalTax).toBe(0);
  });

  it("applies basic personal credit to reduce federal tax", () => {
    const result = calculateIndividualTax({ employmentIncome: 50000 });
    expect(result.basicPersonalCredit).toBeCloseTo(15705 * 0.15, 2);
    expect(result.netFederalTax).toBeLessThan(result.federalTax);
  });

  it("includes breakdown of income and deduction items", () => {
    const result = calculateIndividualTax({
      employmentIncome: 40000,
      otherIncome: 3000,
      rrsp: 5000
    });
    expect(result.breakdown.incomeItems.employmentIncome).toBe(40000);
    expect(result.breakdown.incomeItems.otherIncome).toBe(3000);
    expect(result.breakdown.deductionItems.rrsp).toBe(5000);
    expect(result.breakdown).toHaveProperty("creditItems");
    expect(result.breakdown).toHaveProperty("refundableCreditItems");
    expect(result.breakdown).toHaveProperty("paymentItems");
  });

  it("applies 50% inclusion rate to capital gains", () => {
    const result = calculateIndividualTax({ capitalGains: 20000 });
    expect(result.breakdown.incomeItems.taxableCapitalGains).toBe(10000);
    expect(result.totalIncome).toBe(10000);
  });

  it("includes expanded income sources in total", () => {
    const result = calculateIndividualTax({
      employmentIncome: 50000,
      interestIncome: 2000,
      dividendIncome: 1000,
      rentalIncome: 5000,
      pensionIncome: 3000,
      eiBenefits: 4000
    });
    expect(result.totalIncome).toBe(65000);
  });

  it("includes expanded deductions", () => {
    const result = calculateIndividualTax({
      employmentIncome: 80000,
      rrsp: 5000,
      fhsa: 8000,
      unionDues: 600,
      childCareExpenses: 4000
    });
    expect(result.totalDeductions).toBe(17600);
    expect(result.netIncome).toBe(62400);
  });

  it("applies non-refundable credits to reduce federal tax", () => {
    const result = calculateIndividualTax({
      employmentIncome: 80000,
      tuition: 5000,
      donations: 1000
    });
    expect(result.nonRefundableCredits).toBeGreaterThan(result.basicPersonalCredit);
    expect(result.netFederalTax).toBeLessThan(result.federalTax);
  });

  it("computes refundable credits and balance owing", () => {
    const result = calculateIndividualTax({
      employmentIncome: 30000,
      canadaWorkersAmount: 500,
      totalIncomeTaxDeducted: 3000
    });
    expect(result.refundableCredits).toBe(500);
    expect(result.totalPayments).toBe(3000);
    expect(result.balanceOwing).toBe(
      Math.round((result.netFederalTax - 500 - 3000) * 100) / 100
    );
  });

  it("handles string values by parsing them as numbers", () => {
    const result = calculateIndividualTax({
      employmentIncome: "75000",
      rrsp: "5000"
    });
    expect(result.totalIncome).toBe(75000);
    expect(result.totalDeductions).toBe(5000);
  });

  it("treats non-numeric strings as zero", () => {
    const result = calculateIndividualTax({
      employmentIncome: "not-a-number"
    });
    expect(result.totalIncome).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Federal bracket math spot-checks
// ---------------------------------------------------------------------------

describe("federal bracket calculation", () => {
  it("applies 15% on income within first bracket (≤ $55,867)", () => {
    const result = calculateIndividualTax({ employmentIncome: 40000 });
    // 40000 * 0.15 = 6000
    expect(result.federalTax).toBe(6000);
  });

  it("applies second bracket rate on income above $55,867", () => {
    const result = calculateIndividualTax({ employmentIncome: 70000 });
    // First bracket: 55867 * 0.15 = 8380.05
    // Second bracket: (70000 - 55867) * 0.205 = 14133 * 0.205 = 2897.265
    // Total: 11277.315 → rounded to 11277.31
    expect(result.federalTax).toBeCloseTo(11277.31, 2);
  });
});

// ---------------------------------------------------------------------------
// Self-employed tax calculation
// ---------------------------------------------------------------------------

describe("calculateSelfEmployedTax", () => {
  it("includes business income in total income", () => {
    const result = calculateSelfEmployedTax({
      employmentIncome: 30000,
      businessIncome: 50000
    });
    expect(result.totalIncome).toBe(80000);
  });

  it("includes business expenses and home-use deductions", () => {
    const result = calculateSelfEmployedTax({
      businessIncome: 100000,
      businessExpenses: 30000,
      businessUseHome: 5000,
      rrsp: 10000
    });
    expect(result.totalDeductions).toBe(45000);
    expect(result.netIncome).toBe(55000);
  });

  it("breakdown includes self-employed specific items", () => {
    const result = calculateSelfEmployedTax({
      businessIncome: 60000,
      businessExpenses: 15000,
      businessUseHome: 3000
    });
    expect(result.breakdown.incomeItems.businessIncome).toBe(60000);
    expect(result.breakdown.deductionItems.businessExpenses).toBe(15000);
    expect(result.breakdown.deductionItems.businessUseHome).toBe(3000);
  });

  it("includes expanded income and credits for self-employed", () => {
    const result = calculateSelfEmployedTax({
      businessIncome: 80000,
      interestIncome: 1000,
      businessExpenses: 20000,
      tuition: 2000,
      canadaWorkersAmount: 300
    });
    expect(result.totalIncome).toBe(81000);
    expect(result.breakdown.creditItems.tuition).toBe(2000);
    expect(result.refundableCredits).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// Company tax calculation
// ---------------------------------------------------------------------------

describe("calculateCompanyTax", () => {
  it("returns zero tax for zero revenue", () => {
    const result = calculateCompanyTax({});
    expect(result.totalCorporateTax).toBe(0);
  });

  it("applies small business rate below $500k", () => {
    const result = calculateCompanyTax({ corporateRevenue: 200000 });
    // 200000 * 0.09 = 18000
    expect(result.smallBusinessTax).toBe(18000);
    expect(result.generalTax).toBe(0);
    expect(result.totalCorporateTax).toBe(18000);
  });

  it("applies general rate on income above $500k", () => {
    const result = calculateCompanyTax({ corporateRevenue: 700000 });
    // Small biz: 500000 * 0.09 = 45000
    // General: 200000 * 0.15 = 30000
    expect(result.smallBusinessTax).toBe(45000);
    expect(result.generalTax).toBe(30000);
    expect(result.totalCorporateTax).toBe(75000);
  });

  it("subtracts payroll and deductions from revenue", () => {
    const result = calculateCompanyTax({
      corporateRevenue: 600000,
      corporatePayroll: 200000,
      corporateDeductions: 50000
    });
    expect(result.totalDeductions).toBe(250000);
    expect(result.taxableIncome).toBe(350000);
    // 350000 * 0.09 = 31500
    expect(result.totalCorporateTax).toBe(31500);
  });

  it("taxable income never goes below zero", () => {
    const result = calculateCompanyTax({
      corporateRevenue: 100000,
      corporateDeductions: 200000
    });
    expect(result.taxableIncome).toBe(0);
    expect(result.totalCorporateTax).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Provincial tax calculation
// ---------------------------------------------------------------------------

describe("provincial tax calculation", () => {
  it("returns null provincial when no residencyProvince is provided", () => {
    const result = calculateIndividualTax({ employmentIncome: 80000 }, 2024);
    expect(result.provincial).toBeNull();
    expect(result.totalTax).toBe(result.netFederalTax);
  });

  it("computes Ontario provincial tax for $80k income", () => {
    const result = calculateIndividualTax({
      employmentIncome: 80000,
      residencyProvince: "ON"
    }, 2024);
    expect(result.provincial).not.toBeNull();
    expect(result.provincial!.provinceCode).toBe("ON");
    expect(result.provincial!.provinceName).toBe("Ontario");
    expect(result.provincial!.provincialTax).toBeGreaterThan(0);
    expect(result.provincial!.provincialBasicPersonalCredit).toBeCloseTo(11865 * 0.0505, 2);
    expect(result.provincial!.netProvincialTax).toBeGreaterThan(0);
    expect(result.totalTax).toBe(
      Math.round((result.netFederalTax + result.provincial!.netProvincialTax) * 100) / 100
    );
  });

  it("computes Ontario surtax for high earners", () => {
    const result = calculateIndividualTax({
      employmentIncome: 250000,
      residencyProvince: "ON"
    }, 2024);
    expect(result.provincial!.provincialSurtax).toBeGreaterThan(0);
  });

  it("computes BC provincial tax for $60k income", () => {
    const result = calculateIndividualTax({
      employmentIncome: 60000,
      residencyProvince: "BC"
    }, 2024);
    expect(result.provincial!.provinceCode).toBe("BC");
    // First bracket: 47937 * 0.0506, second bracket: (60000-47937) * 0.077
    expect(result.provincial!.provincialTax).toBeCloseTo(
      47937 * 0.0506 + (60000 - 47937) * 0.077, 2
    );
    expect(result.provincial!.provincialSurtax).toBe(0);
  });

  it("computes Alberta provincial tax — flat 10% first bracket", () => {
    const result = calculateIndividualTax({
      employmentIncome: 100000,
      residencyProvince: "AB"
    }, 2024);
    expect(result.provincial!.provinceCode).toBe("AB");
    // All within first bracket at 10%
    expect(result.provincial!.provincialTax).toBe(10000);
  });

  it("computes Quebec provincial tax", () => {
    const result = calculateIndividualTax({
      employmentIncome: 70000,
      residencyProvince: "QC"
    }, 2024);
    expect(result.provincial!.provinceCode).toBe("QC");
    expect(result.provincial!.provincialTax).toBeGreaterThan(0);
  });

  it("balanceOwing includes both federal and provincial tax", () => {
    const result = calculateIndividualTax({
      employmentIncome: 80000,
      residencyProvince: "ON",
      totalIncomeTaxDeducted: 15000
    }, 2024);
    expect(result.balanceOwing).toBe(
      Math.round((result.totalTax - result.refundableCredits - result.totalPayments) * 100) / 100
    );
  });

  it("applies provincial tax for self-employed filers", () => {
    const result = calculateSelfEmployedTax({
      businessIncome: 100000,
      businessExpenses: 20000,
      residencyProvince: "SK"
    }, 2024);
    expect(result.provincial).not.toBeNull();
    expect(result.provincial!.provinceCode).toBe("SK");
    expect(result.totalTax).toBeGreaterThan(result.netFederalTax);
  });

  it("returns null provincial for unknown province code", () => {
    const result = calculateIndividualTax({
      employmentIncome: 50000,
      residencyProvince: "XX"
    }, 2024);
    expect(result.provincial).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Unified calculateTax entry point
// ---------------------------------------------------------------------------

describe("calculateTax", () => {
  it("dispatches to individual calculation", () => {
    const result = calculateTax("INDIVIDUAL", { employmentIncome: 50000 });
    expect(result.mode).toBe("INDIVIDUAL");
    expect("totalIncome" in result.summary).toBe(true);
  });

  it("dispatches to self-employed calculation", () => {
    const result = calculateTax("SELF_EMPLOYED", { businessIncome: 80000 });
    expect(result.mode).toBe("SELF_EMPLOYED");
  });

  it("dispatches to company calculation", () => {
    const result = calculateTax("COMPANY", { corporateRevenue: 300000 });
    expect(result.mode).toBe("COMPANY");
    expect("totalCorporateTax" in result.summary).toBe(true);
  });
});
