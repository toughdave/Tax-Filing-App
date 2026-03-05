"use client";

import { textFor, type Locale } from "@/lib/i18n";

interface ImportStubsProps {
  locale: Locale;
}

export function TaxSlipImportStub({ locale }: ImportStubsProps) {
  const t = textFor(locale);

  return (
    <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem", opacity: 0.75 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>
          {t.importSlipsTitle}
        </h3>
        <span className="pill" style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
          {t.importComingSoon}
        </span>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
        {t.importSlipsDescription}
      </p>
      <div style={{
        border: "2px dashed var(--line)",
        borderRadius: "12px",
        padding: "1.5rem",
        textAlign: "center",
        color: "var(--ink-soft)",
        fontSize: "0.9rem"
      }}>
        {t.importSlipsDropzone}
      </div>
    </section>
  );
}

export function NoaImportStub({ locale }: ImportStubsProps) {
  const t = textFor(locale);

  return (
    <section className="surface" style={{ padding: "1rem", display: "grid", gap: "0.6rem", opacity: 0.75 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.05rem" }}>
          {t.importNoaTitle}
        </h3>
        <span className="pill" style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
          {t.importComingSoon}
        </span>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
        {t.importNoaDescription}
      </p>
      <button
        className="btn btn-secondary"
        disabled
        type="button"
        style={{ justifySelf: "start", opacity: 0.6 }}
      >
        {t.importNoaConnect}
      </button>
    </section>
  );
}
