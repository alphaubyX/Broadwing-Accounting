import { FiscalYearEndFields } from "@/components/FiscalYearEndFields";
import { Field } from "@/components/Field";
import { hasTransactions } from "@/lib/books";
import { CURRENCIES } from "@/lib/currencies";
import { fiscalYear } from "@/lib/fiscal";
import { formatDate, parseISODate, today } from "@/lib/dates";
import { requireOrganization } from "@/lib/org";
import { saveDatesCurrency } from "../actions";
import { SaveForm } from "../SaveForm";

export const metadata = { title: "Dates & currency" };

export default async function DatesCurrencyPage() {
  const org = await requireOrganization();
  const locked = await hasTransactions(org.id);
  const fy = fiscalYear(today(), org.fiscalYearEndMonth, org.fiscalYearEndDay);
  const currency = CURRENCIES.find((c) => c.code === org.currency);
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Dates & currency</h2>
        <p className="text-sm text-slate-500">Used for your reports and every amount in the app.</p>
      </div>
      <SaveForm action={saveDatesCurrency}>
        <FiscalYearEndFields month={org.fiscalYearEndMonth} day={org.fiscalYearEndDay} />
        <p className="hint -mt-3">
          Current fiscal year: {formatDate(parseISODate(fy.from))} – {formatDate(parseISODate(fy.to))}
        </p>
        <Field
          label="Business currency"
          hint={
            locked
              ? "The currency is locked because transactions have already been recorded in it."
              : "Choose carefully: it can't be changed after you record your first transaction."
          }
        >
          {locked ? (
            <>
              <input type="hidden" name="currency" value={org.currency} />
              <div className="py-2 text-sm font-medium text-slate-900">
                {org.currency}
                {currency ? ` — ${currency.name}` : ""}
              </div>
            </>
          ) : (
            <select name="currency" defaultValue={org.currency} className="input">
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </SaveForm>
    </div>
  );
}
