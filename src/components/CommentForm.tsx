"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction } from "@/app/tasks/comment-actions";
import { Field, FormAlert, fieldClass, primaryButtonClass } from "@/components/form";
import { LIMITS, validateCommentInput } from "@/lib/validation";

export default function CommentForm({ taskId, searching }: { taskId: string; searching: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = validateCommentInput({ body });
    if (!check.ok) {
      setError(check.errors.body);
      return;
    }
    setError(undefined);
    setMessage(null);
    startTransition(async () => {
      const result = await addCommentAction(taskId, { body });
      if (!result.ok) {
        setError(result.errors?.body);
        setMessage(result.errors?.body ? null : result.message);
        return;
      }
      setBody("");
      if (searching) router.replace(`/tasks/${taskId}#comments`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="border-t border-[var(--border)] px-4 py-4">
      <FormAlert message={message} />
      <Field
        label="Add a comment"
        htmlFor="comment-body"
        error={error}
        hint={`${body.trim().length} / ${LIMITS.commentBody} characters`}
      >
        <textarea
          id="comment-body"
          className={`${fieldClass} min-h-20 resize-y`}
          value={body}
          maxLength={LIMITS.commentBody}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Post an update or ask a question about this task…"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "comment-body-error" : undefined}
          disabled={pending}
        />
      </Field>
      <div className="mt-3 flex justify-end">
        <button type="submit" className={primaryButtonClass} disabled={pending || !body.trim()}>
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
