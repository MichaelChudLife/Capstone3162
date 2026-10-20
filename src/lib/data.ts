import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import {
  ROLE_PERMISSIONS,
  type AccessRole,
  type Member,
  type CcaEvent,
  type Task,
  type BudgetItem,
  type BudgetItemInput,
  type TaskStatus,
  type Priority,
  type Permission,
  type EventInput,
  type TaskInput,
  type StatusChange,
  type TaskReminder,
  type ReminderKind,
  type Invite,
  type InviteInput,
} from "./types";
import { DUE_SOON_HOURS, reminderKindFor } from "./reminder-rules";
import { verifyPassword } from "./password";
import { summariseBudget, type BudgetSummary } from "./money";
import { KIND_FROM_DB, KIND_TO_DB, ROLE_FROM_DB, ROLE_TO_DB } from "./db-enums";

const HOUR = 3600000;

const memberSelect = {
  id: true,
  name: true,
  initials: true,
  color: true,
  role: true,
  accessRole: true,
  email: true,
} satisfies Prisma.MemberSelect;

const memberOrder = [{ createdAt: "asc" }, { id: "asc" }] satisfies Prisma.MemberOrderByWithRelationInput[];

const taskInclude = {
  assignees: { select: { id: true }, orderBy: memberOrder },
} satisfies Prisma.TaskInclude;

type MemberRow = Prisma.MemberGetPayload<{ select: typeof memberSelect }>;
type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
type EventRow = Prisma.EventGetPayload<object>;
type BudgetRow = Prisma.BudgetItemGetPayload<object>;
type StatusChangeRow = Prisma.TaskStatusChangeGetPayload<object>;
type ReminderRow = Prisma.TaskReminderGetPayload<object>;
type InviteRow = Prisma.InviteGetPayload<object>;

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    role: row.role,
    accessRole: ROLE_FROM_DB[row.accessRole],
    email: row.email,
  };
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate?.toISOString() ?? null,
    assigneeIds: row.assignees.map((a) => a.id),
    eventId: row.eventId,
    createdAt: row.createdAt.toISOString(),
  };
}

function toEvent(row: EventRow): CcaEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date.toISOString(),
    location: row.location,
    description: row.description,
  };
}

function toBudgetItem(row: BudgetRow): BudgetItem {
  return {
    id: row.id,
    eventId: row.eventId,
    description: row.description,
    expectedCents: row.expectedCents,
    actualCents: row.actualCents,
    createdAt: row.createdAt.toISOString(),
  };
}

function toStatusChange(row: StatusChangeRow): StatusChange {
  return {
    id: row.id,
    taskId: row.taskId,
    from: row.fromStatus,
    to: row.toStatus,
    actorId: row.actorId,
    at: row.at.toISOString(),
  };
}

