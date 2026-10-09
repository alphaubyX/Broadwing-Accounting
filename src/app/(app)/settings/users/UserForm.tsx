"use client";

import { useState } from "react";
import Link from "next/link";
import type { OrgUser } from "@prisma/client";
import { Field } from "@/components/Field";
import type { ActionState } from "@/lib/forms";
import { ROLE_INFO } from "@/lib/roles";
import { SaveForm } from "../SaveForm";


export function UserForm({ action, user }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; user?: OrgUser }) {
  const [role, setRole] = useState<string>(user?.role ?? "EDITOR");
  const isOwner = user?.role === "OWNER";
  return (
    <SaveForm action={action} submitLabel={user ? "Save user" : "Send invite"} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5"
      secondary={<Link href="/settings/users" className="btn-ghost">Cancel</Link>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input name="name" defaultValue={user?.name ?? ""} className="input" placeholder="Optional" /></Field>
        <Field label="Email"><input name="email" type="email" defaultValue={user?.email} className="input" required /></Field>
      </div>
      {isOwner ? (
        <p className="text-sm text-slate-600">This is the owner of the business. The owner always has full access.</p>
      ) : (
        <>
          <fieldset>
            <legend className="label">Access</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["ADMIN", "EDITOR", "VIEWER"] as const).map((r) => (
                <label key={r} className={`cursor-pointer rounded-lg border bg-white p-3 text-sm ${role === r ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200"}`}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                  <div className="font-medium text-slate-900">{ROLE_INFO[r].label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{ROLE_INFO[r].help}</div>
                </label>
              ))}
            </div>
          </fieldset>
          {role === "EDITOR" && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="canSendInvoices" defaultChecked={user?.canSendInvoices ?? false} />
              Can send invoices to customers
            </label>
          )}
        </>
      )}
    </SaveForm>
  );
}
