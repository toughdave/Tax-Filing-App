import { prisma } from "@/lib/db";
import type { SaveReturnInput } from "@/lib/validation/tax-return";
import { getSubmissionProvider } from "@/lib/submission-providers";
import { requiredFieldsForMode, type FilingMode } from "@/lib/tax-field-config";
import { calculateTax, type CalculationResult } from "@/lib/services/tax-calculation-engine";
import { runPreflightChecks } from "@/lib/services/filing-preflight";
import { buildCarryForwardData, computeCarryForwardDiff, type CarryForwardDiffEntry } from "@/lib/carry-forward-config";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { encryptPiiFields, decryptPiiFields } from "@/lib/pii-crypto";

export function sanitizePayload(payload: Record<string, unknown>) {
  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      sanitized[key] = trimmed.length > 0 ? trimmed : null;
      continue;
    }

    if (typeof value === "number") {
      sanitized[key] = Number.isFinite(value) ? value : null;
      continue;
    }

    if (typeof value === "boolean" || value === null) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function missingRequiredFields(mode: FilingMode, payload: Record<string, unknown>) {
  return requiredFieldsForMode(mode).filter((field) => {
    const value = payload[field];

    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      return true;
    }

    return false;
  });
}

export async function listReturnsForUser(userId: string) {
  return prisma.taxReturn.findMany({
    where: { userId },
    orderBy: [{ taxYear: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      taxYear: true,
      filingMode: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      submittedAt: true,
      externalSubmissionRef: true
    }
  });
}

export async function getReturnForUser(userId: string, returnId: string) {
  const record = await prisma.taxReturn.findFirst({
    where: {
      userId,
      id: returnId
    },
    select: {
      id: true,
      taxYear: true,
      filingMode: true,
      status: true,
      data: true,
      taxSummary: true,
      updatedAt: true,
      createdAt: true,
      submittedAt: true,
      externalSubmissionRef: true
    }
  });

  if (record?.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return { ...record, data: decryptPiiFields(record.data as Record<string, unknown>) };
  }

  return record;
}

export interface YoyComparisonRow {
  key: string;
  priorValue: unknown;
  currentValue: unknown;
  change: "added" | "removed" | "changed" | "unchanged";
}

export interface YoyComparison {
  currentYear: number;
  priorYear: number;
  filingMode: string;
  rows: YoyComparisonRow[];
  currentSummary: CalculationResult | null;
  priorSummary: CalculationResult | null;
}

export async function getYearOverYearComparison(
  userId: string,
  returnId: string
): Promise<YoyComparison | null> {
  const current = await getReturnForUser(userId, returnId);
  if (!current) return null;

  const prior = await prisma.taxReturn.findFirst({
    where: {
      userId,
      filingMode: current.filingMode,
      taxYear: current.taxYear - 1
    },
    orderBy: { updatedAt: "desc" },
    select: { data: true, taxSummary: true, taxYear: true }
  });

  const currentData = (current.data as Record<string, unknown>) ?? {};
  let priorData: Record<string, unknown> = {};
  if (prior?.data && typeof prior.data === "object" && !Array.isArray(prior.data)) {
    priorData = decryptPiiFields(prior.data as Record<string, unknown>);
  }

  const allKeys = new Set([...Object.keys(currentData), ...Object.keys(priorData)]);
  const rows: YoyComparisonRow[] = [];

  for (const key of allKeys) {
    const cv = currentData[key] ?? null;
    const pv = priorData[key] ?? null;
    const cvEmpty = cv === null || cv === "" || cv === undefined;
    const pvEmpty = pv === null || pv === "" || pv === undefined;

    if (cvEmpty && pvEmpty) continue;

    let change: YoyComparisonRow["change"];
    if (pvEmpty && !cvEmpty) change = "added";
    else if (!pvEmpty && cvEmpty) change = "removed";
    else if (String(cv) !== String(pv)) change = "changed";
    else change = "unchanged";

    rows.push({ key, priorValue: pv, currentValue: cv, change });
  }

  return {
    currentYear: current.taxYear,
    priorYear: current.taxYear - 1,
    filingMode: current.filingMode,
    rows,
    currentSummary: (current.taxSummary as unknown as CalculationResult) ?? null,
    priorSummary: prior ? ((prior.taxSummary as unknown as CalculationResult) ?? null) : null
  };
}

export async function saveReturnForUser(userId: string, input: SaveReturnInput) {
  const sanitizedPayload = sanitizePayload(input.payload);
  const mode = input.filingMode;

  const carryForwardSource = await prisma.taxReturn.findFirst({
    where: {
      userId,
      filingMode: mode,
      taxYear: input.taxYear - 1
    },
    orderBy: { updatedAt: "desc" }
  });

  const priorDataRaw = (carryForwardSource?.data as Record<string, unknown> | undefined) ?? {};
  const priorData = decryptPiiFields(priorDataRaw);
  const carriedFields = buildCarryForwardData(priorData);

  const mergedData = {
    ...carriedFields,
    ...sanitizedPayload
  };

  const missing = missingRequiredFields(mode, mergedData);
  const nextStatus = missing.length === 0 ? "READY_TO_REVIEW" : "DRAFT";

  const taxSummary: CalculationResult = calculateTax(mode, mergedData);

  const encryptedData = encryptPiiFields(mergedData);

  const record = await prisma.taxReturn.upsert({
    where: {
      userId_taxYear_filingMode: {
        userId,
        taxYear: input.taxYear,
        filingMode: mode
      }
    },
    create: {
      userId,
      taxYear: input.taxYear,
      filingMode: mode,
      status: nextStatus,
      data: encryptedData as InputJsonValue,
      taxSummary: taxSummary.summary as unknown as InputJsonValue,
      priorYearReturnId: carryForwardSource?.id
    },
    update: {
      data: encryptedData as InputJsonValue,
      taxSummary: taxSummary.summary as unknown as InputJsonValue,
      status: nextStatus,
      priorYearReturnId: carryForwardSource?.id
    },
    select: {
      id: true,
      taxYear: true,
      filingMode: true,
      status: true,
      updatedAt: true
    }
  });

  const carryForwardDiff: CarryForwardDiffEntry[] = carryForwardSource
    ? computeCarryForwardDiff(priorData, mergedData, mode)
    : [];

  return {
    record,
    missingRequired: missing,
    carryForwardFromYear: carryForwardSource?.taxYear ?? null,
    carryForwardDiff,
    taxSummary
  };
}

export async function prepareSubmissionForUser(userId: string, returnId: string) {
  const taxReturn = await prisma.taxReturn.findFirst({
    where: { id: returnId, userId },
    select: {
      id: true,
      taxYear: true,
      filingMode: true,
      data: true
    }
  });

  if (!taxReturn) {
    throw new Error("RETURN_NOT_FOUND");
  }

  const rawData = taxReturn.data as Record<string, unknown>;
  const payload = decryptPiiFields(rawData) as Record<string, unknown>;

  const missing = missingRequiredFields(taxReturn.filingMode, payload);
  if (missing.length > 0) {
    const fields = missing.join(",");
    throw new Error(`RETURN_INCOMPLETE:${fields}`);
  }

  const docCount = await prisma.document.count({
    where: { returnId: taxReturn.id, userId }
  });
  const preflight = runPreflightChecks(
    taxReturn.taxYear,
    taxReturn.filingMode,
    payload,
    docCount > 0
  );
  if (!preflight.passed) {
    const failedIds = preflight.checks.filter((c) => !c.passed).map((c) => c.id);
    throw new Error(`PREFLIGHT_FAILED:${failedIds.join(",")}`);
  }

  const calcResult = calculateTax(taxReturn.filingMode, payload);
  const personalSummary = calcResult.mode !== "COMPANY" ? calcResult.summary : null;

  const provider = getSubmissionProvider();
  const prepared = await provider.prepare({
    returnId: taxReturn.id,
    taxYear: taxReturn.taxYear,
    filingMode: taxReturn.filingMode,
    payload,
    generatedAt: new Date().toISOString(),
    taxSummary: personalSummary
      ? {
          netFederalTax: personalSummary.netFederalTax,
          totalTax: personalSummary.totalTax,
          balanceOwing: personalSummary.balanceOwing,
          provincial: personalSummary.provincial ?? null
        }
      : undefined
  });

  const updated = await prisma.taxReturn.update({
    where: { id: taxReturn.id },
    data: {
      status: prepared.status,
      externalSubmissionRef: prepared.externalReference
    },
    select: {
      id: true,
      status: true,
      externalSubmissionRef: true,
      updatedAt: true
    }
  });

  return {
    ...updated,
    taxYear: taxReturn.taxYear,
    provider: provider.name,
    message: prepared.message
  };
}
