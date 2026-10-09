import { accountOptions, contactOptions, mappedAccountId, RECEIVE_INTO, taxOptions } from "@/lib/options";

export async function saleFormData(organizationId: string) {
  const [customers, incomeAccounts, depositAccounts, taxes, defaultIncomeId, defaultBankId] = await Promise.all([
    contactOptions(organizationId, "CUSTOMER"),
    accountOptions(organizationId, { types: ["INCOME"] }),
    accountOptions(organizationId, { subtypes: RECEIVE_INTO }),
    taxOptions(organizationId),
    mappedAccountId(organizationId, "DEFAULT_INCOME"),
    mappedAccountId(organizationId, "DEFAULT_BANK"),
  ]);
  return { customers, incomeAccounts, depositAccounts, taxes, defaultIncomeId, defaultBankId };
}
