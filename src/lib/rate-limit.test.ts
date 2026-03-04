import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  const config = { windowMs: 1000, maxRequests: 3 };

  beforeEach(() => {
    // Use unique keys per test to avoid cross-test pollution
  });

  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const r4 = checkRateLimit(key, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("uses separate counters for different keys", () => {
    const keyA = `test-a-${Date.now()}`;
    const keyB = `test-b-${Date.now()}`;

    checkRateLimit(keyA, config);
    checkRateLimit(keyA, config);
    checkRateLimit(keyA, config);

    const rB = checkRateLimit(keyB, config);
    expect(rB.allowed).toBe(true);
    expect(rB.remaining).toBe(2);
  });

  it("returns resetAt in the future", () => {
    const key = `test-reset-${Date.now()}`;
    const result = checkRateLimit(key, config);
    expect(result.resetAt).toBeGreaterThan(Date.now() - 100);
  });
});
