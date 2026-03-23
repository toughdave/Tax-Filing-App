import { describe, it, expect } from "vitest";
import {
  NoOpOcrProvider,
  NoOpCraImportProvider,
  getOcrProvider,
  getCraImportProvider,
  getSlipFieldMap,
  mergeExtractedIntoPayload,
  type ExtractedSlipData
} from "./ocr-import-service";

describe("NoOpOcrProvider", () => {
  it("returns OCR_NOT_CONFIGURED", async () => {
    const provider = new NoOpOcrProvider();
    const result = await provider.extractFromDocument(Buffer.from(""), "application/pdf", "T4_SLIP");
    expect(result.success).toBe(false);
    expect(result.error).toBe("OCR_NOT_CONFIGURED");
    expect(result.data).toBeNull();
  });
});

describe("NoOpCraImportProvider", () => {
  it("reports not configured", () => {
    const provider = new NoOpCraImportProvider();
    expect(provider.isConfigured()).toBe(false);
  });

  it("returns CRA_IMPORT_NOT_CONFIGURED", async () => {
    const provider = new NoOpCraImportProvider();
    const result = await provider.fetchSlips("user1", 2025, "token");
    expect(result.success).toBe(false);
    expect(result.error).toBe("CRA_IMPORT_NOT_CONFIGURED");
    expect(result.slips).toEqual([]);
  });
});

describe("getOcrProvider", () => {
  it("returns NoOp when OCR_PROVIDER is unset", () => {
    const provider = getOcrProvider();
    expect(provider.name).toBe("noop-ocr");
  });
});

describe("getCraImportProvider", () => {
  it("returns NoOp when CRA_AFR_ENABLED is unset", () => {
    const provider = getCraImportProvider();
    expect(provider.name).toBe("noop-cra-import");
  });
});

describe("getSlipFieldMap", () => {
  it("returns T4 field mappings", () => {
    const map = getSlipFieldMap("T4");
    expect(map["Box 14"]).toBe("employmentIncome");
    expect(map["Box 16"]).toBe("cppEmployeeContributions");
    expect(map["Box 18"]).toBe("eiPremiums");
    expect(map["Box 22"]).toBe("totalIncomeTaxDeducted");
  });

  it("returns T5 field mappings", () => {
    const map = getSlipFieldMap("T5");
    expect(map["Box 13"]).toBe("interestIncome");
    expect(map["Box 25"]).toBe("dividendIncome");
  });

  it("returns empty map for unknown slip type", () => {
    expect(getSlipFieldMap("UNKNOWN")).toEqual({});
  });
});

describe("mergeExtractedIntoPayload", () => {
  const extracted: ExtractedSlipData = {
    slipType: "T4",
    taxYear: 2025,
    issuerName: "Acme Corp",
    fields: [
      { key: "employmentIncome", value: 65000, confidence: 0.95 },
      { key: "totalIncomeTaxDeducted", value: 12000, confidence: 0.90 },
      { key: "unionDues", value: 500, confidence: 0.4 } // below threshold
    ]
  };

  it("merges high-confidence fields into empty payload", () => {
    const { merged, appliedFields, skippedFields } = mergeExtractedIntoPayload({}, extracted);
    expect(merged.employmentIncome).toBe(65000);
    expect(merged.totalIncomeTaxDeducted).toBe(12000);
    expect(appliedFields).toContain("employmentIncome");
    expect(appliedFields).toContain("totalIncomeTaxDeducted");
    expect(skippedFields).toContain("unionDues"); // low confidence
  });

  it("does not overwrite existing non-empty values", () => {
    const existing = { employmentIncome: 70000 };
    const { merged, appliedFields, skippedFields } = mergeExtractedIntoPayload(existing, extracted);
    expect(merged.employmentIncome).toBe(70000); // kept original
    expect(skippedFields).toContain("employmentIncome");
    expect(appliedFields).not.toContain("employmentIncome");
  });

  it("overwrites zero or null values", () => {
    const existing = { employmentIncome: 0, totalIncomeTaxDeducted: null };
    const { merged, appliedFields } = mergeExtractedIntoPayload(existing, extracted);
    expect(merged.employmentIncome).toBe(65000);
    expect(merged.totalIncomeTaxDeducted).toBe(12000);
    expect(appliedFields).toContain("employmentIncome");
  });

  it("respects custom confidence threshold", () => {
    const { appliedFields, skippedFields } = mergeExtractedIntoPayload({}, extracted, 0.3);
    expect(appliedFields).toContain("unionDues"); // 0.4 > 0.3
    expect(skippedFields).not.toContain("unionDues");
  });
});
