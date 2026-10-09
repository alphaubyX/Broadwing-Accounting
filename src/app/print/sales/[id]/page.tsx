import { notFound } from "next/navigation";
import { DocumentView } from "@/components/DocumentView";
import { db } from "@/lib/db";
import { brandingStyle, saleDocument, toDocumentOrg } from "@/lib/document";
import { requireOrganization } from "@/lib/org";
import { PrintToolbar } from "../../PrintToolbar";

export const dynamic = "force-dynamic";

export default async function PrintSale({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const sale = await db.sale.findFirst({ where: { id, organizationId: org.id }, include: { contact: true, lines: { include: { tax: true }, orderBy: { position: "asc" } } } });
  if (!sale) notFound();
  return (
    <main className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <PrintToolbar backHref={`/sales/${sale.id}`} />
      <DocumentView org={toDocumentOrg(org)} doc={saleDocument(org, sale)} style={brandingStyle(org)} />
    </main>
  );
}
