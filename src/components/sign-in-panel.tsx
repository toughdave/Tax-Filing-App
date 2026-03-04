"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { textFor, type Locale } from "@/lib/i18n";

interface SignInPanelProps {
  locale: Locale;
  callbackUrl: string;
  providers: {
    google: boolean;
    azureAd: boolean;
    apple: boolean;
    demoCredentials: boolean;
  };
}

export function SignInPanel({ locale, callbackUrl, providers }: SignInPanelProps) {
  const t = textFor(locale);
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
      <h2 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.2rem" }}>{t.signInPanelTitle}</h2>

      {availableOAuth.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <strong>{t.signInPanelOAuth}</strong>
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

      {providers.demoCredentials ? (
        <form style={{ display: "grid", gap: "0.6rem" }} onSubmit={handleCredentialSignIn}>
          <strong>{t.signInPanelCredentials}</strong>
          <div className="field">
            <label htmlFor="email">{t.signInPanelEmail}</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="passcode">{t.signInPanelPasscode}</label>
            <input id="passcode" type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} required />
          </div>

          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? t.signInPanelPending : t.signInPanelSubmit}
          </button>
        </form>
      ) : null}

      <p className="muted" style={{ margin: 0 }}>
        {t.signInPanelSecurity}
      </p>
    </div>
  );
}