function toReminder(row: ReminderRow): TaskReminder {
  return {
    id: row.id,
    taskId: row.taskId,
    memberId: row.memberId,
    kind: KIND_FROM_DB[row.kind],
    dueDate: row.dueDate.toISOString(),
    firedAt: row.firedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

function toInvite(row: InviteRow): Invite {
  return {
    id: row.id,
    email: row.email,
    accessRole: ROLE_FROM_DB[row.accessRole],
    position: row.position,
    tokenHash: row.tokenHash,
    invitedById: row.invitedById,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    acceptedMemberId: row.acceptedMemberId,
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

function date(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

export function hasPermission(permission: Permission, member: Member): boolean {
  return ROLE_PERMISSIONS[member.accessRole].includes(permission);
}

export function canUpdateTask(task: Task, member: Member): boolean {
  if (hasPermission("manage_tasks", member)) return true;
  return task.assigneeIds.includes(member.id);
}

export async function getWorkspaceVersion(): Promise<number> {
  const workspace = await db().workspace.findUnique({ where: { id: 1 } });
  return workspace?.version ?? 1;
}

export async function bumpWorkspaceVersion(): Promise<number> {
  const workspace = await db().workspace.upsert({
    where: { id: 1 },
    update: { version: { increment: 1 } },
    create: { id: 1, version: 2 },
  });
  return workspace.version;
}

export async function getMembers(): Promise<Member[]> {
  const rows = await db().member.findMany({ select: memberSelect, orderBy: memberOrder });
  return rows.map(toMember);
}

export async function getMemberById(id: string | null): Promise<Member | undefined> {
  if (!id) return undefined;
  const row = await db().member.findUnique({ where: { id }, select: memberSelect });
  return row ? toMember(row) : undefined;
}

export async function getMembersByIds(ids: string[]): Promise<Member[]> {
  if (ids.length === 0) return [];
  const rows = await db().member.findMany({ where: { id: { in: ids } }, select: memberSelect });
  const byId = new Map(rows.map((row) => [row.id, toMember(row)]));
  return ids.map((id) => byId.get(id)).filter((m): m is Member => Boolean(m));
}

export async function getMemberByEmail(email: string): Promise<Member | undefined> {
  const row = await db().member.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: memberSelect,
  });
  return row ? toMember(row) : undefined;
}

export async function authenticate(email: string, password: string): Promise<Member | undefined> {
  const row = await db().member.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { ...memberSelect, passwordHash: true },
  });
  if (!row || !verifyPassword(password, row.passwordHash)) return undefined;
  return toMember(row);
}

export async function updateMemberAccessRole(memberId: string, accessRole: AccessRole): Promise<void> {
  await db().member.updateMany({ where: { id: memberId }, data: { accessRole: ROLE_TO_DB[accessRole] } });
}

export async function getEvents(): Promise<CcaEvent[]> {
  const rows = await db().event.findMany({ orderBy: [{ date: "asc" }, { createdAt: "asc" }] });
  return rows.map(toEvent);
}

export async function getEventById(id: string | null): Promise<CcaEvent | undefined> {
  if (!id) return undefined;
  const row = await db().event.findUnique({ where: { id } });
  return row ? toEvent(row) : undefined;
}

export async function createEvent(input: EventInput): Promise<CcaEvent> {
  const row = await db().event.create({
    data: { title: input.title, description: input.description, date: new Date(input.date), location: input.location },
  });
  return toEvent(row);
}

export async function updateEvent(id: string, input: EventInput): Promise<CcaEvent | undefined> {
  const { count } = await db().event.updateMany({
    where: { id },
    data: { title: input.title, description: input.description, date: new Date(input.date), location: input.location },
  });
  return count ? getEventById(id) : undefined;
}

export async function deleteEvent(id: string): Promise<{ event: CcaEvent; removedTaskIds: string[] } | undefined> {
  return db().$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id } });
    if (!event) return undefined;
    const removed = await tx.task.findMany({ where: { eventId: id }, select: { id: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    await tx.event.delete({ where: { id } });
    return { event: toEvent(event), removedTaskIds: removed.map((t) => t.id) };
  });
}

