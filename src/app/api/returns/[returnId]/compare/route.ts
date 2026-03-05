import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { prepareSubmissionSchema } from "@/lib/validation/tax-return";
import { getYearOverYearComparison } from "@/lib/services/tax-return-service";

export async function GET(
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
  const parsed = prepareSubmissionSchema.safeParse({ returnId });
  if (!parsed.success) {
    return NextResponse.json({ message: "INVALID_RETURN_ID" }, { status: 400 });
  }

  const comparison = await getYearOverYearComparison(session.user.id, parsed.data.returnId);
  if (!comparison) {
    return NextResponse.json({ message: "RETURN_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ comparison });
}
