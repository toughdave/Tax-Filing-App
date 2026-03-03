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

- All auth/session changes must include threat considerations.
- Maintain secure headers and least-privilege patterns.
- Log security and filing events via audit trail.
- Any new third-party integration must document key handling and failure modes.

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

## 8) Documentation Rules

- Update `README.md` for setup, architecture, or workflow changes.
- Update `CHANGELOG.md` for release-impacting changes.
- Keep `SECURITY.md` aligned with implemented controls.
