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

      <section className="container" style={{ marginTop: "1.3rem" }}>
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "1.2rem" }}>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <span className="pill" style={{ width: "fit-content" }}>
              {t.homeEyebrow}
            </span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "clamp(1.7rem, 4.3vw, 3rem)", lineHeight: 1.1 }}>
              {t.homeTitle}
            </h1>
            <p className="muted" style={{ margin: 0, maxWidth: "70ch", fontSize: "1.05rem" }}>
              {t.homeSubtitle}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href={withLang("/returns/new", locale)}>
              {t.homeCtaStart}
            </Link>
            {!session?.user && (
              <Link className="btn btn-secondary" href={withLang("/sign-in", locale)}>
                {t.homeCtaSignIn}
              </Link>
            )}
          </div>

          <div className="grid-cards">
            {filingModes.map((mode) => (
              <article key={mode.value} className="surface" style={{ padding: "1rem" }}>
                <h2 style={{ marginTop: 0, marginBottom: "0.45rem", fontFamily: "var(--font-title)", fontSize: "1.1rem" }}>
                  {t[mode.labelKey]}
                </h2>
                <p className="muted" style={{ margin: 0, lineHeight: 1.45 }}>
                  {t[mode.descriptionKey]}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: "1rem" }}>
        <div className="grid-cards">
          <article className="surface" style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>{t.homeFeatureGuidedTitle}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {t.homeFeatureGuidedBody}
            </p>
          </article>
          <article className="surface" style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>{t.homeFeatureCarryTitle}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {t.homeFeatureCarryBody}
            </p>
          </article>
          <article className="surface" style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>{t.homeFeatureSecureTitle}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {t.homeFeatureSecureBody}
            </p>
          </article>
        </div>
      </section>

      <footer className="container" style={{ marginTop: "2rem", paddingBottom: "1rem", display: "flex", gap: "1.2rem", justifyContent: "center", fontSize: "0.85rem" }}>
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
