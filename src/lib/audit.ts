import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/session";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { isIP } from "node:net";

interface AuditInput {
  userId?: string | null;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const USER_AGENT_MAX_LENGTH = 512;

function normalizeIpCandidate(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const candidate = raw.trim();
  if (!candidate) {
    return null;
  }

  if (isIP(candidate)) {
    return candidate;
  }

  const bracketMatch = candidate.match(/^\[([a-fA-F0-9:]+)](?::\d+)?$/);
  if (bracketMatch?.[1] && isIP(bracketMatch[1])) {
    return bracketMatch[1];
  }

  const hostOnly = candidate.replace(/:\d+$/, "");
  return isIP(hostOnly) ? hostOnly : null;
}

export function extractRequestMeta(request: Request): Pick<AuditInput, "ipAddress" | "userAgent"> {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  const ipAddress =
    normalizeIpCandidate(request.headers.get("x-vercel-forwarded-for")) ??
    normalizeIpCandidate(request.headers.get("cf-connecting-ip")) ??
    normalizeIpCandidate(request.headers.get("x-real-ip")) ??
    normalizeIpCandidate(forwardedFor);

  const rawUserAgent = request.headers.get("user-agent")?.trim();
  const userAgent = rawUserAgent ? rawUserAgent.slice(0, USER_AGENT_MAX_LENGTH) : null;

  return {
    ipAddress,
    userAgent
  };
}

export async function writeAuditEvent(input: AuditInput) {
  const session = await getAuthSession();

  await prisma.auditEvent.create({
    data: {
      userId: input.userId ?? session?.user?.id,
      action: input.action,
      resource: input.resource,
      metadata: input.metadata as InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined
    }
  });
}
