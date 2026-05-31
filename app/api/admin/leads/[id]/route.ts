import { prisma } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { leadUpdateSchema } from "@/lib/validators";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

// Admin: update a lead's pipeline status / notes.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    requireRole(getSession(), ["ADMIN", "COUNSELLOR"]);

    const body = await req.json();
    const data = leadUpdateSchema.parse(body);

    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Lead not found", 404);

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: data.status ?? existing.status,
        notes: data.notes ?? existing.notes,
      },
    });

    return ok({ lead });
  } catch (e) {
    return handleError(e);
  }
}
