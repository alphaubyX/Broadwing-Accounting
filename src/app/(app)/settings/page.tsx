import { Field } from "@/components/Field";
import { CURRENCIES } from "@/lib/currencies";
import { requireOrganization } from "@/lib/org";
import { saveOrganization } from "./actions";
import { SaveForm } from "./SaveForm";

export const metadata = { title: "Business details" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function BusinessSettings({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const org = await requireOrganization();
  return (
    <div className="space-y-4">
      {welcome && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Your business is ready. Add your logo and address here, then pick a look for your invoices under{" "}
          <a href="/settings/branding" className="font-medium underline">Invoice &amp; PO design</a>.
        </div>
      )}
      <SaveForm action={saveOrganization}>
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Logo</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {org.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/logo?v=${org.updatedAt.getTime()}`} alt="Logo" className="max-h-16 max-w-36 object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No logo</span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <input type="file" name="logo" accept="image/*" className="block text-sm" />
              {org.logoPath && (
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" name="removeLogo" /> Remove logo
                </label>
              )}
              <p className="hint">PNG, JPG or SVG. Shown on invoices and purchase orders.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Business</h2>
          <Field label="Business name"><input name="name" defaultValue={org.name} className="input" required /></Field>
          <Field label="Legal name" hint="Printed on documents if set"><input name="legalName" defaultValue={org.legalName ?? ""} className="input" /></Field>
          <Field label="Email"><input name="email" type="email" defaultValue={org.email ?? ""} className="input" /></Field>
          <Field label="Phone"><input name="phone" defaultValue={org.phone ?? ""} className="input" /></Field>
          <Field label="Website" className="sm:col-span-2"><input name="website" defaultValue={org.website ?? ""} className="input" /></Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Address</h2>
          <Field label="Address line 1" className="sm:col-span-2"><input name="addressLine1" defaultValue={org.addressLine1 ?? ""} className="input" /></Field>
          <Field label="Address line 2" className="sm:col-span-2"><input name="addressLine2" defaultValue={org.addressLine2 ?? ""} className="input" /></Field>
          <Field label="City"><input name="city" defaultValue={org.city ?? ""} className="input" /></Field>
          <Field label="State / province"><input name="state" defaultValue={org.state ?? ""} className="input" /></Field>
          <Field label="Postal code"><input name="postalCode" defaultValue={org.postalCode ?? ""} className="input" /></Field>
          <Field label="Country"><input name="country" defaultValue={org.country ?? ""} className="input" /></Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Tax & accounting</h2>
          <Field label="Tax number label" hint='e.g. "VAT number", "GST no.", "TRN"'>
            <input name="taxNumberLabel" defaultValue={org.taxNumberLabel} className="input" />
          </Field>
          <Field label="Tax number"><input name="taxNumber" defaultValue={org.taxNumber ?? ""} className="input" /></Field>
          <Field label="Currency">
            <select name="currency" defaultValue={org.currency} className="input">
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Fiscal year starts in">
            <select name="fiscalYearStartMonth" defaultValue={org.fiscalYearStartMonth} className="input">
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Default payment terms (days)">
            <input name="defaultPaymentTerms" type="number" min={0} max={365} defaultValue={org.defaultPaymentTerms} className="input" />
          </Field>
        </section>
      </SaveForm>
    </div>
  );
}
