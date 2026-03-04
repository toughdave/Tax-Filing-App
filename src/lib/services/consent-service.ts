import { prisma } from "@/lib/db";
import type { ConsentType, DataRequestType } from "@prisma/client";

const CURRENT_CONSENT_VERSIONS: Record<ConsentType, string> = {
  TERMS_OF_SERVICE: "1.0",
  PRIVACY_POLICY: "1.0",
  DATA_PROCESSING: "1.0"
};

export function currentConsentVersion(type: ConsentType): string {
  return CURRENT_CONSENT_VERSIONS[type];
}

export async function hasCurrentConsent(
  userId: string,
  type: ConsentType
): Promise<boolean> {
  const version = currentConsentVersion(type);
  const record = await prisma.consentRecord.findFirst({
    where: {
      userId,
      consentType: type,
      version,
      granted: true
    },
    orderBy: { createdAt: "desc" }
  });
  return record !== null;
}

export async function getUserConsentStatus(userId: string): Promise<{
  termsOfService: boolean;
  privacyPolicy: boolean;
  dataProcessing: boolean;
}> {
  const [tos, privacy, data] = await Promise.all([
    hasCurrentConsent(userId, "TERMS_OF_SERVICE"),
    hasCurrentConsent(userId, "PRIVACY_POLICY"),
    hasCurrentConsent(userId, "DATA_PROCESSING")
  ]);

  return {
    termsOfService: tos,
    privacyPolicy: privacy,
    dataProcessing: data
  };
}

export async function recordConsent(
  userId: string,
  types: ConsentType[],
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.consentRecord.createMany({
    data: types.map((type) => ({
      userId,
      consentType: type,
      version: currentConsentVersion(type),
      granted: true,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    }))
  });
}

export async function revokeConsent(
  userId: string,
  type: ConsentType,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.consentRecord.create({
    data: {
      userId,
      consentType: type,
      version: currentConsentVersion(type),
      granted: false,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    }
  });
}

export async function createDataRequest(
  userId: string,
  requestType: DataRequestType,
  reason?: string
): Promise<{ id: string }> {
  const existing = await prisma.dataRequest.findFirst({
    where: {
      userId,
      requestType,
      status: { in: ["PENDING", "PROCESSING"] }
    }
  });

  if (existing) {
    return { id: existing.id };
  }

  const record = await prisma.dataRequest.create({
    data: {
      userId,
      requestType,
      reason: reason ?? null
    }
  });

  return { id: record.id };
}

export async function listDataRequests(userId: string) {
  return prisma.dataRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestType: true,
      status: true,
      createdAt: true,
      processedAt: true
    }
  });
}
