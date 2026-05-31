/**
 * Seed script — Infinity Admission
 * --------------------------------
 * Produces 25,000+ colleges spanning Engineering, Medical, Law, Management,
 * Science, Commerce, Arts, Pharmacy & Architecture, with one GENERAL cutoff per
 * course. Reserved-category thresholds are derived by the engine at query time.
 *
 * Composition:
 *   1. ~35 hand-curated marquee institutes (IITs, AIIMS, NLUs, IIMs, DU…) with
 *      realistic, indicative cutoffs.
 *   2. A deterministic (seeded PRNG) synthetic generator that fills up to
 *      SEED_COLLEGES total, distributed across streams / states / tiers.
 *
 * Performance: all rows are inserted via chunked `createMany`, with IDs minted
 * in code so relations link without per-row round-trips.
 *
 * Config: set SEED_COLLEGES env var (default 25000) to change the target size.
 *
 * NOTE: synthetic numbers are indicative for demo purposes. Wire a real cutoff
 * feed (NTA / JoSAA / MCC / CLAT Consortium / KEA / WBJEEB) before production.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  EXAM_META,
  STREAM_META,
  Exam,
  Stream,
} from "../lib/domain";

const prisma = new PrismaClient();

const TARGET = parseInt(process.env.SEED_COLLEGES || "25000", 10);
const YEAR = 2024;
const CHUNK = 500; // rows per createMany (safe for SQLite var limits)

// ───────────────────────── deterministic PRNG ─────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20240601);
const rand = () => rng();
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const jitter = (lo = 0.8, hi = 1.25) => lo + rand() * (hi - lo);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ───────────────────────── geography ─────────────────────────
const STATE_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Haryana: ["Gurugram", "Faridabad", "Hisar", "Sonipat"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Solan"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Telangana: ["Hyderabad", "Warangal", "Karimnagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Varanasi", "Prayagraj"],
  Uttarakhand: ["Dehradun", "Haridwar", "Roorkee", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
};
const STATES = Object.keys(STATE_CITIES);

// ───────────────────────── name building ─────────────────────────
const NAME_PREFIXES = [
  "Sri", "Sant", "Swami", "Maharaja", "Rajiv Gandhi", "Indira Gandhi",
  "Dr. B.R. Ambedkar", "Vivekananda", "Tagore", "Subhas Chandra", "Sardar Patel",
  "Lal Bahadur Shastri", "Acharya", "Guru Nanak", "Saraswati", "Gokhale",
  "Bhagat Singh", "National", "Global", "Modern", "Royal", "Sterling",
  "Trinity", "Pinnacle", "Apex", "Crescent", "Heritage", "Galaxy", "Horizon",
  "Pioneer", "Imperial", "Sunrise", "Greenfield", "Silver Oak", "Amity",
];

const STREAM_SUFFIX: Record<Stream, string[]> = {
  ENGINEERING: [
    "Institute of Technology",
    "College of Engineering",
    "Institute of Engineering & Technology",
    "School of Engineering",
  ],
  MEDICAL: [
    "Medical College",
    "Institute of Medical Sciences",
    "Medical College & Hospital",
    "College of Medical Sciences",
  ],
  LAW: ["School of Law", "College of Law", "Law School", "Faculty of Law"],
  MANAGEMENT: [
    "School of Management",
    "Business School",
    "Institute of Management",
    "School of Business",
  ],
  SCIENCE: ["College of Science", "Institute of Science", "Science College"],
  COMMERCE: ["College of Commerce", "Institute of Commerce & Economics"],
  ARTS: ["College of Arts", "Institute of Humanities", "Arts & Science College"],
  PHARMACY: ["College of Pharmacy", "Institute of Pharmaceutical Sciences"],
  ARCHITECTURE: ["School of Architecture", "School of Planning & Architecture"],
};

// course catalog per stream: [name, feeBase(annual INR)]
const STREAM_COURSES: Record<Stream, [string, number][]> = {
  ENGINEERING: [
    ["Computer Science & Engineering", 160000],
    ["Information Technology", 150000],
    ["Electronics & Communication", 140000],
    ["Electrical Engineering", 130000],
    ["Mechanical Engineering", 125000],
    ["Civil Engineering", 120000],
    ["AI & Data Science", 170000],
  ],
  MEDICAL: [
    ["MBBS", 900000],
    ["BDS", 450000],
    ["BAMS (Ayurveda)", 300000],
    ["BHMS (Homeopathy)", 250000],
    ["B.Sc Nursing", 150000],
  ],
  LAW: [
    ["BA LLB (Hons)", 180000],
    ["BBA LLB (Hons)", 190000],
    ["LLB", 120000],
    ["B.Com LLB", 175000],
  ],
  MANAGEMENT: [
    ["MBA", 900000],
    ["PGDM", 700000],
    ["BBA", 220000],
    ["BMS", 200000],
    ["MBA Finance", 950000],
  ],
  SCIENCE: [
    ["B.Sc Computer Science", 60000],
    ["B.Sc Physics (Hons)", 45000],
    ["B.Sc Chemistry (Hons)", 45000],
    ["B.Sc Mathematics (Hons)", 45000],
    ["B.Sc Biotechnology", 70000],
  ],
  COMMERCE: [
    ["B.Com (Hons)", 55000],
    ["B.Com", 40000],
    ["BBA Finance", 120000],
    ["B.Com Accounting & Finance", 90000],
  ],
  ARTS: [
    ["BA Economics (Hons)", 50000],
    ["BA English (Hons)", 40000],
    ["BA Psychology", 60000],
    ["BA Political Science", 40000],
    ["BA Sociology", 38000],
  ],
  PHARMACY: [
    ["B.Pharm", 120000],
    ["D.Pharm", 80000],
    ["Pharm.D", 180000],
  ],
  ARCHITECTURE: [
    ["B.Arch", 180000],
    ["B.Planning", 150000],
  ],
};

// stream selection weights (sum need not be 1; normalised below)
const STREAM_WEIGHTS: Record<Stream, number> = {
  ENGINEERING: 28,
  MANAGEMENT: 14,
  SCIENCE: 12,
  COMMERCE: 11,
  ARTS: 10,
  MEDICAL: 8,
  PHARMACY: 7,
  LAW: 6,
  ARCHITECTURE: 4,
};
const STREAM_KEYS = Object.keys(STREAM_WEIGHTS) as Stream[];
const WEIGHT_TOTAL = STREAM_KEYS.reduce((s, k) => s + STREAM_WEIGHTS[k], 0);
function pickStream(): Stream {
  let r = rand() * WEIGHT_TOTAL;
  for (const k of STREAM_KEYS) {
    r -= STREAM_WEIGHTS[k];
    if (r <= 0) return k;
  }
  return "ENGINEERING";
}

// tier (1 best … 5 weakest) with realistic skew toward mid/low tiers
function pickTier(): number {
  const r = rand();
  if (r < 0.02) return 1;
  if (r < 0.1) return 2;
  if (r < 0.3) return 3;
  if (r < 0.65) return 4;
  return 5;
}
const TIER_RANK_FACTOR: Record<number, number> = {
  1: 0.04,
  2: 0.15,
  3: 0.5,
  4: 1.5,
  5: 4.0,
};
const TIER_SCORE_ADJ: Record<number, number> = {
  1: 1,
  2: 0.92,
  3: 0.82,
  4: 0.72,
  5: 0.62,
};

function examForStreamState(stream: Stream, state: string): Exam {
  if (stream === "ENGINEERING") {
    if (state === "Karnataka") return rand() < 0.6 ? "COMEDK" : "JEE_MAIN";
    if (state === "West Bengal") return rand() < 0.6 ? "WBJEE" : "JEE_MAIN";
    return "JEE_MAIN";
  }
  if (stream === "MEDICAL") return "NEET";
  if (stream === "LAW") return rand() < 0.8 ? "CLAT" : "CUET";
  if (stream === "MANAGEMENT") return rand() < 0.6 ? "CAT" : "CUET";
  if (stream === "PHARMACY") return rand() < 0.5 ? "NEET" : "CUET";
  if (stream === "ARCHITECTURE") return "JEE_MAIN";
  return "CUET"; // SCIENCE, COMMERCE, ARTS
}

// mid-tier (tier3) base closing rank for the flagship course
const BASE_RANK: Partial<Record<Exam, number>> = {
  JEE_MAIN: 70000,
  COMEDK: 25000,
  WBJEE: 30000,
  NEET: 130000,
  CLAT: 9000,
};
// mid-tier base closing score / percentile for the flagship course
const BASE_SCORE: Partial<Record<Exam, number>> = {
  CUET: 560,
  CAT: 82,
};

function quotaForExam(exam: Exam, _state: string): string {
  if (exam === "COMEDK" || exam === "WBJEE") return "HOME_STATE";
  return "ALL_INDIA";
}

// ───────────────────────── accumulators ─────────────────────────
type CollegeRow = {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  type: string;
  stream: string;
  city: string;
  state: string;
  nirfRank: number | null;
  establishedYr: number | null;
  website: string | null;
  description: string | null;
  hostel: boolean;
  feesMin: number;
  feesMax: number;
};
type BranchRow = {
  id: string;
  collegeId: string;
  name: string;
  degree: string;
  durationY: number;
  annualFee: number;
  seats: number;
};
type CutoffRow = {
  id: string;
  collegeId: string;
  branchId: string;
  exam: string;
  year: number;
  category: string;
  quota: string;
  gender: string;
  openingRank: number;
  closingRank: number;
};

const colleges: CollegeRow[] = [];
const branches: BranchRow[] = [];
const cutoffs: CutoffRow[] = [];

let cIdx = 0;
let bIdx = 0;
let kIdx = 0;
const usedSlugs = new Set<string>();

function uniqueSlug(base: string): string {
  let s = slugify(base);
  if (!usedSlugs.has(s)) {
    usedSlugs.add(s);
    return s;
  }
  let n = 2;
  while (usedSlugs.has(`${s}-${n}`)) n++;
  const out = `${s}-${n}`;
  usedSlugs.add(out);
  return out;
}

function degreeFor(courseName: string): string {
  if (/MBA|PGDM/.test(courseName)) return "PG";
  if (/Integrated|Pharm\.D/.test(courseName)) return "INTEGRATED";
  return "UG";
}
function durationFor(courseName: string): number {
  if (courseName === "MBBS") return 5;
  if (/LLB \(Hons\)|BA LLB|BBA LLB|B\.Com LLB/.test(courseName)) return 5;
  if (courseName === "B.Arch") return 5;
  if (courseName === "Pharm.D") return 6;
  if (/MBA|PGDM|D\.Pharm/.test(courseName)) return 2;
  if (/B\.Tech|Engineering|B\.Pharm/.test(courseName)) return 4;
  return 3;
}

function addCollege(c: CollegeRow) {
  colleges.push(c);
}
function makeCutoff(
  exam: Exam,
  closing: number,
  collegeId: string,
  branchId: string,
  quota: string
): CutoffRow {
  const isScore = EXAM_META[exam].metric === "score";
  let opening: number;
  if (isScore) {
    opening = Math.min(EXAM_META[exam].max, Math.round(closing + (exam === "CAT" ? 1.5 : 40)));
  } else {
    opening = Math.max(1, Math.round(closing * 0.35));
  }
  return {
    id: `cut_${kIdx++}`,
    collegeId,
    branchId,
    exam,
    year: YEAR,
    category: "GENERAL",
    quota,
    gender: "ALL",
    openingRank: opening,
    closingRank: closing,
  };
}

// ───────────────────────── curated marquee colleges ─────────────────────────
type CuratedCourse = { name: string; closing: number; fee: number };
type Curated = {
  name: string;
  shortName: string;
  type: string;
  stream: Stream;
  city: string;
  state: string;
  nirf?: number;
  est?: number;
  website?: string;
  exam: Exam;
  courses: CuratedCourse[];
};

const CURATED: Curated[] = [
  // Engineering — IITs (JEE Advanced)
  { name: "Indian Institute of Technology Madras", shortName: "IIT Madras", type: "IIT", stream: "ENGINEERING", city: "Chennai", state: "Tamil Nadu", nirf: 1, est: 1959, website: "https://www.iitm.ac.in", exam: "JEE_ADVANCED", courses: [{ name: "Computer Science & Engineering", closing: 165, fee: 210000 }, { name: "Electrical Engineering", closing: 720, fee: 210000 }, { name: "Mechanical Engineering", closing: 2600, fee: 210000 }] },
  { name: "Indian Institute of Technology Delhi", shortName: "IIT Delhi", type: "IIT", stream: "ENGINEERING", city: "New Delhi", state: "Delhi", nirf: 2, est: 1961, website: "https://www.iitd.ac.in", exam: "JEE_ADVANCED", courses: [{ name: "Computer Science & Engineering", closing: 110, fee: 220000 }, { name: "Electrical Engineering", closing: 620, fee: 220000 }, { name: "Mechanical Engineering", closing: 2100, fee: 220000 }] },
  { name: "Indian Institute of Technology Bombay", shortName: "IIT Bombay", type: "IIT", stream: "ENGINEERING", city: "Mumbai", state: "Maharashtra", nirf: 3, est: 1958, website: "https://www.iitb.ac.in", exam: "JEE_ADVANCED", courses: [{ name: "Computer Science & Engineering", closing: 67, fee: 230000 }, { name: "Electrical Engineering", closing: 430, fee: 230000 }, { name: "Mechanical Engineering", closing: 1750, fee: 230000 }] },
  { name: "Indian Institute of Technology Kanpur", shortName: "IIT Kanpur", type: "IIT", stream: "ENGINEERING", city: "Kanpur", state: "Uttar Pradesh", nirf: 4, est: 1959, website: "https://www.iitk.ac.in", exam: "JEE_ADVANCED", courses: [{ name: "Computer Science & Engineering", closing: 240, fee: 215000 }, { name: "Electrical Engineering", closing: 980, fee: 215000 }] },
  { name: "Indian Institute of Technology Kharagpur", shortName: "IIT Kharagpur", type: "IIT", stream: "ENGINEERING", city: "Kharagpur", state: "West Bengal", nirf: 5, est: 1951, website: "https://www.iitkgp.ac.in", exam: "JEE_ADVANCED", courses: [{ name: "Computer Science & Engineering", closing: 310, fee: 212000 }, { name: "Electronics & Communication", closing: 1250, fee: 212000 }] },
  { name: "Indian Institute of Technology Roorkee", shortName: "IIT Roorkee", type: "IIT", stream: "ENGINEERING", city: "Roorkee", state: "Uttarakhand", nirf: 6, est: 1847, website: "https://www.iitr.ac.in", exam: "JEE_ADVANCED", courses: [{ name: "Computer Science & Engineering", closing: 410, fee: 211000 }, { name: "Electronics & Communication", closing: 1600, fee: 211000 }] },
  // Engineering — NITs / GFTI (JEE Main)
  { name: "National Institute of Technology Tiruchirappalli", shortName: "NIT Trichy", type: "NIT", stream: "ENGINEERING", city: "Tiruchirappalli", state: "Tamil Nadu", nirf: 9, est: 1964, website: "https://www.nitt.edu", exam: "JEE_MAIN", courses: [{ name: "Computer Science & Engineering", closing: 2400, fee: 162500 }, { name: "Electronics & Communication", closing: 6200, fee: 162500 }, { name: "Mechanical Engineering", closing: 18500, fee: 162500 }] },
  { name: "National Institute of Technology Karnataka, Surathkal", shortName: "NIT Surathkal", type: "NIT", stream: "ENGINEERING", city: "Mangaluru", state: "Karnataka", nirf: 12, est: 1960, website: "https://www.nitk.ac.in", exam: "JEE_MAIN", courses: [{ name: "Computer Science & Engineering", closing: 3500, fee: 158000 }, { name: "Information Technology", closing: 6000, fee: 158000 }] },
  { name: "National Institute of Technology Warangal", shortName: "NIT Warangal", type: "NIT", stream: "ENGINEERING", city: "Warangal", state: "Telangana", nirf: 21, est: 1959, website: "https://www.nitw.ac.in", exam: "JEE_MAIN", courses: [{ name: "Computer Science & Engineering", closing: 3000, fee: 155000 }, { name: "Electronics & Communication", closing: 7800, fee: 155000 }] },
  { name: "Delhi Technological University", shortName: "DTU", type: "GFTI", stream: "ENGINEERING", city: "New Delhi", state: "Delhi", nirf: 35, est: 1941, website: "https://www.dtu.ac.in", exam: "JEE_MAIN", courses: [{ name: "Computer Science & Engineering", closing: 6000, fee: 200000 }, { name: "Information Technology", closing: 8200, fee: 200000 }] },
  // Engineering — COMEDK / WBJEE
  { name: "R.V. College of Engineering", shortName: "RVCE", type: "PRIVATE", stream: "ENGINEERING", city: "Bengaluru", state: "Karnataka", nirf: 99, est: 1963, website: "https://www.rvce.edu.in", exam: "COMEDK", courses: [{ name: "Computer Science & Engineering", closing: 1500, fee: 290000 }, { name: "Electronics & Communication", closing: 4800, fee: 280000 }] },
  { name: "Jadavpur University", shortName: "JU", type: "GOVT", stream: "ENGINEERING", city: "Kolkata", state: "West Bengal", nirf: 12, est: 1955, website: "https://www.jaduniv.edu.in", exam: "WBJEE", courses: [{ name: "Computer Science & Engineering", closing: 110, fee: 9600 }, { name: "Electronics & Telecommunication", closing: 420, fee: 9600 }] },
  // Medical (NEET)
  { name: "All India Institute of Medical Sciences, Delhi", shortName: "AIIMS Delhi", type: "AIIMS", stream: "MEDICAL", city: "New Delhi", state: "Delhi", nirf: 1, est: 1956, website: "https://www.aiims.edu", exam: "NEET", courses: [{ name: "MBBS", closing: 55, fee: 8000 }, { name: "B.Sc Nursing", closing: 4500, fee: 6000 }] },
  { name: "Maulana Azad Medical College", shortName: "MAMC", type: "GOVT", stream: "MEDICAL", city: "New Delhi", state: "Delhi", nirf: 8, est: 1958, website: "https://mamc.ac.in", exam: "NEET", courses: [{ name: "MBBS", closing: 120, fee: 30000 }] },
  { name: "Jawaharlal Institute of Postgraduate Medical Education & Research", shortName: "JIPMER", type: "GOVT", stream: "MEDICAL", city: "Puducherry", state: "Tamil Nadu", nirf: 6, est: 1956, website: "https://jipmer.edu.in", exam: "NEET", courses: [{ name: "MBBS", closing: 200, fee: 25000 }] },
  { name: "Christian Medical College", shortName: "CMC Vellore", type: "DEEMED", stream: "MEDICAL", city: "Chennai", state: "Tamil Nadu", nirf: 3, est: 1900, website: "https://www.cmch-vellore.edu", exam: "NEET", courses: [{ name: "MBBS", closing: 1300, fee: 60000 }, { name: "BDS", closing: 9000, fee: 80000 }] },
  { name: "King George's Medical University", shortName: "KGMU", type: "GOVT", stream: "MEDICAL", city: "Lucknow", state: "Uttar Pradesh", nirf: 11, est: 1905, website: "https://www.kgmu.org", exam: "NEET", courses: [{ name: "MBBS", closing: 1800, fee: 54000 }] },
  { name: "Armed Forces Medical College", shortName: "AFMC", type: "GOVT", stream: "MEDICAL", city: "Pune", state: "Maharashtra", nirf: 9, est: 1948, website: "https://afmc.nic.in", exam: "NEET", courses: [{ name: "MBBS", closing: 700, fee: 65000 }] },
  // Law (CLAT)
  { name: "National Law School of India University", shortName: "NLSIU", type: "NLU", stream: "LAW", city: "Bengaluru", state: "Karnataka", nirf: 1, est: 1987, website: "https://www.nls.ac.in", exam: "CLAT", courses: [{ name: "BA LLB (Hons)", closing: 60, fee: 300000 }] },
  { name: "NALSAR University of Law", shortName: "NALSAR", type: "NLU", stream: "LAW", city: "Hyderabad", state: "Telangana", nirf: 3, est: 1998, website: "https://www.nalsar.ac.in", exam: "CLAT", courses: [{ name: "BA LLB (Hons)", closing: 120, fee: 270000 }] },
  { name: "The West Bengal National University of Juridical Sciences", shortName: "WBNUJS", type: "NLU", stream: "LAW", city: "Kolkata", state: "West Bengal", nirf: 5, est: 1999, website: "https://www.nujs.edu", exam: "CLAT", courses: [{ name: "BA LLB (Hons)", closing: 200, fee: 240000 }] },
  { name: "National Law University Jodhpur", shortName: "NLU Jodhpur", type: "NLU", stream: "LAW", city: "Jodhpur", state: "Rajasthan", nirf: 8, est: 1999, website: "https://www.nlujodhpur.ac.in", exam: "CLAT", courses: [{ name: "BA LLB (Hons)", closing: 350, fee: 230000 }, { name: "BBA LLB (Hons)", closing: 600, fee: 235000 }] },
  // Management (CAT — percentile)
  { name: "Indian Institute of Management Ahmedabad", shortName: "IIM Ahmedabad", type: "IIM", stream: "MANAGEMENT", city: "Ahmedabad", state: "Gujarat", nirf: 1, est: 1961, website: "https://www.iima.ac.in", exam: "CAT", courses: [{ name: "MBA", closing: 99, fee: 1300000 }] },
  { name: "Indian Institute of Management Bangalore", shortName: "IIM Bangalore", type: "IIM", stream: "MANAGEMENT", city: "Bengaluru", state: "Karnataka", nirf: 2, est: 1973, website: "https://www.iimb.ac.in", exam: "CAT", courses: [{ name: "MBA", closing: 98.8, fee: 2450000 }] },
  { name: "Indian Institute of Management Calcutta", shortName: "IIM Calcutta", type: "IIM", stream: "MANAGEMENT", city: "Kolkata", state: "West Bengal", nirf: 3, est: 1961, website: "https://www.iimcal.ac.in", exam: "CAT", courses: [{ name: "MBA", closing: 98.5, fee: 2700000 }] },
  { name: "Faculty of Management Studies, University of Delhi", shortName: "FMS Delhi", type: "GOVT", stream: "MANAGEMENT", city: "New Delhi", state: "Delhi", nirf: 11, est: 1954, website: "https://www.fms.edu", exam: "CAT", courses: [{ name: "MBA", closing: 98.4, fee: 25000 }] },
  // Science / Commerce / Arts (CUET — score/800)
  { name: "Hindu College, University of Delhi", shortName: "Hindu College", type: "GOVT", stream: "SCIENCE", city: "New Delhi", state: "Delhi", nirf: 2, est: 1899, website: "https://www.hinducollege.ac.in", exam: "CUET", courses: [{ name: "B.Sc Computer Science", closing: 730, fee: 35000 }, { name: "B.Com (Hons)", closing: 720, fee: 30000 }, { name: "BA Economics (Hons)", closing: 745, fee: 32000 }] },
  { name: "Miranda House, University of Delhi", shortName: "Miranda House", type: "GOVT", stream: "SCIENCE", city: "New Delhi", state: "Delhi", nirf: 1, est: 1948, website: "https://www.mirandahouse.ac.in", exam: "CUET", courses: [{ name: "B.Sc Physics (Hons)", closing: 700, fee: 28000 }, { name: "BA English (Hons)", closing: 715, fee: 24000 }] },
  { name: "St. Stephen's College, University of Delhi", shortName: "St. Stephen's", type: "GOVT", stream: "ARTS", city: "New Delhi", state: "Delhi", nirf: 4, est: 1881, website: "https://www.ststephens.edu", exam: "CUET", courses: [{ name: "BA Economics (Hons)", closing: 740, fee: 45000 }, { name: "BA English (Hons)", closing: 735, fee: 42000 }] },
  { name: "Banaras Hindu University", shortName: "BHU", type: "GOVT", stream: "SCIENCE", city: "Varanasi", state: "Uttar Pradesh", nirf: 5, est: 1916, website: "https://www.bhu.ac.in", exam: "CUET", courses: [{ name: "B.Sc Computer Science", closing: 680, fee: 30000 }, { name: "B.Com (Hons)", closing: 660, fee: 25000 }] },
  // Pharmacy
  { name: "Jamia Hamdard", shortName: "Jamia Hamdard", type: "DEEMED", stream: "PHARMACY", city: "New Delhi", state: "Delhi", nirf: 2, est: 1989, website: "https://jamiahamdard.edu", exam: "CUET", courses: [{ name: "B.Pharm", closing: 640, fee: 160000 }, { name: "Pharm.D", closing: 600, fee: 200000 }] },
  // Architecture
  { name: "School of Planning and Architecture, Delhi", shortName: "SPA Delhi", type: "GFTI", stream: "ARCHITECTURE", city: "New Delhi", state: "Delhi", nirf: 1, est: 1941, website: "https://spa.ac.in", exam: "JEE_MAIN", courses: [{ name: "B.Arch", closing: 1200, fee: 70000 }, { name: "B.Planning", closing: 3500, fee: 65000 }] },
];

function buildCurated() {
  for (const c of CURATED) {
    const id = `clg_${cIdx++}`;
    const fees = c.courses.map((x) => x.fee);
    addCollege({
      id,
      name: c.name,
      slug: uniqueSlug(`${c.shortName}-${c.city}`),
      shortName: c.shortName,
      type: c.type,
      stream: c.stream,
      city: c.city,
      state: c.state,
      nirfRank: c.nirf ?? null,
      establishedYr: c.est ?? null,
      website: c.website ?? null,
      description: `${c.shortName} is a top ${STREAM_META[c.stream].label.toLowerCase()} institute in ${c.city}, ${c.state}. Admissions via ${EXAM_META[c.exam].label}.`,
      hostel: true,
      feesMin: Math.min(...fees),
      feesMax: Math.max(...fees),
    });
    const quota = quotaForExam(c.exam, c.state);
    for (const course of c.courses) {
      const bid = `brn_${bIdx++}`;
      branches.push({
        id: bid,
        collegeId: id,
        name: course.name,
        degree: degreeFor(course.name),
        durationY: durationFor(course.name),
        annualFee: course.fee,
        seats: randInt(40, 180),
      });
      cutoffs.push(makeCutoff(c.exam, course.closing, id, bid, quota));
    }
  }
}

// ───────────────────────── synthetic generator ─────────────────────────
function buildSynthetic(count: number) {
  for (let i = 0; i < count; i++) {
    const stream = pickStream();
    const state = pick(STATES);
    const city = pick(STATE_CITIES[state]);
    const tier = pickTier();
    const exam = examForStreamState(stream, state);
    const meta = EXAM_META[exam];
    const quota = quotaForExam(exam, state);

    const type =
      tier <= 2
        ? rand() < 0.5
          ? "GOVT"
          : "DEEMED"
        : rand() < 0.25
        ? "GOVT"
        : "PRIVATE";

    const prefix = pick(NAME_PREFIXES);
    const suffix = pick(STREAM_SUFFIX[stream]);
    const name = `${prefix} ${suffix}, ${city}`;
    const id = `clg_${cIdx++}`;

    // choose 2–5 courses (always include flagship index 0)
    const catalog = STREAM_COURSES[stream];
    const nCourses = Math.min(catalog.length, randInt(2, 5));
    const chosen = new Set<number>([0]);
    while (chosen.size < nCourses) chosen.add(randInt(0, catalog.length - 1));
    const courseIdx = Array.from(chosen).sort((a, b) => a - b);

    const courseFees: number[] = [];
    const branchIds: { bid: string; courseName: string; closing: number }[] = [];

    courseIdx.forEach((ci, order) => {
      const [courseName, feeBase] = catalog[ci];
      // fee: govt cheaper; jitter applied
      let fee = Math.round(feeBase * jitter(0.7, 1.3));
      if (type === "GOVT") fee = Math.round(fee * 0.4);
      fee = Math.max(8000, fee);
      courseFees.push(fee);

      // closing for flagship (order 0) lowest; subsequent courses easier
      let closing: number;
      if (meta.metric === "rank") {
        const base = (BASE_RANK[exam] ?? 50000) * TIER_RANK_FACTOR[tier];
        closing = Math.round(base * Math.pow(1.7, order) * jitter());
        closing = Math.max(1, Math.min(meta.max, closing));
      } else {
        const base = (BASE_SCORE[exam] ?? 550) * TIER_SCORE_ADJ[tier];
        const drop = order * (exam === "CAT" ? 3 : 22);
        closing = Math.round((base - drop) * jitter(0.95, 1.03));
        const floor = exam === "CAT" ? 40 : 200;
        closing = Math.max(floor, Math.min(meta.max - 1, closing));
      }

      const bid = `brn_${bIdx++}`;
      branches.push({
        id: bid,
        collegeId: id,
        name: courseName,
        degree: degreeFor(courseName),
        durationY: durationFor(courseName),
        annualFee: fee,
        seats: randInt(30, 240),
      });
      branchIds.push({ bid, courseName, closing });
    });

    addCollege({
      id,
      name,
      slug: uniqueSlug(`${prefix}-${suffix}-${city}`),
      shortName: null,
      type,
      stream,
      city,
      state,
      nirfRank: tier === 1 ? randInt(40, 200) : null,
      establishedYr: randInt(1960, 2018),
      website: null,
      description: `${name} is a ${type.toLowerCase()} ${STREAM_META[stream].label.toLowerCase()} institute in ${city}, ${state}. Admissions via ${meta.label}.`,
      hostel: rand() < 0.85,
      feesMin: Math.min(...courseFees),
      feesMax: Math.max(...courseFees),
    });

    for (const b of branchIds) {
      cutoffs.push(makeCutoff(exam, b.closing, id, b.bid, quota));
    }
  }
}

// ───────────────────────── insert helpers ─────────────────────────
async function insertChunked<T>(
  rows: T[],
  fn: (chunk: T[]) => Promise<unknown>,
  label: string
) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await fn(rows.slice(i, i + CHUNK));
    if (i % (CHUNK * 20) === 0) {
      process.stdout.write(`  …${label}: ${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
    }
  }
  process.stdout.write(`  ✓ ${label}: ${rows.length}            \n`);
}

async function main() {
  console.log(`🌱 Seeding Infinity Admission (target ${TARGET} colleges)…`);

  // Reset (dev-only).
  await prisma.cutoff.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.college.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  buildCurated();
  buildSynthetic(Math.max(0, TARGET - colleges.length));

  console.log(
    `🧮 Generated ${colleges.length} colleges, ${branches.length} courses, ${cutoffs.length} cutoffs. Inserting…`
  );

  await insertChunked(colleges, (chunk) => prisma.college.createMany({ data: chunk }), "colleges");
  await insertChunked(branches, (chunk) => prisma.branch.createMany({ data: chunk }), "courses");
  await insertChunked(cutoffs, (chunk) => prisma.cutoff.createMany({ data: chunk }), "cutoffs");

  // Demo accounts.
  const adminPass = await bcrypt.hash("Admin@12345", 10);
  const studentPass = await bcrypt.hash("Student@123", 10);
  await prisma.user.createMany({
    data: [
      { email: "admin@infinityadmission.com", passwordHash: adminPass, name: "Infinity Admin", role: "ADMIN", phone: "+910000000000" },
      { email: "student@example.com", passwordHash: studentPass, name: "Demo Student", role: "STUDENT", phone: "+919999999999" },
    ],
  });

  await prisma.lead.createMany({
    data: [
      { name: "Aarav Sharma", email: "aarav@example.com", phone: "+919812345678", exam: "JEE_MAIN", rank: 14500, budgetMax: 200000, message: "Need guidance on NIT vs IIIT choices.", status: "NEW" },
      { name: "Priya Verma", email: "priya@example.com", phone: "+919823456789", exam: "NEET", rank: 42000, budgetMax: 800000, message: "Looking for MBBS options within budget.", status: "CONTACTED" },
      { name: "Rohan Gupta", email: "rohan@example.com", phone: "+919834567890", exam: "CLAT", rank: 2200, budgetMax: 300000, message: "Interested in NLUs.", status: "IN_PROGRESS" },
    ],
  });

  console.log(
    `✅ Done. ${colleges.length} colleges, ${branches.length} courses, ${cutoffs.length} cutoffs, 2 users, 3 leads.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
