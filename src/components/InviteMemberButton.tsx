"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import InviteLinkPanel from "@/components/InviteLinkPanel";
import { Field, FormAlert, fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/form";
import { PlusIcon } from "@/components/icons";
import { createInviteAction } from "@/app/members/invite-actions";
import { LIMITS } from "@/lib/validation";
import { ACCESS_ROLES, type AccessRole, type FieldErrors, type InviteInput } from "@/lib/types";

type Errors = FieldErrors<keyof InviteInput>;

interface CreatedLink {
  email: string;
  path: string;
  expiresAt: string;
}

export default function InviteMemberButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [accessRole, setAccessRole] = useState<AccessRole>("Committee Member");
  const [position, setPosition] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setEmail("");
    setAccessRole("Committee Member");
    setPosition("");
    setErrors({});
    setFormError(null);
    setCreated(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await createInviteAction({ email, accessRole, position });
      if (!result.ok) {
        setErrors((result.errors as Errors) ?? {});
        setFormError(result.message);
        return;
      }
      setCreated(result.data);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-3.5 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] shadow-sm hover:bg-[var(--brand-strong)]"
      >
        <PlusIcon width={17} height={17} />
        Invite member
      </button>

      <Modal
        open={open}
        onClose={close}
        title={created ? "Invite link ready" : "Invite a member"}
        description={created ? undefined : "They'll set their own name and password from the link."}
        footer={
          created ? (
            <button type="button" onClick={close} className={primaryButtonClass}>
              Done
            </button>
          ) : (
            <>
              <button type="button" onClick={close} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" form="invite-form" disabled={pending} className={primaryButtonClass}>
                {pending ? "Creating…" : "Create invite link"}
              </button>
            </>
          )
        }
      >
        {created ? (
          <InviteLinkPanel email={created.email} path={created.path} expiresAt={created.expiresAt} />
        ) : (
          <form id="invite-form" onSubmit={submit} noValidate className="space-y-4">
            <FormAlert message={formError} />
            <Field label="Email" htmlFor="invite-email" error={errors.email}>
              <input
                id="invite-email"
                type="email"
                className={fieldClass}
                value={email}
                maxLength={LIMITS.email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cca.org.au"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "invite-email-error" : undefined}
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Access role" htmlFor="invite-role" error={errors.accessRole}>
                <select
                  id="invite-role"
                  className={fieldClass}
                  value={accessRole}
                  onChange={(e) => setAccessRole(e.target.value as AccessRole)}
                >
                  {ACCESS_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Position" htmlFor="invite-position" error={errors.position} optional>
                <input
                  id="invite-position"
                  className={fieldClass}
                  value={position}
                  maxLength={LIMITS.position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Sponsorships Officer"
                />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
