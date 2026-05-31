import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details: extra },
    { status }
  );
}

/** Normalises thrown errors (Zod, auth guards, unknown) into JSON responses. */
export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return fail("Validation failed", 422, e.flatten());
  }
  const err = e as Error & { status?: number };
  if (err?.status === 401) return fail("Authentication required", 401);
  if (err?.status === 403) return fail("Forbidden", 403);
  console.error("[api:error]", e);
  return fail("Something went wrong", 500);
}
