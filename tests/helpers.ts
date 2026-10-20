import { vi } from "vitest";
import type { AccessRole, EventInput, TaskInput } from "@/lib/types";
import { cookieJar } from "./session";

export const ME = "m1";

const TABLES = ["Member", "Event", "Task", "BudgetItem", "TaskStatusChange", "TaskReminder", "Invite", "Workspace", "_TaskAssignees"];

let demoPasswordHash: string | undefined;

async function resetDatabase() {
  const { db } = await import("@/lib/db");
  const { DEMO_PASSWORD, seedDemoWorkspace } = await import("@/lib/seed");
  const { hashPassword } = await import("@/lib/password");
  demoPasswordHash ??= hashPassword(DEMO_PASSWORD);
  await db().$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await seedDemoWorkspace(db(), { passwordHash: demoPasswordHash });
  return db();
}

export async function freshWorkspace() {
  vi.resetModules();
  const client = await resetDatabase();
  const data = await import("@/lib/data");
  const auth = await import("@/lib/auth");
  const events = await import("@/app/events/actions");
  const budget = await import("@/app/events/budget-actions");
  const tasks = await import("@/app/tasks/actions");
  const app = await import("@/app/actions");
  const reminders = await import("@/app/reminders/actions");
  const invites = await import("@/app/members/invite-actions");
  const signup = await import("@/app/invite/[token]/actions");

  let signedInAs: string | null = null;
  const signInAs = (memberId: string) => {
    signedInAs = memberId;
    cookieJar.set(auth.SESSION_COOKIE, auth.createSessionToken(memberId));
  };
  const signOut = () => {
    signedInAs = null;
    cookieJar.clear();
  };
  const user = async () => (await data.getMemberById(signedInAs))!;
  const actAs = (role: AccessRole) => data.updateMemberAccessRole(ME, role);

  signOut();
  signInAs(ME);

  return { db: client, data, events, budget, tasks, app, reminders, invites, signup, me: ME, user, actAs, signInAs, signOut };
}

export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

export function eventInput(overrides: Partial<EventInput> = {}): EventInput {
  return {
    title: "Careers Panel",
    description: "Alumni panel on graduate roles.",
    date: hoursFromNow(24 * 14),
    location: "Monash LTB",
    ...overrides,
  };
}

export function taskInput(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    title: "Book the room",
    description: "Reserve a room for 60 people.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: hoursFromNow(72),
    assigneeIds: ["m2"],
    eventId: null,
    ...overrides,
  };
}
