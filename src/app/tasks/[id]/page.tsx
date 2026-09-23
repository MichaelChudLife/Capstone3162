import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import EditTaskButton from "@/components/EditTaskButton";
import { Avatar, DueBadge, PriorityTag, StatusPill, UnassignedFlag } from "@/components/ui";
import { CalendarIcon } from "@/components/icons";
import { getEventById, getEvents, getMembers, getMembersByIds, getTaskById, hasPermission } from "@/lib/data";
import { formatDateTime, formatDeadline } from "@/lib/format";

export const dynamic = "force-dynamic";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--border)] px-5 py-4 sm:grid sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1.5 text-sm text-[var(--ink)] sm:mt-0">{children}</dd>
    </div>
  );
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTaskById(id);
  if (!task) notFound();

  const event = getEventById(task.eventId);
  const assignees = getMembersByIds(task.assigneeIds);
  const canEdit = hasPermission("manage_tasks");

  return (
    <AppShell>
      <nav className="mb-3 flex items-center gap-1.5 text-sm text-[var(--muted)]">
        <Link href="/tasks" className="hover:text-[var(--ink)] hover:underline">
          Tasks
        </Link>
        {event && (
          <>
            <span>/</span>
            <Link href={`/events/${event.id}`} className="truncate hover:text-[var(--ink)] hover:underline">
              {event.title}
            </Link>
          </>
        )}
      </nav>

      <PageHeader
        title={task.title}
        subtitle={event ? `Sub-task of ${event.title}` : "General committee task"}
        actions={canEdit ? <EditTaskButton task={task} members={getMembers()} events={getEvents()} /> : undefined}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusPill status={task.status} />
        <PriorityTag priority={task.priority} />
        {task.dueDate && task.status !== "DONE" && <DueBadge dueDate={task.dueDate} />}
        {assignees.length === 0 && <UnassignedFlag />}
      </div>

      <section className="card overflow-hidden">
        <dl>
          <Detail label="Description">
            {task.description ? (
              <p className="whitespace-pre-wrap leading-relaxed">{task.description}</p>
            ) : (
              <span className="text-[var(--muted)]">No description yet.</span>
            )}
          </Detail>
          <Detail label={assignees.length === 1 ? "Assignee" : "Assignees"}>
            {assignees.length === 0 ? (
              <span className="text-[var(--muted)]">No one is assigned yet.</span>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {assignees.map((m) => (
                  <li key={m.id} className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] py-1 pl-1 pr-3">
                    <Avatar member={m} size={24} />
                    <span className="text-sm">{m.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Detail>
          <Detail label="Deadline">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon width={14} height={14} />
              {formatDeadline(task.dueDate)}
            </span>
          </Detail>
          <Detail label="Priority">
            <PriorityTag priority={task.priority} />
          </Detail>
          <Detail label="Status">
            <StatusPill status={task.status} />
          </Detail>
          <Detail label="Event">
            {event ? (
              <Link href={`/events/${event.id}`} className="font-medium text-[var(--brand-strong)] hover:underline">
                {event.title}
              </Link>
            ) : (
              <span className="text-[var(--muted)]">Not linked to an event</span>
            )}
          </Detail>
          <Detail label="Created">{formatDateTime(task.createdAt)}</Detail>
        </dl>
      </section>
    </AppShell>
  );
}
