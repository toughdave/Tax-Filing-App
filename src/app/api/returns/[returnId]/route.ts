import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { prepareSubmissionSchema } from "@/lib/validation/tax-return";
import { getReturnForUser } from "@/lib/services/tax-return-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const { returnId } = await params;
  const parsed = prepareSubmissionSchema.safeParse({ returnId });

  if (!parsed.success) {
    return NextResponse.json({ message: "INVALID_RETURN_ID", issues: parsed.error.flatten() }, { status: 400 });
  }

  const record = await getReturnForUser(session.user.id, parsed.data.returnId);
  if (!record) {
    return NextResponse.json({ message: "RETURN_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ record });
}
