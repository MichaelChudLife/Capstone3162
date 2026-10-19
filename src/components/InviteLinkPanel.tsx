"use client";

import { useState } from "react";
import { fieldClass, primaryButtonClass } from "@/components/form";
import { formatDate } from "@/lib/format";

export default function InviteLinkPanel({ email, path, expiresAt }: { email: string; path: string; expiresAt: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--ink)]">
        Send this link to <span className="font-semibold">{email}</span>. It works once and expires {formatDate(expiresAt)}.
      </p>
      <div className="flex gap-2">
        <input
          aria-label="Invite link"
          className={`${fieldClass} font-mono text-xs`}
          value={link}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
        />
        <button type="button" onClick={copy} className={`${primaryButtonClass} shrink-0`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        The app doesn&apos;t email invites. This is the only time the link is shown — if it&apos;s lost, generate a new one from Pending invites.
      </p>
    </div>
  );
}