export async function getBudgetItemsForEvent(eventId: string): Promise<BudgetItem[]> {
  const rows = await db().budgetItem.findMany({ where: { eventId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  return rows.map(toBudgetItem);
}

export async function getBudgetItemById(id: string): Promise<BudgetItem | undefined> {
  const row = await db().budgetItem.findUnique({ where: { id } });
  return row ? toBudgetItem(row) : undefined;
}

export async function getBudgetSummary(eventId: string): Promise<BudgetSummary> {
  return summariseBudget(await getBudgetItemsForEvent(eventId));
}

export async function createBudgetItem(eventId: string, input: BudgetItemInput): Promise<BudgetItem> {
  const row = await db().budgetItem.create({
    data: { eventId, description: input.description, expectedCents: input.expectedCents, actualCents: input.actualCents },
  });
  return toBudgetItem(row);
}

export async function updateBudgetItem(id: string, input: BudgetItemInput): Promise<BudgetItem | undefined> {
  const { count } = await db().budgetItem.updateMany({
    where: { id },
    data: { description: input.description, expectedCents: input.expectedCents, actualCents: input.actualCents },
  });
  return count ? getBudgetItemById(id) : undefined;
}

export async function deleteBudgetItem(id: string): Promise<BudgetItem | undefined> {
  const existing = await getBudgetItemById(id);
  if (!existing) return undefined;
  const { count } = await db().budgetItem.deleteMany({ where: { id } });
  return count ? existing : undefined;
}

const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function compareByDeadlineThenPriority(a: Task, b: Task): number {
  const due = (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9");
  return due !== 0 ? due : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

const taskOrder = [{ createdAt: "asc" }, { id: "asc" }] satisfies Prisma.TaskOrderByWithRelationInput[];

export async function getTasks(): Promise<Task[]> {
  const rows = await db().task.findMany({ include: taskInclude, orderBy: taskOrder });
  return rows.map(toTask);
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const row = await db().task.findUnique({ where: { id }, include: taskInclude });
  return row ? toTask(row) : undefined;
}

export async function getTasksForEvent(eventId: string): Promise<Task[]> {
  const rows = await db().task.findMany({ where: { eventId }, include: taskInclude, orderBy: taskOrder });
  return rows.map(toTask).sort(compareByDeadlineThenPriority);
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const rows = await db().task.findMany({
    where: { status },
    include: taskInclude,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, ...taskOrder],
  });
  return rows.map(toTask);
}

export async function createTask(input: TaskInput): Promise<Task> {
  const row = await db().task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: date(input.dueDate),
      eventId: input.eventId,
      assignees: { connect: input.assigneeIds.map((id) => ({ id })) },
    },
    include: taskInclude,
  });
  return toTask(row);
}

export async function updateTask(id: string, input: TaskInput, actorId: string): Promise<Task | undefined> {
  return db().$transaction(async (tx) => {
    const existing = await tx.task.findUnique({ where: { id }, select: { status: true } });
    if (!existing) return undefined;
    const row = await tx.task.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: date(input.dueDate),
        eventId: input.eventId,
        assignees: { set: input.assigneeIds.map((assigneeId) => ({ id: assigneeId })) },
      },
      include: taskInclude,
    });
    if (existing.status !== row.status) {
      await tx.taskStatusChange.create({ data: { taskId: id, fromStatus: existing.status, toStatus: row.status, actorId } });
    }
    return toTask(row);
  });
}

export async function setTaskStatus(id: string, status: TaskStatus, actorId: string): Promise<StatusChange | null> {
  return db().$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id }, select: { status: true } });
    if (!task || task.status === status) return null;
    await tx.task.update({ where: { id }, data: { status } });
    const change = await tx.taskStatusChange.create({
      data: { taskId: id, fromStatus: task.status, toStatus: status, actorId },
    });
    return toStatusChange(change);
  });
}

export async function getStatusHistory(taskId: string): Promise<StatusChange[]> {
  const rows = await db().taskStatusChange.findMany({ where: { taskId }, orderBy: [{ at: "desc" }, { seq: "desc" }] });
  return rows.map(toStatusChange);
}

export interface Reminder {
  task: Task;
  kind: ReminderKind;
}

const KIND_RANK: Record<ReminderKind, number> = { overdue: 0, due_soon: 1 };

function reminderHorizon(now: Date): Date {
  return new Date(now.getTime() + DUE_SOON_HOURS * HOUR);
}

