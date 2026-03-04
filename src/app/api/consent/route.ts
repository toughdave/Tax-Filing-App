import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/session";
import { getUserConsentStatus, recordConsent } from "@/lib/services/consent-service";
import { extractRequestMeta, writeAuditEvent } from "@/lib/audit";
import { guardApiRoute } from "@/lib/api-guard";

const grantConsentSchema = z.object({
  types: z.array(
    z.enum(["TERMS_OF_SERVICE", "PRIVACY_POLICY", "DATA_PROCESSING"])
  ).min(1)
});

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const status = await getUserConsentStatus(session.user.id);
  return NextResponse.json({ consent: status });
}

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = grantConsentSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "INVALID_PAYLOAD", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const meta = extractRequestMeta(request);
  await recordConsent(
    session.user.id,
    parsed.data.types,
    meta.ipAddress ?? undefined,
    meta.userAgent ?? undefined
  );

  await writeAuditEvent({
    action: "consent.granted",
    resource: "ConsentRecord",
    metadata: { types: parsed.data.types },
    ...meta
  });

  const status = await getUserConsentStatus(session.user.id);
  return NextResponse.json({ consent: status });
}
