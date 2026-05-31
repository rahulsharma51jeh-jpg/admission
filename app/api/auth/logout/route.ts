import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST() {
  clearAuthCookie();
  return ok({ loggedOut: true });
}
