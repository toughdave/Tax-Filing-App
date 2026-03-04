"use client";

import { useState } from "react";
import { textFor, type Locale } from "@/lib/i18n";

interface AccountActionsProps {
  locale: Locale;
}

export function AccountActions({ locale }: AccountActionsProps) {
  const t = textFor(locale);
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "done" | "exists">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "done" | "exists">("idle");

  async function requestExport() {
    setExportStatus("loading");
    try {
      const res = await fetch("/api/account/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "EXPORT" })
      });
      if (res.status === 201) {
        setExportStatus("done");
      } else {
        setExportStatus("exists");
      }
    } catch {
      setExportStatus("idle");
    }
  }

  async function requestDeletion() {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setDeleteStatus("loading");
    try {
      const res = await fetch("/api/account/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "DELETION" })
      });
      if (res.status === 201) {
        setDeleteStatus("done");
      } else {
        setDeleteStatus("exists");
      }
    } catch {
      setDeleteStatus("idle");
    }
  }

  return (
    <>
      <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.15rem" }}>
          {t.accountDataExport}
        </h2>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          {t.accountDataExportDesc}
        </p>
        {exportStatus === "done" && (
          <p className="pill" style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}>
            {t.accountDataRequestPending}
          </p>
        )}
        {exportStatus === "exists" && (
          <p className="notice-error" style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}>
            {t.accountDataRequestExists}
          </p>
        )}
        <button
          className="btn btn-secondary"
          onClick={() => void requestExport()}
          disabled={exportStatus === "loading" || exportStatus === "done"}
          type="button"
          style={{ justifySelf: "start", padding: "0.45rem 1rem" }}
        >
          {t.accountDataExport}
        </button>
      </div>

      <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem", borderLeft: "3px solid var(--error, #ef4444)" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.15rem", color: "var(--error, #ef4444)" }}>
          {t.accountDataDeletion}
        </h2>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          {t.accountDataDeletionDesc}
        </p>
        {deleteStatus === "done" && (
          <p className="pill" style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}>
            {t.accountDataRequestPending}
          </p>
        )}
        {deleteStatus === "exists" && (
          <p className="notice-error" style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}>
            {t.accountDataRequestExists}
          </p>
        )}
        <button
          className="btn btn-secondary"
          onClick={() => void requestDeletion()}
          disabled={deleteStatus === "loading" || deleteStatus === "done"}
          type="button"
          style={{ justifySelf: "start", padding: "0.45rem 1rem", borderColor: "var(--error, #ef4444)", color: "var(--error, #ef4444)" }}
        >
          {t.accountDataDeletion}
        </button>
      </div>
    </>
  );
}
