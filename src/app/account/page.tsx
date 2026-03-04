import { SiteHeader } from "@/components/site-header";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { getUserConsentStatus } from "@/lib/services/consent-service";
import { AccountActions } from "@/components/account-actions";
import Link from "next/link";

export default async function AccountPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return (
      <main style={{ paddingBottom: "3rem" }}>
        <SiteHeader locale={locale} />
        <section className="container" style={{ marginTop: "1.2rem" }}>
          <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.7rem" }}>
            <p className="muted" style={{ margin: 0 }}>{t.signInSubtitle}</p>
            <Link className="btn btn-primary" href={withLang("/sign-in", locale)}>{t.navSignIn}</Link>
          </div>
        </section>
      </main>
    );
  }

  const consent = await getUserConsentStatus(session.user.id);

  return (
    <main style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem", display: "grid", gap: "1rem" }}>
        <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.5rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.5rem" }}>
            {t.accountSettingsTitle}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {session.user.email}
          </p>
        </div>

        <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.15rem" }}>
            {t.consentBannerTitle}
          </h2>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t.consentTerms}</span>
              <span className={consent.termsOfService ? "pill" : "notice-error"} style={{ padding: "0.2rem 0.6rem", fontSize: "0.85rem" }}>
                {consent.termsOfService ? t.consentGranted : t.consentPending}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t.consentPrivacy}</span>
              <span className={consent.privacyPolicy ? "pill" : "notice-error"} style={{ padding: "0.2rem 0.6rem", fontSize: "0.85rem" }}>
                {consent.privacyPolicy ? t.consentGranted : t.consentPending}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t.consentDataProcessing}</span>
              <span className={consent.dataProcessing ? "pill" : "notice-error"} style={{ padding: "0.2rem 0.6rem", fontSize: "0.85rem" }}>
                {consent.dataProcessing ? t.consentGranted : t.consentPending}
              </span>
            </div>
          </div>
        </div>

        <AccountActions locale={locale} />
      </section>
    </main>
  );
}
