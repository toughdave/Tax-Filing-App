import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/session";
import type { UserRole } from "@prisma/client";

const ADMIN_ROLES: UserRole[] = ["SUPPORT", "ADMIN"];

export async function requireAdminSession(): Promise<
  | { authorized: true; userId: string; role: UserRole }
  | { authorized: false; response: NextResponse }
> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 })
    };
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ message: "FORBIDDEN" }, { status: 403 })
    };
  }

  return { authorized: true, userId: session.user.id, role: session.user.role };
}
