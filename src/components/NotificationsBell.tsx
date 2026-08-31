"use client";

import { useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";

export interface BellItem {
  id: string;
  title: string;
  label: string;
  urgency: "overdue" | "today" | "soon";
}

const dot: Record<BellItem["urgency"], string> = {
  overdue: "var(--danger)",
  today: "var(--warn)",
  soon: "var(--warn)",
};

export default function NotificationsBell({ items }: { items: BellItem[] }) {
  const [open, setOpen] = useState(false);
  const urgent = items.filter((i) => i.urgency === "overdue" || i.urgency === "today").length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
        aria-label="Notifications"
      >
        <BellIcon width={19} height={19} />
        {urgent > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[11px] font-semibold text-white">
            {urgent}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--ink)]">Reminders</span>
              <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--brand-strong)]">
                {items.length} due
              </span>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: dot[item.urgency] }} />
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-[var(--ink)]">{item.title}</div>
                    <div className="text-xs" style={{ color: dot[item.urgency] }}>{item.label}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/reminders"
              onClick={() => setOpen(false)}
              className="block bg-[var(--surface-2)] px-4 py-3 text-center text-sm font-medium text-[var(--brand-strong)] hover:bg-[var(--brand-soft)]"
            >
              View all reminders
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
