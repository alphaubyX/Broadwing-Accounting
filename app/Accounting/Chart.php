<?php

namespace App\Accounting;

/** Account types, detail types and the starter chart of accounts. */
final class Chart
{
    public const TYPES = ['ASSET' => 'Assets', 'LIABILITY' => 'Liabilities', 'EQUITY' => 'Equity', 'INCOME' => 'Income', 'EXPENSE' => 'Expenses'];

    public const SUBTYPES = [
        'CASH_AND_BANK' => 'Cash & bank',
        'ACCOUNTS_RECEIVABLE' => 'Accounts receivable',
        'CURRENT_ASSET' => 'Current asset',
        'FIXED_ASSET' => 'Fixed asset',
        'ACCOUNTS_PAYABLE' => 'Accounts payable',
        'TAX_PAYABLE' => 'Tax payable',
        'CURRENT_LIABILITY' => 'Current liability',
        'LONG_TERM_LIABILITY' => 'Long-term liability',
        'OWNER_EQUITY' => "Owner's equity",
        'RETAINED_EARNINGS' => 'Retained earnings',
        'SALES' => 'Sales',
        'OTHER_INCOME' => 'Other income',
        'COST_OF_SALES' => 'Cost of sales',
        'OPERATING_EXPENSE' => 'Operating expense',
        'OTHER_EXPENSE' => 'Other expense',
    ];

    public const SUBTYPES_BY_TYPE = [
        'ASSET' => ['CASH_AND_BANK', 'ACCOUNTS_RECEIVABLE', 'CURRENT_ASSET', 'FIXED_ASSET'],
        'LIABILITY' => ['ACCOUNTS_PAYABLE', 'TAX_PAYABLE', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'],
        'EQUITY' => ['OWNER_EQUITY', 'RETAINED_EARNINGS'],
        'INCOME' => ['SALES', 'OTHER_INCOME'],
        'EXPENSE' => ['COST_OF_SALES', 'OPERATING_EXPENSE', 'OTHER_EXPENSE'],
    ];

    /** Accounts money can be received into / paid from. */
    public const RECEIVE_INTO = ['CASH_AND_BANK'];

    public const PAY_FROM = ['CASH_AND_BANK', 'CURRENT_LIABILITY'];

    /** Expense categories (and assets you can buy). */
    public const PURCHASE_CATEGORIES = ['COST_OF_SALES', 'OPERATING_EXPENSE', 'OTHER_EXPENSE', 'CURRENT_ASSET', 'FIXED_ASSET'];

    /** [code, name, type, subtype, mapping key|null] */
    public const DEFAULT = [
        ['1000', 'Cash on hand', 'ASSET', 'CASH_AND_BANK', null],
        ['1010', 'Bank account', 'ASSET', 'CASH_AND_BANK', 'DEFAULT_BANK'],
        ['1100', 'Accounts receivable', 'ASSET', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_RECEIVABLE'],
        ['1200', 'Inventory', 'ASSET', 'CURRENT_ASSET', null],
        ['1300', 'Prepaid expenses', 'ASSET', 'CURRENT_ASSET', null],
        ['1500', 'Equipment', 'ASSET', 'FIXED_ASSET', null],
        ['2000', 'Accounts payable', 'LIABILITY', 'ACCOUNTS_PAYABLE', 'ACCOUNTS_PAYABLE'],
        ['2100', 'Sales tax payable', 'LIABILITY', 'TAX_PAYABLE', 'SALES_TAX'],
        ['2200', 'Credit card', 'LIABILITY', 'CURRENT_LIABILITY', null],
        ['2500', 'Loans', 'LIABILITY', 'LONG_TERM_LIABILITY', null],
        ['3000', "Owner's capital", 'EQUITY', 'OWNER_EQUITY', null],
        ['3100', "Owner's drawings", 'EQUITY', 'OWNER_EQUITY', null],
        ['3900', 'Retained earnings', 'EQUITY', 'RETAINED_EARNINGS', 'RETAINED_EARNINGS'],
        ['4000', 'Sales', 'INCOME', 'SALES', 'DEFAULT_INCOME'],
        ['4100', 'Services', 'INCOME', 'SALES', null],
        ['4900', 'Other income', 'INCOME', 'OTHER_INCOME', null],
        ['5000', 'Cost of goods sold', 'EXPENSE', 'COST_OF_SALES', null],
        ['6000', 'General expenses', 'EXPENSE', 'OPERATING_EXPENSE', 'DEFAULT_EXPENSE'],
        ['6100', 'Advertising & marketing', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6200', 'Bank fees', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6300', 'Meals & entertainment', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6400', 'Office supplies', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6500', 'Professional fees', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6600', 'Rent', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6700', 'Software & subscriptions', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6800', 'Travel', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['6900', 'Utilities & telephone', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['7000', 'Salaries & wages', 'EXPENSE', 'OPERATING_EXPENSE', null],
        ['7900', 'Other expenses', 'EXPENSE', 'OTHER_EXPENSE', null],
    ];

    /** Assets and expenses increase with debits; the rest increase with credits. */
    public static function isDebitNormal(string $type): bool
    {
        return $type === 'ASSET' || $type === 'EXPENSE';
    }
}
