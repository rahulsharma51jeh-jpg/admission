/**
 * Zod request validators. The single boundary where untrusted input becomes
 * typed, safe domain data.
 */
import { z } from "zod";
import {
  CATEGORIES,
  EXAMS,
  GENDERS,
  LEAD_STATUSES,
  STREAMS,
} from "@/lib/domain";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
  phone: z.string().min(8).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const predictSchema = z
  .object({
    exam: z.enum(EXAMS),
    rank: z.number().int().positive().max(2_000_000).optional(),
    score: z.number().min(0).max(800).optional(),
    category: z.enum(CATEGORIES).default("GENERAL"),
    gender: z.enum(GENDERS).default("ALL"),
    homeState: z.string().max(60).optional(),
    budgetMax: z.number().int().nonnegative().max(10_000_000).optional(),
    preferredStates: z.array(z.string().max(60)).max(10).optional(),
    twelfthPct: z.number().min(0).max(100).optional(),
    save: z.boolean().optional(),
  })
  .refine((d) => d.rank != null || d.score != null, {
    message: "Provide a rank (JEE/COMEDK/WBJEE) or a score (CUET).",
    path: ["rank"],
  });

export const leadSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  exam: z.enum(EXAMS).optional(),
  rank: z.number().int().positive().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  message: z.string().max(1000).optional(),
  source: z.string().max(40).optional(),
});

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
});

export const collegeQuerySchema = z.object({
  q: z.string().max(80).optional(),
  state: z.string().max(60).optional(),
  type: z.string().max(20).optional(),
  stream: z.enum(STREAMS).optional(),
  exam: z.enum(EXAMS).optional(),
  sort: z.enum(["nirf", "feesAsc", "feesDesc", "name"]).default("nirf"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PredictRequest = z.infer<typeof predictSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
