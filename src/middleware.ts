import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

const PROTECTED_PATHS = [
  "/dashboard",
  "/roster",
  "/schedule",
  "/volunteer",
  "/updates",
  "/rules",
  "/coaching",
  "/gameday",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/roster/:path*",
    "/schedule/:path*",
    "/volunteer/:path*",
    "/updates/:path*",
    "/rules/:path*",
    "/coaching/:path*",
    "/gameday/:path*",
    "/settings/:path*",
  ],
};
