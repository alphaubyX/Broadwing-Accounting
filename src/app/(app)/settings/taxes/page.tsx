import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Tax } from "@prisma/client";
import { ActionButton } from "@/components/ActionButton";
import { Field } from "@/components/Field";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";
import { deleteTax, restoreTax, saveTax } from "../actions";
import { SaveForm } from "../SaveForm";

export const metadata = { title: "Sales taxes" };

export default async function TaxesPage({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const { edit, new: isNew } = await searchParams;
  const org = await requireOrganization();
  const [taxes, liabilityAccounts, defaultTax] = await Promise.all([
    db.tax.findMany({ where: { organizationId: org.id }, include: { account: true }, orderBy: { abbreviation: "asc" } }),
    db.account.findMany({ where: { organizationId: org.id, type: "LIABILITY", isArchived: false }, orderBy: { code: "asc" } }),
    db.accountMapping.findUnique({ where: { organizationId_key: { organizationId: org.id, key: "SALES_TAX" } } }),
  ]);
  const active = taxes.filter((t) => !t.isArchived);
  const archived = taxes.filter((t) => t.isArchived);

  const form = (tax?: Tax) => (
    <SaveForm
      action={saveTax.bind(null, tax?.id ?? null)}
      submitLabel={tax ? "Save sales tax" : "Create sales tax"}
      className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5"
      secondary={<Link href="/settings/taxes" className="btn-ghost">Cancel</Link>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tax name"><input name="name" defaultValue={tax?.name} className="input" placeholder="General Sales Tax" required /></Field>
        <Field label="Abbreviation" hint="Shown on invoices, e.g. GST, VAT, HST"><input name="abbreviation" defaultValue={tax?.abbreviation} className="input" placeholder="GST" required /></Field>
        <Field label="Description" className="sm:col-span-2"><input name="description" defaultValue={tax?.description ?? ""} className="input" placeholder="Optional" /></Field>
        <Field label="Tax rate (%)"><input name="rate" defaultValue={tax ? Number(tax.rate) : ""} inputMode="decimal" className="input" placeholder="16" required /></Field>
        <Field label="Your tax number" hint="Your registration number for this tax"><input name="taxNumber" defaultValue={tax?.taxNumber ?? ""} className="input" /></Field>
        <Field label="Tax account" className="sm:col-span-2" hint="Tax collected and paid is tracked in this liability account">
          <select name="accountId" defaultValue={tax?.accountId ?? defaultTax?.accountId} className="input">
            {liabilityAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="showTaxNumber" defaultChecked={tax?.showTaxNumber ?? true} className="mt-0.5" />
        Show tax number on invoices
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isRecoverable" defaultChecked={tax?.isRecoverable ?? true} className="mt-0.5" />
        <span>
          This tax is recoverable
          <span className="block text-xs text-slate-500">
            Tick if you can claim back the tax you pay on purchases. If not, the tax becomes part of the expense cost.
          </span>
        </span>
      </label>
    </SaveForm>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Sales taxes</h2>
          <p className="text-sm text-slate-500">Taxes you charge on sales and pay on purchases (VAT, GST, sales tax…).</p>
        </div>
        {!isNew && (
          <Link href="/settings/taxes?new=1" className="btn-primary">
            <Plus className="h-4 w-4" /> Create a sales tax
          </Link>
        )}
      </div>

      {isNew && form()}

      <section className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tax number</th>
              <th>Recoverable</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">No sales taxes yet.</td></tr>
            )}
            {active.map((t) =>
              edit === t.id ? (
                <tr key={t.id}><td colSpan={4}>{form(t)}</td></tr>
              ) : (
                <tr key={t.id}>
                  <td>
                    <span className="font-semibold text-slate-900">{t.abbreviation} ({Number(t.rate)}%)</span>
                    <span className="italic text-slate-500"> – {t.name}</span>
                    {t.description && <div className="text-xs text-slate-500">{t.description}</div>}
                  </td>
                  <td className="text-slate-600">
                    {t.taxNumber ?? "—"}
                    {t.taxNumber && t.showTaxNumber && <span className="ml-2 text-xs text-slate-400">on invoices</span>}
                  </td>
                  <td className="text-slate-600">{t.isRecoverable ? "Yes" : "No"}</td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/settings/taxes?edit=${t.id}`} className="btn-ghost px-2" aria-label={`Edit ${t.name}`}>
                      <Pencil className="h-4 w-4 text-brand-600" />
                    </Link>
                    <ActionButton
                      action={deleteTax.bind(null, t.id)}
                      confirm={`Delete ${t.abbreviation}? If it's already used on transactions it will be archived instead.`}
                      className="btn-ghost px-2"
                    >
                      <Trash2 className="h-4 w-4 text-brand-600" />
                    </ActionButton>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      {archived.length > 0 && (
        <section className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Archived taxes</h3>
          <p className="text-xs text-slate-500">Kept because they are used on past transactions.</p>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {archived.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                <span className="text-slate-500">{t.abbreviation} ({Number(t.rate)}%) – {t.name}</span>
                <ActionButton action={restoreTax.bind(null, t.id)} className="btn-ghost text-xs">Restore</ActionButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
