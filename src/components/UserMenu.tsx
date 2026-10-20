"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { BellIcon, ChevronDownIcon, DashboardIcon, LogOutIcon, UsersIcon } from "@/components/icons";

export interface AccountSummary {
  name: string;
  initials: string;
  color: string;
  email: string;
  role: string;
  accessRole: string;
}

const GUTTER = 8;

function nudge(start: number, end: number, limit: number) {
  if (start < GUTTER) return GUTTER - start;
  if (end > limit - GUTTER) return Math.max(GUTTER - start, limit - GUTTER - end);
  return 0;
}

const options = [
  { href: "/", label: "My tasks", Icon: DashboardIcon },
  { href: "/reminders", label: "My reminders", Icon: BellIcon },
  { href: "/members", label: "Team members", Icon: UsersIcon },
];

function Initials({ user, size }: { user: AccountSummary; size: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: user.color, fontSize: size * 0.38 }}
    >
      {user.initials}
    </span>
  );
}

export default function UserMenu({
  user,
  placement = "header",
}: {
  user: AccountSummary;
  placement?: "header" | "sidebar";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const sidebar = placement === "sidebar";

  useLayoutEffect(() => {
    const node = panel.current;
    if (!open || !node) return;
    node.style.translate = "";
    const rect = node.getBoundingClientRect();
    const dx = nudge(rect.left, rect.right, window.innerWidth);
    const dy = nudge(rect.top, rect.bottom, window.innerHeight);
    if (dx || dy) node.style.translate = `${dx}px ${dy}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function logOut() {
    startTransition(() => logoutAction());
  }

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Account menu for ${user.name}`}
        title={sidebar ? `${user.name} · ${user.accessRole}` : undefined}
        className={
          sidebar
            ? "flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            : "flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-2.5 text-[var(--ink)] hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
        }
      >
        <Initials user={user} size={sidebar ? 36 : 32} />
        {!sidebar && (
          <>
            <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:block">{user.name}</span>
            <ChevronDownIcon
              width={16}
              height={16}
              className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            ref={panel}
            id={panelId}
            className={`absolute z-40 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl ${
              sidebar ? "bottom-0 left-full ml-3" : "right-0 top-full mt-2"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5">
              <Initials user={user} size={40} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-[var(--ink)]">{user.name}</div>
                <div className="mt-0.5 truncate text-xs text-[var(--muted)]">{user.email}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-strong)]">
                    {user.accessRole}
                  </span>
                  {user.role && <span className="truncate text-[11px] text-[var(--muted)]">{user.role}</span>}
                </div>
              </div>
            </div>

            <nav aria-label="Account" className="py-1.5">
              {options.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)]"
                >
                  <Icon width={17} height={17} className="text-[var(--muted)]" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-[var(--border)] py-1.5">
              <button
                type="button"
                onClick={logOut}
                disabled={pending}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-60"
              >
                <LogOutIcon width={17} height={17} />
                {pending ? "Logging out…" : "Log out"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
