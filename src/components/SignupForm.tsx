"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/app/invite/[token]/actions";
import { Field, FormAlert, fieldClass } from "@/components/form";
import { LIMITS, validateSignupInput } from "@/lib/validation";
import type { FieldErrors, SignupInput } from "@/lib/types";

type Errors = FieldErrors<keyof SignupInput>;

export default function SignupForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: SignupInput = { name, password, confirmPassword };
    const check = validateSignupInput(input, { email });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await acceptInviteAction(token, input);
      if (!result.ok) {
        setErrors((result.errors as Errors) ?? {});
        setFormError(result.message);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-7 space-y-4">
      <FormAlert message={formError} />
      <Field label="Email" htmlFor="signup-email">
        <input id="signup-email" className={fieldClass} type="email" value={email} readOnly disabled autoComplete="username" />
      </Field>
      <Field label="Full name" htmlFor="signup-name" error={errors.name}>
        <input
          id="signup-name"
          className={fieldClass}
          value={name}
          maxLength={LIMITS.memberName}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          autoFocus
        />
      </Field>
      <Field label="Password" htmlFor="signup-password" error={errors.password} hint={`At least ${LIMITS.passwordMin} characters.`}>
        <input
          id="signup-password"
          className={fieldClass}
          type="password"
          value={password}
          maxLength={LIMITS.passwordMax}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "signup-password-error" : undefined}
        />
      </Field>
      <Field label="Confirm password" htmlFor="signup-confirm" error={errors.confirmPassword}>
        <input
          id="signup-confirm"
          className={fieldClass}
          type="password"
          value={confirmPassword}
          maxLength={LIMITS.passwordMax}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "signup-confirm-error" : undefined}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)] disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
