"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { LineItemsEditor, type EditableLine, type Option, type TaxOption } from "@/components/LineItemsEditor";
import { SubmitButton } from "@/components/SubmitButton";
import type { ActionState } from "@/lib/forms";

export interface PODefaults {
  contactId: string;
  date: string;
  expectedDate: string;
  reference: string;
  notes: string;
  lines?: EditableLine[];
}

export function PurchaseOrderForm({
  action,
  defaults,
  vendors,
  categories,
  taxes,
  defaultExpenseId,
  currency,
  isNew,
  cancelHref,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  defaults: PODefaults;
  vendors: Option[];
  categories: Option[];
  taxes: TaxOption[];
  defaultExpenseId: string;
  currency: string;
  isNew: boolean;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-6">
      <FormError error={state.error} />
      <div className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Vendor" className="sm:col-span-2">
            <select name="contactId" defaultValue={defaults.contactId} className="input" required>
              <option value="">Choose a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            <span className="hint block">
              <Link href="/contacts/new?type=VENDOR" className="text-brand-600 hover:underline" target="_blank">
                + New vendor
              </Link>
            </span>
          </Field>
          <Field label="Order date">
            <input type="date" name="date" defaultValue={defaults.date} className="input" required />
          </Field>
          <Field label="Delivery by">
            <input type="date" name="expectedDate" defaultValue={defaults.expectedDate} className="input" />
          </Field>
          <Field label="Reference" className="sm:col-span-2">
            <input name="reference" defaultValue={defaults.reference} className="input" placeholder="Optional" />
          </Field>
        </div>
        <LineItemsEditor
          mode="items"
          accounts={categories}
          taxes={taxes}
          initial={defaults.lines}
          defaultAccountId={defaultExpenseId}
          currency={currency}
          accountLabel="Category"
        />
        <Field label="Notes / delivery instructions">
          <textarea name="notes" defaultValue={defaults.notes} rows={3} className="input" />
        </Field>
        {isNew && (
          <div>
            <span className="label">Attachments</span>
            <AttachmentPicker />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-ghost">
          Cancel
        </Link>
        <SubmitButton>Save purchase order</SubmitButton>
      </div>
    </form>
  );
}
