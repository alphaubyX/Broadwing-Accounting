import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { toEditableLines } from "@/lib/options";
import { requireOrganization } from "@/lib/org";
import { savePurchaseOrder } from "../../actions";
import { poFormData } from "../../data";
import { PurchaseOrderForm } from "../../PurchaseOrderForm";

export default async function EditPOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const po = await db.purchaseOrder.findFirst({ where: { id, organizationId: org.id }, include: { lines: { orderBy: { position: "asc" } } } });
  if (!po || po.status === "BILLED" || po.status === "CANCELLED") notFound();
  const d = await poFormData(org.id);
  return (
    <>
      <PageHeader title={`Edit ${po.number}`} />
      <PurchaseOrderForm
        action={savePurchaseOrder.bind(null, po.id)}
        defaults={{
          contactId: po.contactId ?? "",
          date: toISODate(po.date),
          expectedDate: toISODate(po.expectedDate),
          reference: po.reference ?? "",
          notes: po.notes ?? "",
          lines: toEditableLines(po.lines),
        }}
        vendors={d.vendors}
        categories={d.categories}
        taxes={d.taxes}
        defaultExpenseId={d.defaultExpenseId}
        currency={org.currency}
        isNew={false}
        cancelHref={`/purchase-orders/${po.id}`}
      />
    </>
  );
}
