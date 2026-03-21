import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

/** Track used reset tokens to prevent reuse (auto-cleaned after 15min) */
const usedResetTokens = new Set<string>();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(coachId: string): Promise<string> {
  const token = await new SignJWT({ coachId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<{ coachId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { coachId: payload.coachId as string };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<{ coachId: string }> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireHeadCoach(): Promise<{ coachId: string }> {
  const session = await requireAuth();
  const coach = await prisma.coach.findUnique({
    where: { id: session.coachId },
    select: { role: true },
  });
  if (!coach || coach.role !== "HEAD") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function createResetToken(coachId: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ coachId, purpose: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function verifyResetToken(token: string): Promise<{ coachId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "password-reset") return null;
    // Reject already-used tokens
    if (payload.jti && usedResetTokens.has(payload.jti)) return null;
    return { coachId: payload.coachId as string };
  } catch {
    return null;
  }
}

/** Mark a reset token as used so it cannot be reused */
export function invalidateResetToken(token: string): void {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (payload.jti) {
      usedResetTokens.add(payload.jti);
      // Auto-cleanup after 15 minutes (token's max lifetime)
      setTimeout(() => usedResetTokens.delete(payload.jti), 15 * 60 * 1000).unref?.();
    }
  } catch {
    // Ignore parse errors
  }
}
