export interface ProviderAvailability {
  google: boolean;
  azureAd: boolean;
  apple: boolean;
  demoCredentials: boolean;
}

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isTruthy(raw: string | undefined): boolean {
  if (!raw) return false;
  return TRUE_VALUES.has(raw.trim().toLowerCase());
}

function isProd(raw: string | undefined): boolean {
  return (raw ?? "").toLowerCase() === "production";
}

export function isDemoCredentialsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const hasDemoSecrets = Boolean(env.DEMO_EMAIL && env.DEMO_PASSCODE);
  if (!hasDemoSecrets) {
    return false;
  }

  if (isTruthy(env.ENABLE_DEMO_AUTH)) {
    return true;
  }

  return !isProd(env.NODE_ENV);
}

export function availableProviders(env: NodeJS.ProcessEnv = process.env): ProviderAvailability {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    azureAd: Boolean(env.AZURE_AD_CLIENT_ID && env.AZURE_AD_CLIENT_SECRET),
    apple: Boolean(env.APPLE_ID && env.APPLE_SECRET),
    demoCredentials: isDemoCredentialsEnabled(env)
  };
}
