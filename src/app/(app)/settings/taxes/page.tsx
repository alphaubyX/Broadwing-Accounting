import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { Field } from "@/components/Field";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";
import { saveTax, setTaxArchived } from "../actions";
import { SaveForm } from "../SaveForm";

export const metadata = { title: "Taxes" };

export default async function TaxesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const org = await requireOrganization();
  const [taxes, liabilityAccounts, defaultTax] = await Promise.all([
    db.tax.findMany({ where: { organizationId: org.id }, include: { account: true }, orderBy: [{ isArchived: "asc" }, { name: "asc" }] }),
    db.account.findMany({ where: { organizationId: org.id, type: "LIABILITY", isArchived: false }, orderBy: { code: "asc" } }),
    db.accountMapping.findUnique({ where: { organizationId_key: { organizationId: org.id, key: "SALES_TAX" } } }),
  ]);

  const form = (tax?: (typeof taxes)[number]) => (
    <SaveForm action={saveTax.bind(null, tax?.id ?? null)} submitLabel={tax ? "Save tax" : "Add tax"} className="space-y-4 rounded-lg bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_1fr]">
        <Field label="Name"><input name="name" defaultValue={tax?.name} className="input" placeholder="VAT" required /></Field>
        <Field label="Rate (%)"><input name="rate" defaultValue={tax ? Number(tax.rate) : ""} inputMode="decimal" className="input" required /></Field>
        <Field label="Tax account">
          <select name="accountId" defaultValue={tax?.accountId ?? defaultTax?.accountId} className="input">
            {liabilityAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
            ))}
          </select>
        </Field>
      </div>
    </SaveForm>
  );

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Sales tax / VAT rates</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tax you charge on sales is credited to the tax account; tax you pay on purchases is debited to it, so its balance is what you owe the tax office.
        </p>
        <table className="table mt-3">
          <tbody>
            {taxes.length === 0 && (
              <tr><td className="text-slate-500">No taxes yet.</td></tr>
            )}
            {taxes.map((t) =>
              edit === t.id ? (
                <tr key={t.id}><td colSpan={4}>{form(t)}</td></tr>
              ) : (
                <tr key={t.id} className={t.isArchived ? "opacity-50" : ""}>
                  <td className="font-medium">{t.name}</td>
                  <td>{Number(t.rate)}%</td>
                  <td className="text-slate-600">{t.account.name}</td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/settings/taxes?edit=${t.id}`} className="btn-ghost text-xs">Edit</Link>
                    <ActionButton action={setTaxArchived.bind(null, t.id, !t.isArchived)} className="btn-ghost text-xs">
                      {t.isArchived ? "Restore" : "Archive"}
                    </ActionButton>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Add a tax rate</h2>
        {form()}
      </section>
    </div>
  );
}
