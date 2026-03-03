import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export function getAuthSession() {
  return getServerSession(authOptions);
}
