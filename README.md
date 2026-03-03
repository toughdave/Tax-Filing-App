# Canada Tax Filing

A security-first, bilingual (English/French), Canada-focused tax filing web app built on Next.js fullstack to simplify CRA-aligned filing for **individual**, **self-employed**, and **company** pathways with progressive disclosure.

## Vision

Tax filing should feel structured, understandable, and calm. This project prioritizes:

- Individual-first experience (with self-employed support)
- Integrated company path hidden behind guided branching
- Prior-year continuity and carry-forward profile data
- Strong account security + privacy controls
- Submission architecture for CRA-compatible e-filing integrations

## Current Implementation (v0.1.0)

- Next.js App Router + TypeScript fullstack architecture
- OAuth-ready authentication via NextAuth + Prisma adapter
- Demo credentials sign-in mode for local development
- PostgreSQL + Prisma data model for:
  - user accounts/sessions
  - tax profiles
  - tax returns by year and filing mode
  - audit events
- Guided filing form that supports:
  - `INDIVIDUAL`
  - `SELF_EMPLOYED`
  - `COMPANY`
- Prior-year carry-forward by filing mode
- Submission package preparation through a sandbox provider abstraction
- Bilingual interface for core flow (`en` / `fr`)
- API routes for return save/list/prepare and health checks
- CI/CD baseline and semantic version bump automation

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
- Security headers via `next.config.ts` (CSP/HSTS/frame protections)
- Audit logging for auth and filing actions
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
- `POST /api/returns` (authenticated)
- `POST /api/returns/:returnId/prepare` (authenticated)
- `GET|POST /api/auth/[...nextauth]`

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
