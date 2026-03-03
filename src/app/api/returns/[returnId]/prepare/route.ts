import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { prepareSubmissionForUser } from "@/lib/services/tax-return-service";
import { writeAuditEvent } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const { returnId } = await params;

  try {
    const prepared = await prepareSubmissionForUser(session.user.id, returnId);

    await writeAuditEvent({
      action: "tax_return.prepared_submission",
      resource: "TaxReturn",
      metadata: {
        returnId,
        provider: prepared.provider,
        status: prepared.status
      }
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
