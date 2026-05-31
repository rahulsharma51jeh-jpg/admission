import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { leadSchema } from "@/lib/validators";
import { ok, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

// Public: capture a counselling / admission-service inquiry.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = leadSchema.parse(body);
    const user = getSession();

    const lead = await prisma.lead.create({
      data: {
        userId: user?.id ?? null,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        exam: data.exam ?? null,
        rank: data.rank ?? null,
        budgetMax: data.budgetMax ?? null,
        message: data.message ?? null,
        source: data.source ?? "web",
        status: "NEW",
      },
    });

    return ok({ leadId: lead.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
