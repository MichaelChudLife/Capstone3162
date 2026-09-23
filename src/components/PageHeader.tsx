import { getReminders, getMembers, getEvents, hasPermission } from "@/lib/data";
import { dueLabel } from "@/lib/format";
import NotificationsBell, { type BellItem } from "@/components/NotificationsBell";
import NewTaskButton from "@/components/NewTaskButton";

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const items: BellItem[] = getReminders().map((r) => ({
    id: r.task.id,
    title: r.task.title,
    label: dueLabel(r.task.dueDate),
    urgency: r.urgency,
  }));

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--ink)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        {hasPermission("manage_tasks") && <NewTaskButton members={getMembers()} events={getEvents()} />}
        <NotificationsBell items={items} />
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          MZ
        </span>
      </div>
    </header>
  );
}
