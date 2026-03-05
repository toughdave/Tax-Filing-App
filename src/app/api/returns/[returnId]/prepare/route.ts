import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { prepareSubmissionForUser } from "@/lib/services/tax-return-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { prepareSubmissionSchema } from "@/lib/validation/tax-return";
import { guardApiRoute } from "@/lib/api-guard";
import { sendSubmissionConfirmation, isEmailEnabled } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const { returnId } = await params;
  const parsedParams = prepareSubmissionSchema.safeParse({ returnId });

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        message: "INVALID_RETURN_ID",
        issues: parsedParams.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const prepared = await prepareSubmissionForUser(session.user.id, parsedParams.data.returnId);

    await writeAuditEvent({
      action: "tax_return.prepared_submission",
      resource: "TaxReturn",
      metadata: {
        returnId: parsedParams.data.returnId,
        provider: prepared.provider,
        status: prepared.status
      },
      ...extractRequestMeta(request)
    });

    if (isEmailEnabled() && session.user.email) {
      const appUrl = process.env.NEXTAUTH_URL ?? "https://canada-tax-filing.vercel.app";
      sendSubmissionConfirmation({
        email: session.user.email,
        name: session.user.name ?? undefined,
        taxYear: prepared.taxYear,
        provider: prepared.provider,
        confirmationNumber: prepared.externalSubmissionRef ?? undefined,
        status: prepared.status,
        appUrl
      }).catch(() => {});
    }

    return NextResponse.json(prepared);
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;

      if (msg === "RETURN_NOT_FOUND") {
        return NextResponse.json({ message: msg }, { status: 404 });
      }

      if (msg.startsWith("RETURN_INCOMPLETE")) {
        return NextResponse.json({ message: msg }, { status: 409 });
      }

      if (msg.startsWith("PREFLIGHT_FAILED")) {
        return NextResponse.json({ message: msg }, { status: 422 });
      }

      if (msg === "NETFILE_NOT_CONFIGURED" || msg === "EFILE_NOT_CONFIGURED") {
        return NextResponse.json({ message: "PROVIDER_NOT_CONFIGURED" }, { status: 503 });
      }

      if (msg === "NETFILE_INDIVIDUAL_ONLY") {
        return NextResponse.json({ message: msg }, { status: 422 });
      }
    }

    return NextResponse.json({ message: "PREPARE_FAILED" }, { status: 500 });
  }
}
