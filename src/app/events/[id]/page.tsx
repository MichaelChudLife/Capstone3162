import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import EventActions from "@/components/EventActions";
import NewTaskButton from "@/components/NewTaskButton";
import BudgetPanel from "@/components/BudgetPanel";
import { AvatarStack, DueText, PriorityInline, StatusPill, UnassignedFlag, assigneeNames } from "@/components/ui";
import { CalendarIcon, MapPinIcon } from "@/components/icons";
import {
  canEditBudgetItem,
  getBudgetItemsForEvent,
  getEventBudgetSummary,
  getEventById,
  getEvents,
  getMembers,
  getMembersByIds,
  getTasksForEvent,
  hasPermission,
} from "@/lib/data";
import { daysUntil } from "@/lib/format";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

function countdown(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return `${Math.abs(d)} day${d === -1 ? "" : "s"} ago`;
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return `In ${d} days`;
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const subTasks = getTasksForEvent(event.id);
  const done = subTasks.filter((t) => t.status === "DONE").length;
  const pct = subTasks.length ? Math.round((done / subTasks.length) * 100) : 0;
  const unassigned = subTasks.filter((t) => t.assigneeIds.length === 0 && t.status !== "DONE").length;
  const canManageEvents = hasPermission("manage_events");
  const canManageTasks = hasPermission("manage_tasks");
  const date = new Date(event.date);
  const budgetItems = getBudgetItemsForEvent(event.id);
  const budgetSummary = getEventBudgetSummary(event.id);
  const editableBudgetIds = budgetItems.filter((item) => canEditBudgetItem(item)).map((item) => item.id);

  return (
    <AppShell>
      <nav className="mb-3 text-sm text-[var(--muted)]">
        <Link href="/events" className="hover:text-[var(--ink)] hover:underline">
          ← All events
        </Link>
      </nav>

      <PageHeader
        title={event.title}
        subtitle={countdown(event.date)}
        actions={
          canManageEvents ? <EventActions event={event} subTaskTitles={subTasks.map((t) => t.title)} /> : undefined
        }
      />

      <section className="card mb-6 p-5">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon width={15} height={15} />
            {date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon width={15} height={15} />
            {event.location || "Location TBC"}
          </span>
        </div>
        {event.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">{event.description}</p>}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--ink)]">
              {subTasks.length === 0 ? "No sub-tasks yet" : `${done}/${subTasks.length} sub-tasks done`}
            </span>
            <span className="text-[var(--muted)]">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section className="card p-2">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--ink)]">Sub-tasks</h2>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{subTasks.length}</span>
            {unassigned > 0 && (
              <span className="text-xs font-medium text-[var(--warn)]">
                · {unassigned} unassigned
              </span>
            )}
          </div>
          {canManageTasks && (
            <NewTaskButton
              members={getMembers()}
              events={getEvents()}
              defaultEventId={event.id}
              lockEvent
              label="Add sub-task"
              variant="subtle"
            />
          )}
        </header>

        {subTasks.length === 0 ? (
          <div className="mx-4 mb-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
            <div className="text-sm font-medium text-[var(--ink)]">Nothing planned yet</div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {canManageTasks ? "Break this event down into sub-tasks and assign them to the committee." : "Sub-tasks added by a director will appear here."}
            </p>
          </div>
        ) : (
          STATUS_ORDER.map((status) => {
            const group = subTasks.filter((t) => t.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status} className="border-t border-[var(--border)] px-4 pb-2 pt-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {STATUS_LABEL[status]} · {group.length}
                </div>
                <ul className="ml-2 border-l-2 border-[var(--border)]">
                  {group.map((task) => {
                    const assignees = getMembersByIds(task.assigneeIds);
                    const isDone = task.status === "DONE";
                    return (
                      <li key={task.id}>
                        <Link
                          href={`/tasks/${task.id}`}
                          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-r-xl py-3 pl-4 pr-2 hover:bg-[var(--surface-2)]"
                        >
                          <div className="min-w-0 flex-1 basis-56">
                            <div
                              className={`truncate text-sm font-medium ${isDone ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"}`}
                            >
                              {task.title}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                              <PriorityInline priority={task.priority} />
                              <span>·</span>
                              {assignees.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <AvatarStack members={assignees} size={18} />
                                  {assigneeNames(assignees)}
                                </span>
                              ) : (
                                <UnassignedFlag compact />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <StatusPill status={task.status} />
                            {isDone ? <span className="text-sm text-[var(--muted)]">Completed</span> : <DueText dueDate={task.dueDate} />}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <div className="mt-6">
        <BudgetPanel
          eventId={event.id}
          items={budgetItems}
          summary={budgetSummary}
          editableIds={editableBudgetIds}
          members={getMembers()}
        />
      </div>
    </AppShell>
  );
}
