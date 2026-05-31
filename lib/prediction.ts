/**
 * Infinity Admission — Prediction & Counselling Engine
 * ----------------------------------------------------
 * Given a candidate's exam performance and preferences, rank colleges/branches
 * by realistic admission probability.
 *
 * Scale strategy:
 *  - Cutoffs are stored ONCE per branch (GENERAL). Reserved-category thresholds
 *    are derived on the fly via CATEGORY_*_MULT — no row explosion at 25k+ colleges.
 *  - A numeric "band" pre-filter runs in the DB (indexed on [exam, closingRank])
 *    so we only score the relevant slice of cutoffs, then cap the response.
 *
 * Model:
 *  - `scoreCutoff` is a PURE function (no I/O) — deterministic & unit-testable.
 *  - Logistic curve over the rank/score margin. Isolated behind this interface
 *    so a trained ML model can later replace it without touching API/UI.
 */
import { prisma } from "@/lib/db";
import {
  Chance,
  Category,
  Exam,
  Gender,
  EXAM_META,
  CATEGORY_RANK_MULT,
  CATEGORY_SCORE_MULT,
} from "@/lib/domain";

export interface PredictionInput {
  exam: Exam;
  rank?: number; // rank-based exams (lower is better)
  score?: number; // score-based exams (CUET 0-800, CAT percentile 0-100)
  category: Category;
  gender?: Gender;
  homeState?: string;
  budgetMax?: number;
  preferredStates?: string[];
  twelfthPct?: number;
}

export interface CollegeMatch {
  collegeId: string;
  collegeName: string;
  shortName: string | null;
  slug: string;
  city: string;
  state: string;
  type: string;
  stream: string;
  nirfRank: number | null;
  hostel: boolean;
  branchId: string;
  branchName: string;
  annualFee: number;
  exam: string;
  category: string;
  quota: string;
  year: number;
  /** Category-adjusted closing threshold used for this prediction. */
  effectiveClosing: number;
  generalClosing: number;
  probability: number; // 0–100
  chance: Chance;
  fitScore: number; // 0–100 composite ordering score
  withinBudget: boolean;
  locationMatch: boolean;
  eligibilityWarning: string | null;
}

export interface PredictionResult {
  generatedAt: string;
  input: PredictionInput;
  totalMatches: number;
  summary: { SAFE: number; TARGET: number; REACH: number; AMBITIOUS: number };
  matches: CollegeMatch[];
}

const RANK_K = 9;
const SCORE_K = 25;
const MAX_RESULTS = 80;
const MIN_PROB = 8; // hide near-impossible options
// Bucket quotas so the shortlist always spans ambitious → safe.
const REACH_CAP = 24; // AMBITIOUS + REACH
const TARGET_CAP = 28;
const SAFE_CAP = 28;

const MIN_12TH_BY_TYPE: Record<string, number> = {
  IIT: 75,
  NIT: 75,
  IIIT: 75,
  GFTI: 75,
  AIIMS: 60,
  NLU: 45,
  IIM: 50,
  GOVT: 50,
  PRIVATE: 45,
  DEEMED: 45,
};
const RELAXED_CATEGORIES: Category[] = ["SC", "ST", "OBC"];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function bucket(probability: number): Chance {
  if (probability >= 80) return "SAFE";
  if (probability >= 50) return "TARGET";
  if (probability >= 20) return "REACH";
  return "AMBITIOUS";
}

interface CutoffRow {
  exam: string;
  category: string;
  quota: string;
  gender: string;
  year: number;
  openingRank: number;
  closingRank: number;
  branch: {
    id: string;
    name: string;
    annualFee: number;
    college: {
      id: string;
      name: string;
      shortName: string | null;
      slug: string;
      city: string;
      state: string;
      type: string;
      stream: string;
      nirfRank: number | null;
      hostel: boolean;
    };
  };
}

/**
 * Pure scoring of one GENERAL cutoff row against the candidate input.
 * Applies the category multiplier to derive the effective closing threshold.
 */
export function scoreCutoff(
  input: PredictionInput,
  row: CutoffRow
): CollegeMatch | null {
  const meta = EXAM_META[input.exam];
  const generalClosing = row.closingRank;
  let probability: number;
  let effectiveClosing: number;

  if (meta.metric === "rank") {
    const rank = input.rank;
    if (!rank || rank <= 0) return null;
    effectiveClosing = Math.round(
      generalClosing * CATEGORY_RANK_MULT[input.category]
    );
    const ratio = rank / effectiveClosing; // < 1 → better than cutoff
    probability = 100 / (1 + Math.exp(RANK_K * (ratio - 1)));
  } else {
    const score = input.score;
    if (score == null || score <= 0) return null;
    effectiveClosing = Math.round(
      generalClosing * CATEGORY_SCORE_MULT[input.category]
    );
    const ratio = score / effectiveClosing; // > 1 → above cutoff
    probability = 100 / (1 + Math.exp(-SCORE_K * (ratio - 1)));
  }
  probability = clamp(Math.round(probability), 1, 99);

  const college = row.branch.college;
  const annualFee = row.branch.annualFee;

  const withinBudget = input.budgetMax == null || annualFee <= input.budgetMax;
  const budgetFit =
    input.budgetMax && input.budgetMax > 0
      ? clamp(1 - annualFee / input.budgetMax, 0, 1)
      : 0.5;

  const prefs = (input.preferredStates ?? []).map((s) => s.toLowerCase());
  const locationMatch =
    prefs.length > 0 && prefs.includes(college.state.toLowerCase());

  const nirfScore =
    college.nirfRank && college.nirfRank > 0
      ? clamp(1 - college.nirfRank / 200, 0, 1)
      : 0.3;

  let eligibilityWarning: string | null = null;
  if (input.twelfthPct != null) {
    let required = MIN_12TH_BY_TYPE[college.type] ?? 50;
    if (RELAXED_CATEGORIES.includes(input.category)) required -= 10;
    if (input.twelfthPct < required) {
      eligibilityWarning = `Requires ~${required}% in Class 12 (you entered ${input.twelfthPct}%).`;
    }
  }

  let fitScore =
    probability * 0.6 +
    nirfScore * 100 * 0.15 +
    budgetFit * 100 * 0.15 +
    (locationMatch ? 100 : 40) * 0.1;
  if (!withinBudget) fitScore *= 0.6;
  if (eligibilityWarning) fitScore *= 0.5;
  fitScore = clamp(Math.round(fitScore), 0, 100);

  return {
    collegeId: college.id,
    collegeName: college.name,
    shortName: college.shortName,
    slug: college.slug,
    city: college.city,
    state: college.state,
    type: college.type,
    stream: college.stream,
    nirfRank: college.nirfRank,
    hostel: college.hostel,
    branchId: row.branch.id,
    branchName: row.branch.name,
    annualFee,
    exam: row.exam,
    category: input.category,
    quota: row.quota,
    year: row.year,
    effectiveClosing,
    generalClosing,
    probability,
    chance: bucket(probability),
    fitScore,
    withinBudget,
    locationMatch,
    eligibilityWarning,
  };
}

