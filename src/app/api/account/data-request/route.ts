import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/session";
import { createDataRequest, listDataRequests } from "@/lib/services/consent-service";
import { writeAuditEvent, extractRequestMeta } from "@/lib/audit";
import { guardApiRoute } from "@/lib/api-guard";

const createRequestSchema = z.object({
  requestType: z.enum(["EXPORT", "DELETION"]),
  reason: z.string().max(500).optional()
});

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const requests = await listDataRequests(session.user.id);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "INVALID_PAYLOAD", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createDataRequest(
    session.user.id,
    parsed.data.requestType,
    parsed.data.reason
  );

  await writeAuditEvent({
    action: `data_request.${parsed.data.requestType.toLowerCase()}`,
    resource: "DataRequest",
    metadata: { requestId: result.id, requestType: parsed.data.requestType },
    ...extractRequestMeta(request)
  });

  return NextResponse.json({ request: result }, { status: 201 });
}
