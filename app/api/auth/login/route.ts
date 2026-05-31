import { prisma } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { ok, fail, handleError } from "@/lib/http";
import type { Role } from "@/lib/domain";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return fail("Invalid email or password", 401);
    }

    const session = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };
    setAuthCookie(signToken(session));
    return ok({ user: session });
  } catch (e) {
    return handleError(e);
  }
}
