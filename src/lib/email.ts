import { Resend } from "resend";
import type { Locale } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Resend client — lazy-initialised so the app works without RESEND_API_KEY
// (local dev, CI, tests). All public helpers return early when email is
// unavailable rather than throwing.
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Canada Tax Filing <noreply@canadataxfiling.ca>";

// ---------------------------------------------------------------------------
// Generic send helper
// ---------------------------------------------------------------------------

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string }> {
  const client = getClient();
  if (!client) {
    return { success: false };
  }

  try {
    const result = await client.emails.send({
      from: FROM_ADDRESS,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {})
    });

    if (result.error) {
      return { success: false };
    }

    return { success: true, id: result.data?.id };
  } catch {
    return { success: false };
  }
}

// ---------------------------------------------------------------------------
// Template: Filing confirmation (after successful save)
// ---------------------------------------------------------------------------

const filingConfirmationTemplates: Record<Locale, (vars: FilingConfirmationVars) => EmailPayload> = {
  en: (vars) => ({
    to: vars.email,
    subject: `Your ${vars.taxYear} tax return has been saved`,
    html: wrapHtml(`
      <h2>Draft saved successfully</h2>
      <p>Hi${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Your <strong>${vars.taxYear} ${esc(vars.filingMode.toLowerCase())}</strong> tax return has been saved as a draft.</p>
      <table role="presentation" style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Status</td><td style="padding:4px 0">${esc(vars.status)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Return ID</td><td style="padding:4px 0;font-family:monospace;font-size:13px">${esc(vars.returnId)}</td></tr>
      </table>
      ${vars.missingFields > 0 ? `<p style="color:#d97706"><strong>${vars.missingFields}</strong> required field(s) still need values before you can submit.</p>` : '<p style="color:#059669">All required fields are complete — your return is ready for review.</p>'}
      <p style="margin-top:24px"><a href="${vars.appUrl}/returns/${vars.returnId}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Continue your return</a></p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">This is an automated message from Canada Tax Filing. Do not reply to this email.</p>
    `),
    text: `Your ${vars.taxYear} ${vars.filingMode.toLowerCase()} tax return has been saved (${vars.status}). ${vars.missingFields > 0 ? `${vars.missingFields} required field(s) still need values.` : "All required fields are complete."} Continue at: ${vars.appUrl}/returns/${vars.returnId}`
  }),
  fr: (vars) => ({
    to: vars.email,
    subject: `Votre déclaration ${vars.taxYear} a été enregistrée`,
    html: wrapHtml(`
      <h2>Brouillon enregistré avec succès</h2>
      <p>Bonjour${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Votre déclaration <strong>${vars.taxYear} ${vars.filingMode === "INDIVIDUAL" ? "particulier" : vars.filingMode === "SELF_EMPLOYED" ? "travailleur autonome" : "entreprise"}</strong> a été enregistrée comme brouillon.</p>
      <table role="presentation" style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Statut</td><td style="padding:4px 0">${esc(vars.status)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">ID de déclaration</td><td style="padding:4px 0;font-family:monospace;font-size:13px">${esc(vars.returnId)}</td></tr>
      </table>
      ${vars.missingFields > 0 ? `<p style="color:#d97706"><strong>${vars.missingFields}</strong> champ(s) requis doivent encore être remplis avant la soumission.</p>` : '<p style="color:#059669">Tous les champs requis sont remplis — votre déclaration est prête pour révision.</p>'}
      <p style="margin-top:24px"><a href="${vars.appUrl}/returns/${vars.returnId}?lang=fr" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Continuer votre déclaration</a></p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">Ceci est un message automatisé de Déclaration fiscale Canada. Ne répondez pas à ce courriel.</p>
    `),
    text: `Votre déclaration ${vars.taxYear} a été enregistrée (${vars.status}). ${vars.missingFields > 0 ? `${vars.missingFields} champ(s) requis doivent encore être remplis.` : "Tous les champs requis sont remplis."} Continuer à : ${vars.appUrl}/returns/${vars.returnId}?lang=fr`
  })
};

export interface FilingConfirmationVars {
  email: string;
  name?: string;
  taxYear: number;
  filingMode: string;
  status: string;
  returnId: string;
  missingFields: number;
  appUrl: string;
}

