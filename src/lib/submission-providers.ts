export interface SubmissionPackage {
  returnId: string;
  taxYear: number;
  filingMode: "INDIVIDUAL" | "SELF_EMPLOYED" | "COMPANY";
  payload: Record<string, unknown>;
  documents?: { id: string; category: string; storagePath: string }[];
  generatedAt: string;
  taxSummary?: {
    netFederalTax: number;
    totalTax: number;
    balanceOwing: number;
    provincial?: {
      provinceCode: string;
      provinceName: string;
      provincialTax: number;
      provincialBasicPersonalCredit: number;
      provincialNonRefundableCredits: number;
      netProvincialTax: number;
      provincialSurtax: number;
    } | null;
  };
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

export function escapeXml(value: unknown): string {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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
      `<T1Return taxYear="${escapeXml(packageData.taxYear)}" filingMode="${escapeXml(packageData.filingMode)}">`,
      `  <ReturnId>${escapeXml(packageData.returnId)}</ReturnId>`,
      `  <GeneratedAt>${escapeXml(packageData.generatedAt)}</GeneratedAt>`,
      "  <Identification>",
      `    <LegalName>${escapeXml(p.legalName)}</LegalName>`,
      `    <SINLast4>${escapeXml(p.sinLast4)}</SINLast4>`,
      `    <BirthDate>${escapeXml(p.birthDate)}</BirthDate>`,
      `    <Province>${escapeXml(p.residencyProvince)}</Province>`,
      "  </Identification>",
      "  <Income>",
      `    <Line10100>${escapeXml(p.employmentIncome ?? 0)}</Line10100>`,
      `    <Line11500>${escapeXml(p.pensionIncome ?? 0)}</Line11500>`,
      `    <Line11900>${escapeXml(p.eiBenefits ?? 0)}</Line11900>`,
      `    <Line12000>${escapeXml(p.dividendIncome ?? 0)}</Line12000>`,
      `    <Line12100>${escapeXml(p.interestIncome ?? 0)}</Line12100>`,
      `    <Line12600>${escapeXml(p.rentalIncome ?? 0)}</Line12600>`,
      `    <Line12700>${escapeXml(p.capitalGains ?? 0)}</Line12700>`,
      `    <Line13000>${escapeXml(p.otherIncome ?? 0)}</Line13000>`,
      ...(packageData.filingMode === "SELF_EMPLOYED" ? [
        `    <Line8299>${escapeXml(p.businessIncome ?? 0)}</Line8299>`
      ] : []),
      "  </Income>",
      "  <Deductions>",
      `    <Line20800>${escapeXml(p.rrsp ?? 0)}</Line20800>`,
      `    <Line20805>${escapeXml(p.fhsa ?? 0)}</Line20805>`,
      `    <Line21200>${escapeXml(p.unionDues ?? 0)}</Line21200>`,
      `    <Line21400>${escapeXml(p.childCareExpenses ?? 0)}</Line21400>`,
      `    <Line21900>${escapeXml(p.movingExpenses ?? 0)}</Line21900>`,
      `    <Line22000>${escapeXml(p.supportPaymentsMade ?? 0)}</Line22000>`,
      `    <Line22100>${escapeXml(p.carryingCharges ?? 0)}</Line22100>`,
      `    <Line25500>${escapeXml(p.northernResidents ?? 0)}</Line25500>`,
      ...(packageData.filingMode === "SELF_EMPLOYED" ? [
        `    <Line9369>${escapeXml(p.businessExpenses ?? 0)}</Line9369>`,
        `    <Line9945>${escapeXml(p.businessUseHome ?? 0)}</Line9945>`
      ] : []),
      "  </Deductions>",
      "  <NonRefundableCredits>",
      `    <Line30100>${escapeXml(p.ageAmount ?? 0)}</Line30100>`,
      `    <Line30300>${escapeXml(p.spouseAmount ?? 0)}</Line30300>`,
      `    <Line30400>${escapeXml(p.eligibleDependantAmount ?? 0)}</Line30400>`,
      `    <Line30450>${escapeXml(p.canadaCaregiverAmount ?? 0)}</Line30450>`,
      `    <Line30800>${escapeXml(p.cppEiOverpayment ?? 0)}</Line30800>`,
      `    <Line31260>${escapeXml(p.canadaEmploymentAmount ?? 0)}</Line31260>`,
      `    <Line31270>${escapeXml(p.homeBuyersAmount ?? 0)}</Line31270>`,
      `    <Line31400>${escapeXml(p.pensionIncomeAmount ?? 0)}</Line31400>`,
      `    <Line31600>${escapeXml(p.disabilityAmount ?? 0)}</Line31600>`,
      `    <Line31900>${escapeXml(p.studentLoanInterest ?? 0)}</Line31900>`,
      `    <Line32300>${escapeXml(p.tuition ?? 0)}</Line32300>`,
      `    <Line33099>${escapeXml(p.medical ?? 0)}</Line33099>`,
      `    <Line34900>${escapeXml(p.donations ?? 0)}</Line34900>`,
      "  </NonRefundableCredits>",
      "  <RefundableCreditsAndPayments>",
      `    <Line43700>${escapeXml(p.totalIncomeTaxDeducted ?? 0)}</Line43700>`,
      `    <Line45200>${escapeXml(p.refundableMedical ?? 0)}</Line45200>`,
      `    <Line45300>${escapeXml(p.canadaWorkersAmount ?? 0)}</Line45300>`,
      `    <Line45350>${escapeXml(p.canadaTrainingCredit ?? 0)}</Line45350>`,
      `    <Line47600>${escapeXml(p.taxPaidByInstalments ?? 0)}</Line47600>`,
      "  </RefundableCreditsAndPayments>",
      ...(packageData.taxSummary ? [
        "  <TaxCalculation>",
        `    <NetFederalTax>${escapeXml(packageData.taxSummary.netFederalTax)}</NetFederalTax>`,
        ...(packageData.taxSummary.provincial ? [
          "    <ProvincialTax>",
          `      <ProvinceCode>${escapeXml(packageData.taxSummary.provincial.provinceCode)}</ProvinceCode>`,
          `      <ProvinceName>${escapeXml(packageData.taxSummary.provincial.provinceName)}</ProvinceName>`,
          `      <GrossProvincialTax>${escapeXml(packageData.taxSummary.provincial.provincialTax)}</GrossProvincialTax>`,
          `      <BasicPersonalCredit>${escapeXml(packageData.taxSummary.provincial.provincialBasicPersonalCredit)}</BasicPersonalCredit>`,
          `      <NonRefundableCredits>${escapeXml(packageData.taxSummary.provincial.provincialNonRefundableCredits)}</NonRefundableCredits>`,
          `      <Surtax>${escapeXml(packageData.taxSummary.provincial.provincialSurtax)}</Surtax>`,
          `      <NetProvincialTax>${escapeXml(packageData.taxSummary.provincial.netProvincialTax)}</NetProvincialTax>`,
          "    </ProvincialTax>"
        ] : []),
        `    <TotalTax>${escapeXml(packageData.taxSummary.totalTax)}</TotalTax>`,
        `    <BalanceOwing>${escapeXml(packageData.taxSummary.balanceOwing)}</BalanceOwing>`,
        "  </TaxCalculation>"
      ] : []),
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
