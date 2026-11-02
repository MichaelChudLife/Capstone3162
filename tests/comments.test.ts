import { beforeEach, describe, expect, it } from "vitest";
import { validateCommentInput } from "@/lib/validation";
import { freshWorkspace } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-007 · F_REQ-4 Task-level comments", () => {
  it("posts a comment on a task with the author and time", async () => {
    const before = Date.now();

    const result = await ws.comments.addCommentAction("t4", { body: "Room is booked from 12:30." });

    expect(result.ok).toBe(true);
    const comments = await ws.data.getTaskComments("t4");
    expect(comments).toHaveLength(1);
    expect(comments[0]).toMatchObject({ taskId: "t4", authorId: ws.me, body: "Room is booked from 12:30." });
    const at = new Date(comments[0].createdAt).getTime();
    expect(at).toBeGreaterThanOrEqual(before);
    expect(at).toBeLessThanOrEqual(Date.now());
  });

  it("ties each comment to one task and lists that task's comments oldest first", async () => {
    await ws.comments.addCommentAction("t2", { body: "Logos arrived." });

    const poster = await ws.data.getTaskComments("t2");
    expect(poster.map((c) => c.body)).toEqual([
      "Can we use the navy and gold from the brand kit so it matches the sponsor deck?",
      "Yes. First draft is in the shared Drive folder. Still waiting on the final sponsor logos.",
      "Logos arrived.",
    ]);
    expect(poster.every((c) => c.taskId === "t2")).toBe(true);
    expect((await ws.data.getTaskComments("t15")).map((c) => c.id)).toEqual(["c4", "c5"]);
    expect(await ws.data.getTaskComments("t5")).toEqual([]);
  });

  it("lets any signed-in member comment, including on tasks not assigned to them", async () => {
    await ws.actAs("Committee Member");
    const task = (await ws.data.getTaskById("t3"))!;
    expect(task.assigneeIds).not.toContain(ws.me);

    const result = await ws.comments.addCommentAction("t3", { body: "I can help chase the last two firms." });

    expect(result.ok).toBe(true);
    expect((await ws.data.getTaskComments("t3")).at(-1)).toMatchObject({ authorId: ws.me });
  });

  it("finds comments by keyword, ignoring case", async () => {
    expect((await ws.data.getTaskComments("t2", "LOGOS")).map((c) => c.id)).toEqual(["c2"]);
    expect((await ws.data.getTaskComments("t2", "  brand kit  ")).map((c) => c.id)).toEqual(["c1"]);
    expect(await ws.data.getTaskComments("t2", "fridge")).toEqual([]);
  });

  it("only searches within the task being viewed", async () => {
    expect((await ws.data.getTaskComments("t15", "link")).map((c) => c.id)).toEqual(["c5"]);
    expect(await ws.data.getTaskComments("t2", "link")).toEqual([]);
  });

  it("treats % and _ in a search as plain characters", async () => {
    await ws.comments.addCommentAction("t4", { body: "Projector costs 10% of the AV quote" });
    await ws.comments.addCommentAction("t4", { body: "Use room_b if 3.01 falls through" });

    expect((await ws.data.getTaskComments("t4", "%")).map((c) => c.body)).toEqual(["Projector costs 10% of the AV quote"]);
    expect((await ws.data.getTaskComments("t4", "_")).map((c) => c.body)).toEqual(["Use room_b if 3.01 falls through"]);
  });

  it("treats a backslash in a search as a plain character", async () => {
    await ws.comments.addCommentAction("t4", { body: "Slides are in Drive\\Workshops" });
    await ws.comments.addCommentAction("t4", { body: "Workshops folder is shared" });

    expect((await ws.data.getTaskComments("t4", "\\")).map((c) => c.body)).toEqual(["Slides are in Drive\\Workshops"]);
  });

  it("returns every comment for a blank search", async () => {
    expect(await ws.data.getTaskComments("t2", "   ")).toHaveLength(2);
  });

  it("trims the comment and rejects an empty one without saving", async () => {
    await ws.comments.addCommentAction("t5", { body: "  Slides 1–8 drafted.  \n" });
    expect((await ws.data.getTaskComments("t5"))[0].body).toBe("Slides 1–8 drafted.");

    const result = await ws.comments.addCommentAction("t5", { body: "   \n " });

    expect(result).toMatchObject({ ok: false, errors: { body: "Write a comment before posting." } });
    expect(await ws.data.countTaskComments("t5")).toBe(1);
  });

  it("rejects a comment over 1000 characters", async () => {
    const result = await ws.comments.addCommentAction("t5", { body: "x".repeat(1001) });

    expect(result).toMatchObject({ ok: false, errors: { body: "Keep comments under 1000 characters." } });
    expect(await ws.data.countTaskComments("t5")).toBe(0);
  });

  it("refuses a comment when nobody is signed in", async () => {
    ws.signOut();

    const result = await ws.comments.addCommentAction("t5", { body: "Hello" });

    expect(result).toEqual({ ok: false, message: "Your session has ended. Log in again to continue." });
    expect(await ws.data.countTaskComments("t5")).toBe(0);
  });

  it("reports a task that no longer exists", async () => {
    const result = await ws.comments.addCommentAction("missing-task", { body: "Hello" });

    expect(result).toEqual({ ok: false, message: "That task no longer exists." });
  });

  it("bumps the workspace version so other open pages show the new comment", async () => {
    const version = await ws.data.getWorkspaceVersion();

    await ws.comments.addCommentAction("t5", { body: "Started on the intro section." });

    expect(await ws.data.getWorkspaceVersion()).toBeGreaterThan(version);
  });

  it("removes a task's comments when its event is deleted", async () => {
    expect(await ws.data.countTaskComments("t2")).toBe(2);

    await ws.events.deleteEventAction("e1", { confirmSubtaskRemoval: true });

    expect(await ws.db.taskComment.count({ where: { taskId: { in: ["t2", "t3"] } } })).toBe(0);
    expect(await ws.db.taskComment.count({ where: { taskId: "t15" } })).toBe(2);
  });

  it("keeps a comment when its author's account is removed", async () => {
    await ws.db.member.delete({ where: { id: "m3" } });

    const [first, second] = await ws.data.getTaskComments("t2");
    expect(first.authorId).toBe("m4");
    expect(second).toMatchObject({ id: "c2", authorId: null });
  });
});

describe("F_REQ-4 comment validation", () => {
  it("accepts a comment of exactly 1000 characters", () => {
    expect(validateCommentInput({ body: "x".repeat(1000) }).ok).toBe(true);
  });

  it("rejects a missing body", () => {
    expect(validateCommentInput({ body: undefined as unknown as string }).ok).toBe(false);
  });
});
