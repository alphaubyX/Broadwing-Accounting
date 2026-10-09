"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { parseISODate } from "../dates";
import { handle, required, str, UserError, type ActionState } from "../forms";
import { fromCents, toCents } from "../money";
import { requireOrganization } from "../org";
import { nextNumber } from "../sequence";
import { deleteJournal, repostPayment, syncPaymentStatus } from "../accounting/ledger";

export async function recordPayment(kind: "SALE" | "EXPENSE", documentId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const amountCents = toCents(required(fd, "amount", "Amount"));
    if (amountCents <= 0) throw new UserError("Amount must be greater than zero.");
    const accountId = required(fd, "accountId", "Account");
    const date = parseISODate(required(fd, "date", "Date"));

    await db.$transaction(async (tx) => {
      const doc =
        kind === "SALE"
          ? await tx.sale.findFirst({ where: { id: documentId, organizationId: org.id } })
          : await tx.expense.findFirst({ where: { id: documentId, organizationId: org.id } });
      if (!doc) throw new UserError("Document not found.");
      if (doc.settlement === "PAID_NOW") throw new UserError("This transaction was already paid in full.");
      if (doc.status === "DRAFT" || doc.status === "VOID") throw new UserError("Approve the document before recording payments.");
      const due = toCents(doc.total) - toCents(doc.amountPaid);
      if (amountCents > due) throw new UserError(`The amount due is only ${fromCents(due)}.`);

      const account = await tx.account.findFirst({ where: { id: accountId, organizationId: org.id } });
      if (!account) throw new UserError("Unknown account.");

      const payment = await tx.payment.create({
        data: {
          organizationId: org.id,
          number: await nextNumber(tx, org.id, "PAY", "PAY-"),
          date,
          amount: fromCents(amountCents),
          accountId,
          method: str(fd, "method"),
          reference: str(fd, "reference"),
          saleId: kind === "SALE" ? documentId : null,
          expenseId: kind === "EXPENSE" ? documentId : null,
        },
      });
      await repostPayment(tx, payment.id);
      await syncPaymentStatus(tx, kind, documentId);
    });
  });
  revalidatePath("/", "layout");
  return state;
}

export async function deletePayment(paymentId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    await db.$transaction(async (tx) => {
      const p = await tx.payment.findFirst({ where: { id: paymentId, organizationId: org.id } });
      if (!p) throw new UserError("Payment not found.");
      await deleteJournal(tx, org.id, "PAYMENT", [p.id]);
      await tx.payment.delete({ where: { id: p.id } });
      if (p.saleId) await syncPaymentStatus(tx, "SALE", p.saleId);
      if (p.expenseId) await syncPaymentStatus(tx, "EXPENSE", p.expenseId);
    });
  });
  revalidatePath("/", "layout");
  return state;
}
