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
  const status = url.searchParams.get("status") ?? undefined;

  const requests = await prisma.dataRequest.findMany({
    where: status ? { status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { email: true }
      }
    }
  });

  const masked = requests.map((r) => ({
    id: r.id,
    email: r.user.email ? maskEmail(r.user.email) : "—",
    requestType: r.requestType,
    status: r.status,
    createdAt: r.createdAt,
    processedAt: r.processedAt
  }));

  return NextResponse.json({ requests: masked });
}
