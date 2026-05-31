import type { Chance } from "@/lib/domain";

// Static Tailwind class strings (kept whole so the JIT compiler keeps them).
export const CHANCE_BADGE: Record<Chance, string> = {
  SAFE: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  TARGET: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  REACH: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  AMBITIOUS: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

export const CHANCE_BAR: Record<Chance, string> = {
  SAFE: "bg-emerald-500",
  TARGET: "bg-blue-500",
  REACH: "bg-amber-500",
  AMBITIOUS: "bg-rose-500",
};

export const TYPE_BADGE: Record<string, string> = {
  IIT: "bg-indigo-100 text-indigo-700",
  NIT: "bg-violet-100 text-violet-700",
  IIIT: "bg-purple-100 text-purple-700",
  GFTI: "bg-sky-100 text-sky-700",
  AIIMS: "bg-rose-100 text-rose-700",
  NLU: "bg-amber-100 text-amber-700",
  IIM: "bg-emerald-100 text-emerald-700",
  GOVT: "bg-teal-100 text-teal-700",
  PRIVATE: "bg-slate-100 text-slate-700",
  DEEMED: "bg-cyan-100 text-cyan-700",
};

export function typeBadge(t: string): string {
  return TYPE_BADGE[t] ?? "bg-slate-100 text-slate-700";
}
