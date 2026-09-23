import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, setCurrentUserId } from "./data";
import type { Member } from "./types";

export const SESSION_COOKIE = "cca_session";
export const SESSION_TTL_SECONDS = 30 * 60; // matches the "expires after 30 minutes of inactivity" copy on /login

const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Signs a fresh session token for this member, valid for SESSION_TTL_SECONDS from now. */
export function createSessionToken(memberId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${memberId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Verifies a session token's signature and expiry, returning the member id or null. */
export function verifySessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [memberId, expiresAtRaw, signature] = parts;
  const expected = sign(`${memberId}.${expiresAtRaw}`);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  return memberId;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export async function createSession(memberId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(memberId), SESSION_COOKIE_OPTIONS);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionMemberId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

/**
 * Best-effort sync of the request's logged-in member into the in-memory
 * data layer. Swallows the error `next/headers` throws outside a real
 * request (e.g. unit tests calling server actions directly) so those tests
 * keep driving identity via `updateMemberAccessRole` as before.
 */
export async function syncCurrentUserFromSession(): Promise<void> {
  try {
    const memberId = await getSessionMemberId();
    if (memberId) setCurrentUserId(memberId);
  } catch {
    // No request context available — leave the current identity as-is.
  }
}

/** For Server Components: resolves the logged-in member or redirects to /login. */
export async function requireCurrentMember(): Promise<Member> {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");
  setCurrentUserId(memberId);
  return getCurrentUser();
}
