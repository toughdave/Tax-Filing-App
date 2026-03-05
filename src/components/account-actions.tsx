"use client";

import { useEffect, useState } from "react";
import { textFor, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

interface DataRequestRecord {
  id: string;
  requestType: "EXPORT" | "DELETION";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  createdAt: string;
}

interface AccountActionsProps {
  locale: Locale;
}

export function AccountActions({ locale }: AccountActionsProps) {
  const t = textFor(locale);
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "done" | "exists">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "done" | "exists">("idle");
  const [requests, setRequests] = useState<DataRequestRecord[]>([]);

  useEffect(() => {
    fetch("/api/account/data-request")
      .then((res) => res.json())
      .then((data: { requests?: DataRequestRecord[] }) => {
        if (data.requests) setRequests(data.requests);
      })
      .catch(() => {});
  }, [exportStatus, deleteStatus]);

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

      <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.15rem" }}>
          {t.accountDataRequestHistory}
        </h2>
        {requests.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            {t.accountDataRequestEmpty}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.6rem" }}>{t.accountDataRequestType}</th>
                  <th style={{ textAlign: "left", padding: "0.6rem" }}>{t.accountDataRequestStatus}</th>
                  <th style={{ textAlign: "left", padding: "0.6rem" }}>{t.accountDataRequestDate}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.6rem" }}>
                      {t[`accountDataRequestType${req.requestType}`] ?? req.requestType}
                    </td>
                    <td style={{ padding: "0.6rem" }}>
                      <span className="pill" style={{ padding: "0.15rem 0.5rem", fontSize: "0.8rem" }}>
                        {t[`accountDataRequestStatus${req.status}`] ?? req.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem" }}>
                      {formatDate(new Date(req.createdAt), locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
