import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Camera, Paperclip, Plus } from "lucide-react";
import { DocTabs } from "@/components/DocTabs";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatAmount } from "@/lib/money";
import { requireOrganization } from "@/lib/org";

export const metadata = { title: "Expenses" };

const FILTERS: Record<string, Prisma.ExpenseWhereInput> = {
  open: { status: { in: ["UNPAID", "PARTIAL"] } },
  paid: { status: "PAID" },
  noreceipt: { attachments: { none: {} } },
};

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const org = await requireOrganization();
  const expenses = await db.expense.findMany({
    where: { organizationId: org.id, ...FILTERS[status] },
    include: { contact: true, lines: { include: { account: true } }, _count: { select: { attachments: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Everything you buy: cash purchases, card spend and bills on payment terms."
        actions={
          <Link href="/expenses/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New expense
          </Link>
        }
      />
      <DocTabs
        base="/expenses"
        current={status}
        tabs={[
          { value: "all", label: "All" },
          { value: "open", label: "To pay" },
          { value: "paid", label: "Paid" },
          { value: "noreceipt", label: "Missing receipt" },
        ]}
      />
      <div className="card overflow-x-auto">
        {expenses.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            <Camera className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            No expenses here.{" "}
            <Link href="/expenses/new" className="text-brand-600 hover:underline">
              Record an expense
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Date</th>
                <th>Paid to</th>
                <th>Description</th>
                <th>Category</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => {
                const categories = [...new Set(e.lines.map((l) => l.account.name))];
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap">
                      <Link href={`/expenses/${e.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                        {e.number}
                      </Link>
                      {e._count.attachments > 0 && <Paperclip className="ml-1 inline h-3.5 w-3.5 text-slate-400" aria-label="Has receipt" />}
                    </td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(e.date)}</td>
                    <td>{e.contact?.name ?? e.payeeName ?? <span className="text-slate-400">—</span>}</td>
                    <td className="max-w-[240px] truncate text-slate-600">{e.description}</td>
                    <td className="text-slate-600">{categories.length > 1 ? "Split" : categories[0]}</td>
                    <td>
                      <StatusBadge status={displayStatus(e.status, e.dueDate)} />
                    </td>
                    <td className="text-right font-medium">{formatAmount(e.total, org.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
