"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveTaskAction } from "@/app/actions";
import { STATUS_LABEL, STATUS_ORDER, type TaskStatus } from "@/lib/types";

const activeTone: Record<TaskStatus, string> = {
  TODO: "bg-[#fbe9e9] text-[#9a5f5f]",
  IN_PROGRESS: "bg-[var(--inprog-soft)] text-[var(--inprog)]",
  DONE: "bg-[var(--ok-soft)] text-[var(--ok)]",
};

export default function StatusControl({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: TaskStatus) {
    if (next === optimistic || pending) return;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const result = await moveTaskAction(taskId, next);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div role="group" aria-label="Task status" className="inline-flex rounded-xl bg-[var(--surface-2)] p-1">
        {STATUS_ORDER.map((s) => {
          const active = s === optimistic;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              disabled={pending && !active}
              onClick={() => choose(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? `${activeTone[s]} shadow-sm` : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
