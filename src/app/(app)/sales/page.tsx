import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { DocTabs } from "@/components/DocTabs";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatAmount, formatMoney, toCents } from "@/lib/money";
import { requireOrganization } from "@/lib/org";

export const metadata = { title: "Sales" };

const FILTERS: Record<string, Prisma.SaleWhereInput> = {
  draft: { status: "DRAFT" },
  open: { status: { in: ["UNPAID", "PARTIAL"] } },
  paid: { status: "PAID" },
};

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const org = await requireOrganization();
  const sales = await db.sale.findMany({
    where: { organizationId: org.id, ...FILTERS[status] },
    include: { contact: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Invoices and cash sales."
        actions={
          <Link href="/sales/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New sale
          </Link>
        }
      />
      <DocTabs
        base="/sales"
        current={status}
        tabs={[
          { value: "all", label: "All" },
          { value: "draft", label: "Drafts" },
          { value: "open", label: "Unpaid" },
          { value: "paid", label: "Paid" },
        ]}
      />
      <div className="card overflow-x-auto">
        {sales.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No sales here yet.{" "}
            <Link href="/sales/new" className="text-brand-600 hover:underline">
              Create your first sale
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Due</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th className="text-right">Balance due</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/sales/${s.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {s.number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(s.date)}</td>
                  <td>{s.contact?.name ?? <span className="text-slate-400">Walk-in</span>}</td>
                  <td className="whitespace-nowrap text-slate-600">{s.settlement === "ON_TERMS" ? formatDate(s.dueDate) : "—"}</td>
                  <td>
                    <StatusBadge status={displayStatus(s.status, s.dueDate)} />
                  </td>
                  <td className="text-right">{formatAmount(s.total, org.currency)}</td>
                  <td className="text-right font-medium">
                    {s.status === "VOID" ? "—" : formatMoney(toCents(s.total) - toCents(s.amountPaid), org.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
