"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BudgetItemDialog from "@/components/BudgetItemDialog";
import Modal from "@/components/Modal";
import { FormAlert, dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { deleteBudgetItemAction } from "@/app/events/budget-actions";
import type { BudgetItem } from "@/lib/types";

export default function BudgetItemActions({ item, eventTitle }: { item: BudgetItem; eventTitle: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function closeConfirm() {
    setConfirming(false);
    setError(null);
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteBudgetItemAction(item.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      closeConfirm();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setEditing(true)}
          aria-label={`Edit ${item.description}`}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        >
          Edit
        </button>
        <button
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${item.description}`}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
        >
          Delete
        </button>
      </div>

      {editing && (
        <BudgetItemDialog
          open={editing}
          onClose={() => setEditing(false)}
          eventId={item.eventId}
          eventTitle={eventTitle}
          item={item}
        />
      )}

      <Modal
        open={confirming}
        onClose={closeConfirm}
        title={`Delete “${item.description}”?`}
        description="This removes the line from the event budget and updates the totals."
        footer={
          <>
            <button type="button" onClick={closeConfirm} className={secondaryButtonClass}>
              Keep item
            </button>
            <button type="button" onClick={confirmDelete} disabled={pending} className={dangerButtonClass}>
              {pending ? "Deleting…" : "Delete item"}
            </button>
          </>
        }
      >
        <FormAlert message={error} />
      </Modal>
    </>
  );
}
