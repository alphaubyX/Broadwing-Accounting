import type { Contact, Organization, PurchaseOrder, PurchaseOrderLine, Sale, SaleLine, Tax } from "@prisma/client";
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

type TaxedLine = { taxAmount: unknown; tax: Tax | null };

/** One total line per tax, e.g. "VAT 5% (100123456700003)", like a real tax invoice. */
function taxTotals(lines: TaxedLine[], currency: string) {
  const byTax = new Map<string, { tax: Tax; cents: number }>();
  for (const l of lines) {
    if (!l.tax) continue;
    const entry = byTax.get(l.tax.id) ?? { tax: l.tax, cents: 0 };
    entry.cents += toCents(l.taxAmount as string);
    byTax.set(l.tax.id, entry);
  }
  return [...byTax.values()].map(({ tax, cents }) => ({
    label: `${tax.abbreviation} ${Number(tax.rate)}%${tax.showTaxNumber && tax.taxNumber ? ` (${tax.taxNumber})` : ""}`,
    value: formatMoney(cents, currency),
  }));
}

function partyLines(c: Contact | null): { name: string; lines: string[] } | null {
  if (!c) return null;
  return { name: c.name, lines: [c.address, c.email, c.phone, c.taxNumber ? `Tax no: ${c.taxNumber}` : null].filter((l): l is string => !!l) };
}

export function brandingStyle(org: OrganizationWithBranding): BrandingStyle {
  const b = org.branding;
  return {
    accentColor: b?.accentColor ?? "#2f6fed",
    font: b?.font ?? "sans",
    layout: b?.layout ?? "contemporary",
    logoPosition: b?.logoPosition ?? "left",
    addressPosition: b?.addressPosition ?? "right",
    showTaxNumber: b?.showTaxNumber ?? true,
    showLogo: b?.showLogo ?? true,
  };
}

export function saleDocument(org: OrganizationWithBranding, sale: Sale & { lines: (SaleLine & { tax: Tax | null })[]; contact: Contact | null }): DocumentData {
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
    highlight: { label: `Amount due (${c})`, value: formatMoney(due, c) },
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
      ...taxTotals(sale.lines, c),
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
  po: PurchaseOrder & { lines: (PurchaseOrderLine & { tax: Tax | null })[]; contact: Contact | null },
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
    highlight: { label: `Order total (${c})`, value: formatAmount(po.total, c) },
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
      ...taxTotals(po.lines, c),
      { label: "Total", value: formatAmount(po.total, c), strong: true },
    ],
    notes: po.notes,
    footer: org.branding?.poFooter,
  };
}
