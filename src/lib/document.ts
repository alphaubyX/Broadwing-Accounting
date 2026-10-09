import type { Contact, Organization, PurchaseOrder, PurchaseOrderLine, Sale, SaleLine } from "@prisma/client";
import type { BrandingStyle, DocumentData, DocumentOrg } from "@/components/DocumentView";
import type { OrganizationWithBranding } from "./org";
import { formatDate } from "./dates";
import { formatAmount, formatMoney, toCents } from "./money";

export function orgAddressLines(org: Organization): string[] {
  const cityLine = [org.city, org.state, org.postalCode].filter(Boolean).join(", ");
  return [org.addressLine1, org.addressLine2, cityLine, org.country].filter((l): l is string => !!l);
}

export function toDocumentOrg(org: Organization): DocumentOrg {
  return {
    name: org.legalName || org.name,
    addressLines: orgAddressLines(org),
    contactLines: [org.phone, org.email, org.website].filter((l): l is string => !!l),
    taxNumber: org.taxNumber,
    taxNumberLabel: org.taxNumberLabel,
    logoUrl: org.logoPath ? `/api/logo?v=${org.updatedAt.getTime()}` : null,
  };
}

const qty = (q: unknown) => String(Number(q as string));

function partyLines(c: Contact | null): { name: string; lines: string[] } | null {
  if (!c) return null;
  return { name: c.name, lines: [c.address, c.email, c.phone, c.taxNumber ? `Tax no: ${c.taxNumber}` : null].filter((l): l is string => !!l) };
}

export function brandingStyle(org: OrganizationWithBranding): BrandingStyle {
  const b = org.branding;
  return {
    accentColor: b?.accentColor ?? "#2f6fed",
    font: b?.font ?? "sans",
    layout: b?.layout ?? "classic",
    logoPosition: b?.logoPosition ?? "left",
    addressPosition: b?.addressPosition ?? "right",
    showTaxNumber: b?.showTaxNumber ?? true,
  };
}

export function saleDocument(org: OrganizationWithBranding, sale: Sale & { lines: SaleLine[]; contact: Contact | null }): DocumentData {
  const c = org.currency;
  const due = toCents(sale.total) - toCents(sale.amountPaid);
  return {
    title: org.branding?.invoiceTitle ?? "Invoice",
    number: sale.number,
    meta: [
      { label: "Date", value: formatDate(sale.date) },
      ...(sale.dueDate ? [{ label: "Due date", value: formatDate(sale.dueDate) }] : []),
      ...(sale.reference ? [{ label: "Reference", value: sale.reference }] : []),
    ],
    partyHeading: "Bill to",
    party: partyLines(sale.contact),
    showQuantity: true,
    lines: sale.lines.map((l) => ({
      description: l.description,
      quantity: qty(l.quantity),
      unitPrice: formatAmount(l.unitPrice, c),
      amount: formatAmount(l.amount, c),
    })),
    totals: [
      { label: "Subtotal", value: formatAmount(sale.subtotal, c) },
      { label: "Tax", value: formatAmount(sale.taxTotal, c) },
      { label: "Total", value: formatAmount(sale.total, c), strong: true },
      ...(toCents(sale.amountPaid) > 0
        ? [
            { label: "Paid", value: formatAmount(sale.amountPaid, c) },
            { label: "Amount due", value: formatMoney(due, c), strong: true },
          ]
        : []),
    ],
    notes: sale.notes,
    footer: org.branding?.invoiceFooter,
  };
}

export function purchaseOrderDocument(
  org: OrganizationWithBranding,
  po: PurchaseOrder & { lines: PurchaseOrderLine[]; contact: Contact | null },
): DocumentData {
  const c = org.currency;
  return {
    title: org.branding?.poTitle ?? "Purchase Order",
    number: po.number,
    meta: [
      { label: "Date", value: formatDate(po.date) },
      ...(po.expectedDate ? [{ label: "Delivery by", value: formatDate(po.expectedDate) }] : []),
      ...(po.reference ? [{ label: "Reference", value: po.reference }] : []),
    ],
    partyHeading: "Vendor",
    party: partyLines(po.contact),
    showQuantity: true,
    lines: po.lines.map((l) => ({
      description: l.description,
      quantity: qty(l.quantity),
      unitPrice: formatAmount(l.unitPrice, c),
      amount: formatAmount(l.amount, c),
    })),
    totals: [
      { label: "Subtotal", value: formatAmount(po.subtotal, c) },
      { label: "Tax", value: formatAmount(po.taxTotal, c) },
      { label: "Total", value: formatAmount(po.total, c), strong: true },
    ],
    notes: po.notes,
    footer: org.branding?.poFooter,
  };
}
