"use client";

import { useState } from "react";
import type { AccountSubtype, AccountType } from "@prisma/client";
import { Field } from "@/components/Field";
import { ACCOUNT_TYPE_LABELS, SUBTYPES_BY_TYPE, SUBTYPE_LABELS } from "@/lib/accounting/default-chart";
import type { ActionState } from "@/lib/forms";
import { SaveForm } from "../SaveForm";

export function AccountForm({
  action,
  initial,
  submitLabel,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: { code: string; name: string; type: AccountType; subtype: AccountSubtype; description: string | null };
  submitLabel: string;
}) {
  const [type, setType] = useState<AccountType>(initial?.type ?? "EXPENSE");
  return (
    <SaveForm action={action} submitLabel={submitLabel} className="space-y-4 rounded-lg bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-[100px_1fr_160px_200px]">
        <Field label="Code"><input name="code" defaultValue={initial?.code} className="input" required /></Field>
        <Field label="Name"><input name="name" defaultValue={initial?.name} className="input" required /></Field>
        <Field label="Type">
          <select name="type" value={type} onChange={(e) => setType(e.target.value as AccountType)} className="input">
            {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
              <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Detail type">
          <select key={type} name="subtype" defaultValue={initial?.type === type ? initial.subtype : SUBTYPES_BY_TYPE[type][0]} className="input">
            {SUBTYPES_BY_TYPE[type].map((s) => (
              <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description"><input name="description" defaultValue={initial?.description ?? ""} className="input" placeholder="Optional" /></Field>
    </SaveForm>
  );
}
