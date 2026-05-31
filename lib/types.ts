// Client-safe shapes mirroring the prediction engine output (no server imports).
import type { Chance } from "@/lib/domain";

export interface CollegeMatchDTO {
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
  effectiveClosing: number;
  generalClosing: number;
  probability: number;
  chance: Chance;
  fitScore: number;
  withinBudget: boolean;
  locationMatch: boolean;
  eligibilityWarning: string | null;
}

export interface PredictionResultDTO {
  generatedAt: string;
  totalMatches: number;
  summary: Record<Chance, number>;
  matches: CollegeMatchDTO[];
  predictionId: string | null;
  saved: boolean;
}
