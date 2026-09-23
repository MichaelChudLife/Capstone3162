"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { Field, FormAlert, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { addBudgetItemAction, updateBudgetItemAction } from "@/app/events/budget-actions";
import { LIMITS, validateBudgetItemInput } from "@/lib/validation";
import type { BudgetItem, BudgetItemInput, FieldErrors } from "@/lib/types";

type Errors = FieldErrors<keyof BudgetItemInput>;

export default function BudgetItemFormDialog({
  open,
  onClose,
  eventId,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  item?: BudgetItem;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const editing = Boolean(item);
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(item?.label ?? "");
  const [expectedCost, setExpectedCost] = useState(item ? String(item.expectedCost) : "");
  const [actualCost, setActualCost] = useState(item ? String(item.actualCost) : "0");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function close() {
    if (!editing) {
      setLabel("");
      setExpectedCost("");
      setActualCost("0");
    }
    setErrors({});
    setFormError(null);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: BudgetItemInput = {
      label,
      expectedCost: Number(expectedCost),
      actualCost: Number(actualCost),
    };
    const check = validateBudgetItemInput(input);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = item
        ? await updateBudgetItemAction(item.id, check.value)
        : await addBudgetItemAction(eventId, check.value);
      if (!result.ok) {
        setErrors((result.errors as Errors) ?? {});
        setFormError(result.message);
        return;
      }
      onSaved?.(result.data?.id ?? item?.id ?? "");
      close();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? "Edit cost" : "Record a cost"}
      description={
        editing ? "Update the expected or actual cost for this line item." : "Add an expected cost, and the actual spend once it's known."
      }
      footer={
        <>
          <button type="button" onClick={close} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" form="budget-item-form" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add cost"}
          </button>
        </>
      }
    >
      <form id="budget-item-form" onSubmit={submit} noValidate className="space-y-4">
        <FormAlert message={formError} />
        <Field label="Label" htmlFor="budget-label" error={errors.label}>
          <input
            id="budget-label"
            className={fieldClass}
            value={label}
            maxLength={LIMITS.budgetLabel}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Venue hire"
            aria-invalid={Boolean(errors.label)}
            autoFocus
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expected cost" htmlFor="budget-expected" error={errors.expectedCost}>
            <input
              id="budget-expected"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className={fieldClass}
              value={expectedCost}
              onChange={(e) => setExpectedCost(e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.expectedCost)}
            />
          </Field>
          <Field label="Actual cost" htmlFor="budget-actual" error={errors.actualCost} optional hint="Leave as 0 until spent.">
            <input
              id="budget-actual"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className={fieldClass}
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.actualCost)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
