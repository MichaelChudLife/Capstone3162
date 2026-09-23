"use client";

import { Avatar, UnassignedFlag } from "@/components/ui";
import type { Member } from "@/lib/types";

export default function AssigneePicker({
  id,
  members,
  value,
  onChange,
  invalid = false,
}: {
  id?: string;
  members: Member[];
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  function toggle(memberId: string) {
    onChange(value.includes(memberId) ? value.filter((v) => v !== memberId) : [...value, memberId]);
  }

  return (
    <div>
      <div
        id={id}
        role="group"
        aria-label="Assignees"
        className={`flex flex-wrap gap-2 ${invalid ? "rounded-xl ring-1 ring-[var(--danger)] ring-offset-4 ring-offset-[var(--surface)]" : ""}`}
      >
        {members.map((m) => {
          const selected = value.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(m.id)}
              className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
                selected
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] font-medium text-[var(--brand-strong)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Avatar member={m} size={24} />
              {m.name.split(" ")[0]}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex min-h-6 items-center text-xs text-[var(--muted)]">
        {value.length === 0 ? (
          <UnassignedFlag />
        ) : (
          `${value.length} member${value.length === 1 ? "" : "s"} assigned`
        )}
      </div>
    </div>
  );
}
