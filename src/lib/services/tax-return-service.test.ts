import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-tax-return-service");

import { sanitizePayload, missingRequiredFields } from "./tax-return-service";
import { decryptPiiValue } from "@/lib/pii-crypto";

// ---------------------------------------------------------------------------
// Unit tests for pure domain helpers (no Prisma dependency)
// ---------------------------------------------------------------------------

describe("sanitizePayload", () => {
  it("trims strings and keeps non-empty values", () => {
    const result = sanitizePayload({ name: "  Alice  ", city: "Ottawa" });
    expect(result).toEqual({ name: "Alice", city: "Ottawa" });
  });

  it("converts whitespace-only strings to null", () => {
    const result = sanitizePayload({ name: "   ", empty: "" });
    expect(result).toEqual({ name: null, empty: null });
  });

  it("passes through finite numbers", () => {
    const result = sanitizePayload({ income: 50000, deductions: 0 });
    expect(result).toEqual({ income: 50000, deductions: 0 });
  });

  it("converts non-finite numbers to null", () => {
    const result = sanitizePayload({ a: Infinity, b: NaN, c: -Infinity });
    expect(result).toEqual({ a: null, b: null, c: null });
  });

  it("passes through booleans and null", () => {
    const result = sanitizePayload({ flag: true, other: false, empty: null });
    expect(result).toEqual({ flag: true, other: false, empty: null });
  });

  it("drops values of unsupported types (objects, arrays, undefined)", () => {
    const result = sanitizePayload({
      obj: { nested: true },
      arr: [1, 2],
      undef: undefined,
      valid: "kept"
    });
    expect(result).toEqual({ valid: "kept" });
  });

  it("returns empty object for empty input", () => {
    expect(sanitizePayload({})).toEqual({});
  });
});

