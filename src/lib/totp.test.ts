import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-totp-encryption-key");

import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpToken,
  encryptSecret,
  decryptSecret,
  generateRecoveryCodes
} from "./totp";

describe("generateTotpSecret", () => {
  it("returns a base32 string", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    expect(secret.length).toBeGreaterThan(10);
  });
});

describe("generateTotpUri", () => {
  it("returns an otpauth URI with issuer and label", () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri(secret, "user@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("user%40example.com");
    expect(uri).toContain("Canada%20Tax%20Filing");
  });
});

describe("verifyTotpToken", () => {
  it("returns false for an obviously wrong token", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpToken(secret, "000000")).toBe(false);
  });
});

describe("encryptSecret / decryptSecret", () => {
  it("roundtrips a secret correctly", () => {
    const plaintext = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptSecret(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(":")).toHaveLength(3);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same input (random IV)", () => {
    const plaintext = "ABCDEF123456";
    const a = encryptSecret(plaintext);
    const b = encryptSecret(plaintext);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(plaintext);
    expect(decryptSecret(b)).toBe(plaintext);
  });
});

describe("generateRecoveryCodes", () => {
  it("generates the requested number of codes", () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
  });

  it("generates uppercase hex codes", () => {
    const codes = generateRecoveryCodes(4);
    codes.forEach((code) => {
      expect(code).toMatch(/^[0-9A-F]{8}$/);
    });
  });

  it("generates unique codes", () => {
    const codes = generateRecoveryCodes(8);
    expect(new Set(codes).size).toBe(8);
  });
});
