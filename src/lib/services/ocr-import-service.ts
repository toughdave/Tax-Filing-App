/**
 * OCR Document Scanning & CRA My Account Import Service
 *
 * Architecture:
 * - OcrProvider: scans uploaded documents (T4, T5, receipts) and extracts field values
 * - CraImportProvider: connects to CRA My Account via Auto-fill my return (AFR) to fetch slips
 *
 * Both providers return a standardised ExtractedSlipData structure that can be
 * merged into a tax return payload. The UI stubs (import-stubs.tsx) surface
 * these features with a "coming soon" badge until a real provider is configured.
 *
 * Environment variables:
 * - OCR_PROVIDER: "none" (default) | "tesseract" | "google-vision" | "azure-di"
 * - CRA_AFR_ENABLED: "false" (default) | "true"
 * - CRA_AFR_CLIENT_ID / CRA_AFR_CLIENT_SECRET: OAuth credentials for CRA AFR
 */

// ---------------------------------------------------------------------------
// Extracted data types
// ---------------------------------------------------------------------------

export interface ExtractedField {
  key: string;
  value: string | number | null;
  confidence: number; // 0–1
  sourceFormLine?: string;
}

export interface ExtractedSlipData {
  slipType: string; // e.g. "T4", "T5", "T3", "RECEIPT"
  taxYear: number | null;
  issuerName: string | null;
  fields: ExtractedField[];
  rawText?: string;
}

export interface OcrExtractionResult {
  success: boolean;
  data: ExtractedSlipData | null;
  error?: string;
}

export interface CraImportResult {
  success: boolean;
  slips: ExtractedSlipData[];
  noaData?: {
    priorYearBalance: number | null;
    rrspLimit: number | null;
    rrspDeductionLimit: number | null;
    taxableIncome: number | null;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// OCR Provider interface
// ---------------------------------------------------------------------------

export interface OcrProvider {
  name: string;
  extractFromDocument(
    fileBuffer: Buffer,
    mimeType: string,
    documentCategory: string
  ): Promise<OcrExtractionResult>;
}

// ---------------------------------------------------------------------------
// CRA Import Provider interface
// ---------------------------------------------------------------------------

export interface CraImportProvider {
  name: string;
  isConfigured(): boolean;
  fetchSlips(
    userId: string,
    taxYear: number,
    accessToken: string
  ): Promise<CraImportResult>;
}

// ---------------------------------------------------------------------------
// Stub implementations (default — no real provider configured)
// ---------------------------------------------------------------------------

export class NoOpOcrProvider implements OcrProvider {
  name = "noop-ocr";

  async extractFromDocument(
    _fileBuffer: Buffer,
    _mimeType: string,
    _documentCategory: string
  ): Promise<OcrExtractionResult> {
    void _fileBuffer; void _mimeType; void _documentCategory;
    return {
      success: false,
      data: null,
      error: "OCR_NOT_CONFIGURED"
    };
  }
}

export class NoOpCraImportProvider implements CraImportProvider {
  name = "noop-cra-import";

  isConfigured(): boolean {
    return false;
  }

  async fetchSlips(
    _userId: string,
    _taxYear: number,
    _accessToken: string
  ): Promise<CraImportResult> {
    void _userId; void _taxYear; void _accessToken;
    return {
      success: false,
      slips: [],
      error: "CRA_IMPORT_NOT_CONFIGURED"
    };
  }
}

// ---------------------------------------------------------------------------
// T4 field mapping for OCR extraction
// ---------------------------------------------------------------------------

const T4_FIELD_MAP: Record<string, string> = {
  "Box 14": "employmentIncome",
  "Box 16": "cppEmployeeContributions",
  "Box 18": "eiPremiums",
  "Box 22": "totalIncomeTaxDeducted",
  "Box 26": "cppPensionableEarnings",
  "Box 44": "unionDues"
};

const T5_FIELD_MAP: Record<string, string> = {
  "Box 13": "interestIncome",
  "Box 25": "dividendIncome",
  "Box 18": "capitalGains"
};

export function getSlipFieldMap(slipType: string): Record<string, string> {
  switch (slipType) {
    case "T4": return T4_FIELD_MAP;
    case "T5": return T5_FIELD_MAP;
    default: return {};
  }
}

// ---------------------------------------------------------------------------
// Merge extracted data into a payload
// ---------------------------------------------------------------------------

export function mergeExtractedIntoPayload(
  currentPayload: Record<string, unknown>,
  extracted: ExtractedSlipData,
  minConfidence = 0.7
): { merged: Record<string, unknown>; appliedFields: string[]; skippedFields: string[] } {
  const merged = { ...currentPayload };
  const appliedFields: string[] = [];
  const skippedFields: string[] = [];

  for (const field of extracted.fields) {
    if (field.confidence < minConfidence) {
      skippedFields.push(field.key);
      continue;
    }

    if (field.value !== null) {
      const existingValue = merged[field.key];
      // Don't overwrite user-entered values unless they're empty
      if (existingValue === null || existingValue === undefined || existingValue === "" || existingValue === 0) {
        merged[field.key] = field.value;
        appliedFields.push(field.key);
      } else {
        skippedFields.push(field.key);
      }
    }
  }

  return { merged, appliedFields, skippedFields };
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

export function getOcrProvider(): OcrProvider {
  const providerName = process.env.OCR_PROVIDER ?? "none";

  switch (providerName) {
    case "none":
    default:
      return new NoOpOcrProvider();
    // Future providers:
    // case "tesseract": return new TesseractOcrProvider();
    // case "google-vision": return new GoogleVisionOcrProvider();
    // case "azure-di": return new AzureDocumentIntelligenceProvider();
  }
}

export function getCraImportProvider(): CraImportProvider {
  const enabled = process.env.CRA_AFR_ENABLED === "true";

  if (!enabled) {
    return new NoOpCraImportProvider();
  }

  // Future: return new CraAfrProvider() when CRA AFR integration is built
  return new NoOpCraImportProvider();
}
