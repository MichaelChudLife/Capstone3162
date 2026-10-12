import { beforeEach, describe, expect, it } from "vitest";
import { freshWorkspace } from "./helpers";
import { formatAud, formatVariance, itemVariance, parseAudToCents, summariseBudget } from "@/lib/money";
import type { BudgetItemInput } from "@/lib/types";

type Workspace = Awaited<ReturnType<typeof freshWorkspace>>;
let ws: Workspace;

beforeEach(async () => {
  ws = await freshWorkspace();
});

function budgetInput(overrides: Partial<BudgetItemInput> = {}): BudgetItemInput {
  return { description: "Catering", expectedCents: 50000, actualCents: null, ...overrides };
}

async function addItem(eventId: string, overrides: Partial<BudgetItemInput> = {}) {
  const result = await ws.budget.createBudgetItemAction(eventId, budgetInput(overrides));
  if (!result.ok) throw new Error(result.message);
  return ws.data.getBudgetItemById(result.data.id)!;
}

describe("TC-010 · F_REQ-7 Budget: expected vs actual, variance calculated automatically", () => {
  it("records an expected cost for an event", async () => {
    const item = await addItem("e4", { description: "Zoom licence", expectedCents: 1999 });

    expect(item).toMatchObject({ eventId: "e4", description: "Zoom licence", expectedCents: 1999, actualCents: null });
    expect(ws.data.getBudgetItemsForEvent("e4")).toHaveLength(1);
  });

  it("records actual expenditure when adding or later editing an item", async () => {
    const item = await addItem("e4", { expectedCents: 50000, actualCents: 42000 });
    expect(item.actualCents).toBe(42000);

    const later = await addItem("e4", { description: "Signage", expectedCents: 10000 });
    const result = await ws.budget.updateBudgetItemAction(later.id, budgetInput({ description: "Signage", expectedCents: 10000, actualCents: 12550 }));

    expect(result.ok).toBe(true);
    expect(ws.data.getBudgetItemById(later.id)?.actualCents).toBe(12550);
  });

  it("calculates per-item variance as actual − expected (positive = over budget)", () => {
    expect(itemVariance({ expectedCents: 50000, actualCents: 60000 })).toBe(10000);
    expect(itemVariance({ expectedCents: 50000, actualCents: 42000 })).toBe(-8000);
    expect(itemVariance({ expectedCents: 50000, actualCents: 50000 })).toBe(0);
    expect(itemVariance({ expectedCents: 50000, actualCents: null })).toBeNull();
  });

  it("recalculates the event total and variance automatically as items change", async () => {
    await addItem("e4", { description: "A", expectedCents: 50000, actualCents: 60000 });
    const b = await addItem("e4", { description: "B", expectedCents: 20000, actualCents: 15000 });
    await addItem("e4", { description: "C", expectedCents: 30000, actualCents: null });

    expect(ws.data.getBudgetSummary("e4")).toMatchObject({
      expectedCents: 100000,
      actualCents: 75000,
      varianceCents: 5000, // (60000 − 50000) + (15000 − 20000)
      pendingExpectedCents: 30000,
      itemCount: 3,
      recordedCount: 2,
    });

    await ws.budget.updateBudgetItemAction(b.id, budgetInput({ description: "B", expectedCents: 20000, actualCents: 25000 }));
    expect(ws.data.getBudgetSummary("e4").varianceCents).toBe(15000);

    await ws.budget.deleteBudgetItemAction(b.id);
    expect(ws.data.getBudgetSummary("e4")).toMatchObject({ expectedCents: 80000, actualCents: 60000, varianceCents: 10000 });
  });

  it("leaves unspent items out of the variance instead of reporting them as savings", () => {
    const summary = summariseBudget([
      { expectedCents: 10000, actualCents: 10000 },
      { expectedCents: 90000, actualCents: null },
    ]);

    expect(summary.varianceCents).toBe(0);
    expect(summary.pendingExpectedCents).toBe(90000);
  });

  it("sums in integer cents without floating-point drift", () => {
    const summary = summariseBudget([
      { expectedCents: parseAudToCents("0.10")!, actualCents: parseAudToCents("0.30")! },
      { expectedCents: parseAudToCents("0.20")!, actualCents: parseAudToCents("0.10")! },
    ]);

    expect(summary).toMatchObject({ expectedCents: 30, actualCents: 40, varianceCents: 10 });
  });

  it("uses AUD formatting", () => {
    expect(formatAud(123456)).toBe("$1,234.56");
    expect(formatVariance(10000)).toBe("+$100.00");
    expect(formatVariance(-8050)).toBe("−$80.50");
    expect(formatVariance(0)).toBe("$0.00");
  });

  it("seeds a worked example for the Networking Night", () => {
    const summary = ws.data.getBudgetSummary("e1");

    expect(summary).toMatchObject({
      expectedCents: 505000,
      actualCents: 470550,
      varianceCents: 25550, // 0 + 32,550 − 7,000
      pendingExpectedCents: 60000,
    });
  });

  it("deletes an event's budget items along with the event", async () => {
    await addItem("e4");
    expect(ws.data.getBudgetItemsForEvent("e4")).toHaveLength(1);

    await ws.events.deleteEventAction("e4", { confirmSubtaskRemoval: true });

    expect(ws.data.budgetItems.filter((b) => b.eventId === "e4")).toHaveLength(0);
  });
});

