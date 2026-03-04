import { describe, it, expect } from "vitest";
import {
  getFormConfig,
  getFormMappings,
  getSupportedTaxYears,
  getFormLineForField
} from "@/lib/cra-form-mapping";

describe("cra-form-mapping", () => {
  it("returns config for supported tax year", () => {
    const config = getFormConfig(2024);
    expect(config).not.toBeNull();
    expect(config!.taxYear).toBe(2024);
    expect(config!.forms.T1).toBeDefined();
    expect(config!.forms.T2125).toBeDefined();
    expect(config!.forms.T2).toBeDefined();
  });

  it("returns null for unsupported tax year", () => {
    expect(getFormConfig(2010)).toBeNull();
  });

  it("returns INDIVIDUAL mappings with correct CRA line numbers", () => {
    const mappings = getFormMappings(2024, "INDIVIDUAL");
    expect(mappings.length).toBeGreaterThan(0);
    const employment = mappings.find((m) => m.fieldKey === "employmentIncome");
    expect(employment).toBeDefined();
    expect(employment!.lineNumber).toBe("10100");
    expect(employment!.formId).toBe("T1");
  });

  it("returns SELF_EMPLOYED mappings including T2125 fields", () => {
    const mappings = getFormMappings(2024, "SELF_EMPLOYED");
    const businessIncome = mappings.find((m) => m.fieldKey === "businessIncome");
    expect(businessIncome).toBeDefined();
    expect(businessIncome!.formId).toBe("T2125");
    expect(businessIncome!.lineNumber).toBe("8299");
  });

  it("returns COMPANY mappings with T2 form lines", () => {
    const mappings = getFormMappings(2024, "COMPANY");
    const revenue = mappings.find((m) => m.fieldKey === "corporateRevenue");
    expect(revenue).toBeDefined();
    expect(revenue!.formId).toBe("T2");
  });

  it("returns empty array for unsupported year", () => {
    expect(getFormMappings(2010, "INDIVIDUAL")).toEqual([]);
  });

  it("getSupportedTaxYears returns descending order", () => {
    const years = getSupportedTaxYears();
    expect(years.length).toBeGreaterThanOrEqual(2);
    expect(years[0]).toBeGreaterThan(years[years.length - 1]);
  });

  it("getFormLineForField finds specific field mapping", () => {
    const line = getFormLineForField(2024, "INDIVIDUAL", "rrsp");
    expect(line).not.toBeNull();
    expect(line!.lineNumber).toBe("20800");
  });

  it("getFormLineForField returns null for unknown field", () => {
    expect(getFormLineForField(2024, "INDIVIDUAL", "nonExistent")).toBeNull();
  });
});
