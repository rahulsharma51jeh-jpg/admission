import Link from "next/link";
import { inr, STREAM_META, type Stream } from "@/lib/domain";
import { typeBadge } from "@/lib/ui";

export interface CollegeCardData {
  slug: string;
  name: string;
  shortName: string | null;
  type: string;
  stream: string;
  city: string;
  state: string;
  nirfRank: number | null;
  feesMin: number;
  feesMax: number;
  hostel: boolean;
  _count?: { branches: number };
}

export default function CollegeCard({ c }: { c: CollegeCardData }) {
  return (
    <Link
      href={`/colleges/${c.slug}`}
      className="card group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`badge ${typeBadge(c.type)}`}>{c.type}</span>
        <span className="text-lg" title={STREAM_META[c.stream as Stream]?.label}>
          {STREAM_META[c.stream as Stream]?.icon}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 font-bold text-slate-900 group-hover:text-indigo-600">
        {c.shortName ?? c.name}
      </h3>
      <p className="text-sm text-slate-500">
        {c.city}, {c.state}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-slate-500">
        {c.nirfRank ? (
          <span className="font-semibold text-slate-700">NIRF #{c.nirfRank}</span>
        ) : null}
        <span>{c._count?.branches ?? 0} courses</span>
        <span className="font-semibold text-slate-700">
          {inr(c.feesMin)}–{inr(c.feesMax)}/yr
        </span>
      </div>
    </Link>
  );
}
