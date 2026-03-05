import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { prepareSubmissionSchema } from "@/lib/validation/tax-return";
import { getReturnForUser } from "@/lib/services/tax-return-service";
import { generateReturnPdf } from "@/lib/services/pdf-generator";
import type { CalculationResult } from "@/lib/services/tax-calculation-engine";

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

  const record = await getReturnForUser(session.user.id, parsed.data.returnId);
  if (!record) {
    return NextResponse.json({ message: "RETURN_NOT_FOUND" }, { status: 404 });
  }

  const pdfBytes = generateReturnPdf({
    id: record.id,
    taxYear: record.taxYear,
    filingMode: record.filingMode,
    status: record.status,
    data: (record.data as Record<string, unknown>) ?? {},
    taxSummary: (record.taxSummary as unknown as CalculationResult) ?? null,
    updatedAt: record.updatedAt,
    submittedAt: record.submittedAt,
    externalSubmissionRef: record.externalSubmissionRef
  });

  const fileName = `tax-return-${record.taxYear}-${record.id.slice(0, 8)}.pdf`;

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
