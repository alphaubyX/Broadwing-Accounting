import { brandingStyle, toDocumentOrg } from "@/lib/document";
import { requireOrganization } from "@/lib/org";
import { InvoiceSettingsForm } from "./InvoiceSettingsForm";

export const metadata = { title: "Invoice customization" };

export default async function InvoiceSettingsPage() {
  const org = await requireOrganization();
  const b = org.branding;
  return (
    <InvoiceSettingsForm
      org={toDocumentOrg(org)}
      currency={org.currency}
      initial={{
        ...brandingStyle(org),
        defaultPaymentTerms: String(org.defaultPaymentTerms),
        invoiceTitle: b?.invoiceTitle ?? "Invoice",
        invoiceNotes: b?.invoiceNotes ?? "",
        invoiceFooter: b?.invoiceFooter ?? "",
        poTitle: b?.poTitle ?? "Purchase Order",
        poNotes: b?.poNotes ?? "",
        poFooter: b?.poFooter ?? "",
        invoicePrefix: b?.invoicePrefix ?? "INV-",
        expensePrefix: b?.expensePrefix ?? "EXP-",
        poPrefix: b?.poPrefix ?? "PO-",
      }}
    />
  );
}
