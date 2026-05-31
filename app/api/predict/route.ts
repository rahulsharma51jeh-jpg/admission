import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { predict, PredictionInput } from "@/lib/prediction";
import { predictSchema } from "@/lib/validators";
import { ok, handleError } from "@/lib/http";

// The predictor reads from the DB on each request.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = predictSchema.parse(body);

    const input: PredictionInput = {
      exam: data.exam,
      rank: data.rank,
      score: data.score,
      category: data.category,
      gender: data.gender,
      homeState: data.homeState,
      budgetMax: data.budgetMax,
      preferredStates: data.preferredStates,
      twelfthPct: data.twelfthPct,
    };

    const result = await predict(input);

    // Persist for logged-in users who opt in (history / dashboard).
    const user = getSession();
    let predictionId: string | null = null;
    if (user && data.save) {
      const saved = await prisma.prediction.create({
        data: {
          userId: user.id,
          exam: input.exam,
          rank: input.rank ?? null,
          score: input.score ?? null,
          category: input.category,
          gender: input.gender ?? "ALL",
          homeState: input.homeState ?? null,
          budgetMax: input.budgetMax ?? null,
          twelfthPct: input.twelfthPct ?? null,
          preferredStates: JSON.stringify(input.preferredStates ?? []),
          resultJson: JSON.stringify({
            summary: result.summary,
            totalMatches: result.totalMatches,
            matches: result.matches.slice(0, 40),
          }),
        },
      });
      predictionId = saved.id;
    }

    return ok({ ...result, predictionId, saved: !!predictionId });
  } catch (e) {
    return handleError(e);
  }
}
