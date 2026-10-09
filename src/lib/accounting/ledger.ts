// Database side of the ledger: loads documents, builds postings with the pure
// rules in ./posting, and (re)writes the journal entries for a source document.

import type { JournalSource } from "@prisma/client";
import type { Tx } from "../db";
import { fromCents, toCents } from "../money";
import { MAPPING_KEYS, type AccountMap, type MappingKey } from "./mapping";
import { postExpense, postPayment, postSale, type Posting } from "./posting";
import { paymentStatus } from "./totals";

export async function getAccountMap(tx: Tx, organizationId: string): Promise<AccountMap> {
  const rows = await tx.accountMapping.findMany({ where: { organizationId } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.accountId])) as Partial<AccountMap>;
  for (const key of Object.keys(MAPPING_KEYS) as MappingKey[]) {
    if (!map[key]) throw new Error(`Account mapping "${MAPPING_KEYS[key].label}" is not set. Fix it under Settings → Account mapping.`);
  }
  return map as AccountMap;
}

async function writeJournal(
  tx: Tx,
  organizationId: string,
  source: { type: JournalSource; id: string; number: string; date: Date },
  posting: Posting | null,
) {
  await tx.journalEntry.deleteMany({ where: { organizationId, sourceType: source.type, sourceId: source.id } });
  if (!posting) return;
  await tx.journalEntry.create({
    data: {
      organizationId,
      date: source.date,
      memo: posting.memo,
      sourceType: source.type,
      sourceId: source.id,
      sourceNumber: source.number,
      lines: {
        create: posting.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description,
          debit: fromCents(l.debitCents),
          credit: fromCents(l.creditCents),
        })),
      },
    },
  });
}

export async function deleteJournal(tx: Tx, organizationId: string, type: JournalSource, sourceIds: string[]) {
  if (sourceIds.length === 0) return;
  await tx.journalEntry.deleteMany({ where: { organizationId, sourceType: type, sourceId: { in: sourceIds } } });
}

export async function repostSale(tx: Tx, saleId: string) {
  const sale = await tx.sale.findUniqueOrThrow({
    where: { id: saleId },
    include: { lines: { include: { tax: true } }, contact: true },
  });
  const map = await getAccountMap(tx, sale.organizationId);
  const posting = postSale(
    {
      number: sale.number,
      counterparty: sale.contact?.name,
      settlement: sale.settlement,
      status: sale.status,
      moneyAccountId: sale.paidIntoAccountId,
      lines: sale.lines.map((l) => ({
        accountId: l.accountId,
        amountCents: toCents(l.amount),
        taxCents: toCents(l.taxAmount),
        taxAccountId: l.tax?.accountId,
      })),
    },
    map,
  );
  await writeJournal(tx, sale.organizationId, { type: "SALE", id: sale.id, number: sale.number, date: sale.date }, posting);
}

export async function repostExpense(tx: Tx, expenseId: string) {
  const expense = await tx.expense.findUniqueOrThrow({
    where: { id: expenseId },
    include: { lines: { include: { tax: true } }, contact: true },
  });
  const map = await getAccountMap(tx, expense.organizationId);
  const posting = postExpense(
    {
      number: expense.number,
      counterparty: expense.contact?.name ?? expense.payeeName,
      settlement: expense.settlement,
      status: expense.status,
      moneyAccountId: expense.paidFromAccountId,
      lines: expense.lines.map((l) => ({
        accountId: l.accountId,
        amountCents: toCents(l.amount),
        taxCents: toCents(l.taxAmount),
        taxAccountId: l.tax?.accountId,
      })),
    },
    map,
  );
  await writeJournal(
    tx,
    expense.organizationId,
    { type: "EXPENSE", id: expense.id, number: expense.number, date: expense.date },
    posting,
  );
}

export async function repostPayment(tx: Tx, paymentId: string) {
  const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { sale: true, expense: true } });
  const map = await getAccountMap(tx, p.organizationId);
  const kind = p.saleId ? "SALE" : "EXPENSE";
  const posting = postPayment(
    {
      number: p.number,
      amountCents: toCents(p.amount),
      bankAccountId: p.accountId,
      kind,
      documentNumber: p.sale?.number ?? p.expense?.number ?? "",
    },
    map,
  );
  await writeJournal(tx, p.organizationId, { type: "PAYMENT", id: p.id, number: p.number, date: p.date }, posting);
}

/** Recalculate amountPaid and status of a sale/expense from its payments. */
export async function syncPaymentStatus(tx: Tx, kind: "SALE" | "EXPENSE", id: string) {
  const doc =
    kind === "SALE"
      ? await tx.sale.findUniqueOrThrow({ where: { id }, include: { payments: true } })
      : await tx.expense.findUniqueOrThrow({ where: { id }, include: { payments: true } });
  if (doc.status === "DRAFT" || doc.status === "VOID") return;

  const totalCents = toCents(doc.total);
  const paidCents =
    doc.settlement === "PAID_NOW" ? totalCents : doc.payments.reduce((s, p) => s + toCents(p.amount), 0);
  const data = { amountPaid: fromCents(paidCents), status: paymentStatus(totalCents, paidCents) };

  if (kind === "SALE") await tx.sale.update({ where: { id }, data });
  else await tx.expense.update({ where: { id }, data });
}