export async function getReminders(member: Member, now = new Date()): Promise<Reminder[]> {
  const rows = await db().task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { not: null, lte: reminderHorizon(now) },
      ...(hasPermission("manage_tasks", member) ? {} : { assignees: { some: { id: member.id } } }),
    },
    include: taskInclude,
    orderBy: taskOrder,
  });
  const items: Reminder[] = [];
  for (const task of rows.map(toTask)) {
    const kind = reminderKindFor(task, now);
    if (kind) items.push({ task, kind });
  }
  return items.sort(
    (a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || (a.task.dueDate ?? "").localeCompare(b.task.dueDate ?? ""),
  );
}

export async function syncReminders(now = new Date()): Promise<number> {
  const rows = await db().task.findMany({
    where: { status: { not: "DONE" }, dueDate: { not: null, lte: reminderHorizon(now) } },
    include: taskInclude,
    orderBy: taskOrder,
  });
  const data: Prisma.TaskReminderCreateManyInput[] = [];
  for (const row of rows) {
    const kind = reminderKindFor(toTask(row), now);
    if (!kind || !row.dueDate) continue;
    for (const { id: memberId } of row.assignees) {
      data.push({ taskId: row.id, memberId, kind: KIND_TO_DB[kind], dueDate: row.dueDate, firedAt: now });
    }
  }
  if (data.length === 0) return 0;
  const { count } = await db().taskReminder.createMany({ data, skipDuplicates: true });
  if (count > 0) await bumpWorkspaceVersion();
  return count;
}

export async function getNextReminderAt(now = new Date()): Promise<string | null> {
  const rows = await db().task.findMany({
    where: { status: { not: "DONE" }, dueDate: { gt: now }, assignees: { some: {} } },
    select: { dueDate: true },
  });
  let next: number | null = null;
  for (const { dueDate } of rows) {
    if (!dueDate) continue;
    const due = dueDate.getTime();
    for (const fireAt of [due - DUE_SOON_HOURS * HOUR, due]) {
      if (fireAt > now.getTime() && (next === null || fireAt < next)) next = fireAt;
    }
  }
  return next === null ? null : new Date(next).toISOString();
}

export interface MemberReminder {
  reminder: TaskReminder;
  task: Task;
}

export async function getRemindersForMember(memberId: string, now = new Date()): Promise<MemberReminder[]> {
  await syncReminders(now);
  const rows = await db().taskReminder.findMany({
    where: { memberId, task: { status: { not: "DONE" }, assignees: { some: { id: memberId } } } },
    include: { task: { include: taskInclude } },
    orderBy: [{ firedAt: "asc" }, { dueDate: "asc" }, { taskId: "asc" }],
  });
  const active: MemberReminder[] = rows
    .filter((row) => row.task.dueDate?.getTime() === row.dueDate.getTime())
    .map((row) => ({ reminder: toReminder(row), task: toTask(row.task) }));
  const overdue = new Set(active.filter((a) => a.reminder.kind === "overdue").map((a) => a.task.id));
  return active
    .filter((a) => !(a.reminder.kind === "due_soon" && overdue.has(a.task.id)))
    .sort(
      (a, b) =>
        Number(a.reminder.readAt !== null) - Number(b.reminder.readAt !== null) ||
        KIND_RANK[a.reminder.kind] - KIND_RANK[b.reminder.kind] ||
        a.reminder.dueDate.localeCompare(b.reminder.dueDate),
    );
}

export async function markReminderRead(id: string, memberId: string, now = new Date()): Promise<boolean> {
  const reminder = await db().taskReminder.findFirst({ where: { id, memberId }, select: { readAt: true } });
  if (!reminder) return false;
  if (!reminder.readAt) await db().taskReminder.update({ where: { id }, data: { readAt: now } });
  return true;
}

export async function markAllRemindersRead(memberId: string, now = new Date()): Promise<number> {
  const unread = (await getRemindersForMember(memberId, now))
    .filter(({ reminder }) => !reminder.readAt)
    .map(({ reminder }) => reminder.id);
  if (unread.length === 0) return 0;
  const { count } = await db().taskReminder.updateMany({ where: { id: { in: unread }, readAt: null }, data: { readAt: now } });
  return count;
}

