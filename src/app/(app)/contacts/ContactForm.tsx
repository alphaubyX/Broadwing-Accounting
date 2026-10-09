"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Contact } from "@prisma/client";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import type { ActionState } from "@/lib/forms";

export function ContactForm({
  action,
  contact,
  defaultType,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  contact?: Contact;
  defaultType: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="card max-w-2xl space-y-4 p-6">
      <FormError error={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <input name="name" defaultValue={contact?.name} className="input" required autoFocus />
        </Field>
        <Field label="Type">
          <select name="type" defaultValue={contact?.type ?? defaultType} className="input">
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor / supplier</option>
            <option value="BOTH">Both</option>
          </select>
        </Field>
        <Field label="Tax number">
          <input name="taxNumber" defaultValue={contact?.taxNumber ?? ""} className="input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={contact?.email ?? ""} className="input" />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={contact?.phone ?? ""} className="input" />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <textarea name="address" defaultValue={contact?.address ?? ""} rows={3} className="input" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea name="notes" defaultValue={contact?.notes ?? ""} rows={2} className="input" />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Link href="/contacts" className="btn-ghost">
          Cancel
        </Link>
        <SubmitButton>Save contact</SubmitButton>
      </div>
    </form>
  );
}
