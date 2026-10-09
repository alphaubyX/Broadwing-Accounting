"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parseISODate } from "@/lib/dates";
import { handle, parseLines, required, str, UserError, type ActionState } from "@/lib/forms";
import { priceLines } from "@/lib/lines";
import { requireOrganization } from "@/lib/org";
import { nextNumber } from "@/lib/sequence";
import { storeAttachments } from "@/lib/attachments";
import { repostSale, syncPaymentStatus } from "@/lib/accounting/ledger";

/** Create or update a sale. intent=draft keeps it out of the books; intent=approve posts it. */
export async function saveSale(saleId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  let id = saleId;
  const state = await handle(async () => {
    const settlement = fd.get("settlement") === "PAID_NOW" ? "PAID_NOW" : "ON_TERMS";
    const approve = fd.get("intent") !== "draft";
    const date = parseISODate(required(fd, "date", "Date"));
    const dueDate = settlement === "ON_TERMS" && str(fd, "dueDate") ? parseISODate(str(fd, "dueDate")!) : null;
    const contactId = str(fd, "contactId");
    const paidIntoAccountId = settlement === "PAID_NOW" ? required(fd, "paidIntoAccountId", "Deposit account") : null;
    const lines = parseLines(fd);

    id = await db.$transaction(async (tx) => {
      const existing = saleId
        ? await tx.sale.findFirst({ where: { id: saleId, organizationId: org.id }, include: { payments: true } })
        : null;
      if (saleId && !existing) throw new UserError("Sale not found.");
      if (existing?.status === "VOID") throw new UserError("A voided sale cannot be edited.");
      if (existing && existing.payments.length > 0 && settlement === "PAID_NOW")
        throw new UserError("This sale already has payments recorded. Remove them before marking it as paid now.");
      if (contactId && !(await tx.contact.findFirst({ where: { id: contactId, organizationId: org.id } })))
        throw new UserError("Unknown customer.");
      if (settlement === "ON_TERMS" && !contactId) throw new UserError("Choose a customer for a sale on payment terms.");

      const priced = await priceLines(tx, org.id, lines, { useQuantity: true, requireAccount: true });
      // Drafts stay drafts until approved; posted sales keep their status and
      // syncPaymentStatus recalculates paid / part paid below.
      const isDraft = !existing || existing.status === "DRAFT";
      const status = isDraft ? (approve ? "UNPAID" : "DRAFT") : existing.status;
      const data = {
        contactId,
        date,
        dueDate,
        reference: str(fd, "reference"),
        notes: str(fd, "notes"),
        settlement,
        paidIntoAccountId,
        status,
        subtotal: priced.subtotal,
        taxTotal: priced.taxTotal,
        total: priced.total,
      } as const;

      let sale;
      if (existing) {
        await tx.saleLine.deleteMany({ where: { saleId: existing.id } });
        sale = await tx.sale.update({
          where: { id: existing.id },
          data: { ...data, lines: { create: priced.rows.map((r) => ({ ...r, accountId: r.accountId! })) } },
        });
      } else {
        sale = await tx.sale.create({
          data: {
            ...data,
            organizationId: org.id,
            number: await nextNumber(tx, org.id, "INV", org.branding?.invoicePrefix ?? "INV-"),
            lines: { create: priced.rows.map((r) => ({ ...r, accountId: r.accountId! })) },
          },
        });
        await storeAttachments(tx, org.id, "sale", sale.id, fd);
      }
      await syncPaymentStatus(tx, "SALE", sale.id);
      await repostSale(tx, sale.id);
      return sale.id;
    });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect(`/sales/${id}`);
}

export async function approveSale(saleId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    await db.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id: saleId, organizationId: org.id } });
      if (!sale || sale.status !== "DRAFT") throw new UserError("Only drafts can be approved.");
      await tx.sale.update({ where: { id: sale.id }, data: { status: "UNPAID" } });
      await syncPaymentStatus(tx, "SALE", sale.id);
      await repostSale(tx, sale.id);
    });
  });
  revalidatePath("/", "layout");
  return state;
}

export async function voidSale(saleId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    await db.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id: saleId, organizationId: org.id }, include: { payments: true } });
      if (!sale) throw new UserError("Sale not found.");
      if (sale.payments.length) throw new UserError("Remove the payments on this sale before voiding it.");
      await tx.sale.update({ where: { id: sale.id }, data: { status: "VOID", amountPaid: 0 } });
      await repostSale(tx, sale.id);
    });
  });
  revalidatePath("/", "layout");
  return state;
}

export async function deleteSale(saleId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const sale = await db.sale.findFirst({ where: { id: saleId, organizationId: org.id } });
    if (!sale) throw new UserError("Sale not found.");
    if (sale.status !== "DRAFT" && sale.status !== "VOID") throw new UserError("Only drafts and voided sales can be deleted. Void it first.");
    await db.sale.delete({ where: { id: sale.id } });
  });
  if (!state.ok) return state;
  revalidatePath("/", "layout");
  redirect("/sales");
}
