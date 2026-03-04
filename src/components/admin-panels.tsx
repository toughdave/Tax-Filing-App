"use client";

import { useState, useEffect } from "react";
import { textFor, type Locale } from "@/lib/i18n";

interface AdminPanelsProps {
  locale: Locale;
}

interface RecoveryItem {
  id: string;
  email: string;
  fullName: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface DataRequestItem {
  id: string;
  email: string;
  requestType: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

interface AuditItem {
  id: string;
  action: string;
  resource: string;
  email: string;
  ipAddress: string;
  createdAt: string;
}

type Tab = "recovery" | "data" | "audit";

export function AdminPanels({ locale }: AdminPanelsProps) {
  const t = textFor(locale);
  const [tab, setTab] = useState<Tab>("recovery");
  const [recoveryData, setRecoveryData] = useState<RecoveryItem[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequestItem[]>([]);
  const [auditData, setAuditData] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchTab(tab);
  }, [tab]);

  async function fetchTab(active: Tab) {
    setLoading(true);
    try {
      if (active === "recovery") {
        const res = await fetch("/api/admin/recovery-requests");
        if (res.ok) {
          const json = await res.json();
          setRecoveryData(json.requests ?? []);
        }
      } else if (active === "data") {
        const res = await fetch("/api/admin/data-requests");
        if (res.ok) {
          const json = await res.json();
          setDataRequests(json.requests ?? []);
        }
      } else {
        const res = await fetch("/api/admin/audit-log?limit=50");
        if (res.ok) {
          const json = await res.json();
          setAuditData(json.events ?? []);
        }
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {(["recovery", "data", "audit"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "btn btn-primary" : "btn btn-secondary"}
            style={{ padding: "0.45rem 1rem" }}
            onClick={() => setTab(key)}
          >
            {key === "recovery" ? t.adminRecoveryRequests : key === "data" ? t.adminDataRequests : t.adminAuditLog}
          </button>
        ))}
      </div>

      <div className="surface" style={{ padding: "1rem", overflow: "auto" }}>
        {loading && <p className="muted">Loading…</p>}

        {!loading && tab === "recovery" && (
          recoveryData.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{t.adminNoResults}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line, #e2e8f0)" }}>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminEmail}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminStatus}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminDate}</th>
                </tr>
              </thead>
              <tbody>
                {recoveryData.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--line, #e2e8f0)" }}>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{r.email}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>
                      <span className="pill" style={{ padding: "0.15rem 0.5rem", fontSize: "0.8rem" }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "0.4rem 0.6rem" }} className="muted">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {!loading && tab === "data" && (
          dataRequests.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{t.adminNoResults}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line, #e2e8f0)" }}>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminEmail}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminType}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminStatus}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminDate}</th>
                </tr>
              </thead>
              <tbody>
                {dataRequests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--line, #e2e8f0)" }}>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{r.email}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{r.requestType}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>
                      <span className="pill" style={{ padding: "0.15rem 0.5rem", fontSize: "0.8rem" }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "0.4rem 0.6rem" }} className="muted">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {!loading && tab === "audit" && (
          auditData.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>{t.adminNoResults}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line, #e2e8f0)" }}>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminAction}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminResource}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminEmail}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminIp}</th>
                  <th style={{ padding: "0.4rem 0.6rem" }}>{t.adminDate}</th>
                </tr>
              </thead>
              <tbody>
                {auditData.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--line, #e2e8f0)" }}>
                    <td style={{ padding: "0.4rem 0.6rem", fontFamily: "monospace", fontSize: "0.8rem" }}>{e.action}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{e.resource}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{e.email}</td>
                    <td style={{ padding: "0.4rem 0.6rem", fontFamily: "monospace", fontSize: "0.8rem" }}>{e.ipAddress}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }} className="muted">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </>
  );
}
