import PageHeader from "@/components/PageHeader";
import { getTasks, getEvents, getEventById, getDashboardStats } from "@/lib/data";
import { StatusPill, PriorityInline, DueText } from "@/components/ui";
import { daysUntil } from "@/lib/format";
import { AlertIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function DashboardPage() {
  const stats = getDashboardStats();
  const events = getEvents();
  const tasks = getTasks();

  const within48 = tasks.filter((t) => {
    if (t.status === "DONE" || !t.dueDate) return false;
    const hrs = (new Date(t.dueDate).getTime() - Date.now()) / 3600000;
    return hrs >= 0 && hrs <= 48;
  }).length;

  const myTasks = tasks
    .filter((t) => t.assigneeId === "m1")
    .sort((a, b) => {
      if (a.status === "DONE" !== (b.status === "DONE")) return a.status === "DONE" ? 1 : -1;
      return (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9");
    });

  const today = new Date();
  const dateLine = `${today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })} · ${greeting()}, Michael`;

  const tiles = [
    { label: "Overdue", value: stats.overdue, danger: true },
    { label: "Due this week", value: stats.dueThisWeek },
    { label: "Open tasks", value: stats.open },
    { label: "Events", value: events.length },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={dateLine} />

      {stats.overdue > 0 && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-[var(--danger-soft)] px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--danger)]">
            <AlertIcon width={17} height={17} />
            {stats.overdue} task{stats.overdue > 1 ? "s are" : " is"} overdue · {within48} deadline{within48 === 1 ? "" : "s"} within 48 hours
          </div>
          <span className="text-sm font-semibold text-[var(--danger)]">Review →</span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-[var(--surface-2)] px-5 py-4">
            <div className="text-sm font-medium text-[var(--muted)]">{t.label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight" style={{ color: t.danger ? "var(--danger)" : "var(--ink)" }}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <section className="card mb-6 p-2">
        <header className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">My tasks</h2>
          <div className="flex items-center gap-1 text-sm">
            <span className="rounded-full bg-[var(--ink)] px-3 py-1 font-medium text-white">All</span>
            <span className="px-3 py-1 text-[var(--muted)]">High</span>
            <span className="px-3 py-1 text-[var(--muted)]">Medium</span>
            <span className="px-3 py-1 text-[var(--muted)]">Low</span>
          </div>
        </header>
        <ul>
          {myTasks.map((task) => {
            const event = getEventById(task.eventId);
            const done = task.status === "DONE";
            return (
              <li key={task.id} className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-3.5">
                <div className="w-28 shrink-0">
                  <StatusPill status={task.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm font-medium ${done ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"}`}>
                    {task.title}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="truncate">{event?.title ?? "General"}</span>
                    <span>·</span>
                    <PriorityInline priority={task.priority} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {done ? (
                    <span className="text-sm text-[var(--muted)]">Completed</span>
                  ) : (
                    <DueText dueDate={task.dueDate} />
                  )}
                </div>
                <ChevronRight />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-2">
        <header className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">Upcoming events</h2>
          <span className="text-sm font-semibold text-[var(--brand)]">View all</span>
        </header>
        <ul>
          {events.slice(0, 3).map((ev) => {
            const remaining = tasks.filter((t) => t.eventId === ev.id && t.status !== "DONE").length;
            const d = daysUntil(ev.date);
            const imminent = d <= 3;
            const label = d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days`;
            const date = new Date(ev.date);
            return (
              <li key={ev.id} className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-3.5">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--surface-2)]">
                  <span className="text-[10px] font-semibold uppercase text-[var(--muted)]">{date.toLocaleDateString("en-AU", { month: "short" })}</span>
                  <span className="text-lg font-bold leading-none text-[var(--ink)]">{date.toLocaleDateString("en-AU", { day: "2-digit" })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--ink)]">{ev.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })} · {ev.location} · {remaining} task{remaining === 1 ? "" : "s"} remaining
                  </div>
                </div>
                {imminent ? (
                  <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--brand)" }}>
                    {label}
                  </span>
                ) : (
                  <span className="shrink-0 text-sm text-[var(--muted)]">{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
