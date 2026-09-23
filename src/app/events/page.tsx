import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import NewEventButton from "@/components/NewEventButton";
import { getEvents, getMembersByIds, getTasksForEvent, hasPermission } from "@/lib/data";
import { requireCurrentMember } from "@/lib/auth";
import { AvatarStack, StatusPill } from "@/components/ui";
import { MapPinIcon, CalendarIcon } from "@/components/icons";

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-AU", { day: "2-digit" }),
    month: d.toLocaleDateString("en-AU", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }),
    weekday: d.toLocaleDateString("en-AU", { weekday: "long" }),
  };
}

export const dynamic = "force-dynamic";

const PREVIEW_COUNT = 3;

export default async function EventsPage() {
  const user = await requireCurrentMember();
  const events = getEvents();
  const canManageEvents = hasPermission("manage_events", user);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <PageHeader
          title="Events"
          subtitle={`${events.length} event${events.length === 1 ? "" : "s"} this semester, with their sub-tasks.`}
          actions={canManageEvents ? <NewEventButton /> : undefined}
        />

        {events.length === 0 && (
          <div className="card px-6 py-12 text-center">
            <div className="text-base font-semibold text-[var(--ink)]">No events yet</div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {canManageEvents ? "Create the first event, then break it into sub-tasks." : "A committee director hasn't added any events yet."}
            </p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {events.map((ev) => {
            const subTasks = getTasksForEvent(ev.id);
            const done = subTasks.filter((t) => t.status === "DONE").length;
            const open = subTasks.filter((t) => t.status !== "DONE");
            const pct = subTasks.length ? Math.round((done / subTasks.length) * 100) : 0;
            const assignees = getMembersByIds([...new Set(subTasks.flatMap((t) => t.assigneeIds))]);
            const { day, month, time, weekday } = dateParts(ev.date);
            return (
              <article key={ev.id} className="card flex flex-col p-5">
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                    <span className="text-xl font-bold leading-none">{day}</span>
                    <span className="text-xs font-semibold">{month}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[var(--ink)]">
                      <Link href={`/events/${ev.id}`} className="hover:text-[var(--brand-strong)] hover:underline">
                        {ev.title}
                      </Link>
                    </h2>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <CalendarIcon width={13} height={13} />
                      {weekday}, {time}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <MapPinIcon width={13} height={13} />
                      {ev.location || "Location TBC"}
                    </div>
                  </div>
                </div>

                {ev.description && <p className="mt-4 text-sm text-[var(--muted)]">{ev.description}</p>}

                {open.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-l-2 border-[var(--border)] pl-3">
                    {open.slice(0, PREVIEW_COUNT).map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3">
                        <Link href={`/tasks/${t.id}`} className="truncate text-xs font-medium text-[var(--ink)] hover:underline">
                          {t.title}
                        </Link>
                        <StatusPill status={t.status} />
                      </li>
                    ))}
                    {open.length > PREVIEW_COUNT && (
                      <li className="text-xs text-[var(--muted)]">+{open.length - PREVIEW_COUNT} more open</li>
                    )}
                  </ul>
                )}

                <div className="mt-auto pt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--ink)]">
                      {subTasks.length === 0 ? "No sub-tasks yet" : `${done}/${subTasks.length} sub-tasks done`}
                    </span>
                    <span className="text-[var(--muted)]">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {assignees.length > 0 ? <AvatarStack members={assignees} size={28} max={5} /> : <span />}
                    <Link href={`/events/${ev.id}`} className="text-sm font-semibold text-[var(--brand-strong)] hover:underline">
                      Open event →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
