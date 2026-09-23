"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import EventFormDialog from "@/components/EventFormDialog";
import { FormAlert, dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { deleteEventAction } from "@/app/events/actions";
import type { CcaEvent } from "@/lib/types";

export default function EventActions({ event, subTaskTitles }: { event: CcaEvent; subTaskTitles: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const count = subTaskTitles.length;

  function closeConfirm() {
    setConfirming(false);
    setError(null);
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteEventAction(event.id, { confirmSubtaskRemoval: true });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/events");
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
      >
        Edit event
      </button>
      <button
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-[var(--danger-soft)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
      >
        Delete
      </button>

      {editing && <EventFormDialog open={editing} onClose={() => setEditing(false)} event={event} />}

      <Modal
        open={confirming}
        onClose={closeConfirm}
        title={`Delete “${event.title}”?`}
        description={
          count === 0
            ? "This event has no sub-tasks. It will be removed from the event list."
            : `This will also permanently delete its ${count} sub-task${count === 1 ? "" : "s"}.`
        }
        footer={
          <>
            <button type="button" onClick={closeConfirm} className={secondaryButtonClass}>
              Keep event
            </button>
            <button type="button" onClick={confirmDelete} disabled={pending} className={dangerButtonClass}>
              {pending ? "Deleting…" : count === 0 ? "Delete event" : `Delete event and ${count} sub-task${count === 1 ? "" : "s"}`}
            </button>
          </>
        }
      >
        <FormAlert message={error} />
        {count > 0 && (
          <ul className="mb-3 max-h-48 space-y-1.5 overflow-y-auto rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--ink)]">
            {subTaskTitles.map((title, i) => (
              <li key={`${title}-${i}`} className="flex items-start gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--muted)]" />
                {title}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
