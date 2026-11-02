import Link from "next/link";
import CommentForm from "@/components/CommentForm";
import { Avatar } from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { fieldClass } from "@/components/form";
import { countTaskComments, getMembersByIds, getTaskComments } from "@/lib/data";
import { formatDateTime, timeAgo } from "@/lib/format";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded bg-[var(--brand-soft)] px-0.5 text-[var(--ink)]">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default async function TaskComments({ taskId, keyword }: { taskId: string; keyword: string }) {
  const term = keyword.trim();
  const [comments, total] = await Promise.all([getTaskComments(taskId, term), countTaskComments(taskId)]);
  const authorIds = [...new Set(comments.map((c) => c.authorId).filter((id): id is string => Boolean(id)))];
  const authors = new Map((await getMembersByIds(authorIds)).map((member) => [member.id, member]));
  const summary = term
    ? `${comments.length} of ${total} match “${term}”`
    : `${total} ${total === 1 ? "comment" : "comments"}, oldest first`;

  return (
    <section id="comments" className="card mt-6 p-2">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">Comments</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{summary}</p>
        </div>
        {(total > 0 || term) && (
          <form action={`/tasks/${taskId}#comments`} role="search" className="flex items-center gap-2">
            <label htmlFor="comment-search" className="sr-only">
              Search comments
            </label>
            <div className="relative">
              <SearchIcon
                width={15}
                height={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                id="comment-search"
                name="q"
                type="search"
                defaultValue={term}
                placeholder="Search comments"
                className={`${fieldClass} w-52 py-1.5 pl-8`}
              />
            </div>
            {term && (
              <Link
                href={`/tasks/${taskId}#comments`}
                className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
              >
                Clear
              </Link>
            )}
          </form>
        )}
      </header>
      {comments.length === 0 ? (
        <p className="border-t border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
          {term ? `No comments match “${term}”.` : "No comments yet. Post the first update below."}
        </p>
      ) : (
        <ol className="border-t border-[var(--border)]">
          {comments.map((comment) => {
            const author = comment.authorId ? authors.get(comment.authorId) : undefined;
            return (
              <li key={comment.id} className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0">
                <Avatar member={author} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold text-[var(--ink)]">{author?.name ?? "Former member"}</span>
                    <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)} className="text-xs text-[var(--muted)]">
                      {formatDateTime(comment.createdAt)} · {timeAgo(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--ink)]">
                    <Highlight text={comment.body} term={term} />
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <CommentForm taskId={taskId} searching={Boolean(term)} />
    </section>
  );
}
