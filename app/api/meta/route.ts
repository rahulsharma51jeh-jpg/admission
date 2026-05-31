import { prisma } from "@/lib/db";
import { ok, handleError } from "@/lib/http";
import {
  EXAM_META,
  EXAMS,
  STREAM_META,
  STREAMS,
  CATEGORIES,
  GENDERS,
  INDIAN_STATES,
} from "@/lib/domain";

export const revalidate = 3600; // catalogue changes rarely

// Public catalogue used to drive forms & filters.
export async function GET() {
  try {
    const collegeCount = await prisma.college.count();

    return ok({
      collegeCount,
      exams: EXAMS.map((e) => ({ key: e, ...EXAM_META[e] })),
      streams: STREAMS.map((s) => ({ key: s, ...STREAM_META[s] })),
      categories: CATEGORIES,
      genders: GENDERS,
      states: INDIAN_STATES,
    });
  } catch (e) {
    return handleError(e);
  }
}
