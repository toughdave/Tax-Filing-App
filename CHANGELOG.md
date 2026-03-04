# Changelog

All notable changes to this project are documented in this file.

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
