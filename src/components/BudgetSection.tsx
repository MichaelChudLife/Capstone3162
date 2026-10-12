import AddBudgetItemButton from "@/components/AddBudgetItemButton";
import BudgetItemActions from "@/components/BudgetItemActions";
import { formatAud, formatVariance, itemVariance, varianceTone, type VarianceTone } from "@/lib/money";
import type { BudgetItem, CcaEvent } from "@/lib/types";
import type { BudgetSummary } from "@/lib/money";

const toneClass: Record<VarianceTone, string> = {
  over: "text-[var(--danger)]",
  under: "text-[var(--ok)]",
  on: "text-[var(--muted)]",
};

const toneLabel: Record<VarianceTone, string> = {
  over: "over budget",
  under: "under budget",
  on: "on budget",
};

function Stat({ label, value, className = "text-[var(--ink)]", note }: { label: string; value: string; className?: string; note?: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3">
      <div className="text-xs font-medium text-[var(--muted)]">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${className}`}>{value}</div>
      {note && <div className="mt-0.5 text-xs text-[var(--muted)]">{note}</div>}
    </div>
  );
}

export default function BudgetSection({
  event,
  items,
  summary,
  canManage,
}: {
  event: CcaEvent;
  items: BudgetItem[];
  summary: BudgetSummary;
  canManage: boolean;
}) {
  const hasRecorded = summary.recordedCount > 0;
  const tone = varianceTone(summary.varianceCents);

  return (
    <section className="card mt-6 p-2" aria-labelledby="budget-heading">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 id="budget-heading" className="text-base font-semibold text-[var(--ink)]">
            Budget
          </h2>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">AUD</span>
        </div>
        {canManage && <AddBudgetItemButton eventId={event.id} eventTitle={event.title} />}
      </header>

      {items.length === 0 ? (
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
          <div className="text-sm font-medium text-[var(--ink)]">No budget recorded yet</div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {canManage
              ? "Add the expected costs for this event, then record the actual spend as it happens."
              : "Expected costs and actual spend added by a director will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-3">
            <Stat label="Expected total" value={formatAud(summary.expectedCents)} />
            <Stat label="Actual spend" value={hasRecorded ? formatAud(summary.actualCents) : "—"} />
            <Stat
              label="Variance (actual − expected)"
              value={hasRecorded ? formatVariance(summary.varianceCents) : "—"}
              className={hasRecorded ? toneClass[tone] : "text-[var(--muted)]"}
              note={
                hasRecorded
                  ? `${toneLabel[tone]}${summary.recordedCount < summary.itemCount ? ` · ${summary.recordedCount} of ${summary.itemCount} items recorded` : ""}`
                  : "Record actual spend to see variance"
              }
            />
          </div>

          <div className="overflow-x-auto border-t border-[var(--border)]">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <th scope="col" className="px-4 py-2.5 font-semibold">Item</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Expected</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Actual</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Variance</th>
                  {canManage && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const variance = itemVariance(item);
                  const itemTone = variance === null ? null : varianceTone(variance);
                  return (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-[var(--ink)]">{item.description}</th>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--ink)]">{formatAud(item.expectedCents)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--ink)]">
                        {item.actualCents === null ? <span className="text-[var(--muted)]">Not yet spent</span> : formatAud(item.actualCents)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${itemTone ? toneClass[itemTone] : "text-[var(--muted)]"}`}>
                        {variance === null || itemTone === null ? (
                          "—"
                        ) : (
                          <>
                            {formatVariance(variance)}
                            <span className="sr-only"> ({toneLabel[itemTone]})</span>
                          </>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-2 text-right">
                          <BudgetItemActions item={item} eventTitle={event.title} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)] font-semibold">
                  <th scope="row" className="px-4 py-3 text-left text-[var(--ink)]">Total</th>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--ink)]">{formatAud(summary.expectedCents)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--ink)]">{hasRecorded ? formatAud(summary.actualCents) : "—"}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${hasRecorded ? toneClass[tone] : "text-[var(--muted)]"}`}>
                    {hasRecorded ? formatVariance(summary.varianceCents) : "—"}
                  </td>
                  {canManage && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
          {summary.pendingExpectedCents > 0 && (
            <p className="px-4 pb-3 pt-1 text-xs text-[var(--muted)]">
              {formatAud(summary.pendingExpectedCents)} of expected cost has no actual spend recorded yet and is left out of the variance.
            </p>
          )}
        </>
      )}
    </section>
  );
}
