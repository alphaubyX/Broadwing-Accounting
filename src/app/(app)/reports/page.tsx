import Link from "next/link";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { formatDate, parseISODate, today } from "@/lib/dates";
import { formatAmount, formatMoney } from "@/lib/money";
import { requireOrganization } from "@/lib/org";
import { balanceSheet, profitAndLoss, trialBalance, type AccountBalance } from "@/lib/accounting/reports";

export const metadata = { title: "Reports" };

const TABS = [
  { value: "pnl", label: "Profit & loss" },
  { value: "balance", label: "Balance sheet" },
  { value: "trial", label: "Trial balance" },
  { value: "journal", label: "Journal" },
];

function fiscalYearStart(todayIso: string, startMonth: number): string {
  const [y, m] = todayIso.split("-").map(Number);
  const year = m >= startMonth ? y : y - 1;
  return `${year}-${String(startMonth).padStart(2, "0")}-01`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.value === sp.tab) ? sp.tab! : "pnl";
  const org = await requireOrganization();
  const to = sp.to || today();
  const from = sp.from || fiscalYearStart(to, org.fiscalYearStartMonth);
  const c = org.currency;
  const usesRange = tab === "pnl" || tab === "journal";

  return (
    <>
      <PageHeader title="Reports" subtitle="Your books, generated automatically from every sale, expense and payment." />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/reports?tab=${t.value}&from=${from}&to=${to}`}
              className={clsx(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
                tab === t.value ? "border-brand-500 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="no-print mb-2 flex flex-wrap items-end gap-2 text-sm">
          <input type="hidden" name="tab" value={tab} />
          {usesRange && (
            <label>
              <span className="label text-xs">From</span>
              <input type="date" name="from" defaultValue={from} className="input py-1.5" />
            </label>
          )}
          <label>
            <span className="label text-xs">{usesRange ? "To" : "As of"}</span>
            <input type="date" name="to" defaultValue={to} className="input py-1.5" />
          </label>
          <button className="btn-secondary py-1.5">Update</button>
        </form>
      </div>

      <div className="card p-6">
        {tab === "pnl" && <ProfitAndLoss orgId={org.id} from={from} to={to} currency={c} />}
        {tab === "balance" && <BalanceSheet orgId={org.id} asOf={to} currency={c} />}
        {tab === "trial" && <TrialBalance orgId={org.id} asOf={to} currency={c} />}
        {tab === "journal" && <Journal orgId={org.id} from={from} to={to} currency={c} />}
      </div>
    </>
  );
}

function Section({ title, rows, total, totalLabel, currency }: { title: string; rows: AccountBalance[]; total: number; totalLabel: string; currency: string }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {rows.length === 0 && <div className="py-1 text-sm text-slate-400">Nothing recorded</div>}
      {rows.map((r) => (
        <div key={r.account.id} className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
          <span>
            <span className="mr-2 text-slate-400">{r.account.code}</span>
            {r.account.name}
          </span>
          <span>{formatMoney(r.balanceCents, currency)}</span>
        </div>
      ))}
      <TotalRow label={totalLabel} cents={total} currency={currency} />
    </div>
  );
}

function TotalRow({ label, cents, currency, big }: { label: string; cents: number; currency: string; big?: boolean }) {
  return (
    <div className={clsx("flex justify-between py-2 font-semibold", big ? "border-t-2 border-slate-800 text-base" : "border-t border-slate-200 text-sm")}>
      <span>{label}</span>
      <span>{formatMoney(cents, currency)}</span>
    </div>
  );
}

async function ProfitAndLoss({ orgId, from, to, currency }: { orgId: string; from: string; to: string; currency: string }) {
  const r = await profitAndLoss(orgId, parseISODate(from), parseISODate(to));
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-center text-lg font-semibold">
        Profit & loss · {formatDate(parseISODate(from))} – {formatDate(parseISODate(to))}
      </h2>
      <Section title="Income" rows={r.income} total={r.incomeTotal} totalLabel="Total income" currency={currency} />
      {r.costOfSales.length > 0 && (
        <>
          <Section title="Cost of sales" rows={r.costOfSales} total={r.costOfSalesTotal} totalLabel="Total cost of sales" currency={currency} />
          <TotalRow label="Gross profit" cents={r.grossProfit} currency={currency} />
          <div className="mb-6" />
        </>
      )}
      <Section title="Expenses" rows={r.expenses} total={r.expenseTotal} totalLabel="Total expenses" currency={currency} />
      <TotalRow label="Net profit" cents={r.netProfit} currency={currency} big />
    </div>
  );
}

async function BalanceSheet({ orgId, asOf, currency }: { orgId: string; asOf: string; currency: string }) {
  const r = await balanceSheet(orgId, parseISODate(asOf));
  const balanced = r.assetTotal === r.liabilityTotal + r.equityTotal;
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-center text-lg font-semibold">Balance sheet · as of {formatDate(parseISODate(asOf))}</h2>
      <Section title="Assets" rows={r.assets} total={r.assetTotal} totalLabel="Total assets" currency={currency} />
      <Section title="Liabilities" rows={r.liabilities} total={r.liabilityTotal} totalLabel="Total liabilities" currency={currency} />
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Equity</h3>
        {r.equity.map((e) => (
          <div key={e.account.id} className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
            <span>
              <span className="mr-2 text-slate-400">{e.account.code}</span>
              {e.account.name}
            </span>
            <span>{formatMoney(e.balanceCents, currency)}</span>
          </div>
        ))}
        <div className="flex justify-between border-b border-slate-50 py-1.5 text-sm">
          <span>Profit to date</span>
          <span>{formatMoney(r.earnings, currency)}</span>
        </div>
        <TotalRow label="Total equity" cents={r.equityTotal} currency={currency} />
      </div>
      <TotalRow label="Liabilities + equity" cents={r.liabilityTotal + r.equityTotal} currency={currency} big />
      {!balanced && <p className="mt-2 text-sm text-red-600">Warning: the balance sheet does not balance.</p>}
    </div>
  );
}

async function TrialBalance({ orgId, asOf, currency }: { orgId: string; asOf: string; currency: string }) {
  const r = await trialBalance(orgId, parseISODate(asOf));
  return (
    <div className="overflow-x-auto">
      <h2 className="mb-4 text-lg font-semibold">Trial balance · as of {formatDate(parseISODate(asOf))}</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Account</th>
            <th className="text-right">Debit</th>
            <th className="text-right">Credit</th>
          </tr>
        </thead>
        <tbody>
          {r.lines.map((l) => (
            <tr key={l.account.id}>
              <td>
                <span className="mr-2 text-slate-400">{l.account.code}</span>
                {l.account.name}
              </td>
              <td className="text-right">{l.debitCents ? formatMoney(l.debitCents, currency) : ""}</td>
              <td className="text-right">{l.creditCents ? formatMoney(l.creditCents, currency) : ""}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td>Total</td>
            <td className="text-right">{formatMoney(r.debitTotal, currency)}</td>
            <td className="text-right">{formatMoney(r.creditTotal, currency)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const SOURCE_HREF = { SALE: "/sales/", EXPENSE: "/expenses/", PAYMENT: "", MANUAL: "" } as const;

async function Journal({ orgId, from, to, currency }: { orgId: string; from: string; to: string; currency: string }) {
  const entries = await db.journalEntry.findMany({
    where: { organizationId: orgId, date: { gte: parseISODate(from), lte: parseISODate(to) } },
    include: { lines: { include: { account: true }, orderBy: { debit: "desc" } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 300,
  });
  if (entries.length === 0) return <p className="text-sm text-slate-500">No journal entries in this period.</p>;
  return (
    <div className="space-y-5">
      {entries.map((e) => (
        <div key={e.id}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {SOURCE_HREF[e.sourceType] && e.sourceId ? (
                <Link href={`${SOURCE_HREF[e.sourceType]}${e.sourceId}`} className="hover:text-brand-600">
                  {e.memo}
                </Link>
              ) : (
                e.memo
              )}
            </span>
            <span className="text-slate-500">{formatDate(e.date)}</span>
          </div>
          <table className="table mt-1 text-xs">
            <tbody>
              {e.lines.map((l) => (
                <tr key={l.id}>
                  <td className={clsx("py-1.5", Number(l.credit) > 0 && "pl-10")}>
                    {l.account.code} · {l.account.name}
                  </td>
                  <td className="w-32 py-1.5 text-right">{Number(l.debit) ? formatAmount(l.debit, currency) : ""}</td>
                  <td className="w-32 py-1.5 text-right">{Number(l.credit) ? formatAmount(l.credit, currency) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
