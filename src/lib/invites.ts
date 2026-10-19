import { getMemberByEmail, inviteState } from "./data";
import type { Invite } from "./types";

export function inviteProblem(invite: Invite | undefined, now = new Date()): string | null {
  if (!invite) return "This invite link isn't valid. Check you copied the whole link.";
  const state = inviteState(invite, now);
  if (state === "expired") return "This invite link has expired. Ask your IT Director for a new one.";
  if (state === "accepted") return "This invite has already been used. Log in with the account you created.";
  if (state === "revoked") return "This invite was cancelled. Ask your IT Director if you still need access.";
  if (getMemberByEmail(invite.email)) return "An account with this email already exists. Log in instead.";
  return null;
}
