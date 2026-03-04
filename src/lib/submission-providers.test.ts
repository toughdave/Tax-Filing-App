import { describe, expect, it } from "vitest";
import {
  getSubmissionProvider,
  NetfileCraProvider,
  EfileCraProvider
} from "@/lib/submission-providers";

describe("submission provider", () => {
  it("prepares deterministic sandbox submission references", async () => {
    const provider = getSubmissionProvider();

    const prepared = await provider.prepare({
      returnId: "ck1234567890abcdef",
      taxYear: 2025,
      filingMode: "SELF_EMPLOYED",
      payload: {
        legalName: "Taylor Filer",
        businessIncome: 128000
      },
      generatedAt: new Date("2026-01-15T10:00:00.000Z").toISOString()
    });

    expect(provider.name).toBe("sandbox-cra-provider");
    expect(prepared.status).toBe("SUBMISSION_PENDING");
    expect(prepared.externalReference?.startsWith("SBX-")).toBe(true);
  });

  it("defaults to sandbox when no override or env var", () => {
    const provider = getSubmissionProvider();
    expect(provider.name).toBe("sandbox-cra-provider");
  });

  it("returns netfile provider when requested", () => {
    const provider = getSubmissionProvider("netfile");
    expect(provider.name).toBe("netfile-cra-provider");
  });

  it("returns efile provider when requested", () => {
    const provider = getSubmissionProvider("efile");
    expect(provider.name).toBe("efile-cra-provider");
  });

  it("netfile throws NETFILE_NOT_CONFIGURED when env vars missing", async () => {
    const provider = new NetfileCraProvider();
    await expect(
      provider.prepare({
        returnId: "r1",
        taxYear: 2024,
        filingMode: "INDIVIDUAL",
        payload: {},
        generatedAt: new Date().toISOString()
      })
    ).rejects.toThrow("NETFILE_NOT_CONFIGURED");
  });

  it("netfile throws NETFILE_INDIVIDUAL_ONLY for COMPANY mode", async () => {
    const originalUrl = process.env.NETFILE_API_URL;
    const originalKey = process.env.NETFILE_API_KEY;
    process.env.NETFILE_API_URL = "https://test.example.com";
    process.env.NETFILE_API_KEY = "test-key";

    try {
      const provider = new NetfileCraProvider();
      await expect(
        provider.prepare({
          returnId: "r1",
          taxYear: 2024,
          filingMode: "COMPANY",
          payload: {},
          generatedAt: new Date().toISOString()
        })
      ).rejects.toThrow("NETFILE_INDIVIDUAL_ONLY");
    } finally {
      process.env.NETFILE_API_URL = originalUrl;
      process.env.NETFILE_API_KEY = originalKey;
    }
  });

  it("efile throws EFILE_NOT_CONFIGURED when env vars missing", async () => {
    const provider = new EfileCraProvider();
    await expect(
      provider.prepare({
        returnId: "r1",
        taxYear: 2024,
        filingMode: "INDIVIDUAL",
        payload: {},
        generatedAt: new Date().toISOString()
      })
    ).rejects.toThrow("EFILE_NOT_CONFIGURED");
  });
});
