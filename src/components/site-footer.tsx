import Link from "next/link";
import { type Locale, textFor, withLang } from "@/lib/i18n";

interface SiteFooterProps {
  locale: Locale;
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const t = textFor(locale);
  return (
    <footer
      className="container"
      style={{
        marginTop: "2rem",
        paddingBottom: "1rem",
        display: "flex",
        gap: "1.2rem",
        justifyContent: "center",
        fontSize: "0.85rem",
        flexWrap: "wrap"
      }}
    >
      <Link href={withLang("/privacy", locale)} className="muted" style={{ textDecoration: "underline" }}>
        {t.privacyTitle}
      </Link>
      <Link href={withLang("/terms", locale)} className="muted" style={{ textDecoration: "underline" }}>
        {t.termsTitle}
      </Link>
      <span className="muted">© {new Date().getFullYear()} {t.appName}</span>
    </footer>
  );
}
