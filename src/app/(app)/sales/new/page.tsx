import { PageHeader } from "@/components/PageHeader";
import { today } from "@/lib/dates";
import { requireOrganization } from "@/lib/org";
import { saveSale } from "../actions";
import { saleFormData } from "../data";
import { SaleForm } from "../SaleForm";

export const metadata = { title: "New sale" };

export default async function NewSalePage() {
  const org = await requireOrganization();
  const d = await saleFormData(org.id);
  return (
    <>
      <PageHeader title="New sale" subtitle="Create an invoice, or record a sale you've already been paid for." />
      <SaleForm
        action={saveSale.bind(null, null)}
        defaults={{
          contactId: "",
          date: today(),
          dueDate: "",
          reference: "",
          notes: org.branding?.invoiceNotes ?? "",
          settlement: "ON_TERMS",
          paidIntoAccountId: d.defaultBankId,
        }}
        customers={d.customers}
        incomeAccounts={d.incomeAccounts}
        depositAccounts={d.depositAccounts}
        taxes={d.taxes}
        defaultIncomeId={d.defaultIncomeId}
        currency={org.currency}
        paymentTerms={org.defaultPaymentTerms}
        canDraft
        isNew
        cancelHref="/sales"
      />
    </>
  );
}
