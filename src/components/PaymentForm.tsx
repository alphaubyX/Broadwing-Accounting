"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/lib/forms";
import type { Option } from "./LineItemsEditor";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

export function PaymentForm({
  action,
  accounts,
  defaultAccountId,
  amountDue,
  today,
  label,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  accounts: Option[];
  defaultAccountId: string;
  amountDue: string;
  today: string;
  label: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <FormError error={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">Date</span>
          <input type="date" name="date" defaultValue={today} className="input" required />
        </label>
        <label>
          <span className="label">Amount</span>
          <input name="amount" defaultValue={amountDue} inputMode="decimal" className="input" required />
        </label>
        <label>
          <span className="label">{label}</span>
          <select name="accountId" defaultValue={defaultAccountId} className="input">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Method</span>
          <select name="method" className="input" defaultValue="Bank transfer">
            <option>Bank transfer</option>
            <option>Cash</option>
            <option>Card</option>
            <option>Cheque</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label">Reference</span>
        <input name="reference" className="input" placeholder="Optional" />
      </label>
      <SubmitButton>Record payment</SubmitButton>
    </form>
  );
}
