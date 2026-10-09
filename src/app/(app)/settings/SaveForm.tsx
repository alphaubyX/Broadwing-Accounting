"use client";

import { useActionState } from "react";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import type { ActionState } from "@/lib/forms";

/** Generic settings form: shows errors and a "Saved" confirmation. */
export function SaveForm({
  action,
  children,
  submitLabel = "Save",
  className = "card space-y-5 p-6",
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      <FormError error={state.error} />
      {children}
      <div className="flex items-center justify-end gap-3">
        {state.ok && <span className="text-sm text-emerald-600">Saved ✓</span>}
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
