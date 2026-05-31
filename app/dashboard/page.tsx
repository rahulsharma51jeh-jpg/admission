import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EXAM_META, CHANCE_META, inr, type Exam, type Chance } from "@/lib/domain";
import { CHANCE_BADGE } from "@/lib/ui";

export const dynamic = "force-dynamic";

interface SavedResult {
  summary: Record<Chance, number>;
  totalMatches: number;
  matches: {
    branchId: string;
    shortName: string | null;
    collegeName: string;
    branchName: string;
    state: string;
    probability: number;
    chance: Chance;
    annualFee: number;
  }[];
}

export default async function DashboardPage() {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role === "ADMIN" || user.role === "COUNSELLOR") redirect("/admin");

  const predictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-slate-500">Your saved college predictions.</p>
        </div>
        <Link href="/predictor" className="btn-primary">+ New prediction</Link>
      </div>

      {predictions.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-slate-600">You haven&apos;t run any predictions yet.</p>
          <Link href="/predictor" className="btn-primary mt-4">Run your first prediction</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {predictions.map((p) => {
            const result = JSON.parse(p.resultJson) as SavedResult;
            const exam = p.exam as Exam;
            const top = result.matches.slice(0, 3);
            return (
              <div key={p.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {EXAM_META[exam].label} ·{" "}
                      {p.rank
                        ? `Rank ${p.rank.toLocaleString("en-IN")}`
                        : `Score ${p.score}`}{" "}
                      · {p.category}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleString("en-IN")} ·{" "}
                      {result.totalMatches} matches
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["SAFE", "TARGET", "REACH", "AMBITIOUS"] as Chance[]).map((c) => (
                      <span key={c} className={`badge ${CHANCE_BADGE[c]}`}>
                        {result.summary[c] ?? 0} {CHANCE_META[c].label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {top.map((m) => (
                    <div key={m.branchId} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {m.probability}%
                        </span>
                        <span className={`badge ${CHANCE_BADGE[m.chance]}`}>
                          {CHANCE_META[m.chance].label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-800">
                        {m.shortName ?? m.collegeName}
                      </p>
                      <p className="truncate text-xs text-slate-500">{m.branchName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {m.state} · {inr(m.annualFee)}/yr
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
