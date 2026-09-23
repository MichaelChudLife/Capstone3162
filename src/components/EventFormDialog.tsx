"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { Field, FormAlert, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { createEventAction, updateEventAction } from "@/app/events/actions";
import { validateEventInput, LIMITS } from "@/lib/validation";
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/format";
import type { CcaEvent, EventInput, FieldErrors } from "@/lib/types";

type Errors = FieldErrors<keyof EventInput>;

export default function EventFormDialog({
  open,
  onClose,
  event,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  event?: CcaEvent;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const editing = Boolean(event);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(toDateTimeLocal(event?.date));
  const [location, setLocation] = useState(event?.location ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function close() {
    if (!editing) {
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
    }
    setErrors({});
    setFormError(null);
    onClose();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: EventInput = { title, description, location, date: fromDateTimeLocal(date) };
    const check = validateEventInput(input);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = event ? await updateEventAction(event.id, check.value) : await createEventAction(check.value);
      if (!result.ok) {
        setErrors((result.errors as Errors) ?? {});
        setFormError(result.message);
        return;
      }
      onSaved?.(result.data.id);
      close();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? "Edit event" : "New event"}
      description={editing ? "Update the event details." : "Add a club event. You can break it into sub-tasks afterwards."}
      footer={
        <>
          <button type="button" onClick={close} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" form="event-form" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create event"}
          </button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} noValidate className="space-y-4">
        <FormAlert message={formError} />
        <Field label="Title" htmlFor="event-title" error={errors.title}>
          <input
            id="event-title"
            className={fieldClass}
            value={title}
            maxLength={LIMITS.eventTitle}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Industry Networking Night"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "event-title-error" : undefined}
            autoFocus
          />
        </Field>
        <Field label="Description" htmlFor="event-description" error={errors.description} optional>
          <textarea
            id="event-description"
            className={`${fieldClass} min-h-24 resize-y`}
            value={description}
            maxLength={LIMITS.eventDescription}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is the event and who is it for?"
            aria-invalid={Boolean(errors.description)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date and time" htmlFor="event-date" error={errors.date}>
            <input
              id="event-date"
              type="datetime-local"
              className={fieldClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "event-date-error" : undefined}
            />
          </Field>
          <Field label="Location" htmlFor="event-location" error={errors.location} optional>
            <input
              id="event-location"
              className={fieldClass}
              value={location}
              maxLength={LIMITS.eventLocation}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Monash LTB Foyer"
              aria-invalid={Boolean(errors.location)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