describe("missingRequiredFields", () => {
  describe("INDIVIDUAL mode", () => {
    const mode = "INDIVIDUAL" as const;

    it("returns all required fields when payload is empty", () => {
      const missing = missingRequiredFields(mode, {});
      expect(missing).toEqual(["legalName", "sinLast4", "birthDate", "residencyProvince"]);
    });

    it("returns empty array when all required fields are present", () => {
      const payload = {
        legalName: "Alice",
        sinLast4: "1234",
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      };
      const missing = missingRequiredFields(mode, payload);
      expect(missing).toEqual([]);
    });

    it("detects null values as missing", () => {
      const payload = {
        legalName: "Alice",
        sinLast4: null,
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      };
      expect(missingRequiredFields(mode, payload)).toEqual(["sinLast4"]);
    });

    it("detects empty/whitespace strings as missing", () => {
      const payload = {
        legalName: "   ",
        sinLast4: "",
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      };
      expect(missingRequiredFields(mode, payload)).toEqual(["legalName", "sinLast4"]);
    });

    it("accepts numeric zero as present", () => {
      const payload = {
        legalName: "Alice",
        sinLast4: 0,
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      };
      expect(missingRequiredFields(mode, payload)).toEqual([]);
    });
  });

  describe("SELF_EMPLOYED mode", () => {
    const mode = "SELF_EMPLOYED" as const;

    it("requires business fields in addition to personal fields", () => {
      const payload = {
        legalName: "Bob",
        sinLast4: "5678",
        birthDate: "1985-06-15",
        residencyProvince: "BC"
      };
      const missing = missingRequiredFields(mode, payload);
      expect(missing).toEqual(["businessIncome", "businessExpenses"]);
    });

    it("returns empty when all self-employed fields are present", () => {
      const payload = {
        legalName: "Bob",
        sinLast4: "5678",
        birthDate: "1985-06-15",
        residencyProvince: "BC",
        businessIncome: 75000,
        businessExpenses: 20000
      };
      expect(missingRequiredFields(mode, payload)).toEqual([]);
    });
  });

  describe("COMPANY mode", () => {
    const mode = "COMPANY" as const;

    it("requires base identity + company-specific fields", () => {
      const missing = missingRequiredFields(mode, {});
      expect(missing).toEqual([
        "legalName", "sinLast4", "birthDate", "residencyProvince",
        "corporationName", "businessNumber", "fiscalYearEnd", "corporateRevenue"
      ]);
    });

    it("returns empty when all required fields are present", () => {
      const payload = {
        legalName: "Jane Smith",
        sinLast4: "1234",
        birthDate: "1985-06-15",
        residencyProvince: "ON",
        corporationName: "Acme Corp",
        businessNumber: "BN123456",
        fiscalYearEnd: "2024-12-31",
        corporateRevenue: 1000000
      };
      expect(missingRequiredFields(mode, payload)).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration-style tests for saveReturnForUser (mocked Prisma)
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    taxReturn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn()
    },
    document: {
      count: vi.fn().mockResolvedValue(0)
    }
  }
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma
}));

vi.mock("@/lib/submission-providers", () => ({
  getSubmissionProvider: () => ({
    name: "test-provider",
    prepare: vi.fn().mockResolvedValue({
      status: "SUBMISSION_PENDING",
      externalReference: "TEST-REF-001",
      message: "Test submission queued."
    })
  })
}));

vi.mock("@/lib/services/filing-preflight", () => ({
  runPreflightChecks: () => ({ passed: true, checks: [] })
}));

describe("saveReturnForUser", () => {
  let saveReturnForUser: typeof import("./tax-return-service").saveReturnForUser;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("./tax-return-service");
    saveReturnForUser = mod.saveReturnForUser;
  });

  it("sets status to DRAFT when required fields are missing", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue(null);
    mockPrisma.taxReturn.upsert.mockResolvedValue({
      id: "ret-1",
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      status: "DRAFT",
      data: { legalName: "Alice" },
      updatedAt: new Date()
    });

    const result = await saveReturnForUser("user-1", {
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      payload: { legalName: "Alice" }
    });

    expect(result.record.status).toBe("DRAFT");
    expect(result.missingRequired.length).toBeGreaterThan(0);
    expect(result.carryForwardFromYear).toBeNull();
  });

  it("sets status to READY_TO_REVIEW when all required fields are present", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue(null);
    mockPrisma.taxReturn.upsert.mockResolvedValue({
      id: "ret-2",
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      status: "READY_TO_REVIEW",
      data: {
        legalName: "Alice",
        sinLast4: "1234",
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      },
      updatedAt: new Date()
    });

    const result = await saveReturnForUser("user-1", {
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      payload: {
        legalName: "Alice",
        sinLast4: "1234",
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      }
    });

    expect(result.record.status).toBe("READY_TO_REVIEW");
    expect(result.missingRequired).toEqual([]);
  });

  it("merges only profile fields from prior year return (excludes income/deductions)", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue({
      id: "ret-prev",
      taxYear: 2023,
      data: {
        legalName: "Alice",
        residencyProvince: "ON",
        employmentIncome: 85000,
        rrsp: 12000,
        capitalGains: 5000,
        donations: 500
      }
    });
    mockPrisma.taxReturn.upsert.mockImplementation(
      async (args: { create: { data: unknown } }) => ({
        id: "ret-3",
        taxYear: 2024,
        filingMode: "INDIVIDUAL",
        status: "DRAFT",
        data: args.create.data,
        updatedAt: new Date()
      })
    );

    const result = await saveReturnForUser("user-1", {
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      payload: { sinLast4: "1234" }
    });

    expect(result.carryForwardFromYear).toBe(2023);

    const upsertCall = mockPrisma.taxReturn.upsert.mock.calls[0][0];
    const mergedData = upsertCall.create.data as Record<string, unknown>;

    // Profile PII fields carried forward and encrypted
    expect((mergedData.legalName as string).startsWith("enc:")).toBe(true);
    expect(decryptPiiValue(mergedData.legalName as string)).toBe("Alice");
    expect(mergedData.residencyProvince).toBe("ON");
    expect((mergedData.sinLast4 as string).startsWith("enc:")).toBe(true);
    expect(decryptPiiValue(mergedData.sinLast4 as string)).toBe("1234");

    // Year-specific fields NOT carried forward
    expect(mergedData.employmentIncome).toBeUndefined();
    expect(mergedData.rrsp).toBeUndefined();
    expect(mergedData.capitalGains).toBeUndefined();
    expect(mergedData.donations).toBeUndefined();
  });

  it("returns carryForwardDiff with carried/new/changed entries", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue({
      id: "ret-prev",
      taxYear: 2023,
      data: { legalName: "Alice", residencyProvince: "ON", birthDate: "1990-01-01" }
    });
    mockPrisma.taxReturn.upsert.mockImplementation(
      async (args: { create: { data: unknown } }) => ({
        id: "ret-diff",
        taxYear: 2024,
        filingMode: "INDIVIDUAL",
        status: "DRAFT",
        data: args.create.data,
        updatedAt: new Date()
      })
    );

    const result = await saveReturnForUser("user-1", {
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      payload: { legalName: "Alice", residencyProvince: "BC", employmentIncome: 60000 }
    });

    expect(result.carryForwardDiff).toBeDefined();
    const diff = result.carryForwardDiff;

    // legalName unchanged → carried
    const nameEntry = diff.find((d) => d.key === "legalName");
    expect(nameEntry?.source).toBe("carried");

    // residencyProvince changed ON→BC
    const provEntry = diff.find((d) => d.key === "residencyProvince");
    expect(provEntry?.source).toBe("changed");
    expect(provEntry?.priorValue).toBe("ON");
    expect(provEntry?.currentValue).toBe("BC");

    // employmentIncome is year-specific → new
    const incomeEntry = diff.find((d) => d.key === "employmentIncome");
    expect(incomeEntry?.source).toBe("new");

    // birthDate from prior year carried forward (absent in current payload but still present in merged)
    const bdEntry = diff.find((d) => d.key === "birthDate");
    expect(bdEntry?.source).toBe("carried");
  });

  it("current-year data overrides carry-forward data", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue({
      id: "ret-prev",
      taxYear: 2023,
      data: { legalName: "Old Name", residencyProvince: "ON" }
    });
    mockPrisma.taxReturn.upsert.mockImplementation(
      async (args: { create: { data: unknown } }) => ({
        id: "ret-4",
        taxYear: 2024,
        filingMode: "INDIVIDUAL",
        status: "DRAFT",
        data: args.create.data,
        updatedAt: new Date()
      })
    );

    await saveReturnForUser("user-1", {
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      payload: { legalName: "New Name" }
    });

    const upsertCall = mockPrisma.taxReturn.upsert.mock.calls[0][0];
    expect(upsertCall.create.data.residencyProvince).toBe("ON");
    expect(typeof upsertCall.create.data.legalName).toBe("string");
    expect(upsertCall.create.data.legalName.startsWith("enc:")).toBe(true);
  });
});

