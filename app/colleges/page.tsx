import Link from "next/link";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import Filters from "@/components/colleges/Filters";
import CollegeCard from "@/components/colleges/CollegeCard";
import { STREAMS, EXAMS, COLLEGE_TYPES, type Stream, type Exam } from "@/lib/domain";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Colleges — Infinity Admission",
  description: "Browse 25,000+ colleges across engineering, medical, law, management and more.",
};

const PAGE_SIZE = 12;

interface SP {
  q?: string;
  stream?: string;
  state?: string;
  type?: string;
  exam?: string;
  sort?: string;
  page?: string;
}

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const page = Math.max(1, Number(searchParams.page || 1));

  const where: Prisma.CollegeWhereInput = {};
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q } },
      { shortName: { contains: searchParams.q } },
      { city: { contains: searchParams.q } },
    ];
  }
  if (searchParams.state) where.state = searchParams.state;
  if (searchParams.type && (COLLEGE_TYPES as readonly string[]).includes(searchParams.type))
    where.type = searchParams.type;
  if (searchParams.stream && (STREAMS as readonly string[]).includes(searchParams.stream))
    where.stream = searchParams.stream as Stream;
  if (searchParams.exam && (EXAMS as readonly string[]).includes(searchParams.exam))
    where.cutoffs = { some: { exam: searchParams.exam as Exam } };

  const orderBy: Prisma.CollegeOrderByWithRelationInput[] =
    searchParams.sort === "feesAsc"
      ? [{ feesMin: "asc" }]
      : searchParams.sort === "feesDesc"
      ? [{ feesMax: "desc" }]
      : searchParams.sort === "name"
      ? [{ name: "asc" }]
      : [{ nirfRank: "asc" }, { name: "asc" }];

  const [total, colleges] = await Promise.all([
    prisma.college.count({ where }),
    prisma.college.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        name: true,
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][]
    );
    params.set("page", String(p));
    return `/colleges?${params.toString()}`;
  };

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Explore Colleges</h1>
      <p className="mt-1 text-slate-500">
        {total.toLocaleString("en-IN")} colleges match your filters.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <Filters />
        </aside>

        <div>
          {colleges.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              No colleges found. Try clearing some filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {colleges.map((c) => (
                <CollegeCard key={c.slug} c={c} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <Link
                href={qs(Math.max(1, page - 1))}
                className={`btn-secondary ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                ← Previous
              </Link>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages.toLocaleString("en-IN")}
              </span>
              <Link
                href={qs(Math.min(totalPages, page + 1))}
                className={`btn-secondary ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                Next →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