export async function sendFilingConfirmation(vars: FilingConfirmationVars, locale: Locale = "en") {
  const template = filingConfirmationTemplates[locale];
  return sendEmail(template(vars));
}

// ---------------------------------------------------------------------------
// Template: Submission confirmation (after successful submission)
// ---------------------------------------------------------------------------

const submissionConfirmationTemplates: Record<Locale, (vars: SubmissionConfirmationVars) => EmailPayload> = {
  en: (vars) => ({
    to: vars.email,
    subject: `Your ${vars.taxYear} tax return has been submitted`,
    html: wrapHtml(`
      <h2>Submission confirmed</h2>
      <p>Hi${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Your <strong>${vars.taxYear}</strong> tax return has been submitted to the CRA via <strong>${esc(vars.provider)}</strong>.</p>
      <table role="presentation" style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Confirmation</td><td style="padding:4px 0;font-family:monospace">${esc(vars.confirmationNumber ?? "Pending")}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Status</td><td style="padding:4px 0">${esc(vars.status)}</td></tr>
      </table>
      <p>You can check your return status anytime from your dashboard.</p>
      <p style="margin-top:24px"><a href="${vars.appUrl}/dashboard" style="display:inline-block;padding:10px 20px;background:#059669;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">View dashboard</a></p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">Keep this email for your records. This is an automated message from Canada Tax Filing.</p>
    `),
    text: `Your ${vars.taxYear} tax return has been submitted via ${vars.provider}. Confirmation: ${vars.confirmationNumber ?? "Pending"}. Status: ${vars.status}. View dashboard: ${vars.appUrl}/dashboard`
  }),
  fr: (vars) => ({
    to: vars.email,
    subject: `Votre déclaration ${vars.taxYear} a été soumise`,
    html: wrapHtml(`
      <h2>Soumission confirmée</h2>
      <p>Bonjour${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Votre déclaration <strong>${vars.taxYear}</strong> a été soumise à l'ARC via <strong>${esc(vars.provider)}</strong>.</p>
      <table role="presentation" style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Confirmation</td><td style="padding:4px 0;font-family:monospace">${esc(vars.confirmationNumber ?? "En attente")}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Statut</td><td style="padding:4px 0">${esc(vars.status)}</td></tr>
      </table>
      <p>Vous pouvez vérifier l'état de votre déclaration à tout moment depuis votre tableau de bord.</p>
      <p style="margin-top:24px"><a href="${vars.appUrl}/dashboard?lang=fr" style="display:inline-block;padding:10px 20px;background:#059669;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Voir le tableau de bord</a></p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">Conservez ce courriel pour vos dossiers. Ceci est un message automatisé de Déclaration fiscale Canada.</p>
    `),
    text: `Votre déclaration ${vars.taxYear} a été soumise via ${vars.provider}. Confirmation : ${vars.confirmationNumber ?? "En attente"}. Statut : ${vars.status}. Tableau de bord : ${vars.appUrl}/dashboard?lang=fr`
  })
};

export interface SubmissionConfirmationVars {
  email: string;
  name?: string;
  taxYear: number;
  provider: string;
  confirmationNumber?: string;
  status: string;
  appUrl: string;
}

export async function sendSubmissionConfirmation(vars: SubmissionConfirmationVars, locale: Locale = "en") {
  const template = submissionConfirmationTemplates[locale];
  return sendEmail(template(vars));
}

// ---------------------------------------------------------------------------
// Template: Welcome / sign-in notification
// ---------------------------------------------------------------------------

