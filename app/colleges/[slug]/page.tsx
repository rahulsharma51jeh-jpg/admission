import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  inr,
  EXAM_META,
  STREAM_META,
  type Exam,
  type Stream,
} from "@/lib/domain";
import { typeBadge } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function CollegeDetail({
  params,
}: {
  params: { slug: string };
}) {
  const college = await prisma.college.findUnique({
    where: { slug: params.slug },
    include: {
      branches: {
        orderBy: { annualFee: "asc" },
        include: {
          cutoffs: { where: { category: "GENERAL" } },
        },
      },
    },
  });

  if (!college) notFound();

  const exam = college.branches[0]?.cutoffs[0]?.exam as Exam | undefined;

  return (
    <div className="container-page py-10">
      <Link href="/colleges" className="text-sm text-indigo-600 hover:underline">
        ← Back to colleges
      </Link>

      {/* Header */}
      <div className="card mt-4 overflow-hidden">
        <div className="gradient-bg p-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-white/20 text-white">{college.type}</span>
            <span className="badge bg-white/20 text-white">
              {STREAM_META[college.stream as Stream]?.icon}{" "}
              {STREAM_META[college.stream as Stream]?.label}
            </span>
            {college.nirfRank ? (
              <span className="badge bg-white/20 text-white">NIRF #{college.nirfRank}</span>
            ) : null}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{college.name}</h1>
          <p className="mt-1 text-indigo-100">
            {college.city}, {college.state}
            {college.establishedYr ? ` · Est. ${college.establishedYr}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <Stat label="Annual fees" value={`${inr(college.feesMin)}–${inr(college.feesMax)}`} />
          <Stat label="Courses" value={String(college.branches.length)} />
          <Stat label="Hostel" value={college.hostel ? "Available" : "No"} />
          <Stat label="Admission via" value={exam ? EXAM_META[exam].label : "—"} />
        </div>
        {college.description && (
          <p className="border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
            {college.description}
          </p>
        )}
        {college.website && (
          <div className="border-t border-slate-100 px-6 py-3">
            <a
              href={college.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              Visit official website ↗
            </a>
          </div>
        )}
      </div>

      {/* Courses + cutoffs */}
      <h2 className="mt-8 text-xl font-bold">Courses & 2024 cutoffs (General)</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Degree</th>
              <th className="px-4 py-3 font-medium">Annual fee</th>
              <th className="px-4 py-3 font-medium">Exam</th>
              <th className="px-4 py-3 font-medium">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {college.branches.map((b) => {
              const cut = b.cutoffs[0];
              const cutExam = cut?.exam as Exam | undefined;
              const closing =
                cut && cutExam
                  ? EXAM_META[cutExam].metric === "rank"
                    ? `Rank ${cut.closingRank.toLocaleString("en-IN")}`
                    : `${cutExam === "CAT" ? "%ile" : "Score"} ${cut.closingRank}`
                  : "—";
              return (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{b.name}</td>
                  <td className="px-4 py-3 text-slate-500">{b.degree}</td>
                  <td className="px-4 py-3 text-slate-700">{inr(b.annualFee)}</td>
                  <td className="px-4 py-3">
                    {cutExam ? (
                      <span className={`badge ${typeBadge(college.type)}`}>
                        {EXAM_META[cutExam].label}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{closing}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card gradient-bg mt-8 p-6 text-center text-white">
        <h3 className="text-lg font-bold">Can you get into {college.shortName ?? "this college"}?</h3>
        <p className="mt-1 text-sm text-indigo-100">
          Run the predictor with your rank to see your real chances.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href={exam ? `/predictor?exam=${exam}` : "/predictor"}
            className="btn bg-white text-indigo-700 hover:bg-indigo-50"
          >
            Check my chances
          </Link>
          <Link
            href="/counselling"
            className="btn border border-white/40 text-white hover:bg-white/10"
          >
            Get counselling
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 font-bold text-slate-900">{value}</div>
    </div>
  );
}