/**
 * Compute the GENERAL-closing band to fetch from the DB so we only score the
 * relevant slice (keeps the predictor fast even with 25k+ colleges).
 */
function closingBand(input: PredictionInput): { gte: number; lte: number } {
  const meta = EXAM_META[input.exam];
  if (meta.metric === "rank") {
    const rank = input.rank ?? meta.max;
    const mult = CATEGORY_RANK_MULT[input.category];
    // effClosing = general*mult. Beyond ~3x rank the probability saturates near
    // 99%, so we cap there; below 0.2x it's effectively impossible.
    return {
      gte: Math.max(1, Math.floor((rank * 0.2) / mult)),
      lte: Math.ceil((rank * 3) / mult),
    };
  }
  const score = input.score ?? 0;
  const mult = CATEGORY_SCORE_MULT[input.category];
  // effClosing = general*mult; want effClosing ∈ [score*0.7, score*1.6].
  return {
    gte: Math.max(1, Math.floor((score * 0.7) / mult)),
    lte: Math.ceil((score * 1.6) / mult),
  };
}

export async function predict(
  input: PredictionInput
): Promise<PredictionResult> {
  const gender = input.gender ?? "ALL";
  const band = closingBand(input);
  const scoreMetric = EXAM_META[input.exam].metric === "score";

  const rows = (await prisma.cutoff.findMany({
    where: {
      exam: input.exam,
      category: "GENERAL",
      gender: { in: gender === "FEMALE" ? ["ALL", "FEMALE"] : ["ALL"] },
      closingRank: { gte: band.gte, lte: band.lte },
    },
    include: { branch: { include: { college: true } } },
    take: 6000, // hard safety cap on the candidate set (band keeps this small)
  })) as unknown as CutoffRow[];

  const scored: CollegeMatch[] = [];
  for (const row of rows) {
    const m = scoreCutoff(input, row);
    if (!m) continue;
    if (m.probability < MIN_PROB) continue; // too unlikely to be useful
    if (!m.withinBudget) continue; // budget is a hard filter when provided
    scored.push(m);
  }

  // "Selectivity": higher = more prestigious/harder. For rank exams a smaller
  // closing rank is better; for score exams a higher closing score is better.
  const selectivity = (m: CollegeMatch) =>
    scoreMetric ? m.generalClosing : -m.generalClosing;

  // Boost preferred-state and well-ranked colleges in tie-breaks.
  const bySelectivity = (a: CollegeMatch, b: CollegeMatch) => {
    const sa = selectivity(a) + (a.locationMatch ? 1e-6 : 0);
    const sb = selectivity(b) + (b.locationMatch ? 1e-6 : 0);
    if (sb !== sa) return sb - sa;
    if (b.probability !== a.probability) return b.probability - a.probability;
    return (a.nirfRank ?? 9999) - (b.nirfRank ?? 9999);
  };

  // Group into buckets so the shortlist always spans reach → safe, each bucket
  // ordered best-college-first.
  const reach = scored
    .filter((m) => m.chance === "REACH" || m.chance === "AMBITIOUS")
    .sort(bySelectivity);
  const target = scored.filter((m) => m.chance === "TARGET").sort(bySelectivity);
  const safe = scored.filter((m) => m.chance === "SAFE").sort(bySelectivity);

  const composed = [
    ...reach.slice(0, REACH_CAP),
    ...target.slice(0, TARGET_CAP),
    ...safe.slice(0, SAFE_CAP),
  ];

  // Backfill to MAX_RESULTS from whatever is left, preserving quality order.
  if (composed.length < MAX_RESULTS) {
    const used = new Set(composed.map((m) => m.branchId));
    const rest = scored
      .filter((m) => !used.has(m.branchId))
      .sort(bySelectivity)
      .slice(0, MAX_RESULTS - composed.length);
    composed.push(...rest);
  }

  // Final ordering: most selective (aspirational) first, safest last.
  composed.sort(bySelectivity);
  const capped = composed.slice(0, MAX_RESULTS);

  const summary = { SAFE: 0, TARGET: 0, REACH: 0, AMBITIOUS: 0 };
  for (const m of capped) summary[m.chance] += 1;

  return {
    generatedAt: new Date().toISOString(),
    input,
    totalMatches: capped.length,
    summary,
    matches: capped,
  };
}
