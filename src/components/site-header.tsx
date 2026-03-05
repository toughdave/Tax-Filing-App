import Link from "next/link";
import { type Locale, textFor, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

interface SiteHeaderProps {
  locale: Locale;
}

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const session = await getAuthSession();
  const t = textFor(locale);
  const otherLocale: Locale = locale === "en" ? "fr" : "en";

  return (
    <header style={{ paddingTop: "1.1rem" }}>
      <div className="container surface" style={{ padding: "0.8rem 1.1rem" }}>
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="pill">{t.homeEyebrow}</span>
            <Link href={withLang("/", locale)} style={{ fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "1.08rem" }}>
              {t.appName}
            </Link>
          </div>

          <nav className="desktop-nav" aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Link href={withLang("/", locale)}>{t.navHome}</Link>
            <Link href={withLang("/dashboard", locale)}>{t.navDashboard}</Link>
            <Link href={withLang("/returns/new", locale)}>{t.navStartReturn}</Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <ThemeToggle />
            <Link href={withLang("/", otherLocale)} className="btn btn-secondary" style={{ padding: "0.45rem 0.8rem" }}>
              {otherLocale.toUpperCase()}
            </Link>
            {session?.user ? (
              <>
                <Link href={withLang("/account", locale)} className="btn btn-secondary" style={{ padding: "0.45rem 0.8rem" }}>
                  {t.navAccount}
                </Link>
                <span className="muted" style={{ fontSize: "0.9rem" }}>
                  {t.navSignedInAs}: {session.user.email}
                </span>
                <SignOutButton callbackUrl={withLang("/", locale)} label={t.navSignOut} />
              </>
            ) : (
              <Link className="btn btn-primary" href={withLang("/sign-in", locale)}>
                {t.navSignIn}
              </Link>
            )}
          </div>
        </div>

        <nav className="mobile-nav" aria-label="Mobile navigation" style={{ marginTop: "0.9rem", display: "flex", gap: "1rem", overflowX: "auto" }}>
          <Link href={withLang("/", locale)}>{t.navHome}</Link>
          <Link href={withLang("/dashboard", locale)}>{t.navDashboard}</Link>
          <Link href={withLang("/returns/new", locale)}>{t.navStartReturn}</Link>
        </nav>
      </div>
    </header>
  );
}
