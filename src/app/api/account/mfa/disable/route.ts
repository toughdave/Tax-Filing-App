import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { disableMfa } from "@/lib/services/mfa-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  await disableMfa(session.user.id);

  const meta = extractRequestMeta(request);
  await writeAuditEvent({
    action: "mfa.disabled",
    resource: "TotpDevice",
    userId: session.user.id,
    metadata: {},
    ...meta
  });

  return NextResponse.json({ message: "MFA_DISABLED" });
}
