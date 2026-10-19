"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon } from "@/components/icons";
import { markAllRemindersReadAction, markReminderReadAction } from "@/app/reminders/actions";
import type { ReminderKind } from "@/lib/types";

export interface BellItem {
  id: string;
  taskId: string;
  title: string;
  label: string;
  kind: ReminderKind;
  unread: boolean;
}

const tone: Record<ReminderKind, string> = {
  overdue: "var(--danger)",
  due_soon: "var(--warn)",
};

export default function NotificationsBell({ items }: { items: BellItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const unread = items.filter((i) => i.unread).length;

  function openReminder(item: BellItem) {
    setOpen(false);
    startTransition(async () => {
      if (item.unread) await markReminderReadAction(item.id);
      router.push(`/tasks/${item.taskId}`);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllRemindersReadAction();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        aria-label={unread > 0 ? `Reminders, ${unread} unread` : "Reminders"}
      >
        <BellIcon width={19} height={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[11px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--ink)]">Your reminders</span>
              {unread > 0 ? (
                <button
                  onClick={markAll}
                  disabled={pending}
                  className="text-xs font-semibold text-[var(--brand-strong)] hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              ) : (
                <span className="text-xs text-[var(--muted)]">All caught up</span>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">Nothing due in the next 48 hours.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="border-b border-[var(--border)] last:border-0">
                    <button
                      onClick={() => openReminder(item)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)] ${item.unread ? "" : "opacity-70"}`}
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: item.unread ? tone[item.kind] : "var(--border)" }}
                      />
                      <span className="min-w-0 leading-tight">
                        <span className={`block truncate text-sm text-[var(--ink)] ${item.unread ? "font-semibold" : "font-medium"}`}>
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs" style={{ color: tone[item.kind] }}>
                          {item.label}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
