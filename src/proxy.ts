import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, createSessionToken, verifySessionToken } from "@/lib/auth";

// Next.js 16 renamed the middleware convention to "proxy"; it now runs on
// the Node.js runtime by default, so this can share lib/auth.ts directly.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const memberId = token ? verifySessionToken(token) : null;

  if (request.nextUrl.pathname === "/login") {
    if (memberId) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!memberId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sliding expiry: every authenticated request refreshes the 30-minute window.
  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, createSessionToken(memberId), SESSION_COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|cca-logo.png|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)"],
};
