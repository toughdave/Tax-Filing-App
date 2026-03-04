import { prisma } from "@/lib/db";

export interface RecoveryRequestInput {
  email: string;
  fullName: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function submitRecoveryRequest(
  input: RecoveryRequestInput
): Promise<{ id: string; alreadyExists: boolean }> {
  const existing = await prisma.recoveryRequest.findFirst({
    where: {
      email: input.email.toLowerCase().trim(),
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] }
    }
  });

  if (existing) {
    return { id: existing.id, alreadyExists: true };
  }

  const record = await prisma.recoveryRequest.create({
    data: {
      email: input.email.toLowerCase().trim(),
      fullName: input.fullName.trim(),
      reason: input.reason.trim(),
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null
    }
  });

  return { id: record.id, alreadyExists: false };
}

export async function listRecoveryRequests(status?: string) {
  return prisma.recoveryRequest.findMany({
    where: status ? { status: status as "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DENIED" } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      reason: true,
      status: true,
      createdAt: true,
      reviewedAt: true
    }
  });
}
