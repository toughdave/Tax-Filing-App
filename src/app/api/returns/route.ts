import { NextResponse } from "next/server";
import { saveReturnSchema } from "@/lib/validation/tax-return";
import { getAuthSession } from "@/lib/session";
import { saveReturnForUser, listReturnsForUser } from "@/lib/services/tax-return-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { guardApiRoute } from "@/lib/api-guard";
import { sendFilingConfirmation, isEmailEnabled } from "@/lib/email";

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const records = await listReturnsForUser(session.user.id);
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = saveReturnSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "INVALID_PAYLOAD",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const result = await saveReturnForUser(session.user.id, parsed.data);

  await writeAuditEvent({
    action: "tax_return.saved",
    resource: "TaxReturn",
    metadata: {
      returnId: result.record.id,
      taxYear: result.record.taxYear,
      filingMode: result.record.filingMode
    },
    ...extractRequestMeta(request)
  });

  if (isEmailEnabled() && session.user.email) {
    const appUrl = process.env.NEXTAUTH_URL ?? "https://canada-tax-filing.vercel.app";
    sendFilingConfirmation({
      email: session.user.email,
      name: session.user.name ?? undefined,
      taxYear: result.record.taxYear,
      filingMode: result.record.filingMode,
      status: result.record.status,
      returnId: result.record.id,
      missingFields: result.missingRequired.length,
      appUrl
    }).catch(() => {});
  }

  return NextResponse.json(result);
}
