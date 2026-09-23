"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, BoardIcon, CalendarIcon, BellIcon, UsersIcon } from "@/components/icons";
import LogoutButton from "@/components/LogoutButton";
import type { Member } from "@/lib/types";

const nav = [
  { href: "/", label: "Dashboard", Icon: DashboardIcon },
  { href: "/tasks", label: "Tasks", Icon: BoardIcon },
  { href: "/events", label: "Events", Icon: CalendarIcon },
  { href: "/members", label: "Members", Icon: UsersIcon },
  { href: "/reminders", label: "Reminders", Icon: BellIcon },
];

export default function Sidebar({ user }: { user: Member }) {
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

      <div
        title={`${user.name} · ${user.accessRole}`}
        aria-label={`Logged in as ${user.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: user.color }}
      >
        {user.initials}
      </div>
      <LogoutButton />
    </aside>
  );
}
