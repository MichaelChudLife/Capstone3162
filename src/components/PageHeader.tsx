import { getRemindersForMember, getMembers, getEvents, hasPermission } from "@/lib/data";
import { requireCurrentMember } from "@/lib/auth";
import { reminderLabel } from "@/lib/reminder-rules";
import NotificationsBell, { type BellItem } from "@/components/NotificationsBell";
import NewTaskButton from "@/components/NewTaskButton";

export default async function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const user = await requireCurrentMember();
  const now = new Date();
  const items: BellItem[] = getRemindersForMember(user.id, now).map(({ reminder, task }) => ({
    id: reminder.id,
    taskId: task.id,
    title: task.title,
    label: reminderLabel(reminder.dueDate, now),
    kind: reminder.kind,
    unread: reminder.readAt === null,
  }));

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--ink)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {hasPermission("manage_tasks", user) && <NewTaskButton members={getMembers()} events={getEvents()} />}
        <NotificationsBell items={items} />
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: user.color }}
          title={`${user.name} · ${user.accessRole}`}
          aria-label={`Logged in as ${user.name}`}
        >
          {user.initials}
        </span>
      </div>
    </header>
  );
}
