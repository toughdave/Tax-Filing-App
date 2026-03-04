import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { prepareSubmissionForUser } from "@/lib/services/tax-return-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { prepareSubmissionSchema } from "@/lib/validation/tax-return";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
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

    return NextResponse.json(prepared);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RETURN_NOT_FOUND") {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }

      if (error.message.startsWith("RETURN_INCOMPLETE")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
    }

    return NextResponse.json({ message: "PREPARE_FAILED" }, { status: 500 });
  }
}
