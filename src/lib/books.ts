import { db } from "./db";

/** Currency can only change while the books are empty, as amounts are not converted. */
export async function hasTransactions(organizationId: string): Promise<boolean> {
  return (await db.journalEntry.count({ where: { organizationId } })) > 0;
}
