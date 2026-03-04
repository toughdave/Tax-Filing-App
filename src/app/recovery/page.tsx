import { SiteHeader } from "@/components/site-header";
import { resolveLocale, textFor } from "@/lib/i18n";
import { RecoveryForm } from "@/components/recovery-form";
import Link from "next/link";

export default async function RecoveryPage({
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
      <section className="container" style={{ marginTop: "1.2rem", display: "grid", gap: "1rem" }}>
        <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.5rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.5rem" }}>
            {t.recoveryTitle}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {t.recoverySubtitle}
          </p>
          <p className="notice-error" style={{ margin: 0 }}>
            {t.securityNotice}
          </p>
        </div>

        <RecoveryForm locale={locale} />

        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <Link className="btn btn-secondary" href={`/sign-in?lang=${locale}`} style={{ padding: "0.45rem 1rem" }}>
            {t.navSignIn}
          </Link>
        </div>
      </section>
    </main>
  );
}
