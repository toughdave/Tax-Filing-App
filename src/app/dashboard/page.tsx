import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatDate } from "@/lib/format";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { listReturnsForUser } from "@/lib/services/tax-return-service";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);
  const session = await getAuthSession();

  type TaxReturnRow = Awaited<ReturnType<typeof listReturnsForUser>>[number];
  const returns: TaxReturnRow[] = session?.user?.id ? await listReturnsForUser(session.user.id) : [];

  return (
    <main id="main-content" style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem", display: "grid", gap: "0.9rem" }}>
        <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.5rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.5rem" }}>{t.dashboardTitle}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {t.dashboardSubtitle}
          </p>
        </div>

        {session?.user ? (
          returns.length > 0 ? (
            <div className="surface" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0.9rem" }}>{t.dashboardYear}</th>
                    <th style={{ textAlign: "left", padding: "0.9rem" }}>{t.dashboardMode}</th>
                    <th style={{ textAlign: "left", padding: "0.9rem" }}>{t.dashboardStatus}</th>
                    <th style={{ textAlign: "left", padding: "0.9rem" }}>{t.dashboardUpdated}</th>
                    <th style={{ textAlign: "left", padding: "0.9rem" }}>{t.dashboardAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((taxReturn) => (
                    <tr key={taxReturn.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "0.9rem" }}>{taxReturn.taxYear}</td>
                      <td style={{ padding: "0.9rem" }}>{taxReturn.filingMode}</td>
                      <td style={{ padding: "0.9rem" }}>{t[`status${taxReturn.status}`] ?? taxReturn.status}</td>
                      <td style={{ padding: "0.9rem" }}>{formatDate(taxReturn.updatedAt, locale)}</td>
                      <td style={{ padding: "0.9rem" }}>
                        <Link href={withLang(`/returns/${taxReturn.id}`, locale)} className="btn btn-secondary" style={{ padding: "0.35rem 0.7rem" }}>
                          {t.dashboardOpen}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="surface" style={{ padding: "1rem" }}>
              <p className="muted" style={{ marginTop: 0, marginBottom: "0.8rem" }}>
                {t.dashboardEmpty}
              </p>
              <Link className="btn btn-primary" href={withLang("/returns/new", locale)}>
                {t.navStartReturn}
              </Link>
            </div>
          )
        ) : (
          <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.7rem" }}>
            <p className="muted" style={{ margin: 0 }}>
              {t.signInSubtitle}
            </p>
            <Link className="btn btn-primary" href={withLang("/sign-in", locale)}>
              {t.navSignIn}
            </Link>
          </div>
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
