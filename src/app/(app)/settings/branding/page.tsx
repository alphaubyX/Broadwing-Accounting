import { requireOrganization } from "@/lib/org";
import { brandingStyle, toDocumentOrg } from "@/lib/document";
import { BrandingForm } from "./BrandingForm";

export const metadata = { title: "Invoice & PO design" };

export default async function BrandingPage() {
  const org = await requireOrganization();
  const b = org.branding;
  return (
    <BrandingForm
      org={toDocumentOrg(org)}
      currency={org.currency}
      initial={{
        ...brandingStyle(org),
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
