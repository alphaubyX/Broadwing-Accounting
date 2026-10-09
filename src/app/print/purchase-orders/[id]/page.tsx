import { notFound } from "next/navigation";
import { DocumentView } from "@/components/DocumentView";
import { db } from "@/lib/db";
import { brandingStyle, purchaseOrderDocument, toDocumentOrg } from "@/lib/document";
import { requireOrganization } from "@/lib/org";
import { PrintToolbar } from "../../PrintToolbar";

export const dynamic = "force-dynamic";

export default async function PrintPO({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const po = await db.purchaseOrder.findFirst({ where: { id, organizationId: org.id }, include: { contact: true, lines: { include: { tax: true }, orderBy: { position: "asc" } } } });
  if (!po) notFound();
  return (
    <main className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <PrintToolbar backHref={`/purchase-orders/${po.id}`} />
      <DocumentView org={toDocumentOrg(org)} doc={purchaseOrderDocument(org, po)} style={brandingStyle(org)} />
    </main>
  );
}
