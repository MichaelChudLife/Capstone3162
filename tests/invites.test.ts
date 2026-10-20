import { beforeEach, describe, expect, it, vi } from "vitest";
import { freshWorkspace } from "./helpers";

const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

const signup = { name: "Priya Raman", password: "sponsor-season-26", confirmPassword: "sponsor-season-26" };

beforeEach(async () => {
  cookieJar.clear();
  ws = await freshWorkspace();
});

async function invite(email = "priya@cca.org.au", accessRole: "Committee Member" | "Finance Director" = "Committee Member") {
  const result = await ws.invites.createInviteAction({ email, accessRole, position: "Sponsorships Officer" });
  if (!result.ok) throw new Error(result.message);
  return { ...result.data, token: result.data.path.replace("/invite/", "") };
}

describe("F_REQ-8 · Invite-only sign-up links", () => {
  it("lets the IT Director create a one-time link without storing the raw token", async () => {
    const link = await invite();

    expect(link.path).toMatch(/^\/invite\/[A-Za-z0-9_-]{43}$/);
    const stored = ws.data.getInviteById(link.inviteId)!;
    expect(stored).toMatchObject({ email: "priya@cca.org.au", accessRole: "Committee Member", acceptedAt: null });
    expect(JSON.stringify(ws.data.invites)).not.toContain(link.token);
    expect(new Date(stored.expiresAt).getTime() - new Date(stored.createdAt).getTime()).toBe(7 * 86400000);
  });

  it("returns 'You do not have access' when anyone else tries to invite", async () => {
    ws.actAs("Committee Director");

    const result = await ws.invites.createInviteAction({ email: "x@cca.org.au", accessRole: "Committee Member", position: "" });

    expect(result).toEqual({ ok: false, message: "You do not have access to invite members." });
    expect(ws.data.invites).toHaveLength(0);
  });

  it("rejects invalid emails, existing members and duplicate open invites", async () => {
    await invite("priya@cca.org.au");

    for (const email of ["not-an-email", "SENER@cca.org.au", "priya@cca.org.au"]) {
      const result = await ws.invites.createInviteAction({ email, accessRole: "Committee Member", position: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors?.email).toBeDefined();
    }
  });

  it("creates the account with the invited role, signs the member in, and lets them log in later", async () => {
    const link = await invite("priya@cca.org.au", "Finance Director");

    const result = await ws.signup.acceptInviteAction(link.token, signup);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const member = ws.data.getMemberById(result.data.memberId)!;
    expect(member).toMatchObject({
      name: "Priya Raman",
      initials: "PR",
      email: "priya@cca.org.au",
      accessRole: "Finance Director",
      role: "Sponsorships Officer",
    });
    expect(member).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(member)).not.toContain(signup.password);
    expect(cookieJar.get("cca_session")).toMatch(new RegExp(`^${member.id}\\.`));
    expect(ws.data.getInviteById(link.inviteId)).toMatchObject({ acceptedMemberId: member.id });

    const login = await import("@/app/login/actions");
    expect(await login.loginAction("priya@cca.org.au", signup.password)).toEqual({ ok: true, data: null });
  });

  it("works only once", async () => {
    const link = await invite();
    await ws.signup.acceptInviteAction(link.token, signup);

    const again = await ws.signup.acceptInviteAction(link.token, { ...signup, name: "Someone Else" });

    expect(again).toMatchObject({ ok: false, message: expect.stringContaining("already been used") });
    expect(ws.data.getMembers().filter((m) => m.email === "priya@cca.org.au")).toHaveLength(1);
  });

  it("refuses an expired link", async () => {
    const link = await invite();
    ws.data.getInviteById(link.inviteId)!.expiresAt = new Date(Date.now() - 1000).toISOString();

    const result = await ws.signup.acceptInviteAction(link.token, signup);

    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("expired") });
  });

  it("refuses a cancelled link, and only the IT Director can cancel", async () => {
    const link = await invite();
    ws.actAs("Committee Director");
    expect(await ws.invites.revokeInviteAction(link.inviteId)).toEqual({
      ok: false,
      message: "You do not have access to manage invites.",
    });
    ws.actAs("IT Director");

    await ws.invites.revokeInviteAction(link.inviteId);
    const result = await ws.signup.acceptInviteAction(link.token, signup);

    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("cancelled") });
  });

  it("invalidates the old link when a new one is generated", async () => {
    const first = await invite();

    const renewed = await ws.invites.renewInviteAction(first.inviteId);
    if (!renewed.ok) throw new Error(renewed.message);
    const second = renewed.data.path.replace("/invite/", "");

    expect(await ws.signup.acceptInviteAction(first.token, signup)).toMatchObject({
      ok: false,
      message: expect.stringContaining("isn't valid"),
    });
    expect((await ws.signup.acceptInviteAction(second, signup)).ok).toBe(true);
  });

  it("validates the name and password before creating the account", async () => {
    const link = await invite();

    const result = await ws.signup.acceptInviteAction(link.token, { name: "P", password: "short", confirmPassword: "short" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors ?? {}).sort()).toEqual(["name", "password"]);
    expect(ws.data.getMemberByEmail("priya@cca.org.au")).toBeUndefined();
  });

  it("rejects mismatched passwords and a made-up token", async () => {
    const link = await invite();

    const mismatch = await ws.signup.acceptInviteAction(link.token, { ...signup, confirmPassword: "something-else-1" });
    const madeUp = await ws.signup.acceptInviteAction("not-a-real-token", signup);

    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.errors?.confirmPassword).toBe("Passwords don't match.");
    expect(madeUp).toMatchObject({ ok: false, message: expect.stringContaining("isn't valid") });
  });
});
