"use server";

import { revalidatePath } from "next/cache";
import type { SettlementMode } from "@prisma/client";
import { redirect } from "next/navigation";
import { db, type Tx } from "@/lib/db";
import { parseISODate } from "@/lib/dates";
import { handle, parseLines, required, str, UserError, type ActionState } from "@/lib/forms";
import { priceLines } from "@/lib/lines";
import { requireOrganization } from "@/lib/org";
import { nextNumber } from "@/lib/sequence";
import { storeAttachments } from "@/lib/attachments";
import { deleteJournal, repostExpense, syncPaymentStatus } from "@/lib/accounting/ledger";

/** "Paid to" is free text; link it to a vendor when the name matches one. */
async function resolvePayee(tx: Tx, organizationId: string, name: string | null) {
  if (!name) return { contactId: null, payeeName: null };
  const contact = await tx.contact.findFirst({
    where: { organizationId, isArchived: false, name: { equals: name, mode: "insensitive" } },
  });
  return contact ? { contactId: contact.id, payeeName: null } : { contactId: null, payeeName: name };
}

export async function saveExpense(expenseId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  let id = expenseId;
  const state = await handle(async () => {
    const settlement: SettlementMode = fd.get("settlement") === "ON_TERMS" ? "ON_TERMS" : "PAID_NOW";
    const date = parseISODate(required(fd, "date", "Date"));
    const description = required(fd, "description", "Description");
    const dueDate = settlement === "ON_TERMS" && str(fd, "dueDate") ? parseISODate(str(fd, "dueDate")!) : null;
    const paidFromAccountId = settlement === "PAID_NOW" ? required(fd, "paidFromAccountId", "Paid from") : null;
    // Lines without their own description inherit the expense description.
    const lines = parseLines(fd).map((l) => ({ ...l, description: l.description || description }));

    id = await db.$transaction(async (tx) => {
      const existing = expenseId
        ? await tx.expense.findFirst({ where: { id: expenseId, organizationId: org.id }, include: { payments: true } })
        : null;
      if (expenseId && !existing) throw new UserError("Expense not found.");
      if (existing && existing.payments.length > 0 && settlement === "PAID_NOW")
        throw new UserError("This expense already has payments recorded. Remove them before marking it as paid now.");
      if (paidFromAccountId && !(await tx.account.findFirst({ where: { id: paidFromAccountId, organizationId: org.id } })))
        throw new UserError("Unknown payment account.");

      const priced = await priceLines(tx, org.id, lines, { useQuantity: false, requireAccount: true });
      const rows = priced.rows.map(({ quantity: _q, unitPrice: _u, ...r }) => ({ ...r, accountId: r.accountId! }));
      const data = {
        ...(await resolvePayee(tx, org.id, str(fd, "payee"))),
        date,
        dueDate,
        description,
        reference: str(fd, "reference"),
        settlement,
        paidFromAccountId,
        status: "UNPAID" as const,
        subtotal: priced.subtotal,
        taxTotal: priced.taxTotal,
        total: priced.total,
      };

      let expense;
      if (existing) {
        await tx.expenseLine.deleteMany({ where: { expenseId: existing.id } });
        expense = await tx.expense.update({ where: { id: existing.id }, data: { ...data, lines: { create: rows } } });
      } else {
        expense = await tx.expense.create({
          data: {
            ...data,
            organizationId: org.id,
            number: await nextNumber(tx, org.id, "EXP", org.branding?.expensePrefix ?? "EXP-"),
            lines: { create: rows },
          },
        });
      }
      await storeAttachments(tx, org.id, "expense", expense.id, fd);
      await syncPaymentStatus(tx, "EXPENSE", expense.id);
      await repostExpense(tx, expense.id);
      return expense.id;
    });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect(`/expenses/${id}`);
}

export async function deleteExpense(expenseId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    await db.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({ where: { id: expenseId, organizationId: org.id }, include: { payments: true } });
      if (!expense) throw new UserError("Expense not found.");
      await deleteJournal(tx, org.id, "PAYMENT", expense.payments.map((p) => p.id));
      await deleteJournal(tx, org.id, "EXPENSE", [expense.id]);
      if (expense.purchaseOrderId) await tx.purchaseOrder.update({ where: { id: expense.purchaseOrderId }, data: { status: "SENT" } });
      await tx.expense.delete({ where: { id: expense.id } });
    });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect("/expenses");
}
