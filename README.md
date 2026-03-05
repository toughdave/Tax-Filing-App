# Canada Tax Filing

A security-first, bilingual (English/French), Canada-focused tax filing web app built on Next.js fullstack to simplify CRA-aligned filing for **individual**, **self-employed**, and **company** pathways with progressive disclosure.

## Vision

Tax filing should feel structured, understandable, and calm. This project prioritizes:

- Individual-first experience (with self-employed support)
- Integrated company path hidden behind guided branching
- Prior-year continuity and carry-forward profile data
- Strong account security + privacy controls
- Submission architecture for CRA-compatible e-filing integrations

## Current Implementation (v0.13.0)

### Core Filing
- Guided interview for **INDIVIDUAL**, **SELF_EMPLOYED**, and **COMPANY** filing modes
- 44+ CRA field mappings per tax year (T1, T2125, T2, Schedule 3/6/9/11)
- Tax calculation engine with federal + provincial/territorial tax for all 13 jurisdictions
- Prior-year carry-forward with smart field filtering and "What changed?" diff
- Filing preflight checks (8 validations) before submission
- Real-time client-side Zod validation with inline error messages

### Security & Privacy
- AES-256-GCM field-level PII encryption (SIN, name, DOB) at rest
- JWT sessions via NextAuth with OAuth providers (Google/Microsoft/Apple)
- Two-factor authentication (TOTP) with recovery codes
- Rate limiting, CSRF protection, nonce-based CSP on all routes
- Consent management, data retention controls, account recovery
- Admin dashboard with masked PII for support workflows
- Complete audit trail for auth, filing, and document actions

### E-Filing & Documents
- Production e-filing providers: NETFILE (XML/T1) and EFILE (JSON/all modes)
- Document upload/download/delete with Vercel Blob storage (local fallback)
- XML escaping and ownership verification on all document operations

### Infrastructure
- Email notifications via Resend (filing confirmation, submission, sign-in alerts)
- PostgreSQL + Prisma with migrations for all models
- Bilingual EN/FR interface (370+ i18n key pairs)
- Loading states, skeleton screens, accessibility (skip nav, ARIA)
- Privacy Policy and Terms of Service pages (PIPEDA-aligned)
- CI/CD: GitHub Actions for lint/typecheck/test/build/security-scan

## Tech Stack

- **Frontend + Backend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Auth**: NextAuth (OAuth + credentials fallback)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Testing**: Vitest
- **Linting**: ESLint (Next config)

## Security Highlights

- JWT sessions via NextAuth with Prisma adapter
- Security headers via `next.config.ts` plus nonce-based CSP via `middleware.ts`
- Audit logging for auth and filing actions
- Request metadata capture (IP/User-Agent) for filing and auth-route boundary events
- Demo credentials provider disabled in production by default (explicit opt-in only)
- PII-aware architecture and clear security documentation
- No hardcoded secrets, env-based config only

See `SECURITY.md` for vulnerability reporting policy.

## Local Development

### 1) Install

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env.local
```

Set at minimum:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DEMO_EMAIL`
- `DEMO_PASSCODE`

Optional hardening toggle:

- `ENABLE_DEMO_AUTH` (defaults to disabled in production unless explicitly set to a truthy value)

(Optional) add OAuth provider credentials.

### 3) Generate Prisma client

```bash
npm run db:generate
```

### 4) Start app

HTTP:

```bash
npm run dev
```

HTTPS local dev (recommended):

```bash
npm run dev:https
```

### 5) Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## API Endpoints

- `GET /api/health`
- `GET /api/returns` (authenticated)
- `GET /api/returns/:returnId` (authenticated)
- `POST /api/returns` (authenticated)
- `POST /api/returns/:returnId/prepare` (authenticated)
- `GET|POST /api/auth/[...nextauth]`

## Deployment Strategy

### Vercel (recommended)

- Use Vercel for preview and eventual production deployment of this fullstack Next.js app.
- This app depends on server-side routes (`/api/*`), auth callbacks, and database access, which are all first-class on Vercel.

### GitHub Pages (not recommended for this app)

- GitHub Pages is static hosting only and cannot run Next.js API routes, NextAuth handlers, or server-side DB access required by this project.

### Domain strategy for safe live testing

- Keep `www.davidoncloud.com` unchanged.
- For live testing, use either:
  1. Vercel preview URLs, or
  2. a dedicated subdomain (example: `tax-preview.davidoncloud.com`) pointed to Vercel via DNS.

This preserves your existing static site/CMS while allowing isolated app testing.

## CI/CD

Workflow files live in `.github/workflows`:

- `ci-cd.yml` – lint, typecheck, tests, build, security scan
- `release-version.yml` – semantic version bump (`major|minor|patch`), commit, tag, push

## Versioning

This project uses semantic versioning (`major.minor.patch`).

Run locally:

```bash
npm run version:bump -- --type patch
# or minor / major
```

This updates:

- `package.json`
- `CHANGELOG.md`

## Legal and Compliance Notes

- This repository currently provides product/engineering scaffolding and a guided filing workflow.
- Production launch must include formal CRA integration readiness, legal/tax review, and compliance validation.
- This app is scoped to **Canada** for initial releases.

## Future Roadmap

### Near-term

- Deeper CRA form mapping and validation rules by tax year
- Enhanced upload/document reconciliation
- Expanded company-filing requirements
- Production-grade e-filing partner integration

### Mobile expansion (planned)

- iOS and Android integrated app clients (future phase)
- Shared secure backend and filing orchestration APIs
- Mobile-first flows for return status, reminders, and document capture

## Project Docs

- `AGENTS.md` – contributor agent playbook and guardrails
- `skill.md` – capability matrix and quality bar
- `SECURITY.md` – security standards and operational controls
- `CHANGELOG.md` – release history
