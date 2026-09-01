"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, BoardIcon, CalendarIcon, BellIcon, UsersIcon } from "@/components/icons";

const nav = [
  { href: "/", label: "Dashboard", Icon: DashboardIcon },
  { href: "/tasks", label: "Tasks", Icon: BoardIcon },
  { href: "/events", label: "Events", Icon: CalendarIcon },
  { href: "/members", label: "Members", Icon: UsersIcon },
  { href: "/reminders", label: "Reminders", Icon: BellIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-screen w-[76px] flex-col items-center gap-2 py-5"
      style={{ background: "var(--sidebar)" }}
    >
      <Link href="/" className="mb-4 flex h-11 w-11 items-center justify-center" aria-label="CCA Hub">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cca-logo.png" alt="CCA Hub" className="h-9 w-9 object-contain" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {nav.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
              style={
                active
                  ? { background: "var(--brand)", color: "#fff" }
                  : { color: "var(--sidebar-muted)" }
              }
            >
              <Icon width={21} height={21} />
            </Link>
          );
        })}
      </nav>

      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ color: "var(--sidebar-muted)" }}
        aria-label="Settings"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      </button>
    </aside>
  );
}
