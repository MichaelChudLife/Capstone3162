"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import InviteLinkPanel from "@/components/InviteLinkPanel";
import { primaryButtonClass } from "@/components/form";
import { renewInviteAction, revokeInviteAction } from "@/app/members/invite-actions";

interface RenewedLink {
  email: string;
  path: string;
  expiresAt: string;
}

export default function InviteRowActions({ inviteId, email }: { inviteId: string; email: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [renewed, setRenewed] = useState<RenewedLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function renew() {
    setError(null);
    startTransition(async () => {
      const result = await renewInviteAction(inviteId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRenewed(result.data);
      router.refresh();
    });
  }

  function revoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeInviteAction(inviteId);
      if (!result.ok) setError(result.message);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {error && (
        <span role="alert" className="text-xs font-medium text-[var(--danger)]">
          {error}
        </span>
      )}
      {confirming ? (
        <>
          <span className="text-xs text-[var(--muted)]">Cancel invite for {email}?</span>
          <button
            onClick={revoke}
            disabled={pending}
            className="rounded-lg bg-[var(--danger)] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Yes, cancel it
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]">
            Keep
          </button>
        </>
      ) : (
        <>
          <button
            onClick={renew}
            disabled={pending}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--brand-strong)] hover:bg-[var(--brand-soft)] disabled:opacity-50"
          >
            New link
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          >
            Cancel invite
          </button>
        </>
      )}

      <Modal
        open={renewed !== null}
        onClose={() => setRenewed(null)}
        title="New invite link"
        description="The previous link for this invite no longer works."
        footer={
          <button type="button" onClick={() => setRenewed(null)} className={primaryButtonClass}>
            Done
          </button>
        }
      >
        {renewed && <InviteLinkPanel email={renewed.email} path={renewed.path} expiresAt={renewed.expiresAt} />}
      </Modal>
    </div>
  );
}
