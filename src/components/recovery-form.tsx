"use client";

import { useState } from "react";
import { textFor, type Locale } from "@/lib/i18n";

interface RecoveryFormProps {
  locale: Locale;
}

export function RecoveryForm({ locale }: RecoveryFormProps) {
  const t = textFor(locale);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "exists" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/account/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, reason })
      });

      if (res.status === 201) {
        setStatus("success");
      } else if (res.status === 200) {
        setStatus("exists");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.6rem" }}>
        <p className="pill" style={{ margin: 0, padding: "0.6rem 1rem", fontSize: "0.95rem" }}>
          {t.recoverySuccess}
        </p>
      </div>
    );
  }

  return (
    <div className="surface" style={{ padding: "1.1rem", display: "grid", gap: "1rem" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.2rem" }}>
        {t.recoverySubmit}
      </h2>

      {status === "exists" && (
        <p className="notice-error" style={{ margin: 0, padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}>
          {t.recoveryExists}
        </p>
      )}
      {status === "error" && (
        <p className="notice-error" style={{ margin: 0, padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}>
          {t.recoveryError}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: "grid", gap: "0.7rem" }}>
        <div className="field">
          <label htmlFor="recovery-email">{t.recoveryEmail}</label>
          <input
            id="recovery-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="recovery-name">{t.recoveryFullName}</label>
          <input
            id="recovery-name"
            type="text"
            required
            maxLength={200}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="recovery-reason">{t.recoveryReason}</label>
          <textarea
            id="recovery-reason"
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder={t.recoveryReasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          disabled={status === "submitting"}
          style={{ justifySelf: "start", padding: "0.5rem 1.2rem" }}
        >
          {status === "submitting" ? t.recoverySubmitting : t.recoverySubmit}
        </button>
      </form>

      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        {t.recoveryNote}
      </p>
    </div>
  );
}
