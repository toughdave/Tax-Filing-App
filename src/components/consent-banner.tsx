"use client";

import { useState, useEffect } from "react";
import { textFor, type Locale } from "@/lib/i18n";

interface ConsentBannerProps {
  locale: Locale;
}

interface ConsentStatus {
  termsOfService: boolean;
  privacyPolicy: boolean;
  dataProcessing: boolean;
}

export function ConsentBanner({ locale }: ConsentBannerProps) {
  const t = textFor(locale);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkConsent() {
      try {
        const res = await fetch("/api/consent");
        if (!res.ok) return;
        const data = (await res.json()) as { consent: ConsentStatus };
        const allGranted =
          data.consent.termsOfService &&
          data.consent.privacyPolicy &&
          data.consent.dataProcessing;
        if (!allGranted) {
          setVisible(true);
        }
      } catch {
        // If check fails (e.g. not authenticated), don't show banner
      }
    }
    void checkConsent();
  }, []);

  async function acceptAll() {
    setSubmitting(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          types: ["TERMS_OF_SERVICE", "PRIVACY_POLICY", "DATA_PROCESSING"]
        })
      });
      setVisible(false);
    } catch {
      // Silently fail — user can retry
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "var(--bg-surface, #fff)",
        borderTop: "2px solid var(--line, #e2e8f0)",
        padding: "1rem 1.2rem",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)"
      }}
    >
      <div className="container" style={{ display: "grid", gap: "0.6rem" }}>
        <strong style={{ fontFamily: "var(--font-title)" }}>{t.consentBannerTitle}</strong>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
          {t.consentBannerBody}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={() => void acceptAll()}
            disabled={submitting}
            type="button"
            style={{ padding: "0.5rem 1.2rem" }}
          >
            {t.consentAcceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
