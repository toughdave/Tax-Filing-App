# skill.md

## Capability Matrix

### Product UX
- Guided multi-path filing interview (individual, self-employed, company)
- Progressive disclosure to reduce user overwhelm
- Bilingual UI for core workflows (EN/FR)

### Identity & Security
- OAuth-ready account model
- Database-backed sessions
- Security headers and audit event logging
- Baseline secure coding controls documented and enforceable

### Tax Workflow Engine
- Filing-year aware return records
- Required-field gating and draft/review state progression
- Prior-year carry-forward for continuity
- Submission preparation interface with provider abstraction

### Platform
- Next.js fullstack architecture
- Prisma + PostgreSQL domain model
- API routes for authenticated filing operations
- CI/CD pipeline scaffolding with quality gates

## Quality Standards

- Strict TypeScript compilation
- Passing lint, tests, and production build before release
- No sensitive data in logs or source control
- Deterministic status transitions

## Scope Boundaries (Current)

- Canada-only implementation scope
- Sandbox submission provider for preparation stage
- Production e-filing/certification work remains roadmap item

## Escalation Triggers

Escalate for legal/compliance review when:

- changing filing logic that affects legal declarations
- introducing production e-filing integrations
- adding cross-border or non-Canadian tax logic
- changing retention, deletion, or privacy-policy-sensitive behavior
