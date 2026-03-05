import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resolveLocale, textFor, withLang } from "@/lib/i18n";

const LAST_UPDATED = "2026-03-04";

export default async function TermsPage({
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
            {t.termsTitle}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            {t.termsLastUpdated}: {LAST_UPDATED}
          </p>

          {locale === "fr" ? <TermsContentFr /> : <TermsContentEn />}
        </div>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}

function TermsContentEn() {
  return (
    <div style={{ display: "grid", gap: "0.9rem", lineHeight: 1.65, fontSize: "0.95rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>1. Acceptance of Terms</h2>
      <p style={{ margin: 0 }}>
        By accessing or using Canada Tax Filing (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
        If you do not agree, do not use the Service.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>2. Description of Service</h2>
      <p style={{ margin: 0 }}>
        The Service provides a guided tax preparation and filing platform for Canadian tax returns.
        It supports individual, self-employed, and company filing modes, with electronic submission
        to the Canada Revenue Agency (CRA) via authorized channels.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>3. User Responsibilities</h2>
      <p style={{ margin: 0 }}>You are responsible for:</p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Providing accurate and complete information in your tax return</li>
        <li>Reviewing all calculations and data before submission</li>
        <li>Maintaining the security of your account credentials</li>
        <li>Complying with all applicable Canadian tax laws and regulations</li>
        <li>Retaining copies of your supporting documents as required by the CRA</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>4. Accuracy and Liability</h2>
      <p style={{ margin: 0 }}>
        While we strive for accuracy in tax calculations and form mappings, the Service is provided
        &quot;as is&quot; without warranties of any kind. You remain solely responsible for the accuracy
        of your tax return as filed with the CRA. We are not a registered tax preparer or advisor,
        and the Service does not constitute professional tax advice.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>5. Account and Data</h2>
      <p style={{ margin: 0 }}>
        You may create one account per person. Your tax return data is stored securely and retained
        in accordance with our Privacy Policy. You may request export or deletion of your data at any
        time through your Account Settings, subject to legal retention requirements.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>6. Prohibited Use</h2>
      <p style={{ margin: 0 }}>You may not:</p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Use the Service for fraudulent tax filings or misrepresentation</li>
        <li>Attempt to access other users&apos; data or accounts</li>
        <li>Reverse-engineer, scrape, or automate access to the Service</li>
        <li>Use the Service in violation of Canadian law</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>7. Termination</h2>
      <p style={{ margin: 0 }}>
        We may suspend or terminate your access to the Service at our discretion if you violate
        these terms or engage in prohibited activities. You may close your account at any time
        through the data deletion request process.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>8. Changes to Terms</h2>
      <p style={{ margin: 0 }}>
        We may update these Terms from time to time. Continued use of the Service after changes
        constitutes acceptance of the updated terms. We will notify users of material changes
        through the Service.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>9. Governing Law</h2>
      <p style={{ margin: 0 }}>
        These Terms are governed by the laws of Canada and the province in which the Service operator
        is located. Any disputes shall be resolved in the courts of that jurisdiction.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>10. Contact</h2>
      <p style={{ margin: 0 }}>
        For questions about these terms, please use the account data request system or contact us
        at the address listed in our security policy.
      </p>
    </div>
  );
}

function TermsContentFr() {
  return (
    <div style={{ display: "grid", gap: "0.9rem", lineHeight: 1.65, fontSize: "0.95rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>1. Acceptation des conditions</h2>
      <p style={{ margin: 0 }}>
        En accédant ou en utilisant Canada Tax Filing (« le Service »), vous acceptez d&apos;être lié par ces conditions d&apos;utilisation.
        Si vous n&apos;acceptez pas, n&apos;utilisez pas le Service.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>2. Description du service</h2>
      <p style={{ margin: 0 }}>
        Le Service fournit une plateforme guidée de préparation et de production de déclarations de revenus canadiennes.
        Il prend en charge les modes de production individuel, travailleur autonome et société, avec soumission électronique
        à l&apos;Agence du revenu du Canada (ARC) via des canaux autorisés.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>3. Responsabilités de l&apos;utilisateur</h2>
      <p style={{ margin: 0 }}>Vous êtes responsable de :</p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Fournir des renseignements exacts et complets dans votre déclaration de revenus</li>
        <li>Vérifier tous les calculs et données avant la soumission</li>
        <li>Maintenir la sécurité de vos identifiants de compte</li>
        <li>Respecter toutes les lois et réglementations fiscales canadiennes applicables</li>
        <li>Conserver des copies de vos documents justificatifs tel qu&apos;exigé par l&apos;ARC</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>4. Exactitude et responsabilité</h2>
      <p style={{ margin: 0 }}>
        Bien que nous nous efforcions d&apos;assurer l&apos;exactitude des calculs fiscaux et du mappage des formulaires, le Service est fourni
        « tel quel » sans garantie d&apos;aucune sorte. Vous demeurez seul responsable de l&apos;exactitude
        de votre déclaration de revenus telle que produite auprès de l&apos;ARC. Nous ne sommes pas un préparateur ou conseiller fiscal agréé,
        et le Service ne constitue pas un avis fiscal professionnel.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>5. Compte et données</h2>
      <p style={{ margin: 0 }}>
        Vous pouvez créer un compte par personne. Vos données de déclaration de revenus sont stockées en toute sécurité et conservées
        conformément à notre politique de confidentialité. Vous pouvez demander l&apos;exportation ou la suppression de vos données à tout
        moment via les paramètres de votre compte, sous réserve des exigences légales de conservation.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>6. Utilisation interdite</h2>
      <p style={{ margin: 0 }}>Vous ne pouvez pas :</p>
      <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
        <li>Utiliser le Service pour des déclarations fiscales frauduleuses ou des fausses déclarations</li>
        <li>Tenter d&apos;accéder aux données ou comptes d&apos;autres utilisateurs</li>
        <li>Effectuer de la rétro-ingénierie, de l&apos;extraction ou automatiser l&apos;accès au Service</li>
        <li>Utiliser le Service en violation de la loi canadienne</li>
      </ul>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>7. Résiliation</h2>
      <p style={{ margin: 0 }}>
        Nous pouvons suspendre ou résilier votre accès au Service à notre discrétion si vous enfreignez
        ces conditions ou vous livrez à des activités interdites. Vous pouvez fermer votre compte à tout moment
        via le processus de demande de suppression de données.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>8. Modification des conditions</h2>
      <p style={{ margin: 0 }}>
        Nous pouvons mettre à jour ces conditions de temps à autre. L&apos;utilisation continue du Service après les modifications
        constitue une acceptation des conditions mises à jour. Nous informerons les utilisateurs des modifications importantes
        via le Service.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>9. Loi applicable</h2>
      <p style={{ margin: 0 }}>
        Ces conditions sont régies par les lois du Canada et de la province où l&apos;exploitant du Service
        est situé. Tout litige sera résolu devant les tribunaux de cette juridiction.
      </p>

      <h2 style={{ margin: 0, fontSize: "1.15rem" }}>10. Contact</h2>
      <p style={{ margin: 0 }}>
        Pour toute question concernant ces conditions, veuillez utiliser le système de demande de données du compte ou nous contacter
        à l&apos;adresse indiquée dans notre politique de sécurité.
      </p>
    </div>
  );
}
