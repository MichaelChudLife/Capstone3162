"use server";

import {
  createBudgetItem,
  deleteBudgetItem,
  getBudgetItemById,
  getEventById,
  hasPermission,
  updateBudgetItem,
} from "@/lib/data";
import { syncCurrentUserFromSession } from "@/lib/auth";
import { validateBudgetItemInput } from "@/lib/validation";
import { denied, invalid, missing, ok } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, BudgetItemInput } from "@/lib/types";

export async function createBudgetItemAction(
  eventId: string,
  input: BudgetItemInput,
): Promise<ActionResult<{ id: string }>> {
  await syncCurrentUserFromSession();
  if (!hasPermission("manage_budget")) return denied("edit budgets");
  if (!getEventById(eventId)) return missing("event");
  const result = validateBudgetItemInput(input);
  if (!result.ok) return invalid(result.errors);
  const item = createBudgetItem(eventId, result.value);
  revalidateWorkspace();
  return ok({ id: item.id });
}

export async function updateBudgetItemAction(
  id: string,
  input: BudgetItemInput,
): Promise<ActionResult<{ id: string }>> {
  await syncCurrentUserFromSession();
  if (!hasPermission("manage_budget")) return denied("edit budgets");
  if (!getBudgetItemById(id)) return missing("budget item");
  const result = validateBudgetItemInput(input);
  if (!result.ok) return invalid(result.errors);
  updateBudgetItem(id, result.value);
  revalidateWorkspace();
  return ok({ id });
}

export async function deleteBudgetItemAction(id: string): Promise<ActionResult> {
  await syncCurrentUserFromSession();
  if (!hasPermission("manage_budget")) return denied("edit budgets");
  if (!deleteBudgetItem(id)) return missing("budget item");
  revalidateWorkspace();
  return ok(null);
}
