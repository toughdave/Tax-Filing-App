export interface SubmissionPackage {
  returnId: string;
  taxYear: number;
  filingMode: "INDIVIDUAL" | "SELF_EMPLOYED" | "COMPANY";
  payload: Record<string, unknown>;
  documents?: { id: string; category: string; storagePath: string }[];
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

// ---------------------------------------------------------------------------
// NETFILE provider — for individual/self-employed T1 filings via CRA NETFILE
// ---------------------------------------------------------------------------

export class NetfileCraProvider implements FilingSubmissionProvider {
  name = "netfile-cra-provider";

  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.NETFILE_API_URL ?? "";
    this.apiKey = process.env.NETFILE_API_KEY ?? "";
  }

  async prepare(packageData: SubmissionPackage): Promise<SubmissionResult> {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error("NETFILE_NOT_CONFIGURED");
    }

    if (packageData.filingMode === "COMPANY") {
      throw new Error("NETFILE_INDIVIDUAL_ONLY");
    }

    const xmlPayload = this.buildT1Xml(packageData);

    const response = await fetch(`${this.apiUrl}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        Authorization: `Bearer ${this.apiKey}`,
        "X-Tax-Year": String(packageData.taxYear)
      },
      body: xmlPayload
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        status: "REJECTED",
        message: `NETFILE rejected: ${errorText}`
      };
    }

    const result = await response.json() as { confirmationNumber?: string; message?: string };

    return {
      status: "SUBMISSION_PENDING",
      externalReference: result.confirmationNumber ?? `NF-${Date.now()}`,
      message: result.message ?? "Submission accepted by CRA NETFILE."
    };
  }

  private buildT1Xml(packageData: SubmissionPackage): string {
    const p = packageData.payload;
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<T1Return taxYear="${packageData.taxYear}" filingMode="${packageData.filingMode}">`,
      `  <ReturnId>${packageData.returnId}</ReturnId>`,
      `  <GeneratedAt>${packageData.generatedAt}</GeneratedAt>`,
      "  <Identification>",
      `    <LegalName>${p.legalName ?? ""}</LegalName>`,
      `    <SINLast4>${p.sinLast4 ?? ""}</SINLast4>`,
      `    <BirthDate>${p.birthDate ?? ""}</BirthDate>`,
      `    <Province>${p.residencyProvince ?? ""}</Province>`,
      "  </Identification>",
      "  <Income>",
      `    <Line10100>${p.employmentIncome ?? 0}</Line10100>`,
      `    <Line13000>${p.otherIncome ?? 0}</Line13000>`,
      ...(packageData.filingMode === "SELF_EMPLOYED" ? [
        `    <Line8299>${p.businessIncome ?? 0}</Line8299>`
      ] : []),
      "  </Income>",
      "  <Deductions>",
      `    <Line20800>${p.rrsp ?? 0}</Line20800>`,
      `    <Line32300>${p.tuition ?? 0}</Line32300>`,
      `    <Line33099>${p.medical ?? 0}</Line33099>`,
      ...(packageData.filingMode === "SELF_EMPLOYED" ? [
        `    <Line9369>${p.businessExpenses ?? 0}</Line9369>`,
        `    <Line9945>${p.businessUseHome ?? 0}</Line9945>`
      ] : []),
      "  </Deductions>",
      "</T1Return>"
    ].join("\n");
  }
}

// ---------------------------------------------------------------------------
// EFILE provider — for accountant/professional filing (supports all modes)
// ---------------------------------------------------------------------------

export class EfileCraProvider implements FilingSubmissionProvider {
  name = "efile-cra-provider";

  private apiUrl: string;
  private efileNumber: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.EFILE_API_URL ?? "";
    this.efileNumber = process.env.EFILE_NUMBER ?? "";
    this.apiKey = process.env.EFILE_API_KEY ?? "";
  }

  async prepare(packageData: SubmissionPackage): Promise<SubmissionResult> {
    if (!this.apiUrl || !this.efileNumber || !this.apiKey) {
      throw new Error("EFILE_NOT_CONFIGURED");
    }

    const response = await fetch(`${this.apiUrl}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "X-EFile-Number": this.efileNumber
      },
      body: JSON.stringify({
        taxYear: packageData.taxYear,
        filingMode: packageData.filingMode,
        returnId: packageData.returnId,
        payload: packageData.payload,
        documents: packageData.documents?.map((d) => d.id) ?? [],
        generatedAt: packageData.generatedAt
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        status: "REJECTED",
        message: `EFILE rejected: ${errorText}`
      };
    }

    const result = await response.json() as { confirmationNumber?: string; message?: string };

    return {
      status: "SUBMISSION_PENDING",
      externalReference: result.confirmationNumber ?? `EF-${Date.now()}`,
      message: result.message ?? "Submission accepted via CRA EFILE."
    };
  }
}

// ---------------------------------------------------------------------------
// Provider factory — selects provider based on EFILING_PROVIDER env var
// ---------------------------------------------------------------------------

export type ProviderName = "sandbox" | "netfile" | "efile";

export function getSubmissionProvider(override?: ProviderName): FilingSubmissionProvider {
  const name = override ?? (process.env.EFILING_PROVIDER as ProviderName | undefined) ?? "sandbox";

  switch (name) {
    case "netfile":
      return new NetfileCraProvider();
    case "efile":
      return new EfileCraProvider();
    case "sandbox":
    default:
      return new SandboxCraProvider();
  }
}
