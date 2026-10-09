// Money is calculated in integer minor units (cents) to avoid floating point
// drift, and stored in the database as DECIMAL(14,2).

type Decimalish = { toString(): string } | number | string | null | undefined;

export function toCents(value: Decimalish): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatMoney(cents: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

/** Format a stored DECIMAL value. */
export function formatAmount(value: Decimalish, currency = "USD"): string {
  return formatMoney(toCents(value), currency);
}
