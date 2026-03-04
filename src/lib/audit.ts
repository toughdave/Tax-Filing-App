import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/session";
import type { InputJsonValue } from "@prisma/client/runtime/library";

interface AuditInput {
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function extractRequestMeta(request: Request): Pick<AuditInput, "ipAddress" | "userAgent"> {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent") ?? null
  };
}

export async function writeAuditEvent(input: AuditInput) {
  const session = await getAuthSession();

  await prisma.auditEvent.create({
    data: {
      userId: session?.user?.id,
      action: input.action,
      resource: input.resource,
      metadata: input.metadata as InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined
    }
  });
}
