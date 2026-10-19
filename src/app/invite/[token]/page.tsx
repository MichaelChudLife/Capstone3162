import Image from "next/image";
import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import { findInviteByTokenHash, getMemberById } from "@/lib/data";
import { getSessionMemberId } from "@/lib/auth";
import { hashInviteToken } from "@/lib/invite-token";
import { inviteProblem } from "@/lib/invites";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = findInviteByTokenHash(hashInviteToken(token));
  const problem = inviteProblem(invite);
  const sessionId = await getSessionMemberId();
  const signedInAs = sessionId ? getMemberById(sessionId) : undefined;
  const inviter = invite ? getMemberById(invite.invitedById) : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Image src="/cca-logo.png" alt="CCA Hub" width={44} height={44} className="mb-8 h-11 w-11 object-contain" priority />

        {problem || !invite ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Invite unavailable</h1>
            <div role="alert" className="mt-4 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
              {problem}
            </div>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-semibold text-[var(--brand-strong)] hover:underline"
            >
              Go to log in →
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Join the CCA committee workspace</h1>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              {inviter ? `${inviter.name} invited you` : "You've been invited"} as{" "}
              <span className="font-semibold text-[var(--ink)]">{invite.accessRole}</span>
              {invite.position ? ` (${invite.position})` : ""}. This link works once and expires {formatDate(invite.expiresAt)}.
            </p>
            {signedInAs && (
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
                You&apos;re signed in as <span className="font-semibold text-[var(--ink)]">{signedInAs.name}</span>. Creating this account
                signs you in as the new member instead.
              </div>
            )}
            <SignupForm token={token} email={invite.email} />
          </>
        )}
      </div>
    </div>
  );
}
