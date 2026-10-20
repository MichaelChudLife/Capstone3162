import Sidebar from "@/components/Sidebar";
import LiveRefresh from "@/components/LiveRefresh";
import { getNextReminderAt, getWorkspaceVersion } from "@/lib/data";
import type { Member } from "@/lib/types";

async function LiveUpdates() {
  const [version, nextReminderAt] = await Promise.all([getWorkspaceVersion(), getNextReminderAt()]);
  return <LiveRefresh version={version} nextReminderAt={nextReminderAt} />;
}

export default function AppShell({ user, children }: { user: Member; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <main className="min-h-screen pl-[76px]">
        <div className="mx-auto max-w-5xl px-8 py-7">{children}</div>
      </main>
      <LiveUpdates />
    </div>
  );
}
