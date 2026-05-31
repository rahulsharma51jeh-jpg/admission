import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

// Returns the logged-in user's saved prediction history.
export async function GET() {
  try {
    const user = getSession();
    if (!user) return fail("Authentication required", 401);

    const predictions = await prisma.prediction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return ok({
      predictions: predictions.map((p) => ({
        id: p.id,
        exam: p.exam,
        rank: p.rank,
        score: p.score,
        category: p.category,
        budgetMax: p.budgetMax,
        createdAt: p.createdAt,
        result: JSON.parse(p.resultJson),
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
