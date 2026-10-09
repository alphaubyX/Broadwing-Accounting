import type { Tx } from "./db";
import { computeTotals } from "./accounting/totals";
import { fromCents, toCents } from "./money";
import { UserError, type ParsedLine } from "./forms";

/** Validate parsed lines against the organization's accounts/taxes and compute amounts. */
export async function priceLines(
  tx: Tx,
  organizationId: string,
  lines: ParsedLine[],
  opts: { useQuantity: boolean; requireAccount: boolean },
) {
  const [accounts, taxes] = await Promise.all([
    tx.account.findMany({ where: { organizationId }, select: { id: true } }),
    tx.tax.findMany({ where: { organizationId } }),
  ]);
  const accountIds = new Set(accounts.map((a) => a.id));
  const taxById = new Map(taxes.map((t) => [t.id, t]));

  for (const l of lines) {
    if (opts.requireAccount && !accountIds.has(l.accountId)) throw new UserError("Choose an account for every line.");
    if (l.taxId && !taxById.has(l.taxId)) throw new UserError("Unknown tax selected.");
    if (!l.description) throw new UserError("Every line needs a description.");
  }

  const totals = computeTotals(
    lines.map((l) => ({
      quantity: opts.useQuantity ? l.quantity : 1,
      unitPriceCents: toCents(l.unitPrice),
      taxRate: l.taxId ? Number(taxById.get(l.taxId)!.rate) : 0,
    })),
  );
  if (totals.totalCents < 0) throw new UserError("The total cannot be negative.");

  return {
    rows: lines.map((l, i) => ({
      position: i,
      description: l.description,
      quantity: opts.useQuantity ? l.quantity : 1,
      unitPrice: l.unitPrice,
      amount: fromCents(totals.lines[i].amountCents),
      taxAmount: fromCents(totals.lines[i].taxCents),
      accountId: l.accountId || null,
      taxId: l.taxId || null,
    })),
    subtotal: fromCents(totals.subtotalCents),
    taxTotal: fromCents(totals.taxCents),
    total: fromCents(totals.totalCents),
  };
}
