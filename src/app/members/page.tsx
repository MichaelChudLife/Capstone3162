import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import { getCurrentUser, getMembers } from "@/lib/data";
import { Avatar } from "@/components/ui";
import RoleSelect from "@/components/RoleSelect";

export const dynamic = "force-dynamic";

const emailByMember: Record<string, string> = {
  m1: "michael@cca.org.au",
  m2: "yahya@cca.org.au",
  m3: "nathanael@cca.org.au",
  m4: "yunsoo@cca.org.au",
  m5: "sener@cca.org.au",
};

const perms: { role: string; desc: string }[] = [
  { role: "IT Director", desc: "Manage every member's access and all workspace content" },
  { role: "Committee Director", desc: "Full create, edit and manage privileges over events and tasks" },
  { role: "Events Director", desc: "Manage event planning and event-linked work" },
  { role: "Marketing Director", desc: "View workspace information for marketing delivery" },
  { role: "Finance Director", desc: "View workspace information for finance delivery" },
  { role: "Committee Member", desc: "View events and update tasks assigned to them" },
];

export default function MembersPage() {
  const members = getMembers();
  const canManageAccess = getCurrentUser().accessRole === "IT Director";

  return (
    <AppShell>
      <PageHeader title="Members" subtitle="Assign access by responsibility. Only the IT Director can change a role." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <RoleSelect memberId={m.id} value={m.accessRole} disabled={!canManageAccess} />
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
