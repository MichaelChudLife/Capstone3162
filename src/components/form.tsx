export const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)] aria-[invalid=true]:border-[var(--danger)] disabled:bg-[var(--surface-2)] disabled:text-[var(--muted)]";

export const primaryButtonClass =
  "rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)] disabled:opacity-50";

export const secondaryButtonClass =
  "rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]";

export const dangerButtonClass =
  "rounded-xl bg-[var(--danger)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
        {label}
        {optional && <span className="font-normal">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="mt-1.5 text-xs font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : (
        hint && <div className="mt-1.5 text-xs text-[var(--muted)]">{hint}</div>
      )}
    </div>
  );
}

export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl bg-[var(--danger-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--danger)]">
      {message}
    </div>
  );
}
