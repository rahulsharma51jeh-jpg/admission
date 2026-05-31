import { prisma } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const college = await prisma.college.findUnique({
      where: { slug: params.slug },
      include: {
        branches: {
          orderBy: { annualFee: "asc" },
          include: {
            cutoffs: {
              where: { category: "GENERAL" },
              select: {
                exam: true,
                year: true,
                quota: true,
                openingRank: true,
                closingRank: true,
              },
            },
          },
        },
      },
    });

    if (!college) return fail("College not found", 404);
    return ok({ college });
  } catch (e) {
    return handleError(e);
  }
}
