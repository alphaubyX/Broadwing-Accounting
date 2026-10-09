import { accountOptions, contactOptions, mappedAccountId, taxOptions } from "@/lib/options";

export async function poFormData(organizationId: string) {
  const [vendors, categories, taxes, defaultExpenseId] = await Promise.all([
    contactOptions(organizationId, "VENDOR"),
    accountOptions(organizationId, { subtypes: ["COST_OF_SALES", "OPERATING_EXPENSE", "OTHER_EXPENSE", "CURRENT_ASSET", "FIXED_ASSET"] }),
    taxOptions(organizationId),
    mappedAccountId(organizationId, "DEFAULT_EXPENSE"),
  ]);
  return { vendors, categories, taxes, defaultExpenseId };
}
