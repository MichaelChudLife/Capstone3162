"use client";

import { useState } from "react";
import TaskFormDialog from "@/components/TaskFormDialog";
import type { CcaEvent, Member, Task } from "@/lib/types";

export default function EditTaskButton({
  task,
  members,
  events,
  restricted = false,
}: {
  task: Task;
  members: Member[];
  events: CcaEvent[];
  restricted?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
      >
        Edit task
      </button>
      {open && (
        <TaskFormDialog
          open={open}
          onClose={() => setOpen(false)}
          members={members}
          events={events}
          task={task}
          restricted={restricted}
        />
      )}
    </>
  );
}
