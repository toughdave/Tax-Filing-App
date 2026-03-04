import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  recoveryRequest: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

import { submitRecoveryRequest, listRecoveryRequests } from "./recovery-service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitRecoveryRequest", () => {
  it("creates a new request when no pending one exists", async () => {
    mockPrisma.recoveryRequest.findFirst.mockResolvedValue(null);
    mockPrisma.recoveryRequest.create.mockResolvedValue({ id: "rr1" });

    const result = await submitRecoveryRequest({
      email: "  User@Example.com  ",
      fullName: "  Jane Doe  ",
      reason: "Lost access to Google account"
    });

    expect(result).toEqual({ id: "rr1", alreadyExists: false });
    expect(mockPrisma.recoveryRequest.create).toHaveBeenCalledWith({
      data: {
        email: "user@example.com",
        fullName: "Jane Doe",
        reason: "Lost access to Google account",
        ipAddress: null,
        userAgent: null
      }
    });
  });

  it("returns existing request when one is already pending", async () => {
    mockPrisma.recoveryRequest.findFirst.mockResolvedValue({ id: "rr-existing" });

    const result = await submitRecoveryRequest({
      email: "user@example.com",
      fullName: "Jane Doe",
      reason: "Lost access"
    });

    expect(result).toEqual({ id: "rr-existing", alreadyExists: true });
    expect(mockPrisma.recoveryRequest.create).not.toHaveBeenCalled();
  });

  it("passes IP and user agent when provided", async () => {
    mockPrisma.recoveryRequest.findFirst.mockResolvedValue(null);
    mockPrisma.recoveryRequest.create.mockResolvedValue({ id: "rr2" });

    await submitRecoveryRequest({
      email: "user@example.com",
      fullName: "Jane Doe",
      reason: "Lost access",
      ipAddress: "1.2.3.4",
      userAgent: "TestBrowser/1.0"
    });

    expect(mockPrisma.recoveryRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: "1.2.3.4",
        userAgent: "TestBrowser/1.0"
      })
    });
  });
});

describe("listRecoveryRequests", () => {
  it("returns all requests when no status filter is given", async () => {
    const mockData = [{ id: "rr1", email: "a@b.com", status: "SUBMITTED" }];
    mockPrisma.recoveryRequest.findMany.mockResolvedValue(mockData);

    const result = await listRecoveryRequests();
    expect(result).toEqual(mockData);
    expect(mockPrisma.recoveryRequest.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        reason: true,
        status: true,
        createdAt: true,
        reviewedAt: true
      }
    });
  });

  it("filters by status when provided", async () => {
    mockPrisma.recoveryRequest.findMany.mockResolvedValue([]);

    await listRecoveryRequests("SUBMITTED");
    expect(mockPrisma.recoveryRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "SUBMITTED" }
      })
    );
  });
});
