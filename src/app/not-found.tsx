import Link from "next/link";
import { headers } from "next/headers";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";

export default async function NotFound() {
  const locale = resolveLocale((await headers()).get("x-locale"));
  const t = textFor(locale);

  return (
    <main style={{ paddingBottom: "3rem", paddingTop: "3rem" }}>
      <section className="container" style={{ display: "grid", gap: "1rem", textAlign: "center" }}>
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "0.8rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "2rem" }}>404 • {t.notFoundTitle}</h1>
          <p className="muted" style={{ margin: 0 }}>{t.notFoundBody}</p>
          <div>
            <Link className="btn btn-primary" href={withLang("/", locale)}>{t.notFoundReturnHome}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
