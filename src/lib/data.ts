import {
  ROLE_PERMISSIONS,
  type AccessRole,
  type Member,
  type CcaEvent,
  type Task,
  type TaskStatus,
  type Priority,
  type Permission,
  type EventInput,
  type TaskInput,
} from "./types";
import { hashPassword } from "./password";

// Demo seed data only — every member shares this password so the app can be
// tried out as any role. Not a pattern to carry into a real deployment.
const DEMO_PASSWORD = "Committee2026!";

function dayOffset(days: number, hour = 17, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const members: Member[] = [
  { id: "m1", name: "Michael Zhang", initials: "MZ", color: "#4f46e5", role: "Tech Lead", accessRole: "IT Director", email: "michael@cca.org.au", passwordHash: hashPassword(DEMO_PASSWORD) },
  { id: "m2", name: "Yahya Al-Rawi", initials: "YA", color: "#0ea5e9", role: "Backend", accessRole: "Events Director", email: "yahya@cca.org.au", passwordHash: hashPassword(DEMO_PASSWORD) },
  { id: "m3", name: "Nathanael Khor", initials: "NK", color: "#16a34a", role: "Frontend", accessRole: "Marketing Director", email: "nathanael@cca.org.au", passwordHash: hashPassword(DEMO_PASSWORD) },
  { id: "m4", name: "YunSoo Jin", initials: "YJ", color: "#db2777", role: "Full-stack", accessRole: "Committee Director", email: "yunsoo@cca.org.au", passwordHash: hashPassword(DEMO_PASSWORD) },
  { id: "m5", name: "Sener Sethi", initials: "SS", color: "#f59e0b", role: "QA & Docs", accessRole: "Committee Member", email: "sener@cca.org.au", passwordHash: hashPassword(DEMO_PASSWORD) },
];

// The identity of the signed-in member for the current request. Real
// requests set this from the session cookie (see lib/auth.ts); it defaults
// to m1 so the existing unit tests — which exercise permission logic
// directly and have no HTTP session — keep working unchanged.
export let currentUserId = "m1";

export function setCurrentUserId(id: string): void {
  currentUserId = id;
}

export function getCurrentUser(): Member {
  return members.find((member) => member.id === currentUserId)!;
}

export function getMemberByEmail(email: string): Member | undefined {
  const target = email.trim().toLowerCase();
  return members.find((member) => member.email.toLowerCase() === target);
}

export function hasPermission(permission: Permission, member = getCurrentUser()): boolean {
  return ROLE_PERMISSIONS[member.accessRole].includes(permission);
}

// Committee Directors (and other manage_tasks roles) can update any task.
// Committee Members can only update the status of tasks assigned to them.
export function canUpdateTask(task: Task, member = getCurrentUser()): boolean {
  if (hasPermission("manage_tasks", member)) return true;
  return hasPermission("update_own_tasks", member) && task.assigneeIds.includes(member.id);
}

export function updateMemberAccessRole(memberId: string, accessRole: AccessRole): void {
  const member = members.find((item) => item.id === memberId);
  if (member) member.accessRole = accessRole;
}

export const events: CcaEvent[] = [
  {
    id: "e1",
    title: "Industry Networking Night",
    date: dayOffset(9, 18, 30),
    location: "Monash LTB Foyer",
    description: "Flagship semester event connecting members with commerce and tech recruiters.",
  },
  {
    id: "e2",
    title: "Semester 2 Welcome BBQ",
    date: dayOffset(3, 12, 0),
    location: "Lemon Scented Lawns",
    description: "Kick-off social to onboard new members and introduce the committee.",
  },
  {
    id: "e3",
    title: "Intro to Quant Finance Workshop",
    date: dayOffset(16, 13, 0),
    location: "Woodside Building 3.01",
    description: "Hands-on workshop run with the Quant Society covering Python for finance.",
  },
  {
    id: "e4",
    title: "Weekly Committee Meeting",
    date: dayOffset(1, 18, 0),
    location: "Zoom",
    description: "Standing weekly sync to track deliverables and blockers.",
  },
];

export const tasks: Task[] = [
  {
    id: "t1",
    title: "Confirm catering headcount",
    description: "Lock in final numbers with the caterer for the BBQ.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: dayOffset(-1),
    assigneeIds: ["m4"],
    eventId: "e2",
    createdAt: dayOffset(-6),
  },
  {
    id: "t2",
    title: "Design event poster",
    description: "A3 poster for the Networking Night, on-brand with CCA palette.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    dueDate: dayOffset(2),
    assigneeIds: ["m3", "m4"],
    eventId: "e1",
    createdAt: dayOffset(-4),
  },
  {
    id: "t3",
    title: "Email recruiter partners",
    description: "Send invitations and confirm attendance from partner firms.",
    status: "TODO",
    priority: "HIGH",
    dueDate: dayOffset(1),
    assigneeIds: ["m2"],
    eventId: "e1",
    createdAt: dayOffset(-3),
  },
  {
    id: "t4",
    title: "Book Woodside room 3.01",
    description: "Reserve the workshop room and AV equipment.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: dayOffset(4),
    assigneeIds: ["m5"],
    eventId: "e3",
    createdAt: dayOffset(-2),
  },
  {
    id: "t5",
    title: "Draft workshop slide deck",
    description: "Intro to Quant Finance content, ~20 slides.",
    status: "TODO",
    priority: "LOW",
    dueDate: dayOffset(10),
    assigneeIds: ["m1"],
    eventId: "e3",
    createdAt: dayOffset(-1),
  },
  {
    id: "t6",
    title: "Prepare committee agenda",
    description: "Collate updates and blockers for the weekly sync.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: dayOffset(0, 12, 0),
    assigneeIds: ["m1"],
    eventId: "e4",
    createdAt: dayOffset(-1),
  },
  {
    id: "t7",
    title: "Set up ticketing form",
    description: "Create the RSVP and ticketing flow for Networking Night.",
    status: "TODO",
    priority: "HIGH",
    dueDate: dayOffset(3),
    assigneeIds: ["m4"],
    eventId: "e1",
    createdAt: dayOffset(-2),
  },
  {
    id: "t8",
    title: "Post BBQ announcement",
    description: "Instagram and Discord announcement with sign-up link.",
    status: "DONE",
    priority: "MEDIUM",
    dueDate: dayOffset(-4),
    assigneeIds: ["m3"],
    eventId: "e2",
    createdAt: dayOffset(-8),
  },
  {
    id: "t9",
    title: "Reconcile sponsorship budget",
    description: "Match sponsor commitments against the semester budget sheet.",
    status: "DONE",
    priority: "LOW",
    dueDate: dayOffset(-6),
    assigneeIds: ["m5"],
    eventId: null,
    createdAt: dayOffset(-10),
  },
  {
    id: "t10",
    title: "Order printed name tags",
    description: "Name tags for committee and volunteers at the BBQ.",
    status: "TODO",
    priority: "LOW",
    dueDate: dayOffset(2, 12, 0),
    assigneeIds: ["m2"],
    eventId: "e2",
    createdAt: dayOffset(-1),
  },
  {
    id: "t11",
    title: "Finalise run sheet",
    description: "Minute-by-minute run sheet for Networking Night.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: dayOffset(6),
    assigneeIds: ["m1", "m2"],
    eventId: "e1",
    createdAt: dayOffset(-2),
  },
  {
    id: "t12",
    title: "Finalise sponsor deck",
    description: "Pull final logos and tiers into the sponsor deck for Networking Night.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: dayOffset(-1),
    assigneeIds: ["m1"],
    eventId: "e1",
    createdAt: dayOffset(-7),
  },
  {
    id: "t13",
    title: "Confirm guest speaker availability",
    description: "Lock in the keynote speaker and confirm their slot.",
    status: "DONE",
    priority: "LOW",
    dueDate: dayOffset(-1),
    assigneeIds: ["m1"],
    eventId: "e1",
    createdAt: dayOffset(-9),
  },
  {
    id: "t14",
    title: "Recruit event photographers",
    description: "Find two volunteers to cover photos for socials on the night.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: dayOffset(5),
    assigneeIds: [],
    eventId: "e1",
    createdAt: dayOffset(-1),
  },
];

let taskSeq = tasks.length;
let eventSeq = events.length;

const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function compareByDeadlineThenPriority(a: Task, b: Task): number {
  const due = (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9");
  return due !== 0 ? due : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

export function getMembers(): Member[] {
  return members;
}

export function getMemberById(id: string | null): Member | undefined {
  if (!id) return undefined;
  return members.find((m) => m.id === id);
}

export function getMembersByIds(ids: string[]): Member[] {
  return ids.map((id) => members.find((m) => m.id === id)).filter((m): m is Member => Boolean(m));
}

export function getEvents(): CcaEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

export function getEventById(id: string | null): CcaEvent | undefined {
  if (!id) return undefined;
  return events.find((e) => e.id === id);
}

export function createEvent(input: EventInput): CcaEvent {
  eventSeq += 1;
  const event: CcaEvent = {
    id: `e${eventSeq}`,
    title: input.title,
    description: input.description,
    date: input.date,
    location: input.location,
  };
  events.push(event);
  return event;
}

export function updateEvent(id: string, input: EventInput): CcaEvent | undefined {
  const event = events.find((e) => e.id === id);
  if (!event) return undefined;
  Object.assign(event, input);
  return event;
}

export function deleteEvent(id: string): { event: CcaEvent; removedTaskIds: string[] } | undefined {
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return undefined;
  const [event] = events.splice(index, 1);
  const removedTaskIds: string[] = [];
  for (let i = tasks.length - 1; i >= 0; i -= 1) {
    if (tasks[i].eventId === id) {
      removedTaskIds.push(tasks[i].id);
      tasks.splice(i, 1);
    }
  }
  return { event, removedTaskIds: removedTaskIds.reverse() };
}

export function getTasks(): Task[] {
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function getTasksForEvent(eventId: string): Task[] {
  return tasks.filter((t) => t.eventId === eventId).sort(compareByDeadlineThenPriority);
}

export function getTasksByStatus(status: TaskStatus): Task[] {
  return tasks
    .filter((t) => t.status === status)
    .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"));
}

export function createTask(input: TaskInput): Task {
  taskSeq += 1;
  const task: Task = {
    id: `t${taskSeq}`,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    assigneeIds: [...input.assigneeIds],
    eventId: input.eventId,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
}

export function updateTask(id: string, input: TaskInput): Task | undefined {
  const task = tasks.find((t) => t.id === id);
  if (!task) return undefined;
  Object.assign(task, { ...input, assigneeIds: [...input.assigneeIds] });
  return task;
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  const task = tasks.find((t) => t.id === id);
  if (task) task.status = status;
}

export interface Reminder {
  task: Task;
  urgency: "overdue" | "today" | "soon";
  daysUntil: number;
}

export function getReminders(): Reminder[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const items: Reminder[] = [];
  for (const task of tasks) {
    if (task.status === "DONE" || !task.dueDate) continue;
    const due = new Date(task.dueDate);
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const daysUntil = Math.round((startOfDue - startOfToday) / 86400000);
    if (daysUntil < 0) items.push({ task, urgency: "overdue", daysUntil });
    else if (daysUntil === 0) items.push({ task, urgency: "today", daysUntil });
    else if (daysUntil <= 3) items.push({ task, urgency: "soon", daysUntil });
  }
  const rank = { overdue: 0, today: 1, soon: 2 };
  return items.sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.daysUntil - b.daysUntil);
}

export interface DashboardStats {
  open: number;
  inProgress: number;
  overdue: number;
  dueThisWeek: number;
  done: number;
  total: number;
  completionRate: number;
}

export function getDashboardStats(memberId?: string): DashboardStats {
  const scope = memberId ? tasks.filter((t) => t.assigneeIds.includes(memberId)) : tasks;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let open = 0, inProgress = 0, overdue = 0, dueThisWeek = 0, done = 0;
  for (const task of scope) {
    if (task.status === "DONE") { done += 1; continue; }
    open += 1;
    if (task.status === "IN_PROGRESS") inProgress += 1;
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
      const daysUntil = Math.round((startOfDue - startOfToday) / 86400000);
      if (daysUntil < 0) overdue += 1;
      else if (daysUntil <= 7) dueThisWeek += 1;
    }
  }
  const total = scope.length;
  return {
    open, inProgress, overdue, dueThisWeek, done, total,
    completionRate: total ? Math.round((done / total) * 100) : 0,
  };
}
