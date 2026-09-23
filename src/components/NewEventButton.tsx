"use client";

import { useState } from "react";
import EventFormDialog from "@/components/EventFormDialog";
import { PlusIcon } from "@/components/icons";

export default function NewEventButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[var(--brand)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--brand-strong)] shadow-sm hover:bg-[var(--brand-soft)]"
      >
        <PlusIcon width={17} height={17} />
        New Event
      </button>
      <EventFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
