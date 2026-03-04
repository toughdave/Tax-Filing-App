# Changelog

All notable changes to this project are documented in this file.

## [0.6.0] - 2026-03-04
### Added
- Admin/operator support dashboard (`/admin`) with role-based access control (SUPPORT/ADMIN roles only).
- PII masking utility (`pii-mask.ts`) — masks emails, names, and IP addresses in admin views.
- Admin guard utility (`admin-guard.ts`) — reusable session + role check returning 401/403 for unauthorized access.
- `GET /api/admin/recovery-requests` — lists recovery requests with masked PII.
- `GET /api/admin/data-requests` — lists data export/deletion requests with masked user emails.
- `GET /api/admin/audit-log` — lists recent audit events with masked emails and IPs.
- Tabbed admin dashboard UI (Recovery requests, Data requests, Audit log) with bilingual i18n.
- 10 unit tests for PII masking utility.
- `/admin` added to protected routes in auth middleware.

### Security
- All admin API endpoints enforce SUPPORT/ADMIN role check via `requireAdminSession()`.
- PII is never exposed in admin views — emails, names, and IPs are masked by default.
- Admin API endpoints are rate-limited and CSRF-protected via `guardApiRoute`.

## [0.5.0] - 2026-03-04
### Added
- Account recovery flow for users who lose access to their OAuth provider.
- `RecoveryRequest` Prisma model with status tracking (SUBMITTED → UNDER_REVIEW → APPROVED/DENIED).
- `POST /api/account/recovery` endpoint with strict rate limiting (3 req/5 min per IP) and CSRF protection.
- Public `/recovery` page with bilingual form (email, full name, reason).
- Recovery form component with status feedback (success, already exists, error).
- "Lost access to your account?" link on sign-in page pointing to recovery.
- Recovery service with idempotent request creation and email normalization.
- 5 unit tests for recovery service.
- Prisma migration for `RecoveryRequest` table and indexes.

### Security
- Recovery endpoint has tighter rate limits than standard API routes (3 req/5 min vs 30 req/min).
- Recovery requests log IP address and user-agent for audit trail.
- Duplicate pending recovery requests are prevented per email.

## [0.4.0] - 2026-03-04
### Added
- Consent management system with `ConsentRecord` Prisma model tracking user agreement to Terms of Service, Privacy Policy, and Data Processing.
- Consent banner component — appears for authenticated users who haven't yet accepted current consent versions.
- `GET /api/consent` and `POST /api/consent` endpoints for checking and recording consent.
- Data retention controls with `DataRequest` Prisma model for EXPORT and DELETION requests.
- `GET /api/account/data-request` and `POST /api/account/data-request` endpoints for submitting data requests.
- Account settings page (`/account`) showing consent status and data request controls.
- Account nav link in site header for authenticated users.
- Bilingual (EN/FR) i18n strings for all consent and account management UI.
- Consent service with version tracking, grant/revoke logic, and idempotent data request creation.
- 9 unit tests for consent service covering all CRUD operations.
- Prisma migration for `ConsentRecord`, `DataRequest`, and related enums.

### Changed
- `/account` added to protected routes in auth middleware.
- Root layout now renders `ConsentBanner` globally for all pages.

### Security
- Consent records include IP address and user-agent for audit trail.
- Data requests are rate-limited and CSRF-protected via `guardApiRoute`.
- Duplicate pending data requests are prevented (idempotent).

## [0.3.0] - 2026-03-04
### Added
- Auth middleware for protected page redirects (`/dashboard`, `/returns/*`) — unauthenticated users are redirected to `/sign-in` with `callbackUrl`.
- In-memory rate limiting on all API routes (30 req/min per IP) with `Retry-After` header on 429 responses.
- CSRF origin validation on mutating API requests (POST/PUT/PATCH/DELETE).
- Shared `guardApiRoute` helper combining rate limit + CSRF checks for DRY route protection.
- Unit tests for rate limiter (4 tests) and CSRF validator (7 tests).

### Changed
- All `/api/returns` routes now run rate limit and CSRF checks before auth/business logic.
- Middleware matcher unchanged; auth check runs before CSP/nonce generation for protected routes.

### Security
- Protected routes no longer render for unauthenticated users — immediate redirect at edge.
- API abuse surface reduced via per-IP sliding-window rate limiter.
- Cross-origin mutating requests blocked by origin header validation.

## [0.2.0] - 2026-03-04
### Added
- Return detail retrieval endpoint: `GET /api/returns/:returnId`.
- Return resume UI route: `/returns/:returnId` with prefilled filing data.
- Auth policy helpers for environment-aware provider enablement.
- Vercel preview deployment workflow at `.windsurf/workflows/vercel-preview-deploy.md`.
- New tests for auth policy and audit request metadata extraction.
- Mandatory version bump rule in `AGENTS.md` CI/CD section.

### Changed
- Dashboard "Open" action now targets the selected return record.
- Demo credentials provider is disabled in production unless explicitly enabled.
- `/api/returns` listing now returns summary fields only (reduced PII exposure).
- Not-found and error boundaries now use EN/FR localized text.
- Middleware now emits nonce-based CSP and locale headers.
- Audit metadata extraction now validates/sanitizes IP and user-agent values.
- CI security scan split into strict (production deps) and advisory (all deps) steps.

### Security
- Added auth-route boundary audit events with request metadata.
- Removed static `'unsafe-inline'` script CSP policy from `next.config.ts` in favor of nonce-based middleware CSP.

## [0.1.0] - 2026-03-03
### Added
- Initial Next.js fullstack foundation for Canada-focused tax filing.
- OAuth-ready authentication architecture with secure session handling.
- Guided bilingual (EN/FR) filing UX for individual, self-employed, and company paths.
- Prisma data model for user profiles, tax returns, and audit events.
- CI/CD baseline plan with lint, typecheck, test, build, and security scan steps.
