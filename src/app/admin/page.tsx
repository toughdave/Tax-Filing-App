import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveLocale, textFor } from "@/lib/i18n";
import { getAuthSession } from "@/lib/session";
import { AdminPanels } from "@/components/admin-panels";

const ADMIN_ROLES = ["SUPPORT", "ADMIN"];

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const t = textFor(locale);
  const session = await getAuthSession();

  const isAdmin = session?.user?.role && ADMIN_ROLES.includes(session.user.role);

  return (
    <main style={{ paddingBottom: "3rem" }}>
      <SiteHeader locale={locale} />
      <section className="container" style={{ marginTop: "1.2rem", display: "grid", gap: "1rem" }}>
        <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.5rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.5rem" }}>
            {t.adminTitle}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {t.adminSubtitle}
          </p>
        </div>

        {!isAdmin ? (
          <div className="surface" style={{ padding: "1.2rem" }}>
            <p className="notice-error" style={{ margin: 0 }}>{t.adminForbidden}</p>
          </div>
        ) : (
          <AdminPanels locale={locale} />
        )}
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
