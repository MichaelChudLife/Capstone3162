"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BudgetItemFormDialog from "@/components/BudgetItemFormDialog";
import { deleteBudgetItemAction } from "@/app/events/budget-actions";
import { formatCurrency } from "@/lib/format";
import type { BudgetSummary } from "@/lib/data";
import type { BudgetItem, Member } from "@/lib/types";

function varianceColor(variance: number): string {
  if (variance > 0) return "var(--danger)";
  if (variance < 0) return "var(--ok)";
  return "var(--muted)";
}

function varianceLabel(variance: number): string {
  if (variance > 0) return `${formatCurrency(variance)} over`;
  if (variance < 0) return `${formatCurrency(Math.abs(variance))} under`;
  return "On budget";
}

function BudgetRow({
  item,
  recordedBy,
  editable,
  onEdit,
}: {
  item: BudgetItem;
  recordedBy?: Member;
  editable: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const variance = item.actualCost - item.expectedCost;

  function remove() {
    if (!window.confirm(`Remove “${item.label}” from the budget?`)) return;
    startTransition(async () => {
      await deleteBudgetItemAction(item.id);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--border)] px-4 py-3">
      <div className="min-w-0 flex-1 basis-40">
        <div className="truncate text-sm font-medium text-[var(--ink)]">{item.label}</div>
        {recordedBy && <div className="mt-0.5 text-xs text-[var(--muted)]">Recorded by {recordedBy.name.split(" ")[0]}</div>}
      </div>
      <div className="w-28 shrink-0 text-sm text-[var(--muted)]">{formatCurrency(item.expectedCost)}</div>
      <div className="w-28 shrink-0 text-sm font-medium text-[var(--ink)]">{formatCurrency(item.actualCost)}</div>
      <div className="w-28 shrink-0 text-sm font-medium" style={{ color: varianceColor(variance) }}>
        {varianceLabel(variance)}
      </div>
      {editable ? (
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={onEdit} className="text-xs font-semibold text-[var(--brand-strong)] hover:underline">
            Edit
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-xs font-semibold text-[var(--danger)] hover:underline disabled:opacity-50"
          >
            {pending ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : (
        <div className="w-[92px] shrink-0" />
      )}
    </li>
  );
}

export default function BudgetPanel({
  eventId,
  items,
  summary,
  editableIds,
  members,
}: {
  eventId: string;
  items: BudgetItem[];
  summary: BudgetSummary;
  editableIds: string[];
  members: Member[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const editable = new Set(editableIds);
  const memberById = new Map(members.map((m) => [m.id, m]));

  return (
    <section className="card p-2">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--ink)]">Budget</h2>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{items.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
        >
          Record a cost
        </button>
      </header>

      {items.length === 0 ? (
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-xs text-[var(--muted)]">
          No costs recorded yet.
        </div>
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <BudgetRow
                key={item.id}
                item={item}
                recordedBy={item.recordedById ? memberById.get(item.recordedById) : undefined}
                editable={editable.has(item.id)}
                onEdit={() => setEditingItem(item)}
              />
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--border)] px-4 py-3 text-sm">
            <span className="font-semibold text-[var(--ink)]">Total</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="w-28 text-[var(--muted)]">{formatCurrency(summary.expectedTotal)}</span>
              <span className="w-28 font-semibold text-[var(--ink)]">{formatCurrency(summary.actualTotal)}</span>
              <span className="w-28 font-semibold" style={{ color: varianceColor(summary.variance) }}>
                {varianceLabel(summary.variance)}
              </span>
            </div>
          </div>
        </>
      )}

      {adding && <BudgetItemFormDialog open={adding} onClose={() => setAdding(false)} eventId={eventId} />}
      {editingItem && (
        <BudgetItemFormDialog
          open={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          eventId={eventId}
          item={editingItem}
        />
      )}
    </section>
  );
}
