import PageHeader from "@/components/PageHeader";
import { getEvents, getTasks, getMemberById } from "@/lib/data";
import { Avatar } from "@/components/ui";
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

export default function EventsPage() {
  const events = getEvents();
  const tasks = getTasks();

  return (
    <div className="space-y-6">
      <PageHeader title="Events" subtitle={`${events.length} events this semester, with their linked tasks.`} />

      <div className="grid gap-5 md:grid-cols-2">
        {events.map((ev) => {
          const linked = tasks.filter((t) => t.eventId === ev.id);
          const done = linked.filter((t) => t.status === "DONE").length;
          const pct = linked.length ? Math.round((done / linked.length) * 100) : 0;
          const assignees = [...new Set(linked.map((t) => t.assigneeId).filter(Boolean))]
            .map((id) => getMemberById(id))
            .filter(Boolean)
            .slice(0, 5);
          const { day, month, time, weekday } = dateParts(ev.date);
          return (
            <article key={ev.id} className="card flex flex-col p-5">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="text-xs font-semibold">{month}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--ink)]">{ev.title}</h2>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <CalendarIcon width={13} height={13} />
                    {weekday}, {time}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <MapPinIcon width={13} height={13} />
                    {ev.location}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--muted)]">{ev.description}</p>

              <div className="mt-auto pt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--ink)]">{done}/{linked.length} tasks done</span>
                  <span className="text-[var(--muted)]">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex -space-x-2">
                  {assignees.map((m) => (
                    <span key={m!.id} className="ring-2 ring-[var(--surface)] rounded-full">
                      <Avatar member={m!} size={28} />
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
