import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSession, requireRole } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { LEAD_STATUSES, LeadStatus } from "@/lib/domain";

export const dynamic = "force-dynamic";

// Admin: list leads (sales pipeline), filterable by status, paginated.
export async function GET(req: Request) {
  try {
    requireRole(getSession(), ["ADMIN", "COUNSELLOR"]);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") as LeadStatus | null;
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("pageSize") || 20))
    );

    const where: Prisma.LeadWhereInput = {};
    if (status && LEAD_STATUSES.includes(status)) where.status = status;

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({
      leads,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    return handleError(e);
  }
}
