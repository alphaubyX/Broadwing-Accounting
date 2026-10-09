import type { Account, AccountSubtype, AccountType } from "@prisma/client";
import { db } from "../db";
import { toCents } from "../money";
import { isDebitNormal } from "./default-chart";

export interface AccountBalance {
  account: Pick<Account, "id" | "code" | "name" | "type" | "subtype">;
  debitCents: number;
  creditCents: number;
  /** Balance in the account's natural direction (positive = normal). */
  balanceCents: number;
}

/** Sum journal lines per account for a date range (inclusive). */
export async function accountBalances(organizationId: string, range: { from?: Date; to?: Date } = {}) {
  const [accounts, sums] = await Promise.all([
    db.account.findMany({ where: { organizationId }, orderBy: { code: "asc" } }),
    db.journalLine.groupBy({
      by: ["accountId"],
      where: { journalEntry: { organizationId, date: { gte: range.from, lte: range.to } } },
      _sum: { debit: true, credit: true },
    }),
  ]);
  const byId = new Map(sums.map((s) => [s.accountId, s._sum]));
  return accounts.map<AccountBalance>((account) => {
    const s = byId.get(account.id);
    const debitCents = toCents(s?.debit);
    const creditCents = toCents(s?.credit);
    const net = debitCents - creditCents;
    return { account, debitCents, creditCents, balanceCents: isDebitNormal(account.type) ? net : -net };
  });
}

const sum = (rows: AccountBalance[]) => rows.reduce((s, r) => s + r.balanceCents, 0);
const nonZero = (rows: AccountBalance[]) => rows.filter((r) => r.debitCents !== 0 || r.creditCents !== 0);
const ofType = (rows: AccountBalance[], type: AccountType, subtypes?: AccountSubtype[]) =>
  nonZero(rows.filter((r) => r.account.type === type && (!subtypes || subtypes.includes(r.account.subtype))));

export async function profitAndLoss(organizationId: string, from: Date, to: Date) {
  const rows = await accountBalances(organizationId, { from, to });
  const income = ofType(rows, "INCOME");
  const costOfSales = ofType(rows, "EXPENSE", ["COST_OF_SALES"]);
  const expenses = ofType(rows, "EXPENSE", ["OPERATING_EXPENSE", "OTHER_EXPENSE"]);
  const incomeTotal = sum(income);
  const costOfSalesTotal = sum(costOfSales);
  const grossProfit = incomeTotal - costOfSalesTotal;
  const expenseTotal = sum(expenses);
  return {
    income,
    incomeTotal,
    costOfSales,
    costOfSalesTotal,
    grossProfit,
    expenses,
    expenseTotal,
    netProfit: grossProfit - expenseTotal,
  };
}

export async function balanceSheet(organizationId: string, asOf: Date) {
  const rows = await accountBalances(organizationId, { to: asOf });
  const assets = ofType(rows, "ASSET");
  const liabilities = ofType(rows, "LIABILITY");
  const equity = ofType(rows, "EQUITY");
  // No year-end closing entries yet: accumulated profit is shown as one equity line.
  const earnings = sum(ofType(rows, "INCOME")) - sum(ofType(rows, "EXPENSE"));
  const assetTotal = sum(assets);
  const liabilityTotal = sum(liabilities);
  const equityTotal = sum(equity) + earnings;
  return { assets, assetTotal, liabilities, liabilityTotal, equity, earnings, equityTotal };
}

export async function trialBalance(organizationId: string, asOf: Date) {
  const rows = nonZero(await accountBalances(organizationId, { to: asOf }));
  const lines = rows.map((r) => {
    const net = r.debitCents - r.creditCents;
    return { account: r.account, debitCents: net > 0 ? net : 0, creditCents: net < 0 ? -net : 0 };
  });
  return {
    lines,
    debitTotal: lines.reduce((s, l) => s + l.debitCents, 0),
    creditTotal: lines.reduce((s, l) => s + l.creditCents, 0),
  };
}
