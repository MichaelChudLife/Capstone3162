"use server";

import {
  createBudgetItem,
  deleteBudgetItem,
  getBudgetItemById,
  getEventById,
  hasPermission,
  updateBudgetItem,
} from "@/lib/data";
import { currentActor } from "@/lib/auth";
import { validateBudgetItemInput } from "@/lib/validation";
import { denied, invalid, missing, ok, signedOut } from "@/lib/action-result";
import { revalidateWorkspace } from "@/lib/revalidate";
import type { ActionResult, BudgetItemInput } from "@/lib/types";

export async function createBudgetItemAction(
  eventId: string,
  input: BudgetItemInput,
): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_budget", actor)) return denied("edit budgets");
  if (!(await getEventById(eventId))) return missing("event");
  const result = validateBudgetItemInput(input);
  if (!result.ok) return invalid(result.errors);
  const item = await createBudgetItem(eventId, result.value);
  await revalidateWorkspace();
  return ok({ id: item.id });
}

export async function updateBudgetItemAction(
  id: string,
  input: BudgetItemInput,
): Promise<ActionResult<{ id: string }>> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_budget", actor)) return denied("edit budgets");
  if (!(await getBudgetItemById(id))) return missing("budget item");
  const result = validateBudgetItemInput(input);
  if (!result.ok) return invalid(result.errors);
  await updateBudgetItem(id, result.value);
  await revalidateWorkspace();
  return ok({ id });
}

export async function deleteBudgetItemAction(id: string): Promise<ActionResult> {
  const actor = await currentActor();
  if (!actor) return signedOut();
  if (!hasPermission("manage_budget", actor)) return denied("edit budgets");
  if (!(await deleteBudgetItem(id))) return missing("budget item");
  await revalidateWorkspace();
  return ok(null);
}
