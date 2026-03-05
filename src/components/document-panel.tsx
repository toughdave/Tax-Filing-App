"use client";

import { useCallback, useEffect, useState } from "react";
import { textFor, type Locale } from "@/lib/i18n";

interface DocumentRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  uploadedAt: string;
}

const CATEGORIES = [
  "T4_SLIP",
  "T5_SLIP",
  "RECEIPT",
  "BUSINESS_STATEMENT",
  "NOTICE_OF_ASSESSMENT",
  "OTHER"
] as const;

const CATEGORY_I18N: Record<string, string> = {
  T4_SLIP: "documentsCategoryT4",
  T5_SLIP: "documentsCategoryT5",
  RECEIPT: "documentsCategoryReceipt",
  BUSINESS_STATEMENT: "documentsCategoryBusiness",
  NOTICE_OF_ASSESSMENT: "documentsCategoryNOA",
  OTHER: "documentsCategoryOther"
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentPanelProps {
  locale: Locale;
  returnId: string | null;
}

export function DocumentPanel({ locale, returnId }: DocumentPanelProps) {
  const t = textFor(locale);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("OTHER");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!returnId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?returnId=${returnId}`);
      if (res.ok) {
        const data = (await res.json()) as { documents: DocumentRecord[] };
        setDocuments(data.documents);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setIsLoading(false);
    }
  }, [returnId]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !returnId) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t.documentsFileTooLarge);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("returnId", returnId);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        if (data?.message === "UNSUPPORTED_FILE_TYPE") {
          setUploadError(t.documentsUnsupportedType);
        } else if (data?.message === "FILE_TOO_LARGE") {
          setUploadError(t.documentsFileTooLarge);
        } else {
          setUploadError(t.documentsUploadError);
        }
        return;
      }

      await fetchDocuments();
    } catch {
      setUploadError(t.documentsUploadError);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch {
      // Silently fail
    } finally {
      setDeleteConfirm(null);
    }
  }

  if (!returnId) {
    return (
      <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.documentsTitle}</h3>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t.documentsDescription}</p>
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem", fontStyle: "italic" }}>
          {t.documentsSaveFirst ?? "Save your return first to upload documents."}
        </p>
      </section>
    );
  }

  return (
    <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>{t.documentsTitle}</h3>
      <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t.documentsDescription}</p>

      {/* Upload controls */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "0.5rem 0.7rem", fontSize: "0.9rem", background: "#fff", minHeight: "44px" }}
          aria-label={t.documentsCategory}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t[CATEGORY_I18N[cat]] ?? cat}
            </option>
          ))}
        </select>
        <label
          className="btn btn-secondary"
          style={{ cursor: isUploading ? "wait" : "pointer", position: "relative", overflow: "hidden" }}
        >
          {isUploading ? t.documentsUploading : t.documentsUpload}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.csv"
            onChange={(e) => void handleUpload(e)}
            disabled={isUploading}
            style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, cursor: "pointer" }}
            aria-label={t.documentsUpload}
          />
        </label>
      </div>

      {uploadError && <p className="notice-error" style={{ margin: 0 }}>{uploadError}</p>}

      {/* Document list */}
      {isLoading ? (
        <div className="muted" style={{ fontSize: "0.9rem" }}>Loading...</div>
      ) : documents.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>{t.documentsEmpty}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.5rem", fontWeight: 600 }}>{t.documentsFileName}</th>
                <th style={{ padding: "0.5rem 0.5rem", fontWeight: 600 }}>{t.documentsCategory}</th>
                <th style={{ padding: "0.5rem 0.5rem", fontWeight: 600 }}>{t.documentsSize}</th>
                <th style={{ padding: "0.5rem 0.5rem", fontWeight: 600 }}>{t.documentsDate}</th>
                <th style={{ padding: "0.5rem 0.5rem", fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "0.5rem" }}>
                    <a
                      href={`/api/documents/${doc.id}`}
                      style={{ color: "var(--brand-2)", textDecoration: "underline" }}
                      download
                    >
                      {doc.fileName}
                    </a>
                  </td>
                  <td style={{ padding: "0.5rem" }}>{t[CATEGORY_I18N[doc.category]] ?? doc.category}</td>
                  <td style={{ padding: "0.5rem" }}>{formatFileSize(doc.sizeBytes)}</td>
                  <td style={{ padding: "0.5rem" }}>{new Date(doc.uploadedAt).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA")}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {deleteConfirm === doc.id ? (
                      <span style={{ display: "flex", gap: "0.3rem" }}>
                        <button
                          className="btn"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}
                          onClick={() => void handleDelete(doc.id)}
                          type="button"
                        >
                          ✓
                        </button>
                        <button
                          className="btn"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                          onClick={() => setDeleteConfirm(null)}
                          type="button"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <button
                        className="btn"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", color: "var(--alert)" }}
                        onClick={() => setDeleteConfirm(doc.id)}
                        type="button"
                      >
                        {t.documentsDelete}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
