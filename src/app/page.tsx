import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { filingModes } from "@/lib/tax-field-config";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);
  const session = await getAuthSession();

  return (
    <main id="main-content" style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />

      {/* Hero */}
      <section className="container" style={{ marginTop: "1.5rem" }}>
        <div className="surface" style={{ padding: "clamp(1.5rem, 4vw, 3rem)", display: "grid", gap: "1.5rem", textAlign: "center" }}>
          <div style={{ display: "grid", gap: "0.7rem", justifyItems: "center" }}>
            <span className="pill" style={{ width: "fit-content" }}>
              {t.homeEyebrow}
            </span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)", lineHeight: 1.08, maxWidth: "22ch" }}>
              {t.homeTitle}
            </h1>
            <p className="muted" style={{ margin: 0, maxWidth: "58ch", fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)", lineHeight: 1.55 }}>
              {t.homeSubtitle}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link className="btn btn-primary" href={withLang("/returns/new", locale)} style={{ padding: "0.75rem 1.6rem", fontSize: "1.02rem" }}>
              {t.homeCtaStart}
            </Link>
            {!session?.user && (
              <Link className="btn btn-secondary" href={withLang("/sign-in", locale)} style={{ padding: "0.75rem 1.6rem", fontSize: "1.02rem" }}>
                {t.homeCtaSignIn}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="container" style={{ marginTop: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" }}>
          {[
            { icon: "🍁", text: t.homeStatsProvinces },
            { icon: "📅", text: t.homeStatsTaxYears },
            { icon: "📋", text: t.homeStatsFields },
            { icon: "🔐", text: t.homeStatsEncryption }
          ].map((stat) => (
            <div key={stat.text} className="surface" style={{ padding: "0.9rem", textAlign: "center", display: "grid", gap: "0.25rem" }}>
              <span style={{ fontSize: "1.3rem" }}>{stat.icon}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)" }}>{stat.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Filing mode cards */}
      <section className="container" style={{ marginTop: "1.2rem" }}>
        <div className="grid-cards">
          {filingModes.map((mode) => (
            <article key={mode.value} className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.4rem" }}>
              <h2 style={{ marginTop: 0, marginBottom: 0, fontFamily: "var(--font-title)", fontSize: "1.1rem" }}>
                {t[mode.labelKey]}
              </h2>
              <p className="muted" style={{ margin: 0, lineHeight: 1.5, fontSize: "0.92rem" }}>
                {t[mode.descriptionKey]}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container" style={{ marginTop: "1.5rem" }}>
        <div className="surface" style={{ padding: "clamp(1.2rem, 3vw, 2rem)" }}>
          <h2 style={{ margin: "0 0 1rem", fontFamily: "var(--font-title)", fontSize: "1.35rem", textAlign: "center" }}>
            {t.homeHowItWorksTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem" }}>
            {[
              { title: t.homeStep1Title, body: t.homeStep1Body },
              { title: t.homeStep2Title, body: t.homeStep2Body },
              { title: t.homeStep3Title, body: t.homeStep3Body }
            ].map((step) => (
              <div key={step.title} style={{ display: "grid", gap: "0.35rem" }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.02rem", color: "var(--brand)" }}>
                  {step.title}
                </h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="container" style={{ marginTop: "1rem" }}>
        <div className="grid-cards">
          <article className="surface" style={{ padding: "1.2rem" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.02rem" }}>{t.homeFeatureGuidedTitle}</h3>
            <p className="muted" style={{ marginBottom: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
              {t.homeFeatureGuidedBody}
            </p>
          </article>
          <article className="surface" style={{ padding: "1.2rem" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.02rem" }}>{t.homeFeatureCarryTitle}</h3>
            <p className="muted" style={{ marginBottom: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
              {t.homeFeatureCarryBody}
            </p>
          </article>
          <article className="surface" style={{ padding: "1.2rem" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.02rem" }}>{t.homeFeatureSecureTitle}</h3>
            <p className="muted" style={{ marginBottom: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
              {t.homeFeatureSecureBody}
            </p>
          </article>
        </div>
      </section>

      {/* Trust signals */}
      <section className="container" style={{ marginTop: "1.2rem" }}>
        <div className="surface" style={{ padding: "clamp(1.2rem, 3vw, 2rem)" }}>
          <h2 style={{ margin: "0 0 0.8rem", fontFamily: "var(--font-title)", fontSize: "1.2rem", textAlign: "center" }}>
            {t.homeTrustTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem 1.2rem" }}>
            {[
              t.homeTrustPipeda,
              t.homeTrustBilingual,
              t.homeTrustAudit,
              t.homeTrustMfa,
              t.homeTrustOpenSource,
              t.homeTrustNoTracking
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                <span style={{ color: "var(--brand)", fontSize: "1rem", lineHeight: 1 }}>&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container" style={{ marginTop: "2rem", paddingBottom: "1rem", display: "flex", gap: "1.2rem", justifyContent: "center", fontSize: "0.85rem", flexWrap: "wrap" }}>
        <Link href={withLang("/privacy", locale)} className="muted" style={{ textDecoration: "underline" }}>
          {t.privacyTitle}
        </Link>
        <Link href={withLang("/terms", locale)} className="muted" style={{ textDecoration: "underline" }}>
          {t.termsTitle}
        </Link>
      </footer>
    </main>
  );
}
