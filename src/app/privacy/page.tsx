import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";

const LAST_UPDATED = "2026-03-04";

export default async function PrivacyPage({
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
      <section className="container" style={{ marginTop: "1.2rem" }}>
        <div className="surface" style={{ padding: "1.5rem 1.5rem 2rem", display: "grid", gap: "1rem", maxWidth: "75ch" }}>
          <div>
            <Link href={withLang("/", locale)} style={{ fontSize: "0.9rem", color: "var(--brand-2)" }}>
              ← {t.legalBackHome}
            </Link>
          </div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.6rem" }}>
            {t.privacyTitle}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            {t.privacyLastUpdated}: {LAST_UPDATED}
          </p>

          {locale === "fr" ? <PrivacyContentFr /> : <PrivacyContentEn />}
        </div>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}

function PrivacyContentEn() {
  return (
    <div style={{ display: "grid", gap: "0.9rem", lineHeight: 1.65, fontSize: "0.95rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>1. Information We Collect</h2>
      <p style={{ margin: 0 }}>
        We collect only the information necessary to prepare and file your Canadian tax return. This includes:
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Identity information (legal name, date of birth, last 4 digits of SIN)</li>
        <li>Contact information (email address)</li>
        <li>Tax return data (income, deductions, credits, filing mode)</li>
        <li>Supporting documents you upload (tax slips, receipts)</li>
        <li>Technical data (IP address, browser type — for security only)</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>2. How We Use Your Information</h2>
      <p style={{ margin: 0 }}>Your information is used exclusively to:</p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Prepare and calculate your tax return</li>
        <li>Submit your return to the Canada Revenue Agency (CRA) on your behalf</li>
        <li>Carry forward stable profile data to future tax years</li>
        <li>Provide account security and audit logging</li>
        <li>Respond to your support or data requests</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>3. Data Storage and Security</h2>
      <p style={{ margin: 0 }}>
        Your data is stored in encrypted PostgreSQL databases hosted in Canada. All data in transit is protected
        by HTTPS/TLS encryption. We implement rate limiting, CSRF protection, Content Security Policy headers,
        and audit logging for all sensitive operations. Authentication uses industry-standard OAuth 2.0 providers
        with optional two-factor authentication (TOTP).
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>4. Data Sharing</h2>
      <p style={{ margin: 0 }}>
        We do not sell, trade, or share your personal information with third parties except as required to
        file your tax return with the CRA, or as required by Canadian law. OAuth authentication providers
        (Google, Microsoft, Apple) receive only the minimum information needed for sign-in.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>5. Your Rights Under PIPEDA</h2>
      <p style={{ margin: 0 }}>
        Under Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your personal data</li>
        <li>Export a copy of your data</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p style={{ margin: 0 }}>
        You can exercise these rights from your Account Settings page by submitting a data export or deletion request.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>6. Data Retention</h2>
      <p style={{ margin: 0 }}>
        Tax return data is retained for a minimum of 6 years in accordance with CRA record-keeping requirements.
        You may request deletion of your account and data at any time; however, we may be required to retain
        certain records for legal compliance.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>7. Cookies</h2>
      <p style={{ margin: 0 }}>
        We use only essential cookies required for authentication sessions and security (CSRF tokens).
        We do not use advertising or analytics cookies.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>8. Contact</h2>
      <p style={{ margin: 0 }}>
        For privacy inquiries, please contact us through the account data request system or by email
        at the address listed in our security policy.
      </p>
    </div>
  );
}

function PrivacyContentFr() {
  return (
    <div style={{ display: "grid", gap: "0.9rem", lineHeight: 1.65, fontSize: "0.95rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>1. Renseignements que nous recueillons</h2>
      <p style={{ margin: 0 }}>
        Nous recueillons uniquement les renseignements nécessaires pour préparer et produire votre déclaration de revenus canadienne. Cela comprend :
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Renseignements d&apos;identité (nom légal, date de naissance, 4 derniers chiffres du NAS)</li>
        <li>Coordonnées (adresse courriel)</li>
        <li>Données de déclaration de revenus (revenus, déductions, crédits, mode de production)</li>
        <li>Documents justificatifs téléversés (feuillets d&apos;impôt, reçus)</li>
        <li>Données techniques (adresse IP, type de navigateur — pour la sécurité uniquement)</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>2. Comment nous utilisons vos renseignements</h2>
      <p style={{ margin: 0 }}>Vos renseignements sont utilisés exclusivement pour :</p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Préparer et calculer votre déclaration de revenus</li>
        <li>Soumettre votre déclaration à l&apos;Agence du revenu du Canada (ARC) en votre nom</li>
        <li>Reporter les données de profil stables aux années d&apos;imposition futures</li>
        <li>Assurer la sécurité du compte et la journalisation d&apos;audit</li>
        <li>Répondre à vos demandes de soutien ou de données</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>3. Stockage et sécurité des données</h2>
      <p style={{ margin: 0 }}>
        Vos données sont stockées dans des bases de données PostgreSQL chiffrées hébergées au Canada. Toutes les données en transit sont protégées
        par le chiffrement HTTPS/TLS. Nous mettons en œuvre la limitation de débit, la protection CSRF, les en-têtes de politique de sécurité du contenu
        et la journalisation d&apos;audit pour toutes les opérations sensibles. L&apos;authentification utilise des fournisseurs OAuth 2.0 standards
        avec authentification à deux facteurs optionnelle (TOTP).
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>4. Partage des données</h2>
      <p style={{ margin: 0 }}>
        Nous ne vendons, n&apos;échangeons ni ne partageons vos renseignements personnels avec des tiers, sauf dans la mesure nécessaire pour
        produire votre déclaration de revenus auprès de l&apos;ARC, ou conformément à la loi canadienne. Les fournisseurs d&apos;authentification OAuth
        (Google, Microsoft, Apple) ne reçoivent que le minimum nécessaire pour la connexion.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>5. Vos droits en vertu de la LPRPDE</h2>
      <p style={{ margin: 0 }}>
        En vertu de la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE), vous avez le droit de :
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Accéder aux renseignements personnels que nous détenons à votre sujet</li>
        <li>Demander la correction de renseignements inexacts</li>
        <li>Demander la suppression de vos données personnelles</li>
        <li>Exporter une copie de vos données</li>
        <li>Retirer votre consentement à tout moment</li>
      </ul>
      <p style={{ margin: 0 }}>
        Vous pouvez exercer ces droits depuis la page Paramètres du compte en soumettant une demande d&apos;exportation ou de suppression de données.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>6. Conservation des données</h2>
      <p style={{ margin: 0 }}>
        Les données de déclaration de revenus sont conservées pendant un minimum de 6 ans conformément aux exigences de tenue de dossiers de l&apos;ARC.
        Vous pouvez demander la suppression de votre compte et de vos données à tout moment; cependant, nous pourrions être tenus de conserver
        certains dossiers pour la conformité légale.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>7. Témoins (cookies)</h2>
      <p style={{ margin: 0 }}>
        Nous utilisons uniquement les témoins essentiels requis pour les sessions d&apos;authentification et la sécurité (jetons CSRF).
        Nous n&apos;utilisons pas de témoins publicitaires ou analytiques.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>8. Contact</h2>
      <p style={{ margin: 0 }}>
        Pour toute question relative à la confidentialité, veuillez nous contacter via le système de demande de données du compte ou par courriel
        à l&apos;adresse indiquée dans notre politique de sécurité.
      </p>
    </div>
  );
}
