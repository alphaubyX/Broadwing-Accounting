import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Printer } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { DocumentView } from "@/components/DocumentView";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { brandingStyle, purchaseOrderDocument, toDocumentOrg } from "@/lib/document";
import { requireOrganization } from "@/lib/org";
import { convertToExpense, deletePurchaseOrder, setPurchaseOrderStatus } from "../actions";

export default async function POPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const po = await db.purchaseOrder.findFirst({
    where: { id, organizationId: org.id },
    include: { contact: true, lines: { orderBy: { position: "asc" } }, attachments: true, expense: true },
  });
  if (!po) notFound();
  const open = po.status === "DRAFT" || po.status === "SENT";

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {po.number} <StatusBadge status={po.status} />
          </span>
        }
        subtitle={po.contact?.name}
        actions={
          <>
            {open && (
              <Link href={`/purchase-orders/${po.id}/edit`} className="btn-secondary">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            <Link href={`/print/purchase-orders/${po.id}`} target="_blank" className="btn-secondary">
              <Printer className="h-4 w-4" /> Print / PDF
            </Link>
            {po.status === "DRAFT" && (
              <ActionButton action={setPurchaseOrderStatus.bind(null, po.id, "SENT")}>Mark as sent</ActionButton>
            )}
            {open && (
              <ActionButton action={convertToExpense.bind(null, po.id)} className="btn-primary" confirm="Create a bill (expense on terms) from this purchase order?">
                Convert to expense
              </ActionButton>
            )}
            {open && (
              <ActionButton action={setPurchaseOrderStatus.bind(null, po.id, "CANCELLED")} confirm="Cancel this purchase order?" className="btn-danger">
                Cancel PO
              </ActionButton>
            )}
            {!po.expense && (po.status === "DRAFT" || po.status === "CANCELLED") && (
              <ActionButton action={deletePurchaseOrder.bind(null, po.id)} confirm="Delete this purchase order permanently?" className="btn-danger">
                Delete
              </ActionButton>
            )}
          </>
        }
      />
      {po.expense && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Billed as{" "}
          <Link href={`/expenses/${po.expense.id}`} className="font-medium underline">
            {po.expense.number}
          </Link>
          .
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200">
          <DocumentView org={toDocumentOrg(org)} doc={purchaseOrderDocument(org, po)} style={brandingStyle(org)} />
        </div>
        <div className="space-y-6">
          <section className="card p-5 text-sm text-slate-600">
            Purchase orders don&apos;t affect your books. When the vendor bills you, use <strong>Convert to expense</strong> to
            record what you owe.
          </section>
          <AttachmentsPanel target="purchaseOrder" id={po.id} attachments={po.attachments} />
        </div>
      </div>
    </>
  );
}
