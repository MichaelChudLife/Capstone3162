import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DEMO_PASSWORD, seedPassword } from "@/lib/seed";
import { freshWorkspace, taskInput } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

const SIGNED_OUT = { ok: false, message: "Your session has ended. Log in again to continue." };

beforeEach(async () => {
  ws = await freshWorkspace();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("NF_REQ-2 · Every action runs as the signed-in member", () => {
  it("refuses changes when nobody is signed in", async () => {
    ws.signOut();

    expect(await ws.app.moveTaskAction("t5", "DONE")).toEqual(SIGNED_OUT);
    expect(await ws.tasks.createTaskAction(taskInput())).toEqual(SIGNED_OUT);
    expect(await ws.events.deleteEventAction("e1", { confirmSubtaskRemoval: true })).toEqual(SIGNED_OUT);
    expect(await ws.invites.createInviteAction({ email: "x@cca.org.au", accessRole: "Committee Member", position: "" })).toEqual(SIGNED_OUT);
    await expect(ws.app.updateMemberRoleAction("m5", "IT Director")).rejects.toThrow();
    expect((await ws.data.getTaskById("t5"))?.status).toBe("TODO");
    expect(await ws.data.getEventById("e1")).toBeDefined();
  });

  it("uses whoever the session belongs to, not the last member who acted", async () => {
    await ws.app.moveTaskAction("t5", "IN_PROGRESS");
    ws.signInAs("m5");

    const result = await ws.app.moveTaskAction("t5", "DONE");

    expect(result).toEqual({ ok: false, message: "You do not have access to update this task." });
    expect((await ws.data.getTaskById("t5"))?.status).toBe("IN_PROGRESS");
  });

  it("reports the shared workspace version to open pages", async () => {
    const auth = await import("@/lib/auth");
    const { GET } = await import("@/app/api/live/route");
    const request = () =>
      new NextRequest("http://localhost/api/live", { headers: { cookie: `${auth.SESSION_COOKIE}=${auth.createSessionToken("m1")}` } });

    const before = await (await GET(request())).json();
    await ws.app.moveTaskAction("t5", "DONE");
    const after = await (await GET(request())).json();

    expect(before).toEqual({ signedIn: true, version: expect.any(Number) });
    expect(after.version).toBeGreaterThan(before.version);
  });

  it("keeps changes in the database for every server instance to read", async () => {
    await ws.app.moveTaskAction("t5", "DONE");

    const row = await ws.db.task.findUnique({ where: { id: "t5" } });

    expect(row?.status).toBe("DONE");
  });
});

describe("NF_REQ-2 · Production secrets", () => {
  it("refuses to sign sessions in production without a strong SESSION_SECRET", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "too-short");
    const auth = await import("@/lib/auth");

    expect(() => auth.createSessionToken("m1")).toThrow(/SESSION_SECRET/);
  });

  it("signs and verifies sessions with the configured secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "x".repeat(40));
    const auth = await import("@/lib/auth");

    const token = auth.createSessionToken("m1");

    expect(auth.verifySessionToken(token)).toBe("m1");
    vi.stubEnv("SESSION_SECRET", "y".repeat(40));
    expect(auth.verifySessionToken(token)).toBeNull();
  });

  it("requires SEED_PASSWORD before seeding a hosted database", () => {
    expect(() => seedPassword({ VERCEL: "1" })).toThrow(/SEED_PASSWORD/);
    expect(() => seedPassword({ NODE_ENV: "production", SEED_PASSWORD: "short" })).toThrow(/SEED_PASSWORD/);
    expect(seedPassword({ VERCEL: "1", SEED_PASSWORD: "a-long-private-password" })).toBe("a-long-private-password");
    expect(seedPassword({})).toBe(DEMO_PASSWORD);
  });
});
