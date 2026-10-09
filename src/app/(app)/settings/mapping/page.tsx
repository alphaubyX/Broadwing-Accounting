import type { AccountType } from "@prisma/client";
import { Field } from "@/components/Field";
import { db } from "@/lib/db";
import { requireOrganization } from "@/lib/org";
import { MAPPING_KEYS, type MappingKey } from "@/lib/accounting/mapping";
import { saveMappings } from "../actions";
import { SaveForm } from "../SaveForm";

export const metadata = { title: "Account mapping" };

export default async function MappingPage() {
  const org = await requireOrganization();
  const [accounts, mappings] = await Promise.all([
    db.account.findMany({ where: { organizationId: org.id, isArchived: false }, orderBy: { code: "asc" } }),
    db.accountMapping.findMany({ where: { organizationId: org.id } }),
  ]);
  const current = Object.fromEntries(mappings.map((m) => [m.key, m.accountId]));

  return (
    <div className="space-y-4">
      <div className="card p-5 text-sm text-slate-600">
        <h2 className="mb-2 font-semibold text-slate-900">How transactions hit your books</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Sale on terms:</strong> Debit Accounts receivable · Credit Income · Credit Sales tax</li>
          <li><strong>Cash sale:</strong> Debit Bank · Credit Income · Credit Sales tax</li>
          <li><strong>Customer payment:</strong> Debit Bank · Credit Accounts receivable</li>
          <li><strong>Expense paid now:</strong> Debit Expense category · Debit Tax · Credit Bank / card</li>
          <li><strong>Bill on terms:</strong> Debit Expense category · Debit Tax · Credit Accounts payable</li>
          <li><strong>Bill payment:</strong> Debit Accounts payable · Credit Bank</li>
        </ul>
        <p className="mt-2">Choose which accounts are used for each automatic entry below.</p>
      </div>
      <SaveForm action={saveMappings} submitLabel="Save mapping">
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(MAPPING_KEYS) as MappingKey[]).map((key) => {
            const def = MAPPING_KEYS[key];
            const options = accounts.filter((a) => (def.types as readonly AccountType[]).includes(a.type));
            return (
              <Field key={key} label={def.label} hint={def.help}>
                <select name={key} defaultValue={current[key] ?? ""} className="input">
                  <option value="" disabled>Choose an account…</option>
                  {options.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                  ))}
                </select>
              </Field>
            );
          })}
        </div>
      </SaveForm>
    </div>
  );
}
