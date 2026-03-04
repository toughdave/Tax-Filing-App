import { describe, it, expect } from "vitest";
import {
  getTaxYearParams,
  getDefaultTaxYear,
  getSupportedTaxYears
} from "@/lib/tax-year-config";

describe("tax-year-config", () => {
  it("returns params for 2024", () => {
    const params = getTaxYearParams(2024);
    expect(params).not.toBeNull();
    expect(params!.taxYear).toBe(2024);
    expect(params!.federalBrackets.length).toBe(5);
    expect(params!.basicPersonalAmount).toBe(15705);
    expect(params!.rrspLimit).toBe(31560);
  });

  it("returns params for 2025", () => {
    const params = getTaxYearParams(2025);
    expect(params).not.toBeNull();
    expect(params!.basicPersonalAmount).toBe(16129);
  });

  it("returns null for unsupported year", () => {
    expect(getTaxYearParams(2010)).toBeNull();
  });

  it("brackets are ordered by threshold ascending", () => {
    const params = getTaxYearParams(2024)!;
    for (let i = 1; i < params.federalBrackets.length; i++) {
      expect(params.federalBrackets[i].upTo).toBeGreaterThan(params.federalBrackets[i - 1].upTo);
    }
  });

  it("getDefaultTaxYear returns a reasonable year", () => {
    const year = getDefaultTaxYear();
    const now = new Date().getFullYear();
    expect(year).toBeGreaterThanOrEqual(now - 1);
    expect(year).toBeLessThanOrEqual(now);
  });

  it("getSupportedTaxYears returns descending order", () => {
    const years = getSupportedTaxYears();
    expect(years.length).toBeGreaterThanOrEqual(3);
    expect(years[0]).toBeGreaterThan(years[years.length - 1]);
  });

  it("small business rate is consistent across years", () => {
    const years = getSupportedTaxYears();
    for (const y of years) {
      const p = getTaxYearParams(y)!;
      expect(p.smallBusinessRate).toBe(0.09);
      expect(p.smallBusinessLimit).toBe(500000);
    }
  });
});
