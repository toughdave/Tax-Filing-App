"use client";

import { useSearchParams } from "next/navigation";
import { resolveLocale, textFor } from "@/lib/i18n";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const searchParams = useSearchParams();
  const locale = resolveLocale(searchParams.get("lang"));
  const t = textFor(locale);

  return (
    <main style={{ paddingBottom: "3rem", paddingTop: "3rem" }}>
      <section className="container" style={{ display: "grid", gap: "1rem", textAlign: "center" }}>
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "0.8rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.5rem" }}>{t.errorTitle}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {error.digest ? `${t.errorReferencePrefix} ${error.digest}` : t.errorFallback}
          </p>
          <div>
            <button className="btn btn-primary" type="button" onClick={reset}>{t.errorTryAgain}</button>
          </div>
        </div>
      </section>
    </main>
  );
}
