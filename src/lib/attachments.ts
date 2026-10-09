import type { db, Tx } from "./db";
import { UserError } from "./forms";
import { isUpload, saveUpload } from "./storage";

export type AttachTarget = "sale" | "expense" | "purchaseOrder";

/** Save every file in the "files" field and link it to a document. */
export async function storeAttachments(tx: Tx | typeof db, organizationId: string, target: AttachTarget, id: string, fd: FormData) {
  const files = fd.getAll("files").filter(isUpload);
  for (const file of files) {
    let stored;
    try {
      stored = await saveUpload(file, `attachments/${organizationId}`);
    } catch (e) {
      throw new UserError((e as Error).message);
    }
    await tx.attachment.create({ data: {
        organizationId,
        ...stored,
        saleId: target === "sale" ? id : null,
        expenseId: target === "expense" ? id : null,
        purchaseOrderId: target === "purchaseOrder" ? id : null,
      }, });
  }
  return files.length;
}

