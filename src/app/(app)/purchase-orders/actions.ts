"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { addDays, parseISODate, today } from "@/lib/dates";
import { handle, parseLines, required, str, UserError, type ActionState } from "@/lib/forms";
import { priceLines } from "@/lib/lines";
import { mappedAccountId } from "@/lib/options";
import { requireOrganization } from "@/lib/org";
import { nextNumber } from "@/lib/sequence";
import { storeAttachments } from "@/lib/attachments";
import { repostExpense, syncPaymentStatus } from "@/lib/accounting/ledger";

export async function savePurchaseOrder(poId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  let id = poId;
  const state = await handle(async () => {
    const contactId = required(fd, "contactId", "Vendor");
    const date = parseISODate(required(fd, "date", "Date"));
    const expected = str(fd, "expectedDate");
    const lines = parseLines(fd);

    id = await db.$transaction(async (tx) => {
      const existing = poId ? await tx.purchaseOrder.findFirst({ where: { id: poId, organizationId: org.id } }) : null;
      if (poId && !existing) throw new UserError("Purchase order not found.");
      if (existing && existing.status !== "DRAFT" && existing.status !== "SENT")
        throw new UserError("Billed or cancelled purchase orders cannot be edited.");
      if (!(await tx.contact.findFirst({ where: { id: contactId, organizationId: org.id } }))) throw new UserError("Unknown vendor.");

      const priced = await priceLines(tx, org.id, lines, { useQuantity: true, requireAccount: true });
      const data = {
        contactId,
        date,
        expectedDate: expected ? parseISODate(expected) : null,
        reference: str(fd, "reference"),
        notes: str(fd, "notes"),
        subtotal: priced.subtotal,
        taxTotal: priced.taxTotal,
        total: priced.total,
      };
      if (existing) {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: existing.id } });
        await tx.purchaseOrder.update({ where: { id: existing.id }, data: { ...data, lines: { create: priced.rows } } });
        return existing.id;
      }
      const po = await tx.purchaseOrder.create({
        data: {
          ...data,
          organizationId: org.id,
          number: await nextNumber(tx, org.id, "PO", org.branding?.poPrefix ?? "PO-"),
          lines: { create: priced.rows },
        },
      });
      await storeAttachments(tx, org.id, "purchaseOrder", po.id, fd);
      return po.id;
    });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect(`/purchase-orders/${id}`);
}

export async function setPurchaseOrderStatus(poId: string, status: "SENT" | "CANCELLED" | "DRAFT"): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const po = await db.purchaseOrder.findFirst({ where: { id: poId, organizationId: org.id } });
    if (!po) throw new UserError("Purchase order not found.");
    if (po.status === "BILLED") throw new UserError("This purchase order has already been billed.");
    await db.purchaseOrder.update({ where: { id: po.id }, data: { status } });
  });
  revalidatePath("/", "layout");
  return state;
}

/** Turn a purchase order into an expense on payment terms (a bill). */
export async function convertToExpense(poId: string): Promise<ActionState> {
  const org = await requireOrganization();
  let expenseId = "";
  const state = await handle(async () => {
    const defaultExpense = await mappedAccountId(org.id, "DEFAULT_EXPENSE");
    expenseId = await db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({ where: { id: poId, organizationId: org.id }, include: { lines: true } });
      if (!po) throw new UserError("Purchase order not found.");
      if (po.status === "BILLED" || po.status === "CANCELLED") throw new UserError("This purchase order cannot be billed.");
      const d = today();
      const expense = await tx.expense.create({
        data: {
          organizationId: org.id,
          number: await nextNumber(tx, org.id, "EXP", org.branding?.expensePrefix ?? "EXP-"),
          contactId: po.contactId,
          date: parseISODate(d),
          dueDate: parseISODate(addDays(d, org.defaultPaymentTerms)),
          description: `Purchase order ${po.number}`,
          reference: po.reference,
          settlement: "ON_TERMS",
          subtotal: po.subtotal,
          taxTotal: po.taxTotal,
          total: po.total,
          purchaseOrderId: po.id,
          lines: {
            create: po.lines.map((l) => ({
              position: l.position,
              description: Number(l.quantity) === 1 ? l.description : `${l.description} × ${Number(l.quantity)}`,
              amount: l.amount,
              taxAmount: l.taxAmount,
              accountId: l.accountId ?? defaultExpense,
              taxId: l.taxId,
            })),
          },
        },
      });
      await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "BILLED" } });
      await syncPaymentStatus(tx, "EXPENSE", expense.id);
      await repostExpense(tx, expense.id);
      return expense.id;
    });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect(`/expenses/${expenseId}`);
}

export async function deletePurchaseOrder(poId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const po = await db.purchaseOrder.findFirst({ where: { id: poId, organizationId: org.id }, include: { expense: true } });
    if (!po) throw new UserError("Purchase order not found.");
    if (po.expense) throw new UserError(`This purchase order is linked to expense ${po.expense.number}. Delete that first.`);
    await db.purchaseOrder.delete({ where: { id: po.id } });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect("/purchase-orders");
}
