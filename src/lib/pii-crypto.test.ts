import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-pii-encryption");

import {
  isPiiField,
  encryptPiiValue,
  decryptPiiValue,
  encryptPiiFields,
  decryptPiiFields
} from "@/lib/pii-crypto";

describe("pii-crypto", () => {
  describe("isPiiField", () => {
    it("identifies PII fields", () => {
      expect(isPiiField("legalName")).toBe(true);
      expect(isPiiField("sinLast4")).toBe(true);
      expect(isPiiField("birthDate")).toBe(true);
    });

    it("rejects non-PII fields", () => {
      expect(isPiiField("employmentIncome")).toBe(false);
      expect(isPiiField("residencyProvince")).toBe(false);
      expect(isPiiField("filingMode")).toBe(false);
    });
  });

  describe("encryptPiiValue / decryptPiiValue", () => {
    it("round-trips a string value", () => {
      const plaintext = "Jane Doe";
      const encrypted = encryptPiiValue(plaintext);
      expect(encrypted).toMatch(/^enc:/);
      expect(encrypted).not.toContain(plaintext);
      expect(decryptPiiValue(encrypted)).toBe(plaintext);
    });

    it("produces different ciphertexts for same input (random IV)", () => {
      const a = encryptPiiValue("test");
      const b = encryptPiiValue("test");
      expect(a).not.toBe(b);
      expect(decryptPiiValue(a)).toBe("test");
      expect(decryptPiiValue(b)).toBe("test");
    });

    it("returns plaintext if value is not encrypted", () => {
      expect(decryptPiiValue("plain value")).toBe("plain value");
    });

    it("handles empty string", () => {
      const encrypted = encryptPiiValue("");
      expect(decryptPiiValue(encrypted)).toBe("");
    });

    it("handles unicode characters", () => {
      const name = "José García-López";
      const encrypted = encryptPiiValue(name);
      expect(decryptPiiValue(encrypted)).toBe(name);
    });
  });

  describe("encryptPiiFields / decryptPiiFields", () => {
    it("encrypts only PII fields in a data object", () => {
      const data = {
        legalName: "Alice Smith",
        sinLast4: "1234",
        birthDate: "1990-05-15",
        employmentIncome: 75000,
        residencyProvince: "ON"
      };

      const encrypted = encryptPiiFields(data);
      expect(typeof encrypted.legalName).toBe("string");
      expect((encrypted.legalName as string).startsWith("enc:")).toBe(true);
      expect((encrypted.sinLast4 as string).startsWith("enc:")).toBe(true);
      expect((encrypted.birthDate as string).startsWith("enc:")).toBe(true);
      expect(encrypted.employmentIncome).toBe(75000);
      expect(encrypted.residencyProvince).toBe("ON");
    });

    it("round-trips through encrypt then decrypt", () => {
      const original = {
        legalName: "Bob Johnson",
        sinLast4: "5678",
        birthDate: "1985-12-01",
        employmentIncome: 50000
      };

      const encrypted = encryptPiiFields(original);
      const decrypted = decryptPiiFields(encrypted);
      expect(decrypted.legalName).toBe("Bob Johnson");
      expect(decrypted.sinLast4).toBe("5678");
      expect(decrypted.birthDate).toBe("1985-12-01");
      expect(decrypted.employmentIncome).toBe(50000);
    });

    it("does not double-encrypt already encrypted fields", () => {
      const data = { legalName: "Test" };
      const once = encryptPiiFields(data);
      const twice = encryptPiiFields(once);
      expect(once.legalName).toBe(twice.legalName);
    });

    it("skips null and non-string PII fields", () => {
      const data = { legalName: null, sinLast4: 1234, birthDate: undefined };
      const encrypted = encryptPiiFields(data as Record<string, unknown>);
      expect(encrypted.legalName).toBeNull();
      expect(encrypted.sinLast4).toBe(1234);
      expect(encrypted.birthDate).toBeUndefined();
    });
  });
});
