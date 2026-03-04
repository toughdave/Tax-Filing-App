import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-mfa-service");

const mockPrisma = vi.hoisted(() => ({
  totpDevice: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

import { startEnrollment, confirmEnrollment, disableMfa, isMfaEnabled, verifyMfaChallenge } from "./mfa-service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startEnrollment", () => {
  it("creates a new TOTP device for user without existing MFA", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue(null);
    mockPrisma.totpDevice.upsert.mockResolvedValue({ id: "td1" });

    const result = await startEnrollment("user1", "user@example.com");

    expect(result.secret).toBeTruthy();
    expect(result.uri).toContain("otpauth://totp/");
    expect(result.recoveryCodes).toHaveLength(8);
    expect(mockPrisma.totpDevice.upsert).toHaveBeenCalled();
  });

  it("throws if MFA is already verified", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue({ verified: true });

    await expect(startEnrollment("user1", "user@example.com"))
      .rejects.toThrow("MFA_ALREADY_ENABLED");
  });

  it("allows re-enrollment if previous device was not verified", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue({ verified: false });
    mockPrisma.totpDevice.upsert.mockResolvedValue({ id: "td1" });

    const result = await startEnrollment("user1", "user@example.com");
    expect(result.secret).toBeTruthy();
  });
});

describe("confirmEnrollment", () => {
  it("throws if no device exists", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue(null);

    await expect(confirmEnrollment("user1", "123456"))
      .rejects.toThrow("MFA_NOT_ENROLLED");
  });

  it("throws if device is already verified", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue({ verified: true });

    await expect(confirmEnrollment("user1", "123456"))
      .rejects.toThrow("MFA_ALREADY_ENABLED");
  });
});

describe("disableMfa", () => {
  it("deletes all TOTP devices for the user", async () => {
    mockPrisma.totpDevice.deleteMany.mockResolvedValue({ count: 1 });

    await disableMfa("user1");
    expect(mockPrisma.totpDevice.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user1" }
    });
  });
});

describe("isMfaEnabled", () => {
  it("returns true when verified device exists", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue({ verified: true });
    expect(await isMfaEnabled("user1")).toBe(true);
  });

  it("returns false when no device exists", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue(null);
    expect(await isMfaEnabled("user1")).toBe(false);
  });

  it("returns false when device is not verified", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue({ verified: false });
    expect(await isMfaEnabled("user1")).toBe(false);
  });
});

describe("verifyMfaChallenge", () => {
  it("returns false when no verified device exists", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue(null);
    expect(await verifyMfaChallenge("user1", "123456")).toBe(false);
  });

  it("accepts a valid recovery code and removes it", async () => {
    mockPrisma.totpDevice.findUnique.mockResolvedValue({
      verified: true,
      recoveryCodes: ["ABCD1234", "EFGH5678"],
      encryptedSecret: "dummy"
    });
    mockPrisma.totpDevice.update.mockResolvedValue({});

    const result = await verifyMfaChallenge("user1", "ABCD1234");
    expect(result).toBe(true);
    expect(mockPrisma.totpDevice.update).toHaveBeenCalledWith({
      where: { userId: "user1" },
      data: { recoveryCodes: ["EFGH5678"] }
    });
  });
});
