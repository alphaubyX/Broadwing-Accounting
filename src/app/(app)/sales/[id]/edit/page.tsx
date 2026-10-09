import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { toEditableLines } from "@/lib/options";
import { requireOrganization } from "@/lib/org";
import { saveSale } from "../../actions";
import { saleFormData } from "../../data";
import { SaleForm } from "../../SaleForm";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrganization();
  const sale = await db.sale.findFirst({
    where: { id, organizationId: org.id },
    include: { lines: { orderBy: { position: "asc" } } },
  });
  if (!sale || sale.status === "VOID") notFound();
  const d = await saleFormData(org.id);
  return (
    <>
      <PageHeader title={`Edit ${sale.number}`} />
      <SaleForm
        action={saveSale.bind(null, sale.id)}
        defaults={{
          contactId: sale.contactId ?? "",
          date: toISODate(sale.date),
          dueDate: toISODate(sale.dueDate),
          reference: sale.reference ?? "",
          notes: sale.notes ?? "",
          settlement: sale.settlement,
          paidIntoAccountId: sale.paidIntoAccountId ?? d.defaultBankId,
          lines: toEditableLines(sale.lines),
        }}
        customers={d.customers}
        incomeAccounts={d.incomeAccounts}
        depositAccounts={d.depositAccounts}
        taxes={d.taxes}
        defaultIncomeId={d.defaultIncomeId}
        currency={org.currency}
        paymentTerms={org.defaultPaymentTerms}
        canDraft={sale.status === "DRAFT"}
        isNew={false}
        cancelHref={`/sales/${sale.id}`}
      />
    </>
  );
}
