import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { collegeQuerySchema } from "@/lib/validators";
import { ok, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = collegeQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries())
    );

    const where: Prisma.CollegeWhereInput = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q } },
        { shortName: { contains: params.q } },
        { city: { contains: params.q } },
      ];
    }
    if (params.state) where.state = params.state;
    if (params.type) where.type = params.type;
    if (params.stream) where.stream = params.stream;
    if (params.exam) where.cutoffs = { some: { exam: params.exam } };

    const orderBy: Prisma.CollegeOrderByWithRelationInput[] =
      params.sort === "feesAsc"
        ? [{ feesMin: "asc" }]
        : params.sort === "feesDesc"
        ? [{ feesMax: "desc" }]
        : params.sort === "name"
        ? [{ name: "asc" }]
        : // "nirf": ranked colleges first, then the rest by name
          [{ nirfRank: "asc" }, { name: "asc" }];

    const [total, colleges] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          shortName: true,
          type: true,
          stream: true,
          city: true,
          state: true,
          nirfRank: true,
          feesMin: true,
          feesMax: true,
          hostel: true,
          _count: { select: { branches: true } },
        },
      }),
    ]);

    return ok({
      colleges,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
