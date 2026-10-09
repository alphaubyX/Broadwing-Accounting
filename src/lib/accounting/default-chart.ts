import type { AccountSubtype, AccountType } from "@prisma/client";
import type { MappingKey } from "./mapping";

export interface DefaultAccount {
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  mapping?: MappingKey;
}

/** A small, sensible starter chart. Users can add, rename or archive accounts later. */
export const DEFAULT_CHART: DefaultAccount[] = [
  // Assets
  { code: "1000", name: "Cash on hand", type: "ASSET", subtype: "CASH_AND_BANK" },
  { code: "1010", name: "Bank account", type: "ASSET", subtype: "CASH_AND_BANK", mapping: "DEFAULT_BANK" },
  { code: "1100", name: "Accounts receivable", type: "ASSET", subtype: "ACCOUNTS_RECEIVABLE", mapping: "ACCOUNTS_RECEIVABLE" },
  { code: "1200", name: "Inventory", type: "ASSET", subtype: "CURRENT_ASSET" },
  { code: "1300", name: "Prepaid expenses", type: "ASSET", subtype: "CURRENT_ASSET" },
  { code: "1500", name: "Equipment", type: "ASSET", subtype: "FIXED_ASSET" },
  // Liabilities
  { code: "2000", name: "Accounts payable", type: "LIABILITY", subtype: "ACCOUNTS_PAYABLE", mapping: "ACCOUNTS_PAYABLE" },
  { code: "2100", name: "Sales tax payable", type: "LIABILITY", subtype: "TAX_PAYABLE", mapping: "SALES_TAX" },
  { code: "2200", name: "Credit card", type: "LIABILITY", subtype: "CURRENT_LIABILITY" },
  { code: "2500", name: "Loans", type: "LIABILITY", subtype: "LONG_TERM_LIABILITY" },
  // Equity
  { code: "3000", name: "Owner's capital", type: "EQUITY", subtype: "OWNER_EQUITY" },
  { code: "3100", name: "Owner's drawings", type: "EQUITY", subtype: "OWNER_EQUITY" },
  { code: "3900", name: "Retained earnings", type: "EQUITY", subtype: "RETAINED_EARNINGS", mapping: "RETAINED_EARNINGS" },
  // Income
  { code: "4000", name: "Sales", type: "INCOME", subtype: "SALES", mapping: "DEFAULT_INCOME" },
  { code: "4100", name: "Services", type: "INCOME", subtype: "SALES" },
  { code: "4900", name: "Other income", type: "INCOME", subtype: "OTHER_INCOME" },
  // Expenses
  { code: "5000", name: "Cost of goods sold", type: "EXPENSE", subtype: "COST_OF_SALES" },
  { code: "6000", name: "General expenses", type: "EXPENSE", subtype: "OPERATING_EXPENSE", mapping: "DEFAULT_EXPENSE" },
  { code: "6100", name: "Advertising & marketing", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6200", name: "Bank fees", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6300", name: "Meals & entertainment", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6400", name: "Office supplies", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6500", name: "Professional fees", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6600", name: "Rent", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6700", name: "Software & subscriptions", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6800", name: "Travel", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "6900", name: "Utilities & telephone", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "7000", name: "Salaries & wages", type: "EXPENSE", subtype: "OPERATING_EXPENSE" },
  { code: "7900", name: "Other expenses", type: "EXPENSE", subtype: "OTHER_EXPENSE" },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Assets",
  LIABILITY: "Liabilities",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expenses",
};

export const SUBTYPE_LABELS: Record<AccountSubtype, string> = {
  CASH_AND_BANK: "Cash & bank",
  ACCOUNTS_RECEIVABLE: "Accounts receivable",
  CURRENT_ASSET: "Current asset",
  FIXED_ASSET: "Fixed asset",
  ACCOUNTS_PAYABLE: "Accounts payable",
  TAX_PAYABLE: "Tax payable",
  CURRENT_LIABILITY: "Current liability",
  LONG_TERM_LIABILITY: "Long-term liability",
  OWNER_EQUITY: "Owner's equity",
  RETAINED_EARNINGS: "Retained earnings",
  SALES: "Sales",
  OTHER_INCOME: "Other income",
  COST_OF_SALES: "Cost of sales",
  OPERATING_EXPENSE: "Operating expense",
  OTHER_EXPENSE: "Other expense",
};

export const SUBTYPES_BY_TYPE: Record<AccountType, AccountSubtype[]> = {
  ASSET: ["CASH_AND_BANK", "ACCOUNTS_RECEIVABLE", "CURRENT_ASSET", "FIXED_ASSET"],
  LIABILITY: ["ACCOUNTS_PAYABLE", "TAX_PAYABLE", "CURRENT_LIABILITY", "LONG_TERM_LIABILITY"],
  EQUITY: ["OWNER_EQUITY", "RETAINED_EARNINGS"],
  INCOME: ["SALES", "OTHER_INCOME"],
  EXPENSE: ["COST_OF_SALES", "OPERATING_EXPENSE", "OTHER_EXPENSE"],
};

/** Debit-normal accounts increase with debits; the rest increase with credits. */
export function isDebitNormal(type: AccountType): boolean {
  return type === "ASSET" || type === "EXPENSE";
}
