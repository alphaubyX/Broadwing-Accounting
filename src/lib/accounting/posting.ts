// Turns business documents into balanced double-entry journal postings.
// Pure functions: no database access, so the rules are easy to read and test.

import type { AccountMap } from "./mapping";

export interface PostingLine {
  accountId: string;
  debitCents: number;
  creditCents: number;
  description?: string;
}

export interface Posting {
  memo: string;
  lines: PostingLine[];
}

export interface DocLine {
  accountId: string;
  amountCents: number;
  taxCents: number;
  taxAccountId?: string | null;
  /** false = tax paid on a purchase cannot be claimed back, so it is part of the cost. */
  taxRecoverable?: boolean;
}

interface SettledDoc {
  number: string;
  counterparty?: string | null;
  settlement: "PAID_NOW" | "ON_TERMS";
  status: "DRAFT" | "UNPAID" | "PARTIAL" | "PAID" | "VOID";
  /** Bank/cash account used when settlement is PAID_NOW. */
  moneyAccountId?: string | null;
  lines: DocLine[];
}

export class UnbalancedPostingError extends Error {}

/**
 * Sale
 *   ON_TERMS:  Dr Accounts receivable  /  Cr Income (per line)  /  Cr Sales tax
 *   PAID_NOW:  Dr Bank                 /  Cr Income (per line)  /  Cr Sales tax
 * Drafts and voided sales are not posted.
 */
export function postSale(sale: SettledDoc, map: AccountMap): Posting | null {
  if (sale.status === "DRAFT" || sale.status === "VOID") return null;
  const total = sumTotal(sale.lines);
  const debitAccount =
    sale.settlement === "PAID_NOW" ? sale.moneyAccountId ?? map.DEFAULT_BANK : map.ACCOUNTS_RECEIVABLE;

  const lines: PostingLine[] = [{ accountId: debitAccount, debitCents: total, creditCents: 0 }];
  for (const l of sale.lines) {
    lines.push({ accountId: l.accountId, debitCents: 0, creditCents: l.amountCents });
    if (l.taxCents) lines.push({ accountId: l.taxAccountId ?? map.SALES_TAX, debitCents: 0, creditCents: l.taxCents });
  }
  return finalize(memo("Sale", sale), lines);
}

/**
 * Expense (purchases and expenses share one flow)
 *   PAID_NOW:  Dr Expense category (per line)  /  Dr Tax  /  Cr Bank or card
 *   ON_TERMS:  Dr Expense category (per line)  /  Dr Tax  /  Cr Accounts payable
 * Recoverable tax is debited to the tax account (input tax you claim back);
 * non-recoverable tax is added to the expense category as part of the cost.
 */
export function postExpense(expense: SettledDoc, map: AccountMap): Posting | null {
  if (expense.status === "DRAFT" || expense.status === "VOID") return null;
  const total = sumTotal(expense.lines);
  const creditAccount =
    expense.settlement === "PAID_NOW" ? expense.moneyAccountId ?? map.DEFAULT_BANK : map.ACCOUNTS_PAYABLE;

  const lines: PostingLine[] = [];
  for (const l of expense.lines) {
    lines.push({ accountId: l.accountId, debitCents: l.amountCents, creditCents: 0 });
    if (l.taxCents) {
      const taxAccount = l.taxRecoverable === false ? l.accountId : l.taxAccountId ?? map.SALES_TAX;
      lines.push({ accountId: taxAccount, debitCents: l.taxCents, creditCents: 0 });
    }
  }
  lines.push({ accountId: creditAccount, debitCents: 0, creditCents: total });
  return finalize(memo("Expense", expense), lines);
}

/**
 * Payment against a document on terms
 *   Customer pays a sale:   Dr Bank              /  Cr Accounts receivable
 *   We pay an expense/bill: Dr Accounts payable  /  Cr Bank
 */
export function postPayment(
  payment: { number: string; amountCents: number; bankAccountId: string; kind: "SALE" | "EXPENSE"; documentNumber: string },
  map: AccountMap,
): Posting {
  const lines: PostingLine[] =
    payment.kind === "SALE"
      ? [
          { accountId: payment.bankAccountId, debitCents: payment.amountCents, creditCents: 0 },
          { accountId: map.ACCOUNTS_RECEIVABLE, debitCents: 0, creditCents: payment.amountCents },
        ]
      : [
          { accountId: map.ACCOUNTS_PAYABLE, debitCents: payment.amountCents, creditCents: 0 },
          { accountId: payment.bankAccountId, debitCents: 0, creditCents: payment.amountCents },
        ];
  const verb = payment.kind === "SALE" ? "received for" : "made for";
  return finalize(`Payment ${payment.number} ${verb} ${payment.documentNumber}`, lines);
}

function sumTotal(lines: DocLine[]): number {
  return lines.reduce((s, l) => s + l.amountCents + l.taxCents, 0);
}

function memo(kind: string, doc: SettledDoc): string {
  return doc.counterparty ? `${kind} ${doc.number} — ${doc.counterparty}` : `${kind} ${doc.number}`;
}

/** Merge lines per account and side, drop zero lines, and check debits = credits. */
function finalize(memoText: string, raw: PostingLine[]): Posting {
  const merged = new Map<string, PostingLine>();
  for (const l of raw) {
    const side = l.debitCents ? "D" : "C";
    const key = `${l.accountId}:${side}`;
    const existing = merged.get(key);
    if (existing) {
      existing.debitCents += l.debitCents;
      existing.creditCents += l.creditCents;
    } else {
      merged.set(key, { ...l });
    }
  }
  const lines = [...merged.values()].filter((l) => l.debitCents !== 0 || l.creditCents !== 0);
  const dr = lines.reduce((s, l) => s + l.debitCents, 0);
  const cr = lines.reduce((s, l) => s + l.creditCents, 0);
  if (dr !== cr) throw new UnbalancedPostingError(`Unbalanced posting "${memoText}": Dr ${dr} ≠ Cr ${cr}`);
  return { memo: memoText, lines };
}
