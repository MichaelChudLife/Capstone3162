import type { PrismaClient } from "@/generated/prisma/client";
import type { AccessRole, Priority, TaskStatus } from "./types";
import { ROLE_TO_DB } from "./db-enums";

export const DEMO_PASSWORD = "Committee2026!";

export function seedPassword(env: Record<string, string | undefined>): string {
  const hosted = Boolean(env.VERCEL) || env.NODE_ENV === "production";
  const password = env.SEED_PASSWORD || (hosted ? "" : DEMO_PASSWORD);
  if (password.length < 10) {
    throw new Error("Set SEED_PASSWORD to at least 10 characters before seeding a hosted database.");
  }
  return password;
}

function hoursOffset(now: Date, hours: number): Date {
  const d = new Date(now.getTime() + hours * 3600000);
  d.setSeconds(0, 0);
  return d;
}

function dayOffset(now: Date, days: number, hour = 17, minute = 0): Date {
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

interface SeedMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  accessRole: AccessRole;
  email: string;
}

interface SeedTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date;
  assigneeIds: string[];
  eventId: string | null;
  createdAt: Date;
}

export const DEMO_MEMBERS: SeedMember[] = [
  { id: "m1", name: "Michael Zhang", initials: "MZ", color: "#4f46e5", role: "Tech Lead", accessRole: "IT Director", email: "michael@cca.org.au" },
  { id: "m2", name: "Yahya Al-Rawi", initials: "YA", color: "#0ea5e9", role: "Backend", accessRole: "Events Director", email: "yahya@cca.org.au" },
  { id: "m3", name: "Nathanael Khor", initials: "NK", color: "#16a34a", role: "Frontend", accessRole: "Marketing Director", email: "nathanael@cca.org.au" },
  { id: "m4", name: "YunSoo Jin", initials: "YJ", color: "#db2777", role: "Full-stack", accessRole: "Committee Director", email: "yunsoo@cca.org.au" },
  { id: "m5", name: "Sener Sethi", initials: "SS", color: "#f59e0b", role: "QA & Docs", accessRole: "Committee Member", email: "sener@cca.org.au" },
];

function demoEvents(now: Date) {
  return [
    {
      id: "e1",
      title: "Industry Networking Night",
      date: dayOffset(now, 9, 18, 30),
      location: "Monash LTB Foyer",
      description: "Flagship semester event connecting members with commerce and tech recruiters.",
    },
    {
      id: "e2",
      title: "Semester 2 Welcome BBQ",
      date: dayOffset(now, 3, 12, 0),
      location: "Lemon Scented Lawns",
      description: "Kick-off social to onboard new members and introduce the committee.",
    },
    {
      id: "e3",
      title: "Intro to Quant Finance Workshop",
      date: dayOffset(now, 16, 13, 0),
      location: "Woodside Building 3.01",
      description: "Hands-on workshop run with the Quant Society covering Python for finance.",
    },
    {
      id: "e4",
      title: "Weekly Committee Meeting",
      date: dayOffset(now, 1, 18, 0),
      location: "Zoom",
      description: "Standing weekly sync to track deliverables and blockers.",
    },
  ];
}

function demoTasks(now: Date): SeedTask[] {
  const day = (days: number, hour?: number, minute?: number) => dayOffset(now, days, hour, minute);
  return [
    { id: "t1", title: "Confirm catering headcount", description: "Lock in final numbers with the caterer for the BBQ.", status: "IN_PROGRESS", priority: "HIGH", dueDate: day(-1), assigneeIds: ["m4"], eventId: "e2", createdAt: day(-6) },
    { id: "t2", title: "Design event poster", description: "A3 poster for the Networking Night, on-brand with CCA palette.", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: day(2), assigneeIds: ["m3", "m4"], eventId: "e1", createdAt: day(-4) },
    { id: "t3", title: "Email recruiter partners", description: "Send invitations and confirm attendance from partner firms.", status: "TODO", priority: "HIGH", dueDate: day(1), assigneeIds: ["m2"], eventId: "e1", createdAt: day(-3) },
    { id: "t4", title: "Book Woodside room 3.01", description: "Reserve the workshop room and AV equipment.", status: "TODO", priority: "MEDIUM", dueDate: day(4), assigneeIds: ["m5"], eventId: "e3", createdAt: day(-2) },
    { id: "t5", title: "Draft workshop slide deck", description: "Intro to Quant Finance content, ~20 slides.", status: "TODO", priority: "LOW", dueDate: day(10), assigneeIds: ["m1"], eventId: "e3", createdAt: day(-1) },
    { id: "t6", title: "Prepare committee agenda", description: "Collate updates and blockers for the weekly sync.", status: "TODO", priority: "MEDIUM", dueDate: day(0, 12, 0), assigneeIds: ["m1"], eventId: "e4", createdAt: day(-1) },
    { id: "t7", title: "Set up ticketing form", description: "Create the RSVP and ticketing flow for Networking Night.", status: "TODO", priority: "HIGH", dueDate: day(3), assigneeIds: ["m4"], eventId: "e1", createdAt: day(-2) },
    { id: "t8", title: "Post BBQ announcement", description: "Instagram and Discord announcement with sign-up link.", status: "DONE", priority: "MEDIUM", dueDate: day(-4), assigneeIds: ["m3"], eventId: "e2", createdAt: day(-8) },
    { id: "t9", title: "Reconcile sponsorship budget", description: "Match sponsor commitments against the semester budget sheet.", status: "DONE", priority: "LOW", dueDate: day(-6), assigneeIds: ["m5"], eventId: null, createdAt: day(-10) },
    { id: "t10", title: "Order printed name tags", description: "Name tags for committee and volunteers at the BBQ.", status: "TODO", priority: "LOW", dueDate: day(2, 12, 0), assigneeIds: ["m2"], eventId: "e2", createdAt: day(-1) },
    { id: "t11", title: "Finalise run sheet", description: "Minute-by-minute run sheet for Networking Night.", status: "IN_PROGRESS", priority: "HIGH", dueDate: day(6), assigneeIds: ["m1", "m2"], eventId: "e1", createdAt: day(-2) },
    { id: "t12", title: "Finalise sponsor deck", description: "Pull final logos and tiers into the sponsor deck for Networking Night.", status: "IN_PROGRESS", priority: "HIGH", dueDate: day(-1), assigneeIds: ["m1"], eventId: "e1", createdAt: day(-7) },
    { id: "t13", title: "Confirm guest speaker availability", description: "Lock in the keynote speaker and confirm their slot.", status: "DONE", priority: "LOW", dueDate: day(-1), assigneeIds: ["m1"], eventId: "e1", createdAt: day(-9) },
    { id: "t14", title: "Recruit event photographers", description: "Find two volunteers to cover photos for socials on the night.", status: "TODO", priority: "MEDIUM", dueDate: day(5), assigneeIds: [], eventId: "e1", createdAt: day(-1) },
    { id: "t15", title: "Submit BBQ food safety checklist", description: "Complete the campus food safety form and upload it to the events portal.", status: "IN_PROGRESS", priority: "HIGH", dueDate: hoursOffset(now, 20), assigneeIds: ["m5"], eventId: "e2", createdAt: day(-3) },
    { id: "t16", title: "Send volunteer roster", description: "Share the BBQ volunteer shifts with the committee group chat.", status: "TODO", priority: "MEDIUM", dueDate: hoursOffset(now, -3), assigneeIds: ["m5", "m4"], eventId: "e2", createdAt: day(-4) },
  ];
}

