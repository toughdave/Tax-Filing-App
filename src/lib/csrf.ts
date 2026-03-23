import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function splitHeaderValues(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseHost(value: string): URL | null {
  try {
    return new URL(`http://${value}`);
  } catch {
    return null;
  }
}

function normalizeHostname(value: string): string {
  return value.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

function isLoopbackHostname(value: string): boolean {
  const hostname = normalizeHostname(value);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function hostsEquivalent(originHost: string, candidateHost: string): boolean {
  const originUrl = parseHost(originHost);
  const candidateUrl = parseHost(candidateHost);

  if (!originUrl || !candidateUrl) {
    return false;
  }

  if (originUrl.host === candidateUrl.host) {
    return true;
  }

  return isLoopbackHostname(originUrl.hostname)
    && isLoopbackHostname(candidateUrl.hostname)
    && originUrl.port === candidateUrl.port;
}

export function validateOrigin(request: Request): boolean {
  if (!MUTATING_METHODS.has(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const hostCandidates = new Set<string>([
    ...splitHeaderValues(request.headers.get("host")),
    ...splitHeaderValues(request.headers.get("x-forwarded-host"))
  ]);

  const appUrl = process.env.NEXTAUTH_URL;
  if (appUrl) {
    try {
      hostCandidates.add(new URL(appUrl).host);
    } catch {
      // Ignore invalid NEXTAUTH_URL values during validation.
    }
  }

  if (!origin || hostCandidates.size === 0) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.host;
    return Array.from(hostCandidates).some((candidateHost) => hostsEquivalent(originHost, candidateHost));
  } catch {
    return false;
  }
}

export function csrfForbiddenResponse(): NextResponse {
  return NextResponse.json(
    { message: "CSRF_VALIDATION_FAILED" },
    { status: 403 }
  );
}
