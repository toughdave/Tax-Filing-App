"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import type { Locale } from "@/lib/i18n";

interface SignInPanelProps {
  locale: Locale;
  callbackUrl: string;
  providers: {
    google: boolean;
    azureAd: boolean;
    apple: boolean;
  };
}

const labelsByLocale = {
  en: {
    title: "Sign in with your preferred method",
    oauth: "Use OAuth",
    credentials: "Use demo credentials",
    email: "Email",
    passcode: "Passcode",
    submit: "Continue",
    pending: "Signing in...",
    security: "Security note: OAuth is recommended for production usage."
  },
  fr: {
    title: "Connectez-vous avec votre méthode préférée",
    oauth: "Utiliser OAuth",
    credentials: "Utiliser les identifiants démo",
    email: "Courriel",
    passcode: "Code d'accès",
    submit: "Continuer",
    pending: "Connexion...",
    security: "Note sécurité : OAuth est recommandé en production."
  }
} as const;

export function SignInPanel({ locale, callbackUrl, providers }: SignInPanelProps) {
  const labels = labelsByLocale[locale];
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [pending, setPending] = useState(false);
  const availableOAuth = useMemo(
    () => [
      providers.google ? { id: "google", label: "Google" } : null,
      providers.azureAd ? { id: "azure-ad", label: "Microsoft" } : null,
      providers.apple ? { id: "apple", label: "Apple" } : null
    ].filter(Boolean) as { id: string; label: string }[],
    [providers]
  );

  async function handleCredentialSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    await signIn("credentials", {
      email,
      passcode,
      callbackUrl
    });

    setPending(false);
  }

  return (
    <div className="surface" style={{ padding: "1.1rem", display: "grid", gap: "1rem" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.2rem" }}>{labels.title}</h2>

      {availableOAuth.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <strong>{labels.oauth}</strong>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {availableOAuth.map((provider) => (
              <button
                key={provider.id}
                className="btn btn-secondary"
                type="button"
                onClick={() => void signIn(provider.id, { callbackUrl })}
              >
                {provider.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form style={{ display: "grid", gap: "0.6rem" }} onSubmit={handleCredentialSignIn}>
        <strong>{labels.credentials}</strong>
        <div className="field">
          <label htmlFor="email">{labels.email}</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="passcode">{labels.passcode}</label>
          <input id="passcode" type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? labels.pending : labels.submit}
        </button>
      </form>

      <p className="muted" style={{ margin: 0 }}>
        {labels.security}
      </p>
    </div>
  );
}
