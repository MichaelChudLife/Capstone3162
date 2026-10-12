import type { BudgetItem } from "./types";

// F_REQ-7: the budget module is AUD only. Amounts are integer cents.
export const CURRENCY = "AUD";
export const MAX_AMOUNT_CENTS = 100_000_000_00; // $100,000,000.00

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: CURRENCY });

export function formatAud(cents: number): string {
  return aud.format(cents / 100);
}

// Variance is shown with an explicit sign so over/under budget is unambiguous.
export function formatVariance(cents: number): string {
  if (cents === 0) return formatAud(0);
  return `${cents > 0 ? "+" : "−"}${formatAud(Math.abs(cents))}`;
}

// Accepts "1234", "1,234.5", "$1,234.50". Returns null for anything else
// (negatives, more than 2 decimals, letters, empty input).
export function parseAudToCents(text: string): number | null {
  const cleaned = text.trim().replace(/^\$/, "").replace(/\s/g, "");
  if (cleaned === "" || !/^(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole = "0", fraction = ""] = cleaned.replace(/,/g, "").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0") || "0");
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

// Variance = actual − expected. Positive means over budget, negative under.
export function itemVariance(item: Pick<BudgetItem, "expectedCents" | "actualCents">): number | null {
  return item.actualCents == null ? null : item.actualCents - item.expectedCents;
}

export type VarianceTone = "over" | "under" | "on";

export function varianceTone(cents: number): VarianceTone {
  return cents > 0 ? "over" : cents < 0 ? "under" : "on";
}

export interface BudgetSummary {
  /** Expected cost across every line item. */
  expectedCents: number;
  /** Actual spend across the line items that have a recorded amount. */
  actualCents: number;
  /** Actual − expected, compared like-for-like on lines with recorded spend only. */
  varianceCents: number;
  /** Expected cost of lines with no actual recorded yet (excluded from variance). */
  pendingExpectedCents: number;
  itemCount: number;
  recordedCount: number;
}

export function summariseBudget(items: Pick<BudgetItem, "expectedCents" | "actualCents">[]): BudgetSummary {
  const summary: BudgetSummary = {
    expectedCents: 0,
    actualCents: 0,
    varianceCents: 0,
    pendingExpectedCents: 0,
    itemCount: items.length,
    recordedCount: 0,
  };
  for (const item of items) {
    summary.expectedCents += item.expectedCents;
    if (item.actualCents == null) {
      summary.pendingExpectedCents += item.expectedCents;
      continue;
    }
    summary.recordedCount += 1;
    summary.actualCents += item.actualCents;
    summary.varianceCents += item.actualCents - item.expectedCents;
  }
  return summary;
}
