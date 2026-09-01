import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import { getMembers } from "@/lib/data";
import { Avatar } from "@/components/ui";
import RoleSelect, { type Role } from "@/components/RoleSelect";

export const dynamic = "force-dynamic";

const roleByMember: Record<string, Role> = {
  m1: "IT Admin",
  m4: "Committee Director",
  m2: "Committee Member",
  m3: "Committee Member",
  m5: "Committee Member",
};

const emailByMember: Record<string, string> = {
  m1: "michael@cca.org.au",
  m2: "yahya@cca.org.au",
  m3: "nathanael@cca.org.au",
  m4: "yunsoo@cca.org.au",
  m5: "sener@cca.org.au",
};

const perms: { role: string; desc: string }[] = [
  { role: "IT Admin", desc: "Manage members, roles and invites" },
  { role: "Committee Director", desc: "Full create & edit of events and tasks" },
  { role: "Committee Member", desc: "View events; update self-assigned tasks" },
];

export default function MembersPage() {
  const members = getMembers();

  return (
    <AppShell>
      <PageHeader title="Members" subtitle="Committee members and their access roles. Only IT Admins can change a role." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {perms.map((p) => (
          <div key={p.role} className="card p-4">
            <div className="text-sm font-semibold text-[var(--ink)]">{p.role}</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{p.desc}</div>
          </div>
        ))}
      </div>

      <section className="card p-2">
        <header className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">Team members</h2>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{members.length}</span>
        </header>
        <ul>
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-3.5">
              <Avatar member={m} size={40} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--ink)]">{m.name}</div>
                <div className="text-xs text-[var(--muted)]">{emailByMember[m.id]}</div>
              </div>
              <span className="hidden text-xs text-[var(--muted)] sm:block">{m.role}</span>
              <RoleSelect value={roleByMember[m.id]} />
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
