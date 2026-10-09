import { db } from "./db";
import { DEFAULT_CHART } from "./accounting/default-chart";

export interface NewOrganization {
  name: string;
  currency: string;
  country?: string | null;
  taxName?: string | null;
  taxRate?: number | null;
  data?: Partial<{
    legalName: string | null;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    city: string | null;
    taxNumber: string | null;
  }>;
}

/** Create an organization with branding, a starter chart of accounts, mappings and an optional tax. */
export async function createOrganization(input: NewOrganization) {
  return db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.name, currency: input.currency, country: input.country, ...input.data, branding: { create: {} } },
    });

    await tx.account.createMany({
      data: DEFAULT_CHART.map((a) => ({
        organizationId: org.id,
        code: a.code,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        isSystem: !!a.mapping || a.subtype === "ACCOUNTS_RECEIVABLE" || a.subtype === "ACCOUNTS_PAYABLE",
      })),
    });
    const accounts = await tx.account.findMany({ where: { organizationId: org.id } });
    const byCode = new Map(accounts.map((a) => [a.code, a.id]));

    await tx.accountMapping.createMany({
      data: DEFAULT_CHART.filter((a) => a.mapping).map((a) => ({
        organizationId: org.id,
        key: a.mapping!,
        accountId: byCode.get(a.code)!,
      })),
    });

    if (input.taxName && input.taxRate) {
      await tx.tax.create({
        data: { organizationId: org.id, name: input.taxName, rate: input.taxRate, accountId: byCode.get("2100")! },
      });
    }
    return org;
  });
}
