# AGENTS.md

This document defines contributor-agent expectations for this repository.

## 1) Mission

Build and maintain a clean, secure, bilingual Canada-focused tax filing platform that keeps complexity hidden while preserving legal correctness and auditability.

## 2) Core Product Priorities

1. Individual-first usability
2. Self-employed coverage within individual flow
3. Integrated company flow behind progressive disclosure
4. Prior-year continuity and carry-forward
5. Security + privacy by default

## 3) Engineering Rules

- Keep changes small and composable.
- Favor root-cause fixes over downstream workarounds.
- Preserve existing style and architecture boundaries.
- Treat tax and identity data as sensitive by default.
- Never hardcode secrets or API keys.
- Prefer typed schemas and explicit validation for all API write paths.

## 4) Security Rules

All auth/session changes must include threat considerations. The following 35-point checklist must be assessed regularly and before each release.

### 4.1 Session & Authentication

1. **Session expiration** — JWT/session tokens must have a `maxAge` ≤ 7 days. Enforce server-side expiry; never trust client-only timers.
2. **Secret management** — Never commit secrets, API keys, or credentials. Use environment variables and `.env` files excluded via `.gitignore`. Rotate secrets on suspected exposure.
3. **Demo credentials isolation** — Demo/credential providers must be gated behind `ENABLE_DEMO_AUTH` and disabled in production (`NODE_ENV=production`) unless explicitly opted in.
4. **MFA support** — Offer TOTP-based MFA enrollment. Protect MFA enroll/verify/disable endpoints with rate limiting and session validation.
5. **Token rotation** — Use short-lived JWTs; refresh via NextAuth callbacks. Invalidate sessions on password/role change.

### 4.2 Input Validation & Injection Prevention

6. **Zod schema validation** — All API write paths must validate payloads with Zod schemas before any processing. Reject unknown keys.
7. **SQL injection prevention** — Use Prisma parameterised queries exclusively. Never interpolate user input into raw SQL.
8. **XSS prevention** — Escape all user-provided values before HTML interpolation (emails, PDFs, rendered UI). Use React's built-in escaping for JSX.
9. **Command injection** — Never pass user input to `child_process`, `exec`, or shell commands.
10. **Prototype pollution** — Do not use recursive merge of untrusted objects. Prefer spread or `Object.assign` with validated schemas.

### 4.3 CSRF & Origin Validation

11. **CSRF protection** — All mutating API routes (POST/PUT/PATCH/DELETE) must validate `Origin` header against `Host`. Block requests with missing or mismatched origin.
12. **SameSite cookies** — NextAuth session cookies should use `SameSite=Lax` or `Strict`.

### 4.4 Rate Limiting & DDoS

13. **API rate limiting** — All API routes must pass through `guardApiRoute()` which enforces per-IP rate limits (default 30 req/min). Sensitive endpoints (recovery, MFA) use stricter limits.
14. **Brute-force protection** — Authentication and MFA verification endpoints must have aggressive rate limits (e.g., 3–5 attempts per 5 minutes).
15. **DDoS resilience** — Rely on Vercel/CDN edge-level DDoS protection. Keep rate limiter cleanup intervals active server-side.

### 4.5 Transport & Header Security

16. **HTTPS enforcement** — Enforce `Strict-Transport-Security` (HSTS) with `max-age=63072000; includeSubDomains; preload`.
17. **Security headers** — Every response must include: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-DNS-Prefetch-Control: off`, `X-Download-Options: noopen`, `Cross-Origin-Opener-Policy: same-origin`.
18. **Content Security Policy** — CSP must be set per-request via middleware with a unique nonce for `script-src`. `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`.
19. **`poweredBy` header** — Must be disabled (`poweredByHeader: false` in Next.js config).

### 4.6 Access Control & Authorisation

20. **Route protection** — All `/dashboard`, `/returns`, `/account`, `/admin` paths must redirect unauthenticated users via middleware.
21. **Resource ownership** — Every data-fetching query must filter by `userId` to prevent IDOR. Admin routes must check `ADMIN`/`SUPPORT` role via `requireAdminSession()`.
22. **Least privilege** — Default role is `TAXPAYER`. Escalation to `SUPPORT`/`ADMIN` requires manual DB change. Never auto-assign elevated roles.
23. **Open redirect prevention** — Callback URLs in redirects must be validated as relative paths (starts with `/`, not `//`).

### 4.7 File Upload & Storage

24. **File type allowlist** — Only allow: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `text/csv`. Reject all others.
25. **File size limit** — Max 10 MB per upload. Enforce server-side before writing to storage.
26. **Path traversal prevention** — All local file paths must be resolved via `safeLocalPath()` and validated to stay within `UPLOAD_DIR`. Strip path separators and null bytes from uploaded file names.
27. **Content-Disposition sanitisation** — Escape `"`, `\r`, `\n` in file names used in `Content-Disposition` headers.
28. **Blob redirect validation** — When redirecting to blob storage URLs, validate that the URL uses `https:` protocol only.

### 4.8 PII & Data Protection

29. **PII encryption at rest** — Fields `legalName`, `sinLast4`, `birthDate` must be encrypted with AES-256-GCM before database storage and decrypted on read.
30. **PII masking in logs/admin** — Admin-facing endpoints must mask emails (`d***o@example.com`), names, and IP addresses before returning them.
31. **Data minimisation** — Only select needed columns in Prisma queries. Avoid returning full user objects in API responses.
32. **Data export/deletion** — Support GDPR/PIPEDA-style data requests (EXPORT, DELETION) via `/api/account/data-request`.

### 4.9 Audit & Logging

33. **Audit trail** — All security events (sign-in, sign-out, return save, submission, document upload/delete, consent, recovery) must be logged to `AuditEvent` with userId, action, resource, IP, and user agent.
34. **No sensitive data in logs** — Never log passwords, tokens, full SINs, or encryption keys. Truncate user agents to 512 chars. Validate IP format before storing.
35. **Console output** — Production code must have zero `console.log` / `console.debug` statements. Use structured audit logging only.

### 4.10 Third-Party Integration

- Any new third-party integration must document key handling and failure modes.
- External API keys must be stored in environment variables, never in code.
- Third-party SDK failures must be caught and must not leak stack traces to clients.

## 5) Data & Compliance Rules

- Scope logic to Canadian filing contexts unless explicitly expanded.
- Avoid legal/compliance claims in code comments without references.
- Keep prior-year and status transitions deterministic and testable.
- Ensure any e-filing adapter remains swappable behind an interface.

## 6) Testing Rules

- Add or update tests with functional changes where practical.
- At minimum, run: typecheck, lint, tests, build.
- For filing workflow changes, cover branching and required-field behavior.

## 7) CI/CD Rules

- Keep `.github/workflows` green for merge readiness.
- Preserve semantic versioning pipeline behavior.
- Do not bypass failing checks in PRs.
- Every set of meaningful changes must include a version bump (`patch` for fixes, `minor` for features, `major` for breaking changes) via `npm run version:bump -- --type <patch|minor|major>` before pushing.

## 8) Documentation Rules

- Update `README.md` for setup, architecture, or workflow changes.
- Update `CHANGELOG.md` for release-impacting changes.
- Keep `SECURITY.md` aligned with implemented controls.

## 9) Deployment & Testing Workflow Rules

- Use Vercel as the default deployment platform for preview/production planning.
- Keep production-domain changes isolated behind explicit DNS/domain approval.
- Prefer preview deployments and temporary test domains/subdomains before production cutover.
- During UI/UX verification phases, include browser-based review (system browser or IDE preview) and capture regressions before merge.
