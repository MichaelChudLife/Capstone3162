import { beforeEach, describe, expect, it } from "vitest";
import { budgetItemInput, freshWorkspace } from "./helpers";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

describe("TC-006 · F_REQ-2.2 Budget module per event", () => {
  it("lets a Committee Member record an expected cost and actual expenditure against an event", async () => {
    ws.actAs("Committee Member");

    const result = await ws.budget.addBudgetItemAction("e1", budgetItemInput({ expectedCost: 150, actualCost: 140 }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const item = ws.data.getBudgetItemById(result.data.id);
    expect(item).toMatchObject({
      eventId: "e1",
      label: "Photography",
      expectedCost: 150,
      actualCost: 140,
      recordedById: "m1",
    });
  });

  it("totals expected vs actual cost for an event", () => {
    const summary = ws.data.getEventBudgetSummary("e1");

    expect(summary).toEqual({ expectedTotal: 2000, actualTotal: 2090, variance: 90 });
  });

  it("rejects a cost without a label", async () => {
    const result = await ws.budget.addBudgetItemAction("e1", budgetItemInput({ label: "  " }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.label).toBeDefined();
  });

  it("rejects a negative expected cost", async () => {
    const result = await ws.budget.addBudgetItemAction("e1", budgetItemInput({ expectedCost: -50 }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.expectedCost).toBeDefined();
  });

  it("refuses to record a cost against a missing event", async () => {
    const result = await ws.budget.addBudgetItemAction("ghost", budgetItemInput());

    expect(result).toEqual({ ok: false, message: "That event no longer exists." });
  });

  it("lets the member who recorded a cost edit it", async () => {
    ws.actAs("Committee Member");
    const created = await ws.budget.addBudgetItemAction("e1", budgetItemInput());
    if (!created.ok) throw new Error(created.message);

    const result = await ws.budget.updateBudgetItemAction(created.data.id, budgetItemInput({ actualCost: 145 }));

    expect(result.ok).toBe(true);
    expect(ws.data.getBudgetItemById(created.data.id)?.actualCost).toBe(145);
  });

  it("returns 'You do not have access' when a Committee Member edits someone else's cost entry", async () => {
    ws.actAs("Committee Member");

    const result = await ws.budget.updateBudgetItemAction("b1", budgetItemInput({ label: "Venue hire", expectedCost: 800, actualCost: 900 }));

    expect(result).toEqual({ ok: false, message: "You do not have access to edit this budget item." });
  });

  it("lets a Committee Director edit any budget item for the event", async () => {
    ws.actAs("Committee Director");

    const result = await ws.budget.updateBudgetItemAction("b1", budgetItemInput({ label: "Venue hire", expectedCost: 800, actualCost: 900 }));

    expect(result.ok).toBe(true);
    expect(ws.data.getBudgetItemById("b1")?.actualCost).toBe(900);
  });

  it("lets the recorder delete their own cost entry", async () => {
    ws.actAs("Committee Member");
    const created = await ws.budget.addBudgetItemAction("e1", budgetItemInput());
    if (!created.ok) throw new Error(created.message);

    const result = await ws.budget.deleteBudgetItemAction(created.data.id);

    expect(result).toEqual({ ok: true, data: null });
    expect(ws.data.getBudgetItemById(created.data.id)).toBeUndefined();
  });

  it("blocks deleting someone else's cost entry without manage_events", async () => {
    ws.actAs("Committee Member");

    const result = await ws.budget.deleteBudgetItemAction("b2");

    expect(result).toEqual({ ok: false, message: "You do not have access to delete this budget item." });
    expect(ws.data.getBudgetItemById("b2")).toBeDefined();
  });

  it("removes an event's budget items when the event is deleted", async () => {
    expect(ws.data.getBudgetItemsForEvent("e1").length).toBeGreaterThan(0);

    await ws.events.deleteEventAction("e1", { confirmSubtaskRemoval: true });

    expect(ws.data.getBudgetItemsForEvent("e1")).toEqual([]);
  });
});
