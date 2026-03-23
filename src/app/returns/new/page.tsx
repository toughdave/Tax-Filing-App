import Link from "next/link";
import { ReturnForm } from "@/components/return-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatDate } from "@/lib/format";
import { textFor, resolveLocale, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { getDefaultTaxYear } from "@/lib/tax-year-config";
import { getTaxProfilePrefillForUser, listReturnsForUser } from "@/lib/services/tax-return-service";

export default async function NewReturnPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);
  const session = await getAuthSession();
  const [existingReturns, profilePrefill] = session?.user?.id
    ? await Promise.all([
        listReturnsForUser(session.user.id),
        getTaxProfilePrefillForUser(session.user.id)
      ])
    : [[], {}];
  const resumableReturns = existingReturns.filter((record) => record.status !== "SUBMITTED").slice(0, 4);

  return (
    <main style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem" }}>
        {session?.user ? (
          <div style={{ display: "grid", gap: "0.9rem" }}>
            {resumableReturns.length > 0 && (
              <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.7rem" }}>
                <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.35rem" }}>
                  {t.newReturnResumeTitle ?? t.dashboardTitle}
                </h1>
                <p className="muted" style={{ margin: 0 }}>
                  {t.newReturnResumeSubtitle ?? t.dashboardSubtitle}
                </p>
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  {resumableReturns.map((taxReturn) => (
                    <div
                      key={taxReturn.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.8rem",
                        flexWrap: "wrap",
                        padding: "0.8rem 0.9rem",
                        borderRadius: "10px",
                        border: "1px solid var(--line)"
                      }}
                    >
                      <div style={{ display: "grid", gap: "0.15rem" }}>
                        <strong>{taxReturn.taxYear} · {t[`status${taxReturn.status}`] ?? taxReturn.status}</strong>
                        <span className="muted" style={{ fontSize: "0.85rem" }}>
                          {taxReturn.filingMode} · {formatDate(taxReturn.updatedAt, locale)}
                        </span>
                      </div>
                      <Link className="btn btn-secondary" href={withLang(`/returns/${taxReturn.id}`, locale)}>
                        {t.dashboardOpen}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="surface" style={{ padding: "1rem", display: "grid", gap: "0.4rem" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.1rem" }}>
                {t.newReturnStartFresh ?? t.navStartReturn}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                {t.newReturnPrefillNotice ?? t.homeFeatureCarryBody}
              </p>
            </div>
            <ReturnForm
              locale={locale}
              defaultTaxYear={getDefaultTaxYear()}
              initialPayload={Object.keys(profilePrefill).length > 0 ? profilePrefill : undefined}
            />
          </div>
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
