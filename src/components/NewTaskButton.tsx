"use client";

import { useState } from "react";
import TaskFormDialog from "@/components/TaskFormDialog";
import { PlusIcon } from "@/components/icons";
import type { Member, CcaEvent } from "@/lib/types";

export default function NewTaskButton({
  members,
  events,
  defaultEventId,
  lockEvent = false,
  label = "New Task",
  variant = "primary",
}: {
  members: Member[];
  events: CcaEvent[];
  defaultEventId?: string;
  lockEvent?: boolean;
  label?: string;
  variant?: "primary" | "subtle";
}) {
  const [open, setOpen] = useState(false);

  const className =
    variant === "primary"
      ? "flex items-center gap-2 rounded-xl bg-[var(--brand)] px-3.5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] shadow-sm hover:bg-[var(--brand-strong)]"
      : "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]";

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <PlusIcon width={variant === "primary" ? 17 : 15} height={variant === "primary" ? 17 : 15} />
        {label}
      </button>
      <TaskFormDialog
        open={open}
        onClose={() => setOpen(false)}
        members={members}
        events={events}
        defaultEventId={defaultEventId}
        lockEvent={lockEvent}
      />
    </>
  );
}
