export interface SubmissionPackage {
  returnId: string;
  taxYear: number;
  filingMode: "INDIVIDUAL" | "SELF_EMPLOYED" | "COMPANY";
  payload: Record<string, unknown>;
  generatedAt: string;
}

export interface SubmissionResult {
  status: "SUBMISSION_PENDING" | "REJECTED";
  externalReference?: string;
  message: string;
}

export interface FilingSubmissionProvider {
  name: string;
  prepare(packageData: SubmissionPackage): Promise<SubmissionResult>;
}

export class SandboxCraProvider implements FilingSubmissionProvider {
  name = "sandbox-cra-provider";

  async prepare(packageData: SubmissionPackage): Promise<SubmissionResult> {
    const seed = `${packageData.returnId}-${packageData.taxYear}-${packageData.filingMode}`;
    const normalized = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
      status: "SUBMISSION_PENDING",
      externalReference: `SBX-${normalized}`,
      message: "Submission package validated and queued in sandbox provider."
    };
  }
}

export function getSubmissionProvider(): FilingSubmissionProvider {
  return new SandboxCraProvider();
}
