import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/returns", "/account", "/admin"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function hasSessionToken(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value
  );
}

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
  const { pathname, searchParams } = request.nextUrl;
  const lang = searchParams.get("lang");
  const locale = lang === "fr" ? "fr" : "en";

  if (isProtectedRoute(pathname) && !hasSessionToken(request)) {
    const signInUrl = new URL("/sign-in", request.url);
    const callbackPath = request.nextUrl.pathname + request.nextUrl.search;
    if (callbackPath.startsWith("/") && !callbackPath.startsWith("//")) {
      signInUrl.searchParams.set("callbackUrl", callbackPath);
    }
    if (locale === "fr") {
      signInUrl.searchParams.set("lang", "fr");
    }
    return NextResponse.redirect(signInUrl);
  }

  const nonce = crypto.randomUUID().replaceAll("-", "");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);

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
