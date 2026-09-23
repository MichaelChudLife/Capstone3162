"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMemberRoleAction } from "@/app/actions";
import { ACCESS_ROLES, type AccessRole } from "@/lib/types";

const badge: Record<AccessRole, string> = {
  "IT Director": "bg-[var(--brand-soft)] text-[var(--brand-strong)]",
  "Committee Director": "bg-[#e6eef6] text-[#2f6299]",
  "Events Director": "bg-[#e8f5ed] text-[#28764a]",
  "Marketing Director": "bg-[#fff1df] text-[#a35a12]",
  "Finance Director": "bg-[#f3eafa] text-[#7148a1]",
  "Committee Member": "bg-[var(--surface-2)] text-[var(--muted)]",
};

export default function RoleSelect({ memberId, value, disabled = false }: { memberId: string; value: AccessRole; disabled?: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<AccessRole>(value);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${badge[role]}`}
      >
        {role}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Set role</div>
            {ACCESS_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  void updateMemberRoleAction(memberId, r).then(() => {
                    setRole(r);
                    setOpen(false);
                    router.refresh();
                  });
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[var(--surface-2)]"
              >
                {r}
                {r === role && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
