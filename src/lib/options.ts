import type { AccountSubtype, AccountType, ContactType } from "@prisma/client";
import { db } from "./db";
import { toCents } from "./money";
import type { Option, TaxOption } from "@/components/LineItemsEditor";

export async function accountOptions(
  organizationId: string,
  filter: { types?: AccountType[]; subtypes?: AccountSubtype[] },
): Promise<Option[]> {
  const accounts = await db.account.findMany({
    where: { organizationId, isArchived: false, type: filter.types ? { in: filter.types } : undefined, subtype: filter.subtypes ? { in: filter.subtypes } : undefined },
    orderBy: { code: "asc" },
  });
  return accounts.map((a) => ({ id: a.id, label: `${a.code} · ${a.name}` }));
}

export async function taxOptions(organizationId: string): Promise<TaxOption[]> {
  const taxes = await db.tax.findMany({ where: { organizationId, isArchived: false }, orderBy: { name: "asc" } });
  return taxes.map((t) => ({ id: t.id, label: `${t.name} (${Number(t.rate)}%)`, rate: Number(t.rate) }));
}

export async function contactOptions(organizationId: string, role: "CUSTOMER" | "VENDOR"): Promise<Option[]> {
  const types: ContactType[] = [role, "BOTH"];
  const contacts = await db.contact.findMany({
    where: { organizationId, isArchived: false, type: { in: types } },
    orderBy: { name: "asc" },
  });
  return contacts.map((c) => ({ id: c.id, label: c.name }));
}

/** Accounts money can be received into. */
export const RECEIVE_INTO: AccountSubtype[] = ["CASH_AND_BANK"];
/** Accounts money can be paid from (bank, cash, credit card). */
export const PAY_FROM: AccountSubtype[] = ["CASH_AND_BANK", "CURRENT_LIABILITY"];

export async function mappedAccountId(organizationId: string, key: string): Promise<string> {
  const m = await db.accountMapping.findUnique({ where: { organizationId_key: { organizationId, key } } });
  return m?.accountId ?? "";
}

export function toEditableLines(
  lines: { description: string; quantity?: unknown; unitPrice?: unknown; amount?: unknown; accountId: string | null; taxId: string | null }[],
) {
  return lines.map((l) => ({
    description: l.description,
    quantity: l.quantity !== undefined ? String(Number(l.quantity)) : "1",
    unitPrice: (toCents((l.unitPrice ?? l.amount) as string) / 100).toFixed(2),
    accountId: l.accountId ?? "",
    taxId: l.taxId ?? "",
  }));
}
