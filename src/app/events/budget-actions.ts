"use server";

import {
  canEditBudgetItem,
  createBudgetItem,
  deleteBudgetItem,
  getBudgetItemById,
  getCurrentUser,
  getEventById,
  hasPermission,
  updateBudgetItem,
} from "@/lib/data";
import { validateBudgetItemInput } from "@/lib/validation";
import { denied, invalid, missing, ok } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, BudgetItemInput } from "@/lib/types";

export async function addBudgetItemAction(
  eventId: string,
  input: BudgetItemInput,
): Promise<ActionResult<{ id: string }>> {
  if (!hasPermission("view_workspace")) return denied("record budget items");
  if (!getEventById(eventId)) return missing("event");
  const result = validateBudgetItemInput(input);
  if (!result.ok) return invalid(result.errors);
  const item = createBudgetItem(eventId, result.value, getCurrentUser().id);
  revalidateWorkspace();
  return ok({ id: item.id });
}

export async function updateBudgetItemAction(
  id: string,
  input: BudgetItemInput,
): Promise<ActionResult<{ id: string }>> {
  const existing = getBudgetItemById(id);
  if (!existing) return missing("budget item");
  if (!canEditBudgetItem(existing)) return denied("edit this budget item");
  const result = validateBudgetItemInput(input);
  if (!result.ok) return invalid(result.errors);
  updateBudgetItem(id, result.value);
  revalidateWorkspace();
  return ok({ id });
}

export async function deleteBudgetItemAction(id: string): Promise<ActionResult<null>> {
  const existing = getBudgetItemById(id);
  if (!existing) return missing("budget item");
  if (!canEditBudgetItem(existing)) return denied("delete this budget item");
  deleteBudgetItem(id);
  revalidateWorkspace();
  return ok(null);
}
