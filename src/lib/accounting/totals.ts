// Pure document math. All amounts are integer cents; prices are tax-exclusive.

export interface LineInput {
  quantity?: number; // defaults to 1 (expenses have no quantity)
  unitPriceCents: number;
  taxRate?: number | null; // percent, e.g. 15
}

export interface LineResult {
  amountCents: number;
  taxCents: number;
}

export interface DocumentTotals {
  lines: LineResult[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

export function computeLine(line: LineInput): LineResult {
  const qty = line.quantity ?? 1;
  const amountCents = Math.round(qty * line.unitPriceCents);
  const taxCents = line.taxRate ? Math.round((amountCents * line.taxRate) / 100) : 0;
  return { amountCents, taxCents };
}

export function computeTotals(lines: LineInput[]): DocumentTotals {
  const results = lines.map(computeLine);
  const subtotalCents = results.reduce((s, l) => s + l.amountCents, 0);
  const taxCents = results.reduce((s, l) => s + l.taxCents, 0);
  return { lines: results, subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

export type PayableStatus = "UNPAID" | "PARTIAL" | "PAID";

export function paymentStatus(totalCents: number, paidCents: number): PayableStatus {
  if (paidCents >= totalCents) return "PAID";
  if (paidCents > 0) return "PARTIAL";
  return "UNPAID";
}
