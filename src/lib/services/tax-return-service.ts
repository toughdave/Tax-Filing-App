import { prisma } from "@/lib/db";
import type { SaveReturnInput } from "@/lib/validation/tax-return";
import { getSubmissionProvider } from "@/lib/submission-providers";
import { requiredFieldsForMode, type FilingMode } from "@/lib/tax-field-config";
import { calculateTax, type CalculationResult } from "@/lib/services/tax-calculation-engine";
import { runPreflightChecks } from "@/lib/services/filing-preflight";
import { buildCarryForwardData, computeCarryForwardDiff, type CarryForwardDiffEntry } from "@/lib/carry-forward-config";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { encryptPiiFields, decryptPiiFields, encryptPiiValue, decryptPiiValue } from "@/lib/pii-crypto";

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

function asProfileMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return { ...(metadata as Record<string, unknown>) };
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBirthDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asDependants(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

export async function getTaxProfilePrefillForUser(userId: string): Promise<Record<string, string | number>> {
  const profile = await prisma.taxProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      legalFirstName: true,
      legalLastName: true,
      dateOfBirth: true,
      sinLast4: true,
      residencyProvince: true,
      maritalStatus: true,
      dependants: true,
      metadata: true
    }
  });

  if (!profile) {
    return {};
  }

  const metadata = asProfileMetadata(profile.metadata);
  const fallbackName = [profile.legalFirstName, profile.legalLastName].filter(Boolean).join(" ").trim();
  const encryptedLegalName = typeof metadata.legalName === "string" ? metadata.legalName : null;
  const legalName = encryptedLegalName
    ? decryptPiiValue(encryptedLegalName)
    : (fallbackName.length > 0 ? fallbackName : null);
  const payload: Record<string, string | number> = {};

  if (legalName) {
    payload.legalName = legalName;
  }
  if (profile.sinLast4) {
    payload.sinLast4 = decryptPiiValue(profile.sinLast4);
  }
  if (profile.dateOfBirth) {
    payload.birthDate = profile.dateOfBirth.toISOString().slice(0, 10);
  }
  if (profile.residencyProvince) {
    payload.residencyProvince = profile.residencyProvince;
  }
  if (profile.maritalStatus) {
    payload.maritalStatus = profile.maritalStatus;
  }
  if (typeof profile.dependants === "number" && profile.dependants > 0) {
    payload.dependants = profile.dependants;
  }

  return payload;
}

async function syncTaxProfileFromPayload(userId: string, payload: Record<string, unknown>) {
  const legalName = asNonEmptyString(payload.legalName);
  const sinLast4 = typeof payload.sinLast4 === "string" && /^\d{4}$/.test(payload.sinLast4.trim())
    ? payload.sinLast4.trim()
    : null;
  const birthDate = asBirthDate(payload.birthDate);
  const residencyProvince = asNonEmptyString(payload.residencyProvince);
  const maritalStatus = asNonEmptyString(payload.maritalStatus);
  const dependants = asDependants(payload.dependants);

  if (!legalName && !sinLast4 && !birthDate && !residencyProvince && !maritalStatus && dependants === null) {
    return;
  }

  const existing = await prisma.taxProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, metadata: true }
  });

  const metadata = asProfileMetadata(existing?.metadata);
  if (legalName) {
    metadata.legalName = encryptPiiValue(legalName);
  }

  const data = {
    ...(birthDate ? { dateOfBirth: birthDate } : {}),
    ...(sinLast4 ? { sinLast4: encryptPiiValue(sinLast4) } : {}),
    ...(residencyProvince ? { residencyProvince } : {}),
    ...(maritalStatus ? { maritalStatus } : {}),
    ...(dependants !== null ? { dependants } : {}),
    metadata: metadata as InputJsonValue
  };

  if (existing) {
    await prisma.taxProfile.update({ where: { id: existing.id }, data });
    return;
  }

  await prisma.taxProfile.create({
    data: {
      userId,
      ...data
    }
  });
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

  const currentSummary = calculateTax(current.filingMode, currentData, current.taxYear);
  const priorSummary = prior ? calculateTax(current.filingMode, priorData, prior.taxYear) : null;

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
    currentSummary,
    priorSummary
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

  const taxSummary: CalculationResult = calculateTax(mode, mergedData, input.taxYear);

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

  await syncTaxProfileFromPayload(userId, mergedData);

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

  const documents = await prisma.document.findMany({
    where: { returnId: taxReturn.id, userId },
    select: {
      id: true,
      category: true,
      storagePath: true
    }
  });
  const preflight = runPreflightChecks(
    taxReturn.taxYear,
    taxReturn.filingMode,
    payload,
    documents.length > 0
  );
  if (!preflight.passed) {
    const failedIds = preflight.checks.filter((c) => !c.passed).map((c) => c.id);
    throw new Error(`PREFLIGHT_FAILED:${failedIds.join(",")}`);
  }

  const calcResult = calculateTax(taxReturn.filingMode, payload, taxReturn.taxYear);
  const personalSummary = calcResult.mode !== "COMPANY" ? calcResult.summary : null;

  const provider = getSubmissionProvider();
  const prepared = await provider.prepare({
    returnId: taxReturn.id,
    taxYear: taxReturn.taxYear,
    filingMode: taxReturn.filingMode,
    payload,
    documents,
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
