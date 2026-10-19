import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import { getMemberById, getMembers, getOpenInvites, hasPermission, inviteState } from "@/lib/data";
import { requireCurrentMember } from "@/lib/auth";
import { Avatar } from "@/components/ui";
import RoleSelect from "@/components/RoleSelect";
import InviteMemberButton from "@/components/InviteMemberButton";
import InviteRowActions from "@/components/InviteRowActions";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const perms: { role: string; desc: string }[] = [
  { role: "IT Director", desc: "Manage every member's access and all workspace content, including budgets" },
  { role: "Committee Director", desc: "Create and manage events, tasks and event budgets" },
  { role: "Events Director", desc: "Manage event planning, event-linked work and event budgets" },
  { role: "Marketing Director", desc: "View workspace information for marketing delivery" },
  { role: "Finance Director", desc: "Record and manage event budgets; view workspace information" },
  { role: "Committee Member", desc: "View workspace information and assigned work" },
];

export default async function MembersPage() {
  const user = await requireCurrentMember();
  const members = getMembers();
  const canManageAccess = user.accessRole === "IT Director";
  const canInvite = hasPermission("manage_access", user);
  const openInvites = canInvite ? getOpenInvites() : [];

  return (
    <AppShell user={user}>
      <PageHeader
        title="Members"
        subtitle="Assign access by responsibility. Only the IT Director can change a role or invite new members."
        actions={canInvite ? <InviteMemberButton /> : undefined}
      />

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
                <div className="text-xs text-[var(--muted)]">{m.email}</div>
              </div>
              <span className="hidden text-xs text-[var(--muted)] sm:block">{m.role}</span>
              <RoleSelect memberId={m.id} value={m.accessRole} disabled={!canManageAccess} />
            </li>
          ))}
        </ul>
      </section>

      {canInvite && (
        <section className="card mt-6 p-2">
          <header className="flex items-center justify-between px-4 py-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">Pending invites</h2>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">{openInvites.length}</span>
          </header>
          {openInvites.length === 0 ? (
            <p className="border-t border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
              No open invites. Use Invite member to create a one-time sign-up link.
            </p>
          ) : (
            <ul>
              {openInvites.map((invite) => {
                const expired = inviteState(invite) === "expired";
                const inviter = getMemberById(invite.invitedById);
                return (
                  <li key={invite.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] px-4 py-3.5">
                    <div className="min-w-0 flex-1 basis-56">
                      <div className="truncate text-sm font-medium text-[var(--ink)]">{invite.email}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted)]">
                        {invite.accessRole}
                        {invite.position ? ` · ${invite.position}` : ""} · invited by {inviter?.name ?? "a former member"}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        expired ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--warn-soft)] text-[var(--warn)]"
                      }`}
                    >
                      {expired ? "Expired" : `Expires ${formatDate(invite.expiresAt)}`}
                    </span>
                    <InviteRowActions inviteId={invite.id} email={invite.email} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </AppShell>
  );
}
