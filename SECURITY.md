# SECURITY.md

## Security Posture Summary

NorthBridge Tax handles sensitive identity and financial data. All work in this repository should assume high confidentiality and integrity requirements.

## Implemented Controls

- OAuth-capable authentication with session persistence
- HttpOnly session handling through NextAuth
- Security headers configured in `next.config.ts`
- Audit logging for sign-in/sign-out and filing actions
- Environment-based secret management
- Type-safe validation for write APIs

## Required Controls for Production

1. **Transport security**
   - Enforce HTTPS/TLS 1.2+
   - HSTS enabled at edge and app layers
2. **Identity hardening**
   - MFA policies for privileged users
   - Suspicious sign-in detection and alerting
3. **Data protection**
   - Encryption at rest for database and backups
   - Key management with rotation policy
4. **Access controls**
   - Least-privilege DB/service permissions
   - Audit and periodic access review
5. **Operational security**
   - Secret scanning in CI
   - Dependency vulnerability scanning
   - Incident response runbook
6. **Compliance governance**
   - Legal/privacy review before production claims
   - Documented retention and data-subject request flows

## Secret Handling

- Never commit `.env` files.
- Use `.env.example` for non-secret templates only.
- Rotate compromised credentials immediately.

## Reporting a Security Issue

For serious vulnerabilities, do not open a public issue with exploit details.

1. Reproduce with minimal steps
2. Capture affected versions and impact
3. Share privately with maintainer contact
4. Coordinate a patch + disclosure timeline
