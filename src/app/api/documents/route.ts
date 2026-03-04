import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { uploadDocument, listDocuments, type DocumentCategoryValue } from "@/lib/services/document-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { z } from "zod";

const VALID_CATEGORIES: DocumentCategoryValue[] = [
  "T4_SLIP",
  "T5_SLIP",
  "RECEIPT",
  "BUSINESS_STATEMENT",
  "NOTICE_OF_ASSESSMENT",
  "OTHER"
];

const uploadMetaSchema = z.object({
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]),
  returnId: z.string().optional()
});

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const returnId = searchParams.get("returnId") ?? undefined;

  const documents = await listDocuments(session.user.id, returnId);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const returnId = formData.get("returnId") as string | null;

    if (!file) {
      return NextResponse.json({ message: "NO_FILE_PROVIDED" }, { status: 400 });
    }

    const metaParsed = uploadMetaSchema.safeParse({
      category: category ?? "OTHER",
      returnId: returnId ?? undefined
    });

    if (!metaParsed.success) {
      return NextResponse.json(
        { message: "INVALID_METADATA", issues: metaParsed.error.flatten() },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const doc = await uploadDocument({
      userId: session.user.id,
      returnId: metaParsed.data.returnId,
      fileName: file.name,
      mimeType: file.type,
      category: metaParsed.data.category as DocumentCategoryValue,
      data: buffer
    });

    await writeAuditEvent({
      action: "DOCUMENT_UPLOAD",
      resource: "document",
      userId: session.user.id,
      metadata: { documentId: doc.id, fileName: doc.fileName, category: doc.category },
      ...extractRequestMeta(request)
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPLOAD_FAILED";
    if (message === "UNSUPPORTED_FILE_TYPE" || message === "FILE_TOO_LARGE") {
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ message: "UPLOAD_FAILED" }, { status: 500 });
  }
}
