import { describe, expect, it } from "vitest";
import { postExpense, postPayment, postSale } from "./posting";
import { computeTotals, paymentStatus } from "./totals";
import type { AccountMap } from "./mapping";

const map: AccountMap = {
  ACCOUNTS_RECEIVABLE: "ar",
  ACCOUNTS_PAYABLE: "ap",
  SALES_TAX: "tax",
  DEFAULT_INCOME: "sales",
  DEFAULT_EXPENSE: "general",
  DEFAULT_BANK: "bank",
  RETAINED_EARNINGS: "re",
};

const balanceOf = (lines: { accountId: string; debitCents: number; creditCents: number }[], id: string) =>
  lines.filter((l) => l.accountId === id).reduce((s, l) => s + l.debitCents - l.creditCents, 0);

describe("computeTotals", () => {
  it("computes tax-exclusive totals in cents", () => {
    const t = computeTotals([
      { quantity: 2, unitPriceCents: 1050, taxRate: 15 },
      { quantity: 1, unitPriceCents: 999 },
    ]);
    expect(t.subtotalCents).toBe(3099);
    expect(t.taxCents).toBe(315);
    expect(t.totalCents).toBe(3414);
  });
});

describe("postSale", () => {
  const sale = {
    number: "INV-0001",
    counterparty: "Acme",
    settlement: "ON_TERMS" as const,
    status: "UNPAID" as const,
    lines: [
      { accountId: "sales", amountCents: 10000, taxCents: 1500 },
      { accountId: "services", amountCents: 5000, taxCents: 0 },
    ],
  };

  it("debits receivables and credits income and tax", () => {
    const p = postSale(sale, map)!;
    expect(balanceOf(p.lines, "ar")).toBe(16500);
    expect(balanceOf(p.lines, "sales")).toBe(-10000);
    expect(balanceOf(p.lines, "services")).toBe(-5000);
    expect(balanceOf(p.lines, "tax")).toBe(-1500);
  });

  it("debits the bank for cash sales", () => {
    const p = postSale({ ...sale, settlement: "PAID_NOW", moneyAccountId: "cash" }, map)!;
    expect(balanceOf(p.lines, "cash")).toBe(16500);
    expect(balanceOf(p.lines, "ar")).toBe(0);
  });

  it("does not post drafts or voided sales", () => {
    expect(postSale({ ...sale, status: "DRAFT" }, map)).toBeNull();
    expect(postSale({ ...sale, status: "VOID" }, map)).toBeNull();
  });
});

describe("postExpense", () => {
  const expense = {
    number: "EXP-0001",
    settlement: "PAID_NOW" as const,
    status: "PAID" as const,
    lines: [
      { accountId: "rent", amountCents: 100000, taxCents: 0 },
      { accountId: "general", amountCents: 2000, taxCents: 300 },
    ],
  };

  it("debits expense categories and recoverable tax, credits the bank", () => {
    const p = postExpense(expense, map)!;
    expect(balanceOf(p.lines, "rent")).toBe(100000);
    expect(balanceOf(p.lines, "general")).toBe(2000);
    expect(balanceOf(p.lines, "tax")).toBe(300);
    expect(balanceOf(p.lines, "bank")).toBe(-102300);
  });

  it("credits accounts payable for bills on terms", () => {
    const p = postExpense({ ...expense, settlement: "ON_TERMS", status: "UNPAID" }, map)!;
    expect(balanceOf(p.lines, "ap")).toBe(-102300);
    expect(balanceOf(p.lines, "bank")).toBe(0);
  });
});

describe("postPayment", () => {
  it("clears receivables when a customer pays", () => {
    const p = postPayment({ number: "PAY-0001", amountCents: 500, bankAccountId: "bank", kind: "SALE", documentNumber: "INV-0001" }, map);
    expect(balanceOf(p.lines, "bank")).toBe(500);
    expect(balanceOf(p.lines, "ar")).toBe(-500);
  });

  it("clears payables when we pay a bill", () => {
    const p = postPayment({ number: "PAY-0002", amountCents: 500, bankAccountId: "bank", kind: "EXPENSE", documentNumber: "EXP-0001" }, map);
    expect(balanceOf(p.lines, "ap")).toBe(500);
    expect(balanceOf(p.lines, "bank")).toBe(-500);
  });
});

describe("paymentStatus", () => {
  it("derives unpaid / partial / paid", () => {
    expect(paymentStatus(1000, 0)).toBe("UNPAID");
    expect(paymentStatus(1000, 1)).toBe("PARTIAL");
    expect(paymentStatus(1000, 1000)).toBe("PAID");
  });
});
