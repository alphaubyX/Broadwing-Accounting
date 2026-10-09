import type { Tx } from "./db";

export type SequenceKey = "INV" | "EXP" | "PO" | "PAY";

/** Allocate the next unique, human-readable transaction number, e.g. INV-0007. */
export async function nextNumber(tx: Tx, organizationId: string, key: SequenceKey, prefix: string): Promise<string> {
  const seq = await tx.sequence.upsert({
    where: { organizationId_key: { organizationId, key } },
    create: { organizationId, key, next: 2 },
    update: { next: { increment: 1 } },
  });
  return `${prefix}${String(seq.next - 1).padStart(4, "0")}`;
}
