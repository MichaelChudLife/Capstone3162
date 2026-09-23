import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { getReminders, getMembersByIds, getEventById } from "@/lib/data";
import { AvatarStack, DueBadge, PriorityTag, UnassignedFlag, assigneeNames } from "@/components/ui";
import { AlertIcon, ClockIcon, BellIcon } from "@/components/icons";
import type { Reminder } from "@/lib/data";

const groups = [
  { key: "overdue", title: "Overdue", color: "var(--danger)", soft: "var(--danger-soft)", Icon: AlertIcon },
  { key: "today", title: "Due today", color: "var(--warn)", soft: "var(--warn-soft)", Icon: ClockIcon },
  { key: "soon", title: "Due soon", color: "var(--warn)", soft: "var(--warn-soft)", Icon: BellIcon },
] as const;

export const dynamic = "force-dynamic";

export default function RemindersPage() {
  const reminders = getReminders();

  return (
    <AppShell>
      <div className="space-y-6">
      <PageHeader title="Reminders" subtitle={`Auto-generated from task deadlines. ${reminders.length} task${reminders.length === 1 ? "" : "s"} need attention.`} />

      {groups.map((g) => {
        const items = reminders.filter((r) => r.urgency === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="card overflow-hidden">
            <header className="flex items-center gap-2 px-5 py-3.5" style={{ background: g.soft, color: g.color }}>
              <g.Icon width={17} height={17} />
              <span className="text-sm font-semibold">{g.title}</span>
              <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">{items.length}</span>
            </header>
            <ul className="divide-y divide-[var(--border)]">
              {items.map((r: Reminder) => {
                const assignees = getMembersByIds(r.task.assigneeIds);
                const event = getEventById(r.task.eventId);
                return (
                  <li key={r.task.id} className="flex items-center gap-4 px-5 py-4">
                    <AvatarStack members={assignees} size={34} max={2} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/tasks/${r.task.id}`} className="block truncate text-sm font-medium text-[var(--ink)] hover:underline">
                        {r.task.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-[var(--muted)]">
                        {assignees.length > 0 ? assigneeNames(assignees) : <UnassignedFlag compact />}
                        {event ? <span className="truncate">· {event.title}</span> : null}
                      </div>
                    </div>
                    <PriorityTag priority={r.task.priority} />
                    <DueBadge dueDate={r.task.dueDate} />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
    </AppShell>
  );
}
