import { describe, it, expect } from "vitest";
import {
  isCarryForwardField,
  getCarryForwardFieldKeys,
  buildCarryForwardData,
  computeCarryForwardDiff
} from "./carry-forward-config";

describe("isCarryForwardField", () => {
  it("returns true for identity/profile fields", () => {
    expect(isCarryForwardField("legalName")).toBe(true);
    expect(isCarryForwardField("sinLast4")).toBe(true);
    expect(isCarryForwardField("birthDate")).toBe(true);
    expect(isCarryForwardField("residencyProvince")).toBe(true);
    expect(isCarryForwardField("maritalStatus")).toBe(true);
    expect(isCarryForwardField("dependants")).toBe(true);
  });

  it("returns true for company identity fields", () => {
    expect(isCarryForwardField("corporationName")).toBe(true);
    expect(isCarryForwardField("businessNumber")).toBe(true);
    expect(isCarryForwardField("fiscalYearEnd")).toBe(true);
  });

  it("returns false for income fields", () => {
    expect(isCarryForwardField("employmentIncome")).toBe(false);
    expect(isCarryForwardField("capitalGains")).toBe(false);
    expect(isCarryForwardField("businessIncome")).toBe(false);
    expect(isCarryForwardField("rentalIncome")).toBe(false);
    expect(isCarryForwardField("pensionIncome")).toBe(false);
  });

  it("returns false for deduction fields", () => {
    expect(isCarryForwardField("rrsp")).toBe(false);
    expect(isCarryForwardField("childCareExpenses")).toBe(false);
    expect(isCarryForwardField("unionDues")).toBe(false);
  });

  it("returns false for credit and payment fields", () => {
    expect(isCarryForwardField("tuition")).toBe(false);
    expect(isCarryForwardField("donations")).toBe(false);
    expect(isCarryForwardField("totalIncomeTaxDeducted")).toBe(false);
    expect(isCarryForwardField("taxPaidByInstalments")).toBe(false);
  });

  it("returns false for corporate amount fields", () => {
    expect(isCarryForwardField("corporateRevenue")).toBe(false);
    expect(isCarryForwardField("gstHstCollected")).toBe(false);
    expect(isCarryForwardField("employeeCount")).toBe(false);
  });

  it("returns false for unknown fields", () => {
    expect(isCarryForwardField("randomField")).toBe(false);
    expect(isCarryForwardField("")).toBe(false);
  });
});

describe("getCarryForwardFieldKeys", () => {
  it("returns the expected set of profile fields", () => {
    const keys = getCarryForwardFieldKeys();
    expect(keys.size).toBe(9);
    expect(keys.has("legalName")).toBe(true);
    expect(keys.has("corporationName")).toBe(true);
    expect(keys.has("employmentIncome")).toBe(false);
  });
});

describe("buildCarryForwardData", () => {
  it("keeps only profile fields from prior-year data", () => {
    const priorYear = {
      legalName: "Alice Smith",
      sinLast4: "1234",
      birthDate: "1990-01-01",
      residencyProvince: "ON",
      employmentIncome: 85000,
      rrsp: 12000,
      capitalGains: 5000,
      donations: 500,
      totalIncomeTaxDeducted: 18000
    };

    const carried = buildCarryForwardData(priorYear);

    expect(carried).toEqual({
      legalName: "Alice Smith",
      sinLast4: "1234",
      birthDate: "1990-01-01",
      residencyProvince: "ON"
    });
  });

  it("excludes null and undefined values even for profile fields", () => {
    const priorYear = {
      legalName: "Bob",
      sinLast4: null,
      maritalStatus: undefined,
      residencyProvince: "BC"
    };

    const carried = buildCarryForwardData(priorYear);
    expect(carried).toEqual({
      legalName: "Bob",
      residencyProvince: "BC"
    });
  });

  it("carries company identity fields for COMPANY mode data", () => {
    const priorYear = {
      legalName: "Jane",
      sinLast4: "5678",
      birthDate: "1985-06-15",
      residencyProvince: "ON",
      corporationName: "Acme Corp",
      businessNumber: "BN123456",
      fiscalYearEnd: "2023-12-31",
      corporateRevenue: 1000000,
      corporateDeductions: 200000,
      gstHstCollected: 50000
    };

    const carried = buildCarryForwardData(priorYear);
    expect(carried).toEqual({
      legalName: "Jane",
      sinLast4: "5678",
      birthDate: "1985-06-15",
      residencyProvince: "ON",
      corporationName: "Acme Corp",
      businessNumber: "BN123456",
      fiscalYearEnd: "2023-12-31"
    });
    expect(carried).not.toHaveProperty("corporateRevenue");
    expect(carried).not.toHaveProperty("gstHstCollected");
  });

  it("returns empty object for empty input", () => {
    expect(buildCarryForwardData({})).toEqual({});
  });
});

describe("computeCarryForwardDiff", () => {
  it("marks profile fields as carried when unchanged", () => {
    const prior = { legalName: "Alice", residencyProvince: "ON" };
    const current = { legalName: "Alice", residencyProvince: "ON", employmentIncome: 80000 };

    const diff = computeCarryForwardDiff(prior, current, "INDIVIDUAL");

    const carried = diff.filter((d) => d.source === "carried");
    expect(carried.map((d) => d.key).sort()).toEqual(["legalName", "residencyProvince"]);

    const newEntries = diff.filter((d) => d.source === "new");
    expect(newEntries.map((d) => d.key)).toEqual(["employmentIncome"]);
  });

  it("marks profile fields as changed when values differ", () => {
    const prior = { legalName: "Alice", residencyProvince: "ON" };
    const current = { legalName: "Alice", residencyProvince: "BC" };

    const diff = computeCarryForwardDiff(prior, current, "INDIVIDUAL");

    const changed = diff.find((d) => d.key === "residencyProvince");
    expect(changed?.source).toBe("changed");
    expect(changed?.priorValue).toBe("ON");
    expect(changed?.currentValue).toBe("BC");
  });

  it("carries forward profile fields missing in current payload", () => {
    const prior = { legalName: "Alice", residencyProvince: "ON", maritalStatus: "Single" };
    const current = { legalName: "Alice" };

    const diff = computeCarryForwardDiff(prior, current, "INDIVIDUAL");

    const carriedProvince = diff.find((d) => d.key === "residencyProvince");
    expect(carriedProvince?.source).toBe("carried");
    expect(carriedProvince?.currentValue).toBe("ON");

    const carriedMarital = diff.find((d) => d.key === "maritalStatus");
    expect(carriedMarital?.source).toBe("carried");
    expect(carriedMarital?.currentValue).toBe("Single");
  });

  it("marks all fields as new when no prior data", () => {
    const current = { legalName: "Bob", employmentIncome: 60000 };

    const diff = computeCarryForwardDiff(null, current, "INDIVIDUAL");
    expect(diff.every((d) => d.source === "new")).toBe(true);
  });

  it("handles year-specific fields as always new", () => {
    const prior = { legalName: "Alice", employmentIncome: 50000, rrsp: 5000 };
    const current = { legalName: "Alice", employmentIncome: 60000, rrsp: 8000 };

    const diff = computeCarryForwardDiff(prior, current, "INDIVIDUAL");

    const incomeEntry = diff.find((d) => d.key === "employmentIncome");
    expect(incomeEntry?.source).toBe("new");

    const rrspEntry = diff.find((d) => d.key === "rrsp");
    expect(rrspEntry?.source).toBe("new");
  });
});