describe("prepareSubmissionForUser", () => {
  let prepareSubmissionForUser: typeof import("./tax-return-service").prepareSubmissionForUser;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("./tax-return-service");
    prepareSubmissionForUser = mod.prepareSubmissionForUser;
  });

  it("throws RETURN_NOT_FOUND when return does not exist", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue(null);

    await expect(
      prepareSubmissionForUser("user-1", "nonexistent")
    ).rejects.toThrow("RETURN_NOT_FOUND");
  });

  it("throws RETURN_INCOMPLETE when required fields are missing", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue({
      id: "ret-5",
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      data: { legalName: "Alice" }
    });

    await expect(
      prepareSubmissionForUser("user-1", "ret-5")
    ).rejects.toThrow(/^RETURN_INCOMPLETE/);
  });

  it("updates status to SUBMISSION_PENDING on success", async () => {
    mockPrisma.taxReturn.findFirst.mockResolvedValue({
      id: "ret-6",
      taxYear: 2024,
      filingMode: "INDIVIDUAL",
      data: {
        legalName: "Alice",
        sinLast4: "1234",
        birthDate: "1990-01-01",
        residencyProvince: "ON"
      }
    });
    mockPrisma.taxReturn.update.mockResolvedValue({
      id: "ret-6",
      status: "SUBMISSION_PENDING",
      externalSubmissionRef: "TEST-REF-001",
      updatedAt: new Date()
    });

    const result = await prepareSubmissionForUser("user-1", "ret-6");

    expect(result.status).toBe("SUBMISSION_PENDING");
    expect(result.externalSubmissionRef).toBe("TEST-REF-001");
    expect(result.provider).toBe("test-provider");
  });
});
