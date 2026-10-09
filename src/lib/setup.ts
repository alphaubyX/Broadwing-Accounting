import { db } from "./db";
import { DEFAULT_CHART } from "./accounting/default-chart";

export interface NewOrganization {
  name: string;
  currency: string;
  country?: string | null;
  taxName?: string | null;
  taxAbbreviation?: string | null;
  taxRate?: number | null;
  fiscalYearEndMonth?: number;
  fiscalYearEndDay?: number;
  owner: { name: string | null; email: string };
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
      data: {
        name: input.name,
        currency: input.currency,
        country: input.country,
        fiscalYearEndMonth: input.fiscalYearEndMonth,
        fiscalYearEndDay: input.fiscalYearEndDay,
        ...input.data,
        branding: { create: {} },
        users: { create: { name: input.owner.name, email: input.owner.email.toLowerCase(), role: "OWNER", canSendInvoices: true, status: "ACTIVE" } },
      },
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
        data: {
          organizationId: org.id,
          name: input.taxName,
          abbreviation: input.taxAbbreviation || input.taxName,
          rate: input.taxRate,
          taxNumber: input.data?.taxNumber,
          showTaxNumber: !!input.data?.taxNumber,
          accountId: byCode.get("2100")!,
        },
      });
    }
    return org;
  });
}
