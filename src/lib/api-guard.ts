import { NextResponse } from "next/server";
import { checkRateLimit, extractClientIp, rateLimitResponse, type RateLimitConfig } from "@/lib/rate-limit";
import { validateOrigin, csrfForbiddenResponse } from "@/lib/csrf";

const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 30
};

export function guardApiRoute(
  request: Request
): NextResponse | null {
  const ip = extractClientIp(request);
  const { allowed, resetAt } = checkRateLimit(`api:${ip}`, API_RATE_LIMIT);

  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  if (!validateOrigin(request)) {
    return csrfForbiddenResponse();
  }

  return null;
}
