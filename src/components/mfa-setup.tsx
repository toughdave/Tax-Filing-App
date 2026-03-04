"use client";

import { useState, useEffect } from "react";
import { textFor, type Locale } from "@/lib/i18n";

interface MfaSetupProps {
  locale: Locale;
}

type MfaState = "loading" | "disabled" | "enrolling" | "verifying" | "enabled";

export function MfaSetup({ locale }: MfaSetupProps) {
  const t = textFor(locale);
  const [state, setState] = useState<MfaState>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/account/mfa/challenge");
      if (res.ok) {
        const data = await res.json();
        setState(data.mfaEnabled ? "enabled" : "disabled");
      }
    } catch {
      setState("disabled");
    }
  }

  async function startEnroll() {
    setError("");
    try {
      const res = await fetch("/api/account/mfa/enroll", { method: "POST" });
      if (res.status === 409) {
        setState("enabled");
        return;
      }
      if (!res.ok) {
        setError(t.mfaEnrollError);
        return;
      }
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setRecoveryCodes(data.recoveryCodes);
      setState("enrolling");
    } catch {
      setError(t.mfaEnrollError);
    }
  }

  async function confirmEnroll() {
    setError("");
    const res = await fetch("/api/account/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    if (res.ok) {
      setState("enabled");
      setToken("");
    } else {
      setError(t.mfaInvalidCode);
    }
  }

  async function disable() {
    setError("");
    const res = await fetch("/api/account/mfa/disable", { method: "POST" });
    if (res.ok) {
      setState("disabled");
      setQrCode("");
      setSecret("");
      setRecoveryCodes([]);
    }
  }

  if (state === "loading") {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="surface" style={{ padding: "1.1rem", display: "grid", gap: "0.8rem" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.15rem" }}>
        {t.mfaTitle}
      </h2>
      <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>{t.mfaDescription}</p>

      {error && (
        <p className="notice-error" style={{ margin: 0, padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {state === "disabled" && (
        <button
          className="btn btn-primary"
          style={{ justifySelf: "start", padding: "0.5rem 1.2rem" }}
          onClick={() => void startEnroll()}
        >
          {t.mfaEnable}
        </button>
      )}

      {state === "enrolling" && (
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{t.mfaScanQr}</p>

          {qrCode && (
            <div style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="TOTP QR Code" style={{ maxWidth: "200px" }} />
            </div>
          )}

          <div style={{ fontSize: "0.85rem" }}>
            <p className="muted" style={{ margin: "0 0 0.3rem" }}>{t.mfaManualEntry}</p>
            <code style={{ fontSize: "0.8rem", wordBreak: "break-all", display: "block", padding: "0.4rem", background: "var(--bg-muted, #f1f5f9)", borderRadius: "4px" }}>
              {secret}
            </code>
          </div>

          <div style={{ fontSize: "0.85rem" }}>
            <p className="muted" style={{ margin: "0 0 0.3rem" }}>{t.mfaRecoveryCodesLabel}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", fontFamily: "monospace", fontSize: "0.8rem", padding: "0.4rem", background: "var(--bg-muted, #f1f5f9)", borderRadius: "4px" }}>
              {recoveryCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <p className="notice-error" style={{ margin: "0.4rem 0 0", fontSize: "0.8rem" }}>
              {t.mfaRecoveryCodesWarning}
            </p>
          </div>

          <div className="field" style={{ maxWidth: "200px" }}>
            <label htmlFor="mfa-token">{t.mfaEnterCode}</label>
            <input
              id="mfa-token"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ justifySelf: "start", padding: "0.5rem 1.2rem" }}
            disabled={token.length !== 6}
            onClick={() => void confirmEnroll()}
          >
            {t.mfaVerify}
          </button>
        </div>
      )}

      {state === "enabled" && (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <p className="pill" style={{ margin: 0, padding: "0.4rem 0.8rem", fontSize: "0.9rem", justifySelf: "start" }}>
            {t.mfaEnabled}
          </p>
          <button
            className="btn btn-secondary"
            style={{ justifySelf: "start", padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            onClick={() => void disable()}
          >
            {t.mfaDisable}
          </button>
        </div>
      )}
    </div>
  );
}