describe("F_REQ-7 amount parsing and validation", () => {
  it("parses AUD amounts into cents", () => {
    expect(parseAudToCents("250")).toBe(25000);
    expect(parseAudToCents("$1,234.5")).toBe(123450);
    expect(parseAudToCents("0.05")).toBe(5);
    expect(parseAudToCents(".5")).toBe(50);
  });

  it.each(["", "abc", "-5", "1.234", "12,34", "1e3", "$"])("rejects %j", (text) => {
    expect(parseAudToCents(text)).toBeNull();
  });

  it("requires a description and an expected cost", async () => {
    const result = await ws.budget.createBudgetItemAction("e4", budgetInput({ description: "  " }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.description).toBeDefined();
  });

  it.each([-1, 1.5, Number.NaN, 1e15])("rejects an invalid amount (%s)", async (bad) => {
    const result = await ws.budget.createBudgetItemAction("e4", budgetInput({ expectedCents: bad, actualCents: bad }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors?.expectedCents).toBeDefined();
    expect(result.errors?.actualCents).toBeDefined();
    expect(ws.data.getBudgetItemsForEvent("e4")).toHaveLength(0);
  });

  it("rejects an item for an event that does not exist", async () => {
    const result = await ws.budget.createBudgetItemAction("nope", budgetInput());

    expect(result).toEqual({ ok: false, message: "That event no longer exists." });
  });
});

describe("F_REQ-7 budget access control", () => {
  it.each(["IT Director", "Committee Director", "Events Director", "Finance Director"] as const)(
    "%s can record budget items",
    async (role) => {
      ws.actAs(role);
      const result = await ws.budget.createBudgetItemAction("e4", budgetInput());

      expect(result.ok).toBe(true);
    },
  );

  it.each(["Committee Member", "Marketing Director"] as const)("%s cannot edit budgets", async (role) => {
    const item = await addItem("e4");
    ws.actAs(role);
    const denied = { ok: false, message: "You do not have access to edit budgets." };

    expect(await ws.budget.createBudgetItemAction("e4", budgetInput())).toEqual(denied);
    expect(await ws.budget.updateBudgetItemAction(item.id, budgetInput({ actualCents: 1 }))).toEqual(denied);
    expect(await ws.budget.deleteBudgetItemAction(item.id)).toEqual(denied);
    expect(ws.data.getBudgetItemById(item.id)?.actualCents).toBeNull();
  });

  it("lets every role view the budget", () => {
    ws.actAs("Committee Member");

    expect(ws.data.hasPermission("view_workspace")).toBe(true);
    expect(ws.data.getBudgetItemsForEvent("e1").length).toBeGreaterThan(0);
  });
});
