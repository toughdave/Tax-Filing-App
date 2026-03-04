import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function validateOrigin(request: Request): boolean {
  if (!MUTATING_METHODS.has(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
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
