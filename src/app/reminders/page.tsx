import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import { getReminders, getRemindersForMember, getMembers, getEvents, hasPermission } from "@/lib/data";
import { requireCurrentMember } from "@/lib/auth";
import { reminderLabel, REMINDER_TITLE, DUE_SOON_HOURS } from "@/lib/reminder-rules";
import { timeAgo } from "@/lib/format";
import { AvatarStack, PriorityTag, UnassignedFlag, assigneeNames } from "@/components/ui";
import { AlertIcon, ClockIcon } from "@/components/icons";
import type { CcaEvent, Member, ReminderKind, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

const groups: { kind: ReminderKind; color: string; soft: string; Icon: typeof AlertIcon }[] = [
  { kind: "overdue", color: "var(--danger)", soft: "var(--danger-soft)", Icon: AlertIcon },
  { kind: "due_soon", color: "var(--warn)", soft: "var(--warn-soft)", Icon: ClockIcon },
];

interface Row {
  key: string;
  task: Task;
  kind: ReminderKind;
  unread?: boolean;
  firedAt?: string;
  assignees: Member[];
  event?: CcaEvent;
}

function ReminderRow({ row, now }: { row: Row; now: Date }) {
  const { assignees, event } = row;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      <AvatarStack members={assignees} size={34} max={2} />
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex items-center gap-2">
          <Link href={`/tasks/${row.task.id}`} className="truncate text-sm font-medium text-[var(--ink)] hover:underline">
            {row.task.title}
          </Link>
          {row.unread && (
            <span className="shrink-0 rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">New</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-[var(--muted)]">
          {assignees.length > 0 ? assigneeNames(assignees) : <UnassignedFlag compact />}
          {event ? <span className="truncate">· {event.title}</span> : null}
          {row.firedAt ? <span className="truncate">· reminded {timeAgo(row.firedAt, now.getTime())}</span> : null}
        </div>
      </div>
      <PriorityTag priority={row.task.priority} />
      <span
        className="whitespace-nowrap text-sm font-medium"
        style={{ color: row.kind === "overdue" ? "var(--danger)" : "var(--warn)" }}
      >
        {row.task.dueDate ? reminderLabel(row.task.dueDate, now) : ""}
      </span>
    </li>
  );
}

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireCurrentMember();
  const { view } = await searchParams;
  const now = new Date();
  const canSeeCommittee = hasPermission("manage_tasks", user);
  const showCommittee = canSeeCommittee && view === "committee";

  const [members, events, entries] = await Promise.all([
    getMembers(),
    getEvents(),
    showCommittee
      ? getReminders(user, now).then((list) => list.map((r) => ({ key: r.task.id, task: r.task, kind: r.kind })))
      : getRemindersForMember(user.id, now).then((list) =>
          list.map(({ reminder, task }) => ({
            key: reminder.id,
            task,
            kind: reminder.kind,
            unread: reminder.readAt === null,
            firedAt: reminder.firedAt,
          })),
        ),
  ]);
  const memberById = new Map(members.map((member) => [member.id, member]));
  const eventById = new Map(events.map((event) => [event.id, event]));
  const rows: Row[] = entries.map((entry) => ({
    ...entry,
    assignees: entry.task.assigneeIds.flatMap((id) => memberById.get(id) ?? []),
    event: entry.task.eventId ? eventById.get(entry.task.eventId) : undefined,
  }));

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <PageHeader
          title="Reminders"
          subtitle={`In-app reminders fire ${DUE_SOON_HOURS} hours before a deadline and again once it passes.`}
        />

        {canSeeCommittee && (
          <nav aria-label="Reminder scope" className="inline-flex rounded-xl bg-[var(--surface-2)] p-1">
            <Link href="/reminders" aria-current={!showCommittee ? "page" : undefined} className={tabClass(!showCommittee)}>
              Mine
            </Link>
            <Link href="/reminders?view=committee" aria-current={showCommittee ? "page" : undefined} className={tabClass(showCommittee)}>
              Whole committee
            </Link>
          </nav>
        )}

        {rows.length === 0 && (
          <div className="card px-6 py-12 text-center">
            <div className="text-base font-semibold text-[var(--ink)]">Nothing due in the next {DUE_SOON_HOURS} hours</div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {showCommittee ? "No committee task is close to its deadline." : "You'll get a reminder here when one of your tasks is close to its deadline."}
            </p>
          </div>
        )}

        {groups.map((g) => {
          const items = rows.filter((r) => r.kind === g.kind);
          if (items.length === 0) return null;
          return (
            <section key={g.kind} className="card overflow-hidden">
              <header className="flex items-center gap-2 px-5 py-3.5" style={{ background: g.soft, color: g.color }}>
                <g.Icon width={17} height={17} />
                <span className="text-sm font-semibold">{REMINDER_TITLE[g.kind]}</span>
                <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">{items.length}</span>
              </header>
              <ul className="divide-y divide-[var(--border)]">
                {items.map((row) => (
                  <ReminderRow key={row.key} row={row} now={now} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
