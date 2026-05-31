import { prisma } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { ok, fail, handleError } from "@/lib/http";
import type { Role } from "@/lib/domain";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) return fail("An account with this email already exists", 409);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        passwordHash: await hashPassword(data.password),
        role: "STUDENT",
      },
    });

    const session = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };
    setAuthCookie(signToken(session));
    return ok({ user: session }, 201);
  } catch (e) {
    return handleError(e);
  }
}
