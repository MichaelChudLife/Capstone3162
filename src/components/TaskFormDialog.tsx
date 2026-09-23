"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import AssigneePicker from "@/components/AssigneePicker";
import { Field, FormAlert, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { createTaskAction, updateTaskAction } from "@/app/tasks/actions";
import { LIMITS, validateTaskInput } from "@/lib/validation";
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/format";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_LABEL,
  STATUS_ORDER,
  type CcaEvent,
  type FieldErrors,
  type Member,
  type Priority,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "@/lib/types";

type Errors = FieldErrors<keyof TaskInput>;

function initialState(task?: Task, defaultEventId?: string | null) {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeIds: task?.assigneeIds ?? [],
    eventId: task?.eventId ?? defaultEventId ?? "",
    priority: task?.priority ?? ("MEDIUM" as Priority),
    status: task?.status ?? ("TODO" as TaskStatus),
    due: toDateTimeLocal(task?.dueDate),
  };
}

export default function TaskFormDialog({
  open,
  onClose,
  members,
  events,
  task,
  defaultEventId,
  lockEvent = false,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  members: Member[];
  events: CcaEvent[];
  task?: Task;
  defaultEventId?: string | null;
  lockEvent?: boolean;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const editing = Boolean(task);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => initialState(task, defaultEventId));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const lockedEvent = lockEvent ? events.find((e) => e.id === form.eventId) : undefined;
  const minDue = toDateTimeLocal(new Date().toISOString());

  function update<K extends keyof ReturnType<typeof initialState>>(key: K, value: ReturnType<typeof initialState>[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function close() {
    if (!editing) setForm(initialState(undefined, defaultEventId));
    setErrors({});
    setFormError(null);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: TaskInput = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.due ? fromDateTimeLocal(form.due) : null,
      assigneeIds: form.assigneeIds,
      eventId: form.eventId || null,
    };
    const check = validateTaskInput(input, {
      memberIds: members.map((m) => m.id),
      eventIds: events.map((ev) => ev.id),
      previousDueDate: task?.dueDate,
    });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = task ? await updateTaskAction(task.id, check.value) : await createTaskAction(check.value);
      if (!result.ok) {
        setErrors((result.errors as Errors) ?? {});
        setFormError(result.message);
        return;
      }
      onSaved?.(result.data.id);
      close();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={close}
      width="max-w-xl"
      title={editing ? "Edit task" : lockedEvent ? "Add sub-task" : "New task"}
      description={
        lockedEvent
          ? `This task will sit under “${lockedEvent.title}”.`
          : editing
            ? "Update the details, assignees or deadline."
            : "Create a task, assign it, and set a deadline."
      }
      footer={
        <>
          <button type="button" onClick={close} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" form="task-form" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create task"}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} noValidate className="space-y-4">
        <FormAlert message={formError} />
        <Field label="Title" htmlFor="task-title" error={errors.title}>
          <input
            id="task-title"
            className={fieldClass}
            value={form.title}
            maxLength={LIMITS.taskTitle}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Confirm venue booking"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "task-title-error" : undefined}
            autoFocus
          />
        </Field>
        <Field label="Description" htmlFor="task-description" error={errors.description} optional>
          <textarea
            id="task-description"
            className={`${fieldClass} min-h-20 resize-y`}
            value={form.description}
            maxLength={LIMITS.taskDescription}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Add detail for the assignees…"
            aria-invalid={Boolean(errors.description)}
          />
        </Field>
        <Field label="Assignees" htmlFor="task-assignees" error={errors.assigneeIds}>
          <AssigneePicker
            id="task-assignees"
            members={members}
            value={form.assigneeIds}
            onChange={(ids) => update("assigneeIds", ids)}
            invalid={Boolean(errors.assigneeIds)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deadline" htmlFor="task-due" error={errors.dueDate} optional hint="Can't be set in the past.">
            <input
              id="task-due"
              type="datetime-local"
              className={fieldClass}
              value={form.due}
              min={minDue}
              onChange={(e) => update("due", e.target.value)}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? "task-due-error" : undefined}
            />
          </Field>
          <Field label="Event" htmlFor="task-event" error={errors.eventId}>
            <select
              id="task-event"
              className={fieldClass}
              value={form.eventId}
              disabled={lockEvent}
              onChange={(e) => update("eventId", e.target.value)}
              aria-invalid={Boolean(errors.eventId)}
            >
              <option value="">No event (general task)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority" htmlFor="task-priority" error={errors.priority}>
            <div id="task-priority" role="radiogroup" aria-label="Priority" className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-2)] p-1">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={form.priority === p}
                  onClick={() => update("priority", p)}
                  className={`rounded-lg py-1.5 text-sm font-medium ${
                    form.priority === p ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Status" htmlFor="task-status" error={errors.status}>
            <select
              id="task-status"
              className={fieldClass}
              value={form.status}
              onChange={(e) => update("status", e.target.value as TaskStatus)}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
