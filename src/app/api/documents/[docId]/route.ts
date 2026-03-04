import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { getDocumentForDownload, deleteDocument } from "@/lib/services/document-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { z } from "zod";
import fs from "fs/promises";

const paramSchema = z.object({ docId: z.string().min(1) });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const resolved = await params;
  const parsed = paramSchema.safeParse(resolved);
  if (!parsed.success) {
    return NextResponse.json({ message: "INVALID_PARAM" }, { status: 400 });
  }

  const doc = await getDocumentForDownload(parsed.data.docId, session.user.id);
  if (!doc) {
    return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(doc.filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.fileName}"`,
        "Content-Length": String(fileBuffer.length)
      }
    });
  } catch {
    return NextResponse.json({ message: "FILE_NOT_FOUND" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const resolved = await params;
  const parsed = paramSchema.safeParse(resolved);
  if (!parsed.success) {
    return NextResponse.json({ message: "INVALID_PARAM" }, { status: 400 });
  }

  const deleted = await deleteDocument(parsed.data.docId, session.user.id);
  if (!deleted) {
    return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  }

  await writeAuditEvent({
    action: "DOCUMENT_DELETE",
    resource: "document",
    userId: session.user.id,
    metadata: { documentId: parsed.data.docId },
    ...extractRequestMeta(request)
  });

  return NextResponse.json({ message: "DELETED" });
}
