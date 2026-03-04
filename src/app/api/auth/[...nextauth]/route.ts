import NextAuth from "next-auth";
import { authOptions } from "@/auth";
import { extractRequestMeta, writeAuditEvent } from "@/lib/audit";

const handler = NextAuth(authOptions);

type AuditedAuthAction = "signin" | "signout" | "callback";

const auditedActions: Record<AuditedAuthAction, string> = {
  signin: "auth.sign_in_requested",
  signout: "auth.sign_out_requested",
  callback: "auth.callback_received"
};

function parseAuthAction(request: Request): { action: AuditedAuthAction; provider: string | null } | null {
  const path = new URL(request.url).pathname;
  const authPrefix = "/api/auth/";

  if (!path.includes(authPrefix)) {
    return null;
  }

  const [action, provider] = path.slice(path.indexOf(authPrefix) + authPrefix.length).split("/");

  if (action === "signin" || action === "signout" || action === "callback") {
    return {
      action,
      provider: provider ?? null
    };
  }

  return null;
}

async function auditAuthRequest(request: Request) {
  const parsed = parseAuthAction(request);
  if (!parsed) {
    return;
  }

  if ((parsed.action === "signin" || parsed.action === "signout") && request.method !== "POST") {
    return;
  }

  try {
    await writeAuditEvent({
      action: auditedActions[parsed.action],
      resource: "UserSession",
      metadata: {
        routeAction: parsed.action,
        provider: parsed.provider,
        method: request.method
      },
      ...extractRequestMeta(request)
    });
  } catch {
    // Do not block auth flow if audit logging fails.
  }
}

interface AuthRouteContext {
  params: Promise<{ nextauth: string[] }>;
}

export async function GET(request: Request, context: AuthRouteContext) {
  await auditAuthRequest(request);
  return handler(request, context);
}

export async function POST(request: Request, context: AuthRouteContext) {
  await auditAuthRequest(request);
  return handler(request, context);
}
