import { prisma } from "@/lib/db";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.DOCUMENT_STORAGE_PATH ?? path.join(process.cwd(), ".uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv"
];

export type DocumentCategoryValue =
  | "T4_SLIP"
  | "T5_SLIP"
  | "RECEIPT"
  | "BUSINESS_STATEMENT"
  | "NOTICE_OF_ASSESSMENT"
  | "OTHER";

export interface UploadInput {
  userId: string;
  returnId?: string;
  fileName: string;
  mimeType: string;
  category: DocumentCategoryValue;
  data: Buffer;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  uploadedAt: Date;
  returnId: string | null;
}

export function validateUpload(mimeType: string, sizeBytes: number): string | null {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return "UNSUPPORTED_FILE_TYPE";
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    return "FILE_TOO_LARGE";
  }
  return null;
}

export async function verifyReturnOwnership(returnId: string, userId: string): Promise<boolean> {
  const taxReturn = await prisma.taxReturn.findFirst({
    where: { id: returnId, userId },
    select: { id: true }
  });
  return taxReturn !== null;
}

export async function uploadDocument(input: UploadInput): Promise<DocumentRecord> {
  const error = validateUpload(input.mimeType, input.data.length);
  if (error) throw new Error(error);

  if (input.returnId) {
    const owned = await verifyReturnOwnership(input.returnId, input.userId);
    if (!owned) throw new Error("RETURN_NOT_OWNED");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = input.fileName.split(".").pop() ?? "bin";
  const storageName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = path.join(UPLOAD_DIR, storageName);

  await fs.writeFile(storagePath, input.data);

  const doc = await prisma.document.create({
    data: {
      userId: input.userId,
      returnId: input.returnId ?? null,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.data.length,
      storagePath: storageName,
      category: input.category
    }
  });

  return {
    id: doc.id,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    category: doc.category,
    uploadedAt: doc.uploadedAt,
    returnId: doc.returnId
  };
}

export async function listDocuments(userId: string, returnId?: string): Promise<DocumentRecord[]> {
  const docs = await prisma.document.findMany({
    where: {
      userId,
      ...(returnId ? { returnId } : {})
    },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      category: true,
      uploadedAt: true,
      returnId: true
    }
  });
  return docs;
}

export async function getDocumentForDownload(
  docId: string,
  userId: string
): Promise<{ filePath: string; fileName: string; mimeType: string } | null> {
  const doc = await prisma.document.findFirst({
    where: { id: docId, userId }
  });
  if (!doc) return null;

  const filePath = path.join(UPLOAD_DIR, doc.storagePath);
  return { filePath, fileName: doc.fileName, mimeType: doc.mimeType };
}

export async function deleteDocument(docId: string, userId: string): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: { id: docId, userId }
  });
  if (!doc) return false;

  const filePath = path.join(UPLOAD_DIR, doc.storagePath);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted from storage
  }

  await prisma.document.delete({ where: { id: docId } });
  return true;
}
