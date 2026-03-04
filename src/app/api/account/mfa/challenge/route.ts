import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { verifyMfaChallenge, isMfaEnabled } from "@/lib/services/mfa-service";

const challengeSchema = z.object({
  token: z.string().min(6).max(8)
});

export async function GET(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const enabled = await isMfaEnabled(session.user.id);
  return NextResponse.json({ mfaEnabled: enabled });
}

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = challengeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "INVALID_TOKEN" }, { status: 400 });
  }

  const valid = await verifyMfaChallenge(session.user.id, parsed.data.token);
  if (!valid) {
    return NextResponse.json({ message: "INVALID_TOKEN" }, { status: 401 });
  }

  return NextResponse.json({ message: "MFA_VERIFIED" });
}
