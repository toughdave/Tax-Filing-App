import type { FilingMode } from "@/lib/tax-field-config";
import { getFormConfig } from "@/lib/cra-form-mapping";
import { getTaxYearParams } from "@/lib/tax-year-config";
import { missingRequiredFields } from "@/lib/services/tax-return-service";

// ---------------------------------------------------------------------------
// Pre-submission preflight checks — ensures a return is safe to submit.
// Must pass before any provider.prepare() call.
// ---------------------------------------------------------------------------

export interface PreflightCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface PreflightResult {
  passed: boolean;
  checks: PreflightCheck[];
}

export function runPreflightChecks(
  taxYear: number,
  filingMode: FilingMode,
  payload: Record<string, unknown>,
  hasDocuments: boolean
): PreflightResult {
  const checks: PreflightCheck[] = [];
  const isCompany = filingMode === "COMPANY";

  // 1. Tax year supported
  const yearParams = getTaxYearParams(taxYear);
  checks.push({
    id: "tax_year_supported",
    label: "Tax year is supported",
    passed: yearParams !== null,
    detail: yearParams ? `Using ${taxYear} brackets` : `No config for ${taxYear}`
  });

  // 2. CRA form mapping exists
  const formConfig = getFormConfig(taxYear);
  checks.push({
    id: "form_mapping_exists",
    label: "CRA form mapping available",
    passed: formConfig !== null,
    detail: formConfig ? `${Object.keys(formConfig.forms).length} forms mapped` : "No mapping"
  });

  // 3. All required fields present
  const missing = missingRequiredFields(filingMode, payload);
  checks.push({
    id: "required_fields_complete",
    label: "All required fields filled",
    passed: missing.length === 0,
    detail: missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined
  });

  // 4. Identity fields present
  const hasIdentity = isCompany
    ? Boolean(payload.corporationName && payload.businessNumber && payload.fiscalYearEnd)
    : Boolean(payload.legalName && payload.sinLast4 && payload.birthDate);
  checks.push({
    id: "identity_complete",
    label: isCompany ? "Corporation identification complete" : "Taxpayer identification complete",
    passed: hasIdentity
  });

  // 5. Province of residence
  if (!isCompany) {
    const hasProvince = Boolean(payload.residencyProvince);
    checks.push({
      id: "province_present",
      label: "Province of residence specified",
      passed: hasProvince
    });
  }

  // 6. Income reported (at least one source > 0)
  const incomeKeys = [
    "employmentIncome", "otherIncome", "interestIncome", "dividendIncome",
    "capitalGains", "rentalIncome", "pensionIncome", "eiBenefits",
    "businessIncome", "corporateRevenue"
  ];
  const hasIncome = incomeKeys.some((k) => {
    const v = payload[k];
    return typeof v === "number" && v > 0;
  });
  checks.push({
    id: "income_reported",
    label: "At least one income source reported",
    passed: hasIncome
  });

  // 7. Supporting documents (advisory, not blocking)
  checks.push({
    id: "documents_attached",
    label: "Supporting documents attached",
    passed: hasDocuments,
    detail: hasDocuments ? undefined : "No documents attached (optional but recommended)"
  });

  // 8. Company-specific: business number present
  if (filingMode === "COMPANY") {
    checks.push({
      id: "business_number_present",
      label: "Business number provided",
      passed: Boolean(payload.businessNumber)
    });
  }

  const passed = checks.filter((c) => c.id !== "documents_attached").every((c) => c.passed);

  return { passed, checks };
}
