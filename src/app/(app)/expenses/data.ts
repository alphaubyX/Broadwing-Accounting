import { db } from "@/lib/db";
import { accountOptions, mappedAccountId, PAY_FROM, taxOptions } from "@/lib/options";

export async function expenseFormData(organizationId: string) {
  const [vendors, categories, payFromAccounts, taxes, defaultExpenseId, defaultBankId] = await Promise.all([
    db.contact.findMany({ where: { organizationId, isArchived: false, type: { in: ["VENDOR", "BOTH"] } }, orderBy: { name: "asc" } }),
    accountOptions(organizationId, { types: ["EXPENSE", "ASSET"], subtypes: ["COST_OF_SALES", "OPERATING_EXPENSE", "OTHER_EXPENSE", "CURRENT_ASSET", "FIXED_ASSET"] }),
    accountOptions(organizationId, { subtypes: PAY_FROM }),
    taxOptions(organizationId),
    mappedAccountId(organizationId, "DEFAULT_EXPENSE"),
    mappedAccountId(organizationId, "DEFAULT_BANK"),
  ]);
  return { vendorNames: vendors.map((v) => v.name), categories, payFromAccounts, taxes, defaultExpenseId, defaultBankId };
}
