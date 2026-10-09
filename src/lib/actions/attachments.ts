"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { storeAttachments, type AttachTarget } from "../attachments";
import { handle, UserError, type ActionState } from "../forms";
import { requireOrganization } from "../org";
import { deleteUpload } from "../storage";

export async function addAttachments(target: AttachTarget, id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const owner =
      target === "sale"
        ? await db.sale.findFirst({ where: { id, organizationId: org.id } })
        : target === "expense"
          ? await db.expense.findFirst({ where: { id, organizationId: org.id } })
          : await db.purchaseOrder.findFirst({ where: { id, organizationId: org.id } });
    if (!owner) throw new UserError("Document not found.");
    const n = await storeAttachments(db, org.id, target, id, fd);
    if (n === 0) throw new UserError("Choose a file or take a photo first.");
  });
  revalidatePath("/", "layout");
  return state;
}

export async function deleteAttachment(attachmentId: string): Promise<ActionState> {
  const org = await requireOrganization();
  const state = await handle(async () => {
    const a = await db.attachment.findFirst({ where: { id: attachmentId, organizationId: org.id } });
    if (!a) throw new UserError("Attachment not found.");
    await db.attachment.delete({ where: { id: a.id } });
    await deleteUpload(a.storagePath);
  });
  revalidatePath("/", "layout");
  return state;
}
