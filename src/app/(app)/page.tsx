import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Landmark, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { formatDate, parseISODate, today } from "@/lib/dates";
import { fiscalYear } from "@/lib/fiscal";
import { formatAmount, formatMoney, toCents } from "@/lib/money";
import { requireOrganization } from "@/lib/org";
import { accountBalances, profitAndLoss } from "@/lib/accounting/reports";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const org = await requireOrganization();
  const now = today();
  const monthStart = parseISODate(`${now.slice(0, 7)}-01`);
  const yearStart = parseISODate(fiscalYear(now, org.fiscalYearEndMonth, org.fiscalYearEndDay).from);
  const end = parseISODate(now);

  const [balances, month, year, openSales, openExpenses, recentSales, recentExpenses] = await Promise.all([
    accountBalances(org.id, { to: end }),
    profitAndLoss(org.id, monthStart, end),
    profitAndLoss(org.id, yearStart, end),
    db.sale.findMany({ where: { organizationId: org.id, status: { in: ["UNPAID", "PARTIAL"] } }, select: { total: true, amountPaid: true } }),
    db.expense.findMany({ where: { organizationId: org.id, status: { in: ["UNPAID", "PARTIAL"] } }, select: { total: true, amountPaid: true } }),
    db.sale.findMany({ where: { organizationId: org.id }, include: { contact: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6 }),
    db.expense.findMany({ where: { organizationId: org.id }, include: { contact: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6 }),
  ]);

  const cash = balances.filter((b) => b.account.subtype === "CASH_AND_BANK");
  const outstanding = (rows: { total: unknown; amountPaid: unknown }[]) =>
    rows.reduce((s, r) => s + toCents(r.total as string) - toCents(r.amountPaid as string), 0);
  const c = org.currency;

  const recent = [
    ...recentSales.map((s) => ({ kind: "Sale" as const, href: `/sales/${s.id}`, number: s.number, date: s.date, who: s.contact?.name ?? "—", total: s.total, status: displayStatus(s.status, s.dueDate), created: s.createdAt })),
    ...recentExpenses.map((e) => ({ kind: "Expense" as const, href: `/expenses/${e.id}`, number: e.number, date: e.date, who: e.contact?.name ?? e.payeeName ?? e.description, total: e.total, status: displayStatus(e.status, e.dueDate), created: e.createdAt })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.created.getTime() - a.created.getTime())
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Here's how ${org.name} is doing.`}
        actions={
          <>
            <Link href="/expenses/new" className="btn-secondary">
              <Plus className="h-4 w-4" /> Expense
            </Link>
            <Link href="/sales/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Sale
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Landmark className="h-5 w-5" />} label="Cash & bank" value={formatMoney(cash.reduce((s, b) => s + b.balanceCents, 0), c)} />
        <Stat icon={<ArrowDownRight className="h-5 w-5 text-emerald-600" />} label="Owed to you" value={formatMoney(outstanding(openSales), c)} href="/sales?status=open" />
        <Stat icon={<ArrowUpRight className="h-5 w-5 text-amber-600" />} label="You owe" value={formatMoney(outstanding(openExpenses), c)} href="/expenses?status=open" />
        <Stat label="Profit this fiscal year" value={formatMoney(year.netProfit, c)} href="/reports" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">This month</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Income" value={formatMoney(month.incomeTotal, c)} />
            <Row label="Expenses" value={formatMoney(month.costOfSalesTotal + month.expenseTotal, c)} />
            <div className="border-t border-slate-100 pt-3">
              <Row label="Net profit" value={formatMoney(month.netProfit, c)} strong />
            </div>
          </dl>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Bank & cash accounts</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {cash.map((b) => (
              <li key={b.account.id} className="flex justify-between">
                <span className="text-slate-600">{b.account.name}</span>
                <span>{formatMoney(b.balanceCents, c)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold text-slate-900">Recent transactions</h2>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No transactions yet. Record your first sale or expense.</p>
          ) : (
            <table className="table mt-2">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.href} className="hover:bg-slate-50">
                    <td className="w-28 text-slate-500">{formatDate(r.date)}</td>
                    <td>
                      <Link href={r.href} className="font-medium text-slate-900 hover:text-brand-600">
                        {r.number}
                      </Link>
                      <div className="text-xs text-slate-500">{r.who}</div>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={`text-right font-medium ${r.kind === "Sale" ? "text-emerald-700" : "text-slate-900"}`}>
                      {r.kind === "Sale" ? "+" : "−"}
                      {formatAmount(r.total, c)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value, href }: { icon?: React.ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <div className="card h-full p-5 transition hover:border-slate-300">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-slate-900" : ""}`}>
      <dt className={strong ? "" : "text-slate-500"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
