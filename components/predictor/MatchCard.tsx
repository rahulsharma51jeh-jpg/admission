import Link from "next/link";
import type { CollegeMatchDTO } from "@/lib/types";
import { CHANCE_META, EXAM_META, inr, type Exam } from "@/lib/domain";
import { CHANCE_BADGE, CHANCE_BAR, typeBadge } from "@/lib/ui";

export default function MatchCard({ m }: { m: CollegeMatchDTO }) {
  const meta = EXAM_META[m.exam as Exam];
  const closingLabel =
    meta.metric === "rank"
      ? `Closing rank ~${m.effectiveClosing.toLocaleString("en-IN")}`
      : `Closing ${meta.label === "CAT" ? "%ile" : "score"} ~${m.effectiveClosing}`;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${typeBadge(m.type)}`}>{m.type}</span>
            {m.nirfRank ? (
              <span className="badge bg-slate-100 text-slate-600">NIRF #{m.nirfRank}</span>
            ) : null}
            {m.locationMatch ? (
              <span className="badge bg-indigo-100 text-indigo-700">📍 Preferred</span>
            ) : null}
          </div>
          <Link
            href={`/colleges/${m.slug}`}
            className="mt-1.5 block truncate font-bold text-slate-900 hover:text-indigo-600"
          >
            {m.shortName ?? m.collegeName}
          </Link>
          <p className="truncate text-sm text-slate-500">{m.branchName}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {m.city}, {m.state}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-2xl font-extrabold text-slate-900">{m.probability}%</div>
          <span className={`badge ${CHANCE_BADGE[m.chance]}`}>
            {CHANCE_META[m.chance].label}
          </span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${CHANCE_BAR[m.chance]}`}
          style={{ width: `${m.probability}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{closingLabel} ({m.year})</span>
        <span className="font-semibold text-slate-700">{inr(m.annualFee)}/yr</span>
        <span>{m.hostel ? "🏠 Hostel" : "No hostel"}</span>
      </div>

      {m.eligibilityWarning && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
          ⚠ {m.eligibilityWarning}
        </p>
      )}
    </div>
  );
}
