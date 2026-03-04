import { describe, it, expect } from "vitest";
import { validateOrigin } from "./csrf";

function makeRequest(method: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/returns", {
    method,
    headers
  });
}

describe("validateOrigin", () => {
  it("allows GET requests without origin", () => {
    expect(validateOrigin(makeRequest("GET"))).toBe(true);
  });

  it("allows POST with matching origin and host", () => {
    const req = makeRequest("POST", {
      origin: "https://example.com",
      host: "example.com"
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects POST with mismatched origin", () => {
    const req = makeRequest("POST", {
      origin: "https://evil.com",
      host: "example.com"
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it("rejects POST with missing origin header", () => {
    const req = makeRequest("POST", {
      host: "example.com"
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it("rejects POST with missing host header", () => {
    const req = makeRequest("POST", {
      origin: "https://example.com"
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it("allows DELETE with matching origin", () => {
    const req = makeRequest("DELETE", {
      origin: "https://example.com",
      host: "example.com"
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects PATCH with mismatched origin", () => {
    const req = makeRequest("PATCH", {
      origin: "https://attacker.com",
      host: "example.com"
    });
    expect(validateOrigin(req)).toBe(false);
  });
});
