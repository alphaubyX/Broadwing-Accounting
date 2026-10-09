import type { AccountType } from "@prisma/client";

/**
 * Account mappings tell the app which account receives each automatic
 * debit/credit. They are editable under Settings → Account mapping.
 */
export const MAPPING_KEYS = {
  ACCOUNTS_RECEIVABLE: {
    label: "Accounts receivable",
    help: "Debited when you invoice a customer on terms, credited when they pay.",
    types: ["ASSET"],
  },
  ACCOUNTS_PAYABLE: {
    label: "Accounts payable",
    help: "Credited when you record a bill on terms, debited when you pay it.",
    types: ["LIABILITY"],
  },
  SALES_TAX: {
    label: "Sales tax / VAT",
    help: "Default account for tax collected on sales and paid on purchases.",
    types: ["LIABILITY"],
  },
  DEFAULT_INCOME: {
    label: "Default income account",
    help: "Pre-selected on new sale lines.",
    types: ["INCOME"],
  },
  DEFAULT_EXPENSE: {
    label: "Default expense category",
    help: "Pre-selected on new expense lines.",
    types: ["EXPENSE"],
  },
  DEFAULT_BANK: {
    label: "Default bank / cash account",
    help: "Pre-selected when money is received or paid.",
    types: ["ASSET"],
  },
  RETAINED_EARNINGS: {
    label: "Retained earnings",
    help: "Where prior years' profit is shown on the balance sheet.",
    types: ["EQUITY"],
  },
} as const satisfies Record<string, { label: string; help: string; types: readonly AccountType[] }>;

export type MappingKey = keyof typeof MAPPING_KEYS;

export type AccountMap = Record<MappingKey, string>;
