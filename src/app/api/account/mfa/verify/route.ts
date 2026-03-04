import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { confirmEnrollment } from "@/lib/services/mfa-service";

const verifySchema = z.object({
  token: z.string().length(6).regex(/^\d+$/)
});

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "INVALID_TOKEN" }, { status: 400 });
  }

  try {
    const valid = await confirmEnrollment(session.user.id, parsed.data.token);
    if (!valid) {
      return NextResponse.json({ message: "INVALID_TOKEN" }, { status: 400 });
    }
    return NextResponse.json({ message: "MFA_ENABLED" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "MFA_NOT_ENROLLED") {
        return NextResponse.json({ message: "MFA_NOT_ENROLLED" }, { status: 404 });
      }
      if (err.message === "MFA_ALREADY_ENABLED") {
        return NextResponse.json({ message: "MFA_ALREADY_ENABLED" }, { status: 409 });
      }
    }
    throw err;
  }
}
