import Sidebar from "@/components/Sidebar";
import LiveRefresh from "@/components/LiveRefresh";
import { getNextReminderAt, getWorkspaceVersion, syncReminders } from "@/lib/data";
import type { Member } from "@/lib/types";

export default function AppShell({ user, children }: { user: Member; children: React.ReactNode }) {
  syncReminders();
  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <main className="min-h-screen pl-[76px]">
        <div className="mx-auto max-w-5xl px-8 py-7">{children}</div>
      </main>
      <LiveRefresh version={getWorkspaceVersion()} nextReminderAt={getNextReminderAt()} />
    </div>
  );
}
