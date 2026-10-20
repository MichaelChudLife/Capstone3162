import { Avatar } from "@/components/ui";
import { getMembersByIds, getStatusHistory } from "@/lib/data";
import { formatDateTime, timeAgo } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/types";

export default async function StatusHistory({ taskId }: { taskId: string }) {
  const history = await getStatusHistory(taskId);
  const actorIds = [...new Set(history.map((change) => change.actorId).filter((id): id is string => Boolean(id)))];
  const actors = new Map((await getMembersByIds(actorIds)).map((member) => [member.id, member]));

  return (
    <section className="card mt-6 p-2">
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--ink)]">Activity</h2>
        <span className="text-xs text-[var(--muted)]">Status changes, newest first</span>
      </header>
      {history.length === 0 ? (
        <p className="border-t border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">No status changes yet.</p>
      ) : (
        <ol className="border-t border-[var(--border)]">
          {history.map((change) => {
            const actor = change.actorId ? actors.get(change.actorId) : undefined;
            return (
              <li key={change.id} className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0">
                <Avatar member={actor} size={28} />
                <div className="min-w-0 flex-1 text-sm text-[var(--ink)]">
                  <span className="font-semibold">{actor?.name ?? "Former member"}</span> moved this from{" "}
                  <span className="font-medium">{STATUS_LABEL[change.from]}</span> to{" "}
                  <span className="font-medium">{STATUS_LABEL[change.to]}</span>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    <time dateTime={change.at} title={formatDateTime(change.at)}>
                      {formatDateTime(change.at)} · {timeAgo(change.at)}
                    </time>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
