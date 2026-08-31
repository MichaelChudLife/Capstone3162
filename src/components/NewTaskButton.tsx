"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member, CcaEvent, Priority, TaskStatus } from "@/lib/types";
import { createTaskAction } from "@/app/actions";
import { PlusIcon } from "@/components/icons";

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]";
const labelClass = "mb-1.5 block text-xs font-semibold text-[var(--muted)]";

export default function NewTaskButton({
  members,
  events,
}: {
  members: Member[];
  events: CcaEvent[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(members[0]?.id ?? "");
  const [eventId, setEventId] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [due, setDue] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setAssigneeId(members[0]?.id ?? "");
    setEventId("");
    setPriority("MEDIUM");
    setStatus("TODO");
    setDue("");
  }

  function submit() {
    if (!title.trim()) return;
    const dueDate = due ? new Date(`${due}T17:00:00`).toISOString() : null;
    startTransition(async () => {
      await createTaskAction({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        dueDate,
        assigneeId: assigneeId || null,
        eventId: eventId || null,
      });
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-3.5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] shadow-sm hover:bg-[var(--brand-strong)]"
      >
        <PlusIcon width={17} height={17} />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[var(--ink)]">New Task</h2>
            <p className="mt-0.5 text-sm text-[var(--muted)]">Create and assign a task with a deadline.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass}>Title</label>
                <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Confirm venue booking" autoFocus />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${fieldClass} min-h-20 resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add detail for the assignee…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Assignee</label>
                  <select className={fieldClass} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Event</label>
                  <select className={fieldClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                    <option value="">No event</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select className={fieldClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Due date</label>
                  <input type="date" className={fieldClass} value={due} onChange={(e) => setDue(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]">
                Cancel
              </button>
              <button onClick={submit} disabled={pending || !title.trim()} className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)] disabled:opacity-50">
                {pending ? "Creating…" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
