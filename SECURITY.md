# Security Policy

## Reporting a Security Issue

If you discover a security vulnerability, **do not open a public issue**.

1. Reproduce with minimal steps
2. Note affected versions and potential impact
3. Share privately with the maintainer via the contact in the repository profile
4. Coordinate a fix and disclosure timeline before any public details

We aim to acknowledge reports within 48 hours and coordinate a patch promptly.

## General Posture

This application handles sensitive personal and financial data for Canadian tax filing. Security is treated as a core design requirement. Environment-variable-only configuration is enforced — no secrets are stored in code.

## Secret Handling

- Never commit `.env` files.
- Use `.env.example` for non-secret templates only.
- Rotate any compromised credential immediately.
