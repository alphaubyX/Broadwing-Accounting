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

export interface ExpenseDefaults {
  payee: string;
  date: string;
  dueDate: string;
  description: string;
  reference: string;
  settlement: "PAID_NOW" | "ON_TERMS";
  paidFromAccountId: string;
  lines?: EditableLine[];
}

export function ExpenseForm({
  action,
  defaults,
  vendorNames,
  categories,
  payFromAccounts,
  taxes,
  defaultExpenseId,
  currency,
  paymentTerms,
  cancelHref,
  submitLabel,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  defaults: ExpenseDefaults;
  vendorNames: string[];
  categories: Option[];
  payFromAccounts: Option[];
  taxes: TaxOption[];
  defaultExpenseId: string;
  currency: string;
  paymentTerms: number;
  cancelHref: string;
  submitLabel: string;
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Field label="Paid to" hint="Vendor, shop or person" className="lg:col-span-1">
            <input name="payee" list="vendors" defaultValue={defaults.payee} className="input" placeholder="e.g. Office Depot" />
            <datalist id="vendors">
              {vendorNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label="What was it for?" className="sm:col-span-2">
            <input name="description" defaultValue={defaults.description} className="input" required placeholder="e.g. Printer paper and ink" />
          </Field>
        </div>

        <div className="space-y-3 rounded-lg bg-slate-50 p-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
            {(
              [
                ["PAID_NOW", "Already paid"],
                ["ON_TERMS", "Pay later (bill)"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSettlement(value)}
                className={clsx("rounded-md px-3 py-1.5 font-medium", settlement === value ? "bg-brand-500 text-white" : "text-slate-500")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {settlement === "PAID_NOW" ? (
              <Field label="Paid from">
                <select name="paidFromAccountId" defaultValue={defaults.paidFromAccountId} className="input">
                  {payFromAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Due date" hint={`Default terms: ${paymentTerms} days`}>
                <input type="date" name="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
              </Field>
            )}
            <Field label="Receipt / bill number">
              <input name="reference" defaultValue={defaults.reference} className="input" placeholder="Optional" />
            </Field>
          </div>
        </div>

        <LineItemsEditor
          mode="amounts"
          accounts={categories}
          taxes={taxes}
          initial={defaults.lines}
          defaultAccountId={defaultExpenseId}
          currency={currency}
          accountLabel="Category"
        />

        <div>
          <span className="label">Receipt</span>
          <p className="hint mb-2">Snap a photo of the receipt or attach a file — you can also add it later.</p>
          <AttachmentPicker />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className="btn-ghost">
          Cancel
        </Link>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
