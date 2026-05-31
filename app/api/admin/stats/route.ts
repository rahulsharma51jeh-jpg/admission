import { prisma } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { LEAD_STATUSES, STREAMS } from "@/lib/domain";

export const dynamic = "force-dynamic";

// Admin dashboard metrics.
export async function GET() {
  try {
    requireRole(getSession(), ["ADMIN", "COUNSELLOR"]);

    const [
      collegeCount,
      branchCount,
      cutoffCount,
      userCount,
      leadCount,
      predictionCount,
      leadsByStatusRaw,
      collegesByStreamRaw,
    ] = await Promise.all([
      prisma.college.count(),
      prisma.branch.count(),
      prisma.cutoff.count(),
      prisma.user.count(),
      prisma.lead.count(),
      prisma.prediction.count(),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.college.groupBy({ by: ["stream"], _count: { _all: true } }),
    ]);

    const leadsByStatus = Object.fromEntries(
      LEAD_STATUSES.map((s) => [s, 0])
    ) as Record<string, number>;
    for (const r of leadsByStatusRaw) leadsByStatus[r.status] = r._count._all;

    const collegesByStream = Object.fromEntries(
      STREAMS.map((s) => [s, 0])
    ) as Record<string, number>;
    for (const r of collegesByStreamRaw)
      collegesByStream[r.stream] = r._count._all;

    return ok({
      totals: {
        colleges: collegeCount,
        courses: branchCount,
        cutoffs: cutoffCount,
        users: userCount,
        leads: leadCount,
        predictions: predictionCount,
      },
      leadsByStatus,
      collegesByStream,
    });
  } catch (e) {
    return handleError(e);
  }
}
