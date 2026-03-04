import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { guardApiRoute } from "@/lib/api-guard";
import { listRecoveryRequests } from "@/lib/services/recovery-service";
import { maskEmail, maskName, maskIp } from "@/lib/pii-mask";

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const auth = await requireAdminSession();
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const requests = await listRecoveryRequests(status);

  const masked = requests.map((r) => ({
    ...r,
    email: maskEmail(r.email),
    fullName: maskName(r.fullName),
    reason: r.reason.length > 100 ? r.reason.slice(0, 100) + "…" : r.reason
  }));

  return NextResponse.json({ requests: masked });
}
