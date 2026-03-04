import { SiteHeader } from "@/components/site-header";
import { SignInPanel } from "@/components/sign-in-panel";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";
import { availableProviders } from "@/lib/auth-policy";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);

  return (
    <main style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem", display: "grid", gap: "0.8rem" }}>
        <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.55rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.45rem" }}>{t.signInTitle}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t.signInSubtitle}
          </p>
          <p className="notice-error" style={{ margin: 0 }}>
            {t.securityNotice}
          </p>
        </div>

        <SignInPanel locale={locale} callbackUrl={withLang("/dashboard", locale)} providers={availableProviders()} />

        <div style={{ textAlign: "center", marginTop: "0.3rem" }}>
          <a href={withLang("/recovery", locale)} className="muted" style={{ fontSize: "0.9rem" }}>
            {t.recoveryLink}
          </a>
        </div>
      </section>
    </main>
  );
}
