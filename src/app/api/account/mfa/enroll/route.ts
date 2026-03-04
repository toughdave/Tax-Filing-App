import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import { guardApiRoute } from "@/lib/api-guard";
import { startEnrollment } from "@/lib/services/mfa-service";
import * as QRCode from "qrcode";

export async function POST(request: Request) {
  const blocked = guardApiRoute(request);
  if (blocked) return blocked;

  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await startEnrollment(session.user.id, session.user.email);
    const qrDataUrl = await QRCode.toDataURL(result.uri);

    return NextResponse.json({
      message: "ENROLLMENT_STARTED",
      qrCode: qrDataUrl,
      secret: result.secret,
      recoveryCodes: result.recoveryCodes
    });
  } catch (err) {
    if (err instanceof Error && err.message === "MFA_ALREADY_ENABLED") {
      return NextResponse.json({ message: "MFA_ALREADY_ENABLED" }, { status: 409 });
    }
    throw err;
  }
}
