import { PageHeader } from "@/components/PageHeader";
import { today } from "@/lib/dates";
import { requireOrganization } from "@/lib/org";
import { savePurchaseOrder } from "../actions";
import { poFormData } from "../data";
import { PurchaseOrderForm } from "../PurchaseOrderForm";

export const metadata = { title: "New purchase order" };

export default async function NewPOPage() {
  const org = await requireOrganization();
  const d = await poFormData(org.id);
  return (
    <>
      <PageHeader title="New purchase order" subtitle="Send an order to a vendor. It becomes an expense when you're billed." />
      <PurchaseOrderForm
        action={savePurchaseOrder.bind(null, null)}
        defaults={{ contactId: "", date: today(), expectedDate: "", reference: "", notes: org.branding?.poNotes ?? "" }}
        vendors={d.vendors}
        categories={d.categories}
        taxes={d.taxes}
        defaultExpenseId={d.defaultExpenseId}
        currency={org.currency}
        isNew
        cancelHref="/purchase-orders"
      />
    </>
  );
}
