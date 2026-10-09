"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { computeTotals } from "@/lib/accounting/totals";
import { formatMoney, toCents } from "@/lib/money";

export interface Option {
  id: string;
  label: string;
}

export interface TaxOption extends Option {
  rate: number;
}

export interface EditableLine {
  description: string;
  quantity: string;
  unitPrice: string;
  accountId: string;
  taxId: string;
}

/**
 * Line items for sales, purchase orders and expenses. Serialised as JSON into a
 * hidden "lines" input so it works with plain server-action forms.
 * - "items" mode: description, qty, price, account, tax (sales & POs)
 * - "amounts" mode: description, category, amount, tax (expenses)
 */
export function LineItemsEditor({
  mode,
  accounts,
  taxes,
  initial,
  defaultAccountId,
  currency,
  accountLabel = "Account",
}: {
  mode: "items" | "amounts";
  accounts: Option[];
  taxes: TaxOption[];
  initial?: EditableLine[];
  defaultAccountId: string;
  currency: string;
  accountLabel?: string;
}) {
  const blank = (): EditableLine => ({ description: "", quantity: "1", unitPrice: "", accountId: defaultAccountId, taxId: "" });
  const [lines, setLines] = useState<EditableLine[]>(initial?.length ? initial : [blank()]);

  const update = (i: number, patch: Partial<EditableLine>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const totals = useMemo(() => {
    const rate = (id: string) => taxes.find((t) => t.id === id)?.rate ?? 0;
    return computeTotals(
      lines.map((l) => ({
        quantity: mode === "items" ? Number(l.quantity) || 0 : 1,
        unitPriceCents: toCents(l.unitPrice),
        taxRate: rate(l.taxId),
      })),
    );
  }, [lines, taxes, mode]);

  const grid =
    mode === "items"
      ? "sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_70px_100px_minmax(0,1fr)_110px_36px]"
      : "sm:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_120px_minmax(0,1fr)_110px_36px]";

  return (
    <div>
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      {/* Stacked cards on phones, a single row per line from the sm breakpoint. */}
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        <div className={clsx(grid, "hidden bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid")}>
          <span>Description</span>
          <span>{accountLabel}</span>
          {mode === "items" && <span>Qty</span>}
          <span>{mode === "items" ? "Price" : "Amount"}</span>
          <span>Tax</span>
          <span className="text-right">Total</span>
          <span />
        </div>
        {lines.map((l, i) => (
          <div key={i} className={clsx(grid, "grid grid-cols-2 items-start gap-2 px-3 py-3")}>
            <input
              className="input col-span-2 sm:col-span-1"
              aria-label="Description"
              value={l.description}
              placeholder={mode === "items" ? "Item or service" : "What was it for?"}
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <select
              className="input col-span-2 sm:col-span-1"
              aria-label={accountLabel}
              value={l.accountId}
              onChange={(e) => update(i, { accountId: e.target.value })}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            {mode === "items" && (
              <input
                className="input"
                aria-label="Quantity"
                inputMode="decimal"
                value={l.quantity}
                onChange={(e) => update(i, { quantity: e.target.value })}
              />
            )}
            <input
              className="input"
              aria-label={mode === "items" ? "Price" : "Amount"}
              inputMode="decimal"
              placeholder={mode === "items" ? "Price" : "Amount"}
              value={l.unitPrice}
              onChange={(e) => update(i, { unitPrice: e.target.value })}
            />
            <select
              className={clsx("input", mode === "amounts" && "col-span-1")}
              aria-label="Tax"
              value={l.taxId}
              onChange={(e) => update(i, { taxId: e.target.value })}
            >
              <option value="">No tax</option>
              {taxes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="self-center whitespace-nowrap text-right text-sm font-medium">
              {formatMoney(totals.lines[i].amountCents, currency)}
            </div>
            <div className="self-center text-right">
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn-ghost px-2"
                  aria-label="Remove line"
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <button type="button" className="btn-secondary" onClick={() => setLines((ls) => [...ls, blank()])}>
          <Plus className="h-4 w-4" /> {mode === "items" ? "Add line" : "Split into another category"}
        </button>
        <dl className="min-w-[220px] space-y-1 text-sm">
          <div className="flex justify-between gap-8">
            <dt className="text-slate-500">Subtotal</dt>
            <dd>{formatMoney(totals.subtotalCents, currency)}</dd>
          </div>
          <div className="flex justify-between gap-8">
            <dt className="text-slate-500">Tax</dt>
            <dd>{formatMoney(totals.taxCents, currency)}</dd>
          </div>
          <div className="flex justify-between gap-8 border-t border-slate-200 pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(totals.totalCents, currency)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