function demoStatusChanges(now: Date) {
  return [
    { id: "s1", taskId: "t1", fromStatus: "TODO", toStatus: "IN_PROGRESS", actorId: "m4", at: dayOffset(now, -2, 10, 15) },
    { id: "s2", taskId: "t2", fromStatus: "TODO", toStatus: "IN_PROGRESS", actorId: "m3", at: dayOffset(now, -2, 14, 40) },
    { id: "s3", taskId: "t8", fromStatus: "TODO", toStatus: "IN_PROGRESS", actorId: "m3", at: dayOffset(now, -6, 9, 5) },
    { id: "s4", taskId: "t8", fromStatus: "IN_PROGRESS", toStatus: "DONE", actorId: "m3", at: dayOffset(now, -5, 16, 30) },
    { id: "s5", taskId: "t15", fromStatus: "TODO", toStatus: "IN_PROGRESS", actorId: "m5", at: dayOffset(now, -1, 11, 20) },
  ] as const;
}

function demoBudgetItems(now: Date) {
  return [
    { id: "b1", eventId: "e1", description: "Venue hire — LTB Foyer", expectedCents: 120000, actualCents: 120000, createdAt: dayOffset(now, -12) },
    { id: "b2", eventId: "e1", description: "Catering — canapés and drinks", expectedCents: 280000, actualCents: 312550, createdAt: dayOffset(now, -11) },
    { id: "b3", eventId: "e1", description: "Printing — posters and name tags", expectedCents: 45000, actualCents: 38000, createdAt: dayOffset(now, -8) },
    { id: "b4", eventId: "e1", description: "Photographer", expectedCents: 60000, actualCents: null, createdAt: dayOffset(now, -5) },
    { id: "b5", eventId: "e2", description: "BBQ food and drinks", expectedCents: 90000, actualCents: 84520, createdAt: dayOffset(now, -7) },
    { id: "b6", eventId: "e2", description: "Equipment hire", expectedCents: 25000, actualCents: null, createdAt: dayOffset(now, -6) },
  ];
}

export async function seedDemoWorkspace(client: PrismaClient, options: { passwordHash: string; now?: Date }): Promise<void> {
  const now = options.now ?? new Date();
  const memberSince = new Date(now.getTime() - 30 * 86400000);
  await client.$transaction(async (tx) => {
    await tx.member.createMany({
      data: DEMO_MEMBERS.map((member, index) => ({
        ...member,
        accessRole: ROLE_TO_DB[member.accessRole],
        passwordHash: options.passwordHash,
        createdAt: new Date(memberSince.getTime() + index * 1000),
      })),
    });
    await tx.event.createMany({ data: demoEvents(now) });
    for (const { assigneeIds, ...task } of demoTasks(now)) {
      await tx.task.create({ data: { ...task, assignees: { connect: assigneeIds.map((id) => ({ id })) } } });
    }
    await tx.taskStatusChange.createMany({ data: [...demoStatusChanges(now)] });
    await tx.budgetItem.createMany({ data: demoBudgetItems(now) });
    await tx.workspace.upsert({ where: { id: 1 }, update: {}, create: { id: 1, version: 1 } });
  });
}