const welcomeTemplates: Record<Locale, (vars: WelcomeVars) => EmailPayload> = {
  en: (vars) => ({
    to: vars.email,
    subject: vars.isNewUser ? "Welcome to Canada Tax Filing" : "New sign-in to Canada Tax Filing",
    html: wrapHtml(vars.isNewUser ? `
      <h2>Welcome to Canada Tax Filing</h2>
      <p>Hi${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Your account has been created successfully. You can now start your first tax return.</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Guided, plain-language filing for individuals and self-employed</li>
        <li>Prior-year carry-forward to reduce repetitive entry</li>
        <li>AES-256-GCM encryption for sensitive data</li>
        <li>Bilingual English/French interface</li>
      </ul>
      <p style="margin-top:24px"><a href="${vars.appUrl}/returns/new" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Start your first return</a></p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">This is an automated message from Canada Tax Filing.</p>
    ` : `
      <h2>New sign-in detected</h2>
      <p>Hi${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>A new sign-in to your Canada Tax Filing account was detected.</p>
      <table role="presentation" style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Time</td><td style="padding:4px 0">${new Date().toISOString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Provider</td><td style="padding:4px 0">${esc(vars.provider ?? "Unknown")}</td></tr>
      </table>
      <p>If this was not you, please <a href="${vars.appUrl}/account" style="color:#1d4ed8">review your account security settings</a> immediately.</p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">This is an automated message from Canada Tax Filing.</p>
    `),
    text: vars.isNewUser
      ? `Welcome to Canada Tax Filing! Your account has been created. Start your first return: ${vars.appUrl}/returns/new`
      : `A new sign-in to your Canada Tax Filing account was detected. Provider: ${vars.provider ?? "Unknown"}. If this was not you, review your security settings: ${vars.appUrl}/account`
  }),
  fr: (vars) => ({
    to: vars.email,
    subject: vars.isNewUser ? "Bienvenue à Déclaration fiscale Canada" : "Nouvelle connexion à Déclaration fiscale Canada",
    html: wrapHtml(vars.isNewUser ? `
      <h2>Bienvenue à Déclaration fiscale Canada</h2>
      <p>Bonjour${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Votre compte a été créé avec succès. Vous pouvez maintenant commencer votre première déclaration.</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Déclaration guidée en langage clair pour particuliers et travailleurs autonomes</li>
        <li>Reprise automatique des données de l'année précédente</li>
        <li>Chiffrement AES-256-GCM pour les données sensibles</li>
        <li>Interface bilingue anglais/français</li>
      </ul>
      <p style="margin-top:24px"><a href="${vars.appUrl}/returns/new?lang=fr" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-weight:500">Commencer votre première déclaration</a></p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">Ceci est un message automatisé de Déclaration fiscale Canada.</p>
    ` : `
      <h2>Nouvelle connexion détectée</h2>
      <p>Bonjour${vars.name ? ` ${esc(vars.name)}` : ""},</p>
      <p>Une nouvelle connexion à votre compte Déclaration fiscale Canada a été détectée.</p>
      <table role="presentation" style="margin:16px 0;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Heure</td><td style="padding:4px 0">${new Date().toISOString()}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Fournisseur</td><td style="padding:4px 0">${esc(vars.provider ?? "Inconnu")}</td></tr>
      </table>
      <p>Si ce n'était pas vous, veuillez <a href="${vars.appUrl}/account?lang=fr" style="color:#1d4ed8">vérifier vos paramètres de sécurité</a> immédiatement.</p>
      <p style="margin-top:24px;font-size:13px;color:#94a3b8">Ceci est un message automatisé de Déclaration fiscale Canada.</p>
    `),
    text: vars.isNewUser
      ? `Bienvenue à Déclaration fiscale Canada! Votre compte a été créé. Commencer : ${vars.appUrl}/returns/new?lang=fr`
      : `Nouvelle connexion détectée sur votre compte. Fournisseur : ${vars.provider ?? "Inconnu"}. Si ce n'était pas vous : ${vars.appUrl}/account?lang=fr`
  })
};

export interface WelcomeVars {
  email: string;
  name?: string;
  isNewUser: boolean;
  provider?: string;
  appUrl: string;
}

export async function sendWelcomeOrSignInNotification(vars: WelcomeVars, locale: Locale = "en") {
  const template = welcomeTemplates[locale];
  return sendEmail(template(vars));
}

// ---------------------------------------------------------------------------
// Shared HTML wrapper
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;color:#1e293b">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#fff;border-radius:8px;padding:32px;border:1px solid #e2e8f0">
      ${body}
    </div>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:24px">
      Canada Tax Filing · Déclaration fiscale Canada
    </p>
  </div>
</body>
</html>`;
}
