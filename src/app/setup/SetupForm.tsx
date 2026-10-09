"use client";

import { useActionState } from "react";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import { CURRENCIES } from "@/lib/currencies";
import { setupOrganization } from "./actions";

export function SetupForm() {
  const [state, action] = useActionState(setupOrganization, {});
  return (
    <form action={action} className="card space-y-6 p-6">
      <FormError error={state.error} />
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" className="sm:col-span-2">
          <input name="name" className="input" required autoFocus placeholder="Broadwing Trading" />
        </Field>
        <Field label="Legal name" hint="If different from the business name">
          <input name="legalName" className="input" />
        </Field>
        <Field label="Currency">
          <select name="currency" className="input" defaultValue="USD">
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email">
          <input name="email" type="email" className="input" />
        </Field>
        <Field label="Phone">
          <input name="phone" className="input" />
        </Field>
        <Field label="Address">
          <input name="addressLine1" className="input" />
        </Field>
        <Field label="City">
          <input name="city" className="input" />
        </Field>
        <Field label="Country">
          <input name="country" className="input" />
        </Field>
        <Field label="Tax / VAT number">
          <input name="taxNumber" className="input" />
        </Field>
      </section>
      <section className="rounded-lg bg-slate-50 p-4">
        <div className="mb-3 text-sm font-medium text-slate-700">Do you charge sales tax or VAT? (optional)</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tax name">
            <input name="taxName" className="input" placeholder="VAT" />
          </Field>
          <Field label="Rate (%)">
            <input name="taxRate" className="input" inputMode="decimal" placeholder="15" />
          </Field>
        </div>
      </section>
      <p className="text-xs text-slate-500">
        We&apos;ll create a ready-to-use chart of accounts for you. You can rename, add or archive accounts at any time.
      </p>
      <div className="flex justify-end">
        <SubmitButton pendingText="Setting up…">Create my business</SubmitButton>
      </div>
    </form>
  );
}
