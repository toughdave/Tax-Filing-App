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
      medical: 2000
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
      rrsp: 5000,
      tuition: 1000,
      medical: 500
    });
    expect(result.breakdown.incomeItems).toEqual({
      employmentIncome: 40000,
      otherIncome: 3000
    });
    expect(result.breakdown.deductionItems).toEqual({
      rrsp: 5000,
      tuition: 1000,
      medical: 500
    });
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
