import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateOrigin } from "./csrf";

function makeRequest(method: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/returns", {
    method,
    headers
  });
}

describe("validateOrigin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("allows POST when x-forwarded-host matches the origin host", () => {
    const req = makeRequest("POST", {
      origin: "https://preview.example.dev",
      host: "internal.local:3000",
      "x-forwarded-host": "preview.example.dev"
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows localhost and 127.0.0.1 loopback hosts on the same port in development proxies", () => {
    const req = makeRequest("POST", {
      origin: "http://127.0.0.1:3000",
      host: "localhost:3000"
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows POST when NEXTAUTH_URL matches the origin host", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://tax.example.ca");
    const req = makeRequest("POST", {
      origin: "https://tax.example.ca",
      host: "internal.local"
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
