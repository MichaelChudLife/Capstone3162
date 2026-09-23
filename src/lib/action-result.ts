import type { ActionResult, FieldErrors } from "./types";

export const NO_ACCESS = "You do not have access";

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function denied(what: string): ActionResult<never> {
  return { ok: false, message: `${NO_ACCESS} to ${what}.` };
}

export function invalid(errors: FieldErrors): ActionResult<never> {
  return { ok: false, message: "Please fix the highlighted fields.", errors };
}

export function missing(what: string): ActionResult<never> {
  return { ok: false, message: `That ${what} no longer exists.` };
}

export function refused(message: string): ActionResult<never> {
  return { ok: false, message };
}
