import { describe, expect, it } from "vitest";
import { availableProviders, isDemoCredentialsEnabled } from "@/lib/auth-policy";

describe("auth policy", () => {
  it("disables demo credentials when demo secrets are missing", () => {
    expect(isDemoCredentialsEnabled({ NODE_ENV: "development" })).toBe(false);
  });

  it("enables demo credentials in non-production when demo secrets are present", () => {
    expect(
      isDemoCredentialsEnabled({
        NODE_ENV: "development",
        DEMO_EMAIL: "demo@example.com",
        DEMO_PASSCODE: "password"
      })
    ).toBe(true);
  });

  it("disables demo credentials in production by default", () => {
    expect(
      isDemoCredentialsEnabled({
        NODE_ENV: "production",
        DEMO_EMAIL: "demo@example.com",
        DEMO_PASSCODE: "password"
      })
    ).toBe(false);
  });

  it("allows demo credentials in production only when explicitly enabled", () => {
    expect(
      isDemoCredentialsEnabled({
        NODE_ENV: "production",
        DEMO_EMAIL: "demo@example.com",
        DEMO_PASSCODE: "password",
        ENABLE_DEMO_AUTH: "true"
      })
    ).toBe(true);
  });

  it("returns provider availability map", () => {
    expect(
      availableProviders({
        NODE_ENV: "development",
        GOOGLE_CLIENT_ID: "g-id",
        GOOGLE_CLIENT_SECRET: "g-secret",
        AZURE_AD_CLIENT_ID: "m-id",
        AZURE_AD_CLIENT_SECRET: "m-secret",
        APPLE_ID: "a-id",
        APPLE_SECRET: "a-secret",
        DEMO_EMAIL: "demo@example.com",
        DEMO_PASSCODE: "password"
      })
    ).toEqual({
      google: true,
      azureAd: true,
      apple: true,
      demoCredentials: true
    });
  });
});
