import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function cspForNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lang = searchParams.get("lang");
  const locale = lang === "fr" ? "fr" : "en";
  const nonce = crypto.randomUUID().replaceAll("-", "");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set("x-locale", locale);
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", cspForNonce(nonce));

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"]
};
