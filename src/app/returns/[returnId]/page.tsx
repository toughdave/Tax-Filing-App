import Link from "next/link";
import { notFound } from "next/navigation";
import { ReturnForm } from "@/components/return-form";
import { YoyComparison } from "@/components/yoy-comparison";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { calculateTax, type CalculationResult } from "@/lib/services/tax-calculation-engine";
import { getReturnForUser } from "@/lib/services/tax-return-service";
import { prepareSubmissionSchema } from "@/lib/validation/tax-return";

export default async function ReturnByIdPage({
  params,
  searchParams
}: {
  params: Promise<{ returnId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [paramData, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(query.lang);
  const t = textFor(locale);
  const parsed = prepareSubmissionSchema.safeParse({ returnId: paramData.returnId });

  if (!parsed.success) {
    notFound();
  }

  const session = await getAuthSession();

  if (!session?.user) {
    return (
      <main style={{ paddingBottom: "3rem" }}>
        <SiteHeader locale={locale} />
        <section className="container" style={{ marginTop: "1.2rem" }}>
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
        </section>
        <SiteFooter locale={locale} />
      </main>
    );
  }

  const record = await getReturnForUser(session.user.id, parsed.data.returnId);

  if (!record) {
    notFound();
  }

  const payload =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : {};

  const initialTaxSummary: CalculationResult | null = record.taxSummary
    ? { mode: record.filingMode, summary: record.taxSummary } as unknown as CalculationResult
    : calculateTax(record.filingMode, payload, record.taxYear);

  return (
    <main style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem" }}>
        <ReturnForm
          locale={locale}
          defaultTaxYear={record.taxYear}
          defaultMode={record.filingMode}
          initialReturnId={record.id}
          initialPayload={payload}
          initialTaxSummary={initialTaxSummary}
        />
        <div style={{ marginTop: "1rem" }}>
          <YoyComparison locale={locale} returnId={record.id} />
        </div>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
