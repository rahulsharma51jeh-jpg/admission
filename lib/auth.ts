/**
 * Auth utilities — stateless JWT in an httpOnly cookie.
 * Horizontally scalable (no server-side session store required).
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@/lib/domain";

const COOKIE_NAME = "infinity_token";

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return s;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: SessionUser): string {
  const options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ||
      "7d") as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign({ ...user }, secret(), options);
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, secret()) as jwt.JwtPayload & SessionUser;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/** Set the auth cookie (call from a route handler / server action). */
export function setAuthCookie(token: string): void {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie(): void {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Read & verify the current session (server-side). Returns null if absent. */
export function getSession(): SessionUser | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Throws-style guard for admin-only endpoints. */
export function requireRole(
  user: SessionUser | null,
  roles: Role[]
): SessionUser {
  if (!user || !roles.includes(user.role)) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = user ? 403 : 401;
    throw err;
  }
  return user;
}
