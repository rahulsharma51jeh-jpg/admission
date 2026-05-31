// Shared domain vocabulary. Single source of truth for enum-like values
// used by the DB layer, the prediction engine, the API validators, and the UI.

// ───────────────────────────── Exams ─────────────────────────────
export const EXAMS = [
  "JEE_MAIN",
  "JEE_ADVANCED",
  "CUET",
  "COMEDK",
  "WBJEE",
  "NEET",
  "CLAT",
  "CAT",
] as const;
export type Exam = (typeof EXAMS)[number];

export const EXAM_META: Record<
  Exam,
  {
    label: string;
    metric: "rank" | "score";
    max: number;
    unit: string;
    blurb: string;
  }
> = {
  JEE_MAIN: {
    label: "JEE Main",
    metric: "rank",
    max: 1_200_000,
    unit: "AIR (rank)",
    blurb: "NITs, IIITs, GFTIs & state engineering colleges",
  },
  JEE_ADVANCED: {
    label: "JEE Advanced",
    metric: "rank",
    max: 250_000,
    unit: "CRL (rank)",
    blurb: "All 23 IITs",
  },
  CUET: {
    label: "CUET",
    metric: "score",
    max: 800,
    unit: "score / 800",
    blurb: "Central & state universities (Science, Commerce, Arts)",
  },
  COMEDK: {
    label: "COMEDK UGET",
    metric: "rank",
    max: 200_000,
    unit: "rank",
    blurb: "Karnataka private engineering colleges",
  },
  WBJEE: {
    label: "WBJEE",
    metric: "rank",
    max: 150_000,
    unit: "rank",
    blurb: "West Bengal engineering colleges",
  },
  NEET: {
    label: "NEET UG",
    metric: "rank",
    max: 1_400_000,
    unit: "AIR (rank)",
    blurb: "MBBS, BDS & AYUSH medical colleges",
  },
  CLAT: {
    label: "CLAT",
    metric: "rank",
    max: 80_000,
    unit: "rank",
    blurb: "National Law Universities & top law schools",
  },
  CAT: {
    label: "CAT",
    metric: "score",
    max: 100,
    unit: "percentile",
    blurb: "IIMs & top B-schools (Management & Finance)",
  },
};

// ───────────────────────────── Streams ─────────────────────────────
export const STREAMS = [
  "ENGINEERING",
  "MEDICAL",
  "LAW",
  "MANAGEMENT",
  "SCIENCE",
  "COMMERCE",
  "ARTS",
  "PHARMACY",
  "ARCHITECTURE",
] as const;
export type Stream = (typeof STREAMS)[number];

export const STREAM_META: Record<
  Stream,
  { label: string; icon: string; exams: Exam[]; tagline: string }
> = {
  ENGINEERING: {
    label: "Engineering",
    icon: "⚙️",
    exams: ["JEE_MAIN", "JEE_ADVANCED", "COMEDK", "WBJEE"],
    tagline: "B.Tech / B.E. across IITs, NITs & private institutes",
  },
  MEDICAL: {
    label: "Medical",
    icon: "🩺",
    exams: ["NEET"],
    tagline: "MBBS, BDS, BAMS, Nursing & allied health",
  },
  LAW: {
    label: "Law",
    icon: "⚖️",
    exams: ["CLAT", "CUET"],
    tagline: "BA LLB, BBA LLB & integrated law programs",
  },
  MANAGEMENT: {
    label: "Management & Finance",
    icon: "📈",
    exams: ["CAT", "CUET"],
    tagline: "BBA, MBA, PGDM & finance programs",
  },
  SCIENCE: {
    label: "Science",
    icon: "🔬",
    exams: ["CUET"],
    tagline: "B.Sc & integrated science degrees",
  },
  COMMERCE: {
    label: "Commerce",
    icon: "🧾",
    exams: ["CUET"],
    tagline: "B.Com, B.Com (Hons) & accounting",
  },
  ARTS: {
    label: "Arts & Humanities",
    icon: "🎨",
    exams: ["CUET"],
    tagline: "BA programs across humanities",
  },
  PHARMACY: {
    label: "Pharmacy",
    icon: "💊",
    exams: ["NEET", "CUET"],
    tagline: "B.Pharm, D.Pharm & Pharm.D",
  },
  ARCHITECTURE: {
    label: "Architecture",
    icon: "🏛️",
    exams: ["JEE_MAIN"],
    tagline: "B.Arch & B.Planning",
  },
};

// ───────────────────────── Categories / quotas ─────────────────────────
export const CATEGORIES = ["GENERAL", "EWS", "OBC", "SC", "ST"] as const;
export type Category = (typeof CATEGORIES)[number];

export const QUOTAS = ["ALL_INDIA", "HOME_STATE", "OTHER_STATE"] as const;
export type Quota = (typeof QUOTAS)[number];

export const GENDERS = ["ALL", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];

// Cutoffs are stored once (GENERAL). The engine derives reserved-category
// thresholds with these multipliers, keeping the DB lean at 25k+ colleges.
//  - rank-based: reserved categories get LARGER (more relaxed) closing ranks.
//  - score-based: reserved categories get a LOWER score/percentile floor.
export const CATEGORY_RANK_MULT: Record<Category, number> = {
  GENERAL: 1,
  EWS: 1.25,
  OBC: 1.6,
  SC: 3.2,
  ST: 5.0,
};
export const CATEGORY_SCORE_MULT: Record<Category, number> = {
  GENERAL: 1,
  EWS: 0.96,
  OBC: 0.92,
  SC: 0.82,
  ST: 0.75,
};

// ───────────────────────── College / pipeline ─────────────────────────
export const COLLEGE_TYPES = [
  "IIT",
  "NIT",
  "IIIT",
  "GFTI",
  "AIIMS",
  "NLU",
  "IIM",
  "GOVT",
  "PRIVATE",
  "DEEMED",
] as const;
export type CollegeType = (typeof COLLEGE_TYPES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "IN_PROGRESS",
  "ENROLLED",
  "CLOSED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ROLES = ["STUDENT", "COUNSELLOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// ───────────────────────── Prediction buckets ─────────────────────────
export type Chance = "SAFE" | "TARGET" | "REACH" | "AMBITIOUS";

export const CHANCE_META: Record<
  Chance,
  { label: string; tone: string; description: string }
> = {
  SAFE: {
    label: "Safe",
    tone: "emerald",
    description:
      "Very high chance — your rank clears last year's cutoff comfortably.",
  },
  TARGET: {
    label: "Target",
    tone: "blue",
    description: "Good chance — your rank is right around the cutoff.",
  },
  REACH: {
    label: "Reach",
    tone: "amber",
    description: "Possible with cutoff movement or in later rounds.",
  },
  AMBITIOUS: {
    label: "Ambitious",
    tone: "rose",
    description: "Long shot — worth a try in spot rounds.",
  },
};

export function inr(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
