import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getWorkspaceVersion } from "@/lib/data";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ signedIn: false }, { status: 401, headers: NO_STORE });
  }
  return NextResponse.json({ signedIn: true, version: getWorkspaceVersion() }, { headers: NO_STORE });
}
