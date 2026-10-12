"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { Field, FormAlert, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { createBudgetItemAction, updateBudgetItemAction } from "@/app/events/budget-actions";
import { centsToInput, parseAudToCents } from "@/lib/money";
import { LIMITS, validateBudgetItemInput } from "@/lib/validation";
import type { BudgetItem, BudgetItemInput, FieldErrors } from "@/lib/types";

type Errors = FieldErrors<keyof BudgetItemInput>;

function initialState(item?: BudgetItem) {
  return {
    description: item?.description ?? "",
    expected: centsToInput(item?.expectedCents),
    actual: centsToInput(item?.actualCents),
  };
}

export default function BudgetItemDialog({
  open,
  onClose,
  eventId,
  eventTitle,
  item,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  item?: BudgetItem;
}) {
  const router = useRouter();
  const editing = Boolean(item);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => initialState(item));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof ReturnType<typeof initialState>>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function close() {
    if (!editing) setForm(initialState());
    setErrors({});
    setFormError(null);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const expectedCents = parseAudToCents(form.expected);
    const actualCents = form.actual.trim() === "" ? null : parseAudToCents(form.actual);
    const parseErrors: Errors = {};
    if (expectedCents === null) parseErrors.expectedCents = "Enter the expected cost as an AUD amount, e.g. 250.00.";
    if (form.actual.trim() !== "" && actualCents === null) {
      parseErrors.actualCents = "Enter the actual spend as an AUD amount, e.g. 250.00.";
    }
    const check = validateBudgetItemInput({
      description: form.description,
      expectedCents: expectedCents ?? -1,
      actualCents,
    });
    if (Object.keys(parseErrors).length > 0 || !check.ok) {
      setErrors({ ...(check.ok ? {} : check.errors), ...parseErrors });
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = item
        ? await updateBudgetItemAction(item.id, check.value)
        : await createBudgetItemAction(eventId, check.value);
      if (!result.ok) {
        setErrors((result.errors as Errors) ?? {});
        setFormError(result.message);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? "Edit budget item" : "Add budget item"}
      description={`Costs for “${eventTitle}”, in Australian dollars (AUD).`}
      footer={
        <>
          <button type="button" onClick={close} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" form="budget-form" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add item"}
          </button>
        </>
      }
    >
      <form id="budget-form" onSubmit={submit} noValidate className="space-y-4">
        <FormAlert message={formError} />
        <Field label="What is the cost for?" htmlFor="budget-description" error={errors.description}>
          <input
            id="budget-description"
            className={fieldClass}
            value={form.description}
            maxLength={LIMITS.budgetDescription}
            onChange={(e) => update("description", e.target.value)}
            placeholder="e.g. Catering"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "budget-description-error" : undefined}
            autoFocus
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Expected cost (AUD)" htmlFor="budget-expected" error={errors.expectedCents}>
            <input
              id="budget-expected"
              className={fieldClass}
              inputMode="decimal"
              value={form.expected}
              onChange={(e) => update("expected", e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.expectedCents)}
              aria-describedby={errors.expectedCents ? "budget-expected-error" : undefined}
            />
          </Field>
          <Field
            label="Actual spend (AUD)"
            htmlFor="budget-actual"
            error={errors.actualCents}
            optional
            hint="Leave blank until the money has been spent."
          >
            <input
              id="budget-actual"
              className={fieldClass}
              inputMode="decimal"
              value={form.actual}
              onChange={(e) => update("actual", e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.actualCents)}
              aria-describedby={errors.actualCents ? "budget-actual-error" : undefined}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
