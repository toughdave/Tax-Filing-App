import { describe, expect, it } from "vitest";
import { getSubmissionProvider } from "@/lib/submission-providers";

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
});
