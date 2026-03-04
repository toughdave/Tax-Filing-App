import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  consentRecord: {
    findFirst: vi.fn(),
    createMany: vi.fn(),
    create: vi.fn()
  },
  dataRequest: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

import {
  currentConsentVersion,
  hasCurrentConsent,
  getUserConsentStatus,
  recordConsent,
  revokeConsent,
  createDataRequest,
  listDataRequests
} from "./consent-service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("currentConsentVersion", () => {
  it("returns a version string for each consent type", () => {
    expect(currentConsentVersion("TERMS_OF_SERVICE")).toBe("1.0");
    expect(currentConsentVersion("PRIVACY_POLICY")).toBe("1.0");
    expect(currentConsentVersion("DATA_PROCESSING")).toBe("1.0");
  });
});

describe("hasCurrentConsent", () => {
  it("returns true when a granted record exists for the current version", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue({ id: "cr1" });
    const result = await hasCurrentConsent("user1", "TERMS_OF_SERVICE");
    expect(result).toBe(true);
    expect(mockPrisma.consentRecord.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        consentType: "TERMS_OF_SERVICE",
        version: "1.0",
        granted: true
      },
      orderBy: { createdAt: "desc" }
    });
  });

  it("returns false when no matching record exists", async () => {
    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);
    const result = await hasCurrentConsent("user1", "PRIVACY_POLICY");
    expect(result).toBe(false);
  });
});

describe("getUserConsentStatus", () => {
  it("returns all three consent statuses", async () => {
    mockPrisma.consentRecord.findFirst
      .mockResolvedValueOnce({ id: "cr1" })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "cr3" });

    const status = await getUserConsentStatus("user1");
    expect(status).toEqual({
      termsOfService: true,
      privacyPolicy: false,
      dataProcessing: true
    });
  });
});

describe("recordConsent", () => {
  it("creates consent records for multiple types", async () => {
    mockPrisma.consentRecord.createMany.mockResolvedValue({ count: 2 });
    await recordConsent("user1", ["TERMS_OF_SERVICE", "PRIVACY_POLICY"], "1.2.3.4", "TestAgent");

    expect(mockPrisma.consentRecord.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user1",
          consentType: "TERMS_OF_SERVICE",
          version: "1.0",
          granted: true,
          ipAddress: "1.2.3.4",
          userAgent: "TestAgent"
        },
        {
          userId: "user1",
          consentType: "PRIVACY_POLICY",
          version: "1.0",
          granted: true,
          ipAddress: "1.2.3.4",
          userAgent: "TestAgent"
        }
      ]
    });
  });
});

describe("revokeConsent", () => {
  it("creates a revocation record", async () => {
    mockPrisma.consentRecord.create.mockResolvedValue({ id: "cr-rev" });
    await revokeConsent("user1", "DATA_PROCESSING", "1.2.3.4");

    expect(mockPrisma.consentRecord.create).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        consentType: "DATA_PROCESSING",
        version: "1.0",
        granted: false,
        ipAddress: "1.2.3.4",
        userAgent: null
      }
    });
  });
});

describe("createDataRequest", () => {
  it("creates a new request when none is pending", async () => {
    mockPrisma.dataRequest.findFirst.mockResolvedValue(null);
    mockPrisma.dataRequest.create.mockResolvedValue({ id: "dr1" });

    const result = await createDataRequest("user1", "EXPORT", "Want my data");
    expect(result).toEqual({ id: "dr1" });
    expect(mockPrisma.dataRequest.create).toHaveBeenCalled();
  });

  it("returns existing request ID when one is already pending", async () => {
    mockPrisma.dataRequest.findFirst.mockResolvedValue({ id: "dr-existing" });

    const result = await createDataRequest("user1", "DELETION");
    expect(result).toEqual({ id: "dr-existing" });
    expect(mockPrisma.dataRequest.create).not.toHaveBeenCalled();
  });
});

describe("listDataRequests", () => {
  it("returns sorted data requests for user", async () => {
    const mockRequests = [
      { id: "dr1", requestType: "EXPORT", status: "COMPLETED", createdAt: new Date(), processedAt: new Date() }
    ];
    mockPrisma.dataRequest.findMany.mockResolvedValue(mockRequests);

    const result = await listDataRequests("user1");
    expect(result).toEqual(mockRequests);
    expect(mockPrisma.dataRequest.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        requestType: true,
        status: true,
        createdAt: true,
        processedAt: true
      }
    });
  });
});
