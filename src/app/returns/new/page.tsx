import Link from "next/link";
import { ReturnForm } from "@/components/return-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { textFor, resolveLocale, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";

export default async function NewReturnPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);
  const session = await getAuthSession();

  return (
    <main style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem" }}>
        {session?.user ? (
          <ReturnForm locale={locale} defaultTaxYear={new Date().getFullYear() - 1} />
        ) : (
          <div className="surface" style={{ padding: "1.3rem", display: "grid", gap: "0.7rem" }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.35rem" }}>{t.signInTitle}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {t.signInSubtitle}
            </p>
            <p className="notice-error" style={{ margin: 0 }}>
              {t.securityNotice}
            </p>
            <div>
              <Link className="btn btn-primary" href={withLang("/sign-in", locale)}>
                {t.navSignIn}
              </Link>
            </div>
          </div>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
