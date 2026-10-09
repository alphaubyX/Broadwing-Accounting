"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { LineItemsEditor, type EditableLine, type Option, type TaxOption } from "@/components/LineItemsEditor";
import { SubmitButton } from "@/components/SubmitButton";
import { addDays } from "@/lib/dates";
import type { ActionState } from "@/lib/forms";

export interface SaleDefaults {
  contactId: string;
  date: string;
  dueDate: string;
  reference: string;
  notes: string;
  settlement: "PAID_NOW" | "ON_TERMS";
  paidIntoAccountId: string;
  lines?: EditableLine[];
}

export function SaleForm({
  action,
  defaults,
  customers,
  incomeAccounts,
  depositAccounts,
  taxes,
  defaultIncomeId,
  currency,
  paymentTerms,
  canDraft,
  isNew,
  cancelHref,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  defaults: SaleDefaults;
  customers: Option[];
  incomeAccounts: Option[];
  depositAccounts: Option[];
  taxes: TaxOption[];
  defaultIncomeId: string;
  currency: string;
  paymentTerms: number;
  canDraft: boolean;
  isNew: boolean;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [settlement, setSettlement] = useState(defaults.settlement);
  const [date, setDate] = useState(defaults.date);
  const [dueDate, setDueDate] = useState(defaults.dueDate || addDays(defaults.date, paymentTerms));

  return (
    <form action={formAction} className="space-y-6">
      <FormError error={state.error} />
      <input type="hidden" name="settlement" value={settlement} />

      <div className="card space-y-5 p-6">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
          {(
            [
              ["ON_TERMS", "Invoice — customer pays later"],
              ["PAID_NOW", "Paid now (cash sale)"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSettlement(value)}
              className={clsx("rounded-md px-3 py-1.5 font-medium", settlement === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Customer" className="sm:col-span-2">
            <select name="contactId" defaultValue={defaults.contactId} className="input">
              <option value="">{settlement === "PAID_NOW" ? "Walk-in customer" : "Choose a customer…"}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="hint block">
              <Link href="/contacts/new?type=CUSTOMER" className="text-brand-600 hover:underline" target="_blank">
                + New customer
              </Link>
            </span>
          </Field>
          <Field label="Date">
            <input
              type="date"
              name="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setDueDate(addDays(e.target.value, paymentTerms));
              }}
              className="input"
              required
            />
          </Field>
          {settlement === "ON_TERMS" ? (
            <Field label="Due date" hint={`Default terms: ${paymentTerms} days`}>
              <input type="date" name="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </Field>
          ) : (
            <Field label="Deposited to">
              <select name="paidIntoAccountId" defaultValue={defaults.paidIntoAccountId} className="input">
                {depositAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Reference / PO number" className="sm:col-span-2">
            <input name="reference" defaultValue={defaults.reference} className="input" placeholder="Optional" />
          </Field>
        </div>

        <LineItemsEditor
          mode="items"
          accounts={incomeAccounts}
          taxes={taxes}
          initial={defaults.lines}
          defaultAccountId={defaultIncomeId}
          currency={currency}
          accountLabel="Income account"
        />

        <Field label="Notes to customer">
          <textarea name="notes" defaultValue={defaults.notes} rows={3} className="input" />
        </Field>

        {isNew && (
          <div>
            <span className="label">Attachments</span>
            <AttachmentPicker />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link href={cancelHref} className="btn-ghost">
          Cancel
        </Link>
        {canDraft && (
          <SubmitButton name="intent" value="draft" className="btn-secondary">
            Save as draft
          </SubmitButton>
        )}
        <SubmitButton name="intent" value="approve">
          {canDraft ? "Approve & save" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
