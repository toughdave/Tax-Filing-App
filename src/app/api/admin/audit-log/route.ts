import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { guardApiRoute } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { maskEmail, maskIp } from "@/lib/pii-mask";

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const auth = await requireAdminSession();
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { email: true }
      }
    }
  });

  const masked = events.map((e) => ({
    id: e.id,
    action: e.action,
    resource: e.resource,
    email: e.user?.email ? maskEmail(e.user.email) : "—",
    ipAddress: maskIp(e.ipAddress),
    createdAt: e.createdAt
  }));

  return NextResponse.json({ events: masked });
}
