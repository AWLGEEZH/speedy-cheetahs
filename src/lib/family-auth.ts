import { SignJWT, jwtVerify } from "jose";
import { getSession } from "@/lib/auth";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createFamilyToken(familyId: string): Promise<string> {
  return new SignJWT({ familyId, purpose: "family-verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function verifyFamilyToken(
  token: string
): Promise<{ familyId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "family-verify") return null;
    return { familyId: payload.familyId as string };
  } catch {
    return null;
  }
}

/**
 * Checks for either:
 * 1. A valid coach session cookie (any coach can access family data)
 * 2. A valid family token in the x-family-token header matching the familyId
 *
 * Throws "Unauthorized" if neither is present.
 */
export async function requireFamilyOrCoachAuth(
  request: Request,
  familyId: string
): Promise<void> {
  // Check coach session first
  const session = await getSession();
  if (session) return;

  // Check family token
  const token = request.headers.get("x-family-token");
  if (!token) {
    throw new Error("Unauthorized");
  }

  const family = await verifyFamilyToken(token);
  if (!family || family.familyId !== familyId) {
    throw new Error("Unauthorized");
  }
}
