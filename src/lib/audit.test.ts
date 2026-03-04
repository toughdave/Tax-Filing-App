import { describe, expect, it } from "vitest";
import { extractRequestMeta } from "@/lib/audit";

describe("extractRequestMeta", () => {
  it("uses prioritized proxy headers and normalizes x-forwarded-for values", () => {
    const request = new Request("http://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.2, 198.51.100.4",
        "user-agent": "Mozilla/5.0"
      }
    });

    expect(extractRequestMeta(request)).toEqual({
      ipAddress: "203.0.113.2",
      userAgent: "Mozilla/5.0"
    });
  });

  it("prefers trusted vendor headers over x-forwarded-for", () => {
    const request = new Request("http://example.com", {
      headers: {
        "x-vercel-forwarded-for": "198.51.100.8",
        "x-forwarded-for": "203.0.113.9"
      }
    });

    expect(extractRequestMeta(request).ipAddress).toBe("198.51.100.8");
  });

  it("drops invalid IP values and truncates long user agents", () => {
    const request = new Request("http://example.com", {
      headers: {
        "x-forwarded-for": "not-an-ip",
        "user-agent": "x".repeat(600)
      }
    });

    const result = extractRequestMeta(request);
    expect(result.ipAddress).toBeNull();
    expect(result.userAgent).toHaveLength(512);
  });
});
