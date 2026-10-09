import Link from "next/link";
import { Field } from "@/components/Field";
import { requireOrganization } from "@/lib/org";
import { saveProfile } from "./actions";
import { SaveForm } from "./SaveForm";

export const metadata = { title: "Business profile" };

export default async function BusinessProfile({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const org = await requireOrganization();
  return (
    <div className="space-y-4">
      {welcome && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Your business is ready. Check your details here, then add your logo and choose a template under{" "}
          <Link href="/settings/invoice" className="font-medium underline">Invoice customization</Link>.
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Business profile</h2>
        <p className="text-sm text-slate-500">These details appear on your invoices and purchase orders.</p>
      </div>
      <SaveForm action={saveProfile}>
        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-sm font-semibold text-slate-900 sm:col-span-2">Business</h3>
          <Field label="Business name"><input name="name" defaultValue={org.name} className="input" required /></Field>
          <Field label="Legal name" hint="Printed on documents if set"><input name="legalName" defaultValue={org.legalName ?? ""} className="input" /></Field>
          <Field label="Email"><input name="email" type="email" defaultValue={org.email ?? ""} className="input" /></Field>
          <Field label="Phone"><input name="phone" defaultValue={org.phone ?? ""} className="input" /></Field>
          <Field label="Website" className="sm:col-span-2"><input name="website" defaultValue={org.website ?? ""} className="input" /></Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-sm font-semibold text-slate-900 sm:col-span-2">Address</h3>
          <Field label="Address line 1" className="sm:col-span-2"><input name="addressLine1" defaultValue={org.addressLine1 ?? ""} className="input" /></Field>
          <Field label="Address line 2" className="sm:col-span-2"><input name="addressLine2" defaultValue={org.addressLine2 ?? ""} className="input" /></Field>
          <Field label="City"><input name="city" defaultValue={org.city ?? ""} className="input" /></Field>
          <Field label="State / province"><input name="state" defaultValue={org.state ?? ""} className="input" /></Field>
          <Field label="Postal code"><input name="postalCode" defaultValue={org.postalCode ?? ""} className="input" /></Field>
          <Field label="Country"><input name="country" defaultValue={org.country ?? ""} className="input" /></Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-sm font-semibold text-slate-900 sm:col-span-2">Tax registration</h3>
          <Field label="Tax number label" hint='e.g. "VAT number", "GST no.", "TRN", "NTN"'>
            <input name="taxNumberLabel" defaultValue={org.taxNumberLabel} className="input" />
          </Field>
          <Field label="Tax number"><input name="taxNumber" defaultValue={org.taxNumber ?? ""} className="input" /></Field>
        </section>
      </SaveForm>
    </div>
  );
}
