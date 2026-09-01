import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import { getTasksByStatus, getMemberById, getEventById, getTasks } from "@/lib/data";
import { STATUS_ORDER, STATUS_LABEL, type TaskStatus } from "@/lib/types";
import { Avatar, DueBadge, PriorityTag } from "@/components/ui";
import MoveMenu from "@/components/MoveMenu";

export const dynamic = "force-dynamic";

const columnDot: Record<TaskStatus, string> = {
  TODO: "var(--muted)",
  IN_PROGRESS: "var(--warn)",
  DONE: "var(--ok)",
};

export default function TasksPage() {
  const total = getTasks().length;

  return (
    <AppShell>
      <PageHeader title="Tasks" subtitle={`${total} tasks across the committee · move menu on each card`} />

      <div className="grid gap-5 lg:grid-cols-3">
        {STATUS_ORDER.map((status) => {
          const tasks = getTasksByStatus(status);
          return (
            <div key={status} className="flex flex-col rounded-2xl bg-[var(--surface-2)] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: columnDot[status] }} />
                  <span className="text-sm font-semibold text-[var(--ink)]">{STATUS_LABEL[status]}</span>
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{tasks.length}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {tasks.map((task) => {
                  const assignee = getMemberById(task.assigneeId);
                  const event = getEventById(task.eventId);
                  return (
                    <article key={task.id} className="card p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <PriorityTag priority={task.priority} />
                        <MoveMenu taskId={task.id} status={task.status} />
                      </div>
                      <h3 className="text-sm font-semibold leading-snug text-[var(--ink)]">{task.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{task.description}</p>
                      {event && (
                        <div className="mt-3 inline-flex items-center rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand-strong)]">
                          {event.title}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                        <div className="flex items-center gap-2">
                          <Avatar member={assignee} size={26} />
                          <span className="text-xs text-[var(--muted)]">{assignee?.name.split(" ")[0] ?? "Unassigned"}</span>
                        </div>
                        {task.dueDate && <DueBadge dueDate={task.dueDate} />}
                      </div>
                    </article>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
