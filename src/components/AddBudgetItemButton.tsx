"use client";

import { useState } from "react";
import BudgetItemDialog from "@/components/BudgetItemDialog";
import { PlusIcon } from "@/components/icons";

export default function AddBudgetItemButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
      >
        <PlusIcon width={15} height={15} />
        Add item
      </button>
      {open && <BudgetItemDialog open={open} onClose={() => setOpen(false)} eventId={eventId} eventTitle={eventTitle} />}
    </>
  );
}
