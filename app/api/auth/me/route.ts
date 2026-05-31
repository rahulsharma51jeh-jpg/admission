import { getSession } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function GET() {
  const user = getSession();
  return ok({ user });
}
