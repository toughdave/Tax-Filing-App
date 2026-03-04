import { describe, it, expect } from "vitest";
import { maskEmail, maskName, maskIp } from "./pii-mask";

describe("maskEmail", () => {
  it("masks the local part keeping first and last char", () => {
    expect(maskEmail("david@example.com")).toBe("d***d@example.com");
  });

  it("handles short local parts", () => {
    expect(maskEmail("ab@test.com")).toBe("*@test.com");
  });

  it("handles missing @ gracefully", () => {
    expect(maskEmail("noemail")).toBe("***@***");
  });

  it("handles single char local", () => {
    expect(maskEmail("a@test.com")).toBe("*@test.com");
  });
});

describe("maskName", () => {
  it("masks each part of a full name", () => {
    expect(maskName("Jane Doe")).toBe("J*** D**");
  });

  it("handles single name", () => {
    expect(maskName("Alice")).toBe("A****");
  });

  it("handles single-char names", () => {
    expect(maskName("J")).toBe("*");
  });
});

describe("maskIp", () => {
  it("masks last two octets of IPv4", () => {
    expect(maskIp("192.168.1.100")).toBe("192.168.*.*");
  });

  it("returns dash for null", () => {
    expect(maskIp(null)).toBe("—");
  });

  it("handles non-standard formats gracefully", () => {
    expect(maskIp("unknown")).toBe("unknown");
  });
});
