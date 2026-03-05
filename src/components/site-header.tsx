import Link from "next/link";
import { headers } from "next/headers";
import { type Locale, textFor, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

interface SiteHeaderProps {
  locale: Locale;
}

const navLinkBase: React.CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: "8px",
  fontSize: "0.95rem",
  transition: "background 0.15s, color 0.15s"
};

const navLinkActive: React.CSSProperties = {
  ...navLinkBase,
  fontWeight: 700,
  color: "var(--brand)",
  background: "rgba(31, 107, 87, 0.08)"
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const session = await getAuthSession();
  const t = textFor(locale);
  const otherLocale: Locale = locale === "en" ? "fr" : "en";
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/";

  const navLinks = [
    { href: "/", label: t.navHome },
    { href: "/dashboard", label: t.navDashboard },
    { href: "/returns/new", label: t.navStartReturn }
  ];

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

          <nav className="desktop-nav" aria-label="Main navigation" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={withLang(link.href, locale)}
                style={isActive(pathname, link.href) ? navLinkActive : navLinkBase}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <ThemeToggle />
            <Link href={withLang("/", otherLocale)} className="btn btn-secondary" style={{ padding: "0.45rem 0.8rem" }}>
              {otherLocale.toUpperCase()}
            </Link>
            {session?.user ? (
              <>
                <Link
                  href={withLang("/account", locale)}
                  className="btn btn-secondary"
                  style={{
                    padding: "0.45rem 0.8rem",
                    ...(isActive(pathname, "/account") ? { borderColor: "var(--brand)", fontWeight: 700 } : {})
                  }}
                >
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

        <nav className="mobile-nav" aria-label="Mobile navigation" style={{ marginTop: "0.9rem", display: "flex", gap: "0.25rem", overflowX: "auto" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={withLang(link.href, locale)}
              style={isActive(pathname, link.href) ? navLinkActive : navLinkBase}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
