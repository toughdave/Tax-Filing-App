---
description: Deploy app to Vercel preview and run browser-based verification
---
1. Verify local quality gate before deployment.
   - Run: `npm run typecheck && npm run lint && npm test && npm run build`

2. Confirm Vercel team/project context.
   - Use MCP `list_teams` and `list_projects` if `.vercel/project.json` is missing.

3. Deploy current project to Vercel.
   - Use MCP `deploy_to_vercel`.

4. Retrieve deployment details and access link.
   - Use MCP `get_deployment` for build metadata.
   - If URL is protected, use MCP `get_access_to_vercel_url`.

5. Perform browser-based verification.
   - Open the deployment in system browser and/or IDE browser preview.
   - Validate key routes: `/`, `/sign-in`, `/dashboard`, `/returns/new`, one edit route (`/returns/:returnId`).
   - Check EN/FR rendering via `?lang=en` and `?lang=fr`.

6. Review logs for runtime/build issues.
   - Use MCP `get_deployment_build_logs` for build failures.
   - Use MCP `get_runtime_logs` for request-time errors.

7. Domain strategy (approval required).
   - Keep production domain untouched.
   - Prefer preview URL or dedicated subdomain for testing.
   - Only proceed with DNS/domain binding after explicit approval.
