import { NextResponse } from "next/server";
import { z } from "zod";
import { submitRecoveryRequest } from "@/lib/services/recovery-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { checkRateLimit, extractClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { validateOrigin, csrfForbiddenResponse } from "@/lib/csrf";

const recoverySchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(200),
  reason: z.string().min(10).max(1000)
});

const RECOVERY_RATE_LIMIT = {
  windowMs: 300_000,
  maxRequests: 3
};

export async function POST(request: Request) {
  const ip = extractClientIp(request);
  const { allowed, resetAt } = checkRateLimit(`recovery:${ip}`, RECOVERY_RATE_LIMIT);
  if (!allowed) return rateLimitResponse(resetAt);

  if (!validateOrigin(request)) return csrfForbiddenResponse();

  const rawBody = await request.json().catch(() => null);
  const parsed = recoverySchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "INVALID_PAYLOAD", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const meta = extractRequestMeta(request);
  const result = await submitRecoveryRequest({
    ...parsed.data,
    ipAddress: meta.ipAddress ?? undefined,
    userAgent: meta.userAgent ?? undefined
  });

  await writeAuditEvent({
    action: "recovery.submitted",
    resource: "RecoveryRequest",
    metadata: {
      requestId: result.id,
      email: parsed.data.email,
      alreadyExists: result.alreadyExists
    },
    ...meta
  });

  if (result.alreadyExists) {
    return NextResponse.json(
      { message: "RECOVERY_REQUEST_EXISTS", requestId: result.id },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { message: "RECOVERY_REQUEST_SUBMITTED", requestId: result.id },
    { status: 201 }
  );
}
