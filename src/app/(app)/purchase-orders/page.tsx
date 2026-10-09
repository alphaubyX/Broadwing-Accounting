import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { DocTabs } from "@/components/DocTabs";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatAmount } from "@/lib/money";
import { requireOrganization } from "@/lib/org";

export const metadata = { title: "Purchase orders" };

const FILTERS: Record<string, Prisma.PurchaseOrderWhereInput> = {
  open: { status: { in: ["DRAFT", "SENT"] } },
  billed: { status: "BILLED" },
};

export default async function POsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const org = await requireOrganization();
  const pos = await db.purchaseOrder.findMany({
    where: { organizationId: org.id, ...FILTERS[status] },
    include: { contact: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return (
    <>
      <PageHeader
        title="Purchase orders"
        subtitle="Orders you send to vendors. Convert one to an expense when the bill arrives."
        actions={
          <Link href="/purchase-orders/new" className="btn-primary">
            <Plus className="h-4 w-4" /> New purchase order
          </Link>
        }
      />
      <DocTabs
        base="/purchase-orders"
        current={status}
        tabs={[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "billed", label: "Billed" },
        ]}
      />
      <div className="card overflow-x-auto">
        {pos.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No purchase orders yet.{" "}
            <Link href="/purchase-orders/new" className="text-brand-600 hover:underline">
              Create one
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Delivery by</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/purchase-orders/${p.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {p.number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(p.date)}</td>
                  <td>{p.contact?.name}</td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(p.expectedDate)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="text-right font-medium">{formatAmount(p.total, org.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
