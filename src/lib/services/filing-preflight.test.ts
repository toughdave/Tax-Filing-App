import { describe, it, expect } from "vitest";
import { runPreflightChecks } from "@/lib/services/filing-preflight";

describe("filing-preflight", () => {
  const completeIndividualPayload = {
    legalName: "Jane Doe",
    sinLast4: "1234",
    birthDate: "1990-01-01",
    residencyProvince: "ON",
    maritalStatus: "single",
    employmentIncome: 50000,
    otherIncome: 0,
    rrsp: 5000,
    tuition: 0,
    medical: 0
  };

  it("passes all checks for a complete individual return", () => {
    const result = runPreflightChecks(2024, "INDIVIDUAL", completeIndividualPayload, true);
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("fails when tax year is unsupported", () => {
    const result = runPreflightChecks(2010, "INDIVIDUAL", completeIndividualPayload, true);
    expect(result.passed).toBe(false);
    const yearCheck = result.checks.find((c) => c.id === "tax_year_supported");
    expect(yearCheck?.passed).toBe(false);
  });

  it("fails when identity is incomplete", () => {
    const payload = { ...completeIndividualPayload, legalName: "" };
    const result = runPreflightChecks(2024, "INDIVIDUAL", payload, true);
    expect(result.passed).toBe(false);
    const idCheck = result.checks.find((c) => c.id === "identity_complete");
    expect(idCheck?.passed).toBe(false);
  });

  it("fails when no income is reported", () => {
    const payload = { ...completeIndividualPayload, employmentIncome: 0 };
    const result = runPreflightChecks(2024, "INDIVIDUAL", payload, true);
    expect(result.passed).toBe(false);
  });

  it("passes income check with alternative income sources", () => {
    const payload = { ...completeIndividualPayload, employmentIncome: 0, interestIncome: 500 };
    const result = runPreflightChecks(2024, "INDIVIDUAL", payload, true);
    const incomeCheck = result.checks.find((c) => c.id === "income_reported");
    expect(incomeCheck?.passed).toBe(true);
  });

  it("passes income check with pension income", () => {
    const payload = { ...completeIndividualPayload, employmentIncome: 0, pensionIncome: 12000 };
    const result = runPreflightChecks(2024, "INDIVIDUAL", payload, true);
    expect(result.passed).toBe(true);
  });

  it("documents check does not block submission", () => {
    const result = runPreflightChecks(2024, "INDIVIDUAL", completeIndividualPayload, false);
    expect(result.passed).toBe(true);
    const docCheck = result.checks.find((c) => c.id === "documents_attached");
    expect(docCheck?.passed).toBe(false);
  });

  it("company mode requires business number", () => {
    const companyPayload = {
      corporationName: "ACME Inc",
      businessNumber: "",
      fiscalYearEnd: "2024-12-31",
      corporateRevenue: 1000000,
      corporateDeductions: 200000,
      legalName: "ACME Inc",
      sinLast4: "5678",
      birthDate: "2000-01-01",
      residencyProvince: "BC"
    };
    const result = runPreflightChecks(2024, "COMPANY", companyPayload, true);
    const bnCheck = result.checks.find((c) => c.id === "business_number_present");
    expect(bnCheck).toBeDefined();
    expect(bnCheck?.passed).toBe(false);
  });
});