export const INVITE_TTL_DAYS = 7;

export type InviteState = "pending" | "expired" | "accepted" | "revoked";

export function inviteState(invite: Invite, now = new Date()): InviteState {
  if (invite.acceptedAt) return "accepted";
  if (invite.revokedAt) return "revoked";
  if (new Date(invite.expiresAt).getTime() <= now.getTime()) return "expired";
  return "pending";
}

function inviteExpiry(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 86400000);
}

export async function getOpenInvites(): Promise<Invite[]> {
  const rows = await db().invite.findMany({
    where: { acceptedAt: null, revokedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toInvite);
}

export async function getInviteById(id: string): Promise<Invite | undefined> {
  const row = await db().invite.findUnique({ where: { id } });
  return row ? toInvite(row) : undefined;
}

export async function findInviteByTokenHash(tokenHash: string): Promise<Invite | undefined> {
  const row = await db().invite.findUnique({ where: { tokenHash } });
  return row ? toInvite(row) : undefined;
}

export async function createInvite(input: InviteInput, tokenHash: string, invitedById: string, now = new Date()): Promise<Invite> {
  const row = await db().invite.create({
    data: {
      email: input.email,
      accessRole: ROLE_TO_DB[input.accessRole],
      position: input.position,
      tokenHash,
      invitedById,
      createdAt: now,
      expiresAt: inviteExpiry(now),
    },
  });
  return toInvite(row);
}

export async function renewInvite(id: string, tokenHash: string, now = new Date()): Promise<Invite | undefined> {
  const { count } = await db().invite.updateMany({
    where: { id, acceptedAt: null, revokedAt: null },
    data: { tokenHash, expiresAt: inviteExpiry(now) },
  });
  return count ? getInviteById(id) : undefined;
}

export async function revokeInvite(id: string, now = new Date()): Promise<Invite | undefined> {
  const { count } = await db().invite.updateMany({
    where: { id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  return count ? getInviteById(id) : undefined;
}

const NEW_MEMBER_COLORS = ["#0891b2", "#7c3aed", "#ea580c", "#65a30d", "#be123c", "#0d9488"];

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export async function acceptInvite(
  inviteId: string,
  profile: { name: string; passwordHash: string },
  now = new Date(),
): Promise<Member | undefined> {
  const member = await db().$transaction(async (tx) => {
    const row = await tx.invite.findUnique({ where: { id: inviteId } });
    if (!row || inviteState(toInvite(row), now) !== "pending") return undefined;
    const taken = await tx.member.findFirst({
      where: { email: { equals: row.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (taken) return undefined;
    const memberCount = await tx.member.count();
    const created = await tx.member.create({
      data: {
        name: profile.name,
        initials: initialsFor(profile.name),
        color: NEW_MEMBER_COLORS[memberCount % NEW_MEMBER_COLORS.length],
        role: row.position || "Committee member",
        accessRole: row.accessRole,
        email: row.email,
        passwordHash: profile.passwordHash,
      },
      select: memberSelect,
    });
    const { count } = await tx.invite.updateMany({
      where: { id: inviteId, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: now, acceptedMemberId: created.id },
    });
    if (count !== 1) throw new Error("Invite was used concurrently.");
    return toMember(created);
  });
  if (member) await bumpWorkspaceVersion();
  return member;
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

export async function getDashboardStats(memberId?: string): Promise<DashboardStats> {
  const scope = await db().task.findMany({
    where: memberId ? { assignees: { some: { id: memberId } } } : {},
    select: { status: true, dueDate: true },
  });
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let open = 0, inProgress = 0, overdue = 0, dueThisWeek = 0, done = 0;
  for (const task of scope) {
    if (task.status === "DONE") { done += 1; continue; }
    open += 1;
    if (task.status === "IN_PROGRESS") inProgress += 1;
    if (task.dueDate) {
      const due = task.dueDate;
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
