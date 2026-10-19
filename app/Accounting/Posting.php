<?php

namespace App\Accounting;

use RuntimeException;

/**
 * Turns business documents into balanced double-entry journal postings.
 * Pure functions: no database access, so the rules are easy to read and test.
 *
 * A document is ['number', 'counterparty', 'settlement' (PAID_NOW|ON_TERMS),
 * 'status', 'money_account_id', 'lines' => [['account_id', 'amount_cents',
 * 'tax_cents', 'tax_account_id', 'tax_recoverable']]].
 * A posting is ['memo' => string, 'lines' => [['account_id', 'debit', 'credit']]] in cents.
 */
final class Posting
{
    /**
     * Sale
     *   ON_TERMS:  Dr Accounts receivable / Cr Income (per line) / Cr Sales tax
     *   PAID_NOW:  Dr Bank                / Cr Income (per line) / Cr Sales tax
     * Drafts and voided sales are not posted.
     */
    public static function sale(array $sale, array $map): ?array
    {
        if (in_array($sale['status'], ['DRAFT', 'VOID'], true)) {
            return null;
        }
        $debitAccount = $sale['settlement'] === 'PAID_NOW'
            ? ($sale['money_account_id'] ?? $map['DEFAULT_BANK'])
            : $map['ACCOUNTS_RECEIVABLE'];

        $lines = [['account_id' => $debitAccount, 'debit' => self::total($sale['lines']), 'credit' => 0]];
        foreach ($sale['lines'] as $l) {
            $lines[] = ['account_id' => $l['account_id'], 'debit' => 0, 'credit' => $l['amount_cents']];
            if ($l['tax_cents']) {
                $lines[] = ['account_id' => $l['tax_account_id'] ?? $map['SALES_TAX'], 'debit' => 0, 'credit' => $l['tax_cents']];
            }
        }

        return self::finalize(self::memo('Sale', $sale), $lines);
    }

    /**
     * Expense (purchases and expenses share one flow)
     *   PAID_NOW:  Dr Expense category (per line) / Dr Tax / Cr Bank or card
     *   ON_TERMS:  Dr Expense category (per line) / Dr Tax / Cr Accounts payable
     * Recoverable tax is debited to the tax account (input tax you claim back);
     * non-recoverable tax is added to the expense category as part of the cost.
     */
    public static function expense(array $expense, array $map): ?array
    {
        if (in_array($expense['status'], ['DRAFT', 'VOID'], true)) {
            return null;
        }
        $creditAccount = $expense['settlement'] === 'PAID_NOW'
            ? ($expense['money_account_id'] ?? $map['DEFAULT_BANK'])
            : $map['ACCOUNTS_PAYABLE'];

        $lines = [];
        foreach ($expense['lines'] as $l) {
            $lines[] = ['account_id' => $l['account_id'], 'debit' => $l['amount_cents'], 'credit' => 0];
            if ($l['tax_cents']) {
                $taxAccount = ($l['tax_recoverable'] ?? true) === false ? $l['account_id'] : ($l['tax_account_id'] ?? $map['SALES_TAX']);
                $lines[] = ['account_id' => $taxAccount, 'debit' => $l['tax_cents'], 'credit' => 0];
            }
        }
        $lines[] = ['account_id' => $creditAccount, 'debit' => 0, 'credit' => self::total($expense['lines'])];

        return self::finalize(self::memo('Expense', $expense), $lines);
    }

    /**
     * Payment against a document on terms
     *   Customer pays a sale:   Dr Bank             / Cr Accounts receivable
     *   We pay an expense/bill: Dr Accounts payable / Cr Bank
     */
    public static function payment(array $payment, array $map): array
    {
        $amount = $payment['amount_cents'];
        $lines = $payment['kind'] === 'SALE'
            ? [
                ['account_id' => $payment['bank_account_id'], 'debit' => $amount, 'credit' => 0],
                ['account_id' => $map['ACCOUNTS_RECEIVABLE'], 'debit' => 0, 'credit' => $amount],
            ]
            : [
                ['account_id' => $map['ACCOUNTS_PAYABLE'], 'debit' => $amount, 'credit' => 0],
                ['account_id' => $payment['bank_account_id'], 'debit' => 0, 'credit' => $amount],
            ];
        $verb = $payment['kind'] === 'SALE' ? 'received for' : 'made for';

        return self::finalize("Payment {$payment['number']} {$verb} {$payment['document_number']}", $lines);
    }

    private static function total(array $lines): int
    {
        return array_sum(array_map(fn ($l) => $l['amount_cents'] + $l['tax_cents'], $lines));
    }

    private static function memo(string $kind, array $doc): string
    {
        return ! empty($doc['counterparty']) ? "{$kind} {$doc['number']} — {$doc['counterparty']}" : "{$kind} {$doc['number']}";
    }

    /** Merge lines per account and side, drop zero lines, and check debits = credits. */
    private static function finalize(string $memo, array $raw): array
    {
        $merged = [];
        foreach ($raw as $l) {
            $key = $l['account_id'].':'.($l['debit'] ? 'D' : 'C');
            if (isset($merged[$key])) {
                $merged[$key]['debit'] += $l['debit'];
                $merged[$key]['credit'] += $l['credit'];
            } else {
                $merged[$key] = $l;
            }
        }
        $lines = array_values(array_filter($merged, fn ($l) => $l['debit'] !== 0 || $l['credit'] !== 0));
        $dr = array_sum(array_column($lines, 'debit'));
        $cr = array_sum(array_column($lines, 'credit'));
        if ($dr !== $cr) {
            throw new RuntimeException("Unbalanced posting \"{$memo}\": Dr {$dr} ≠ Cr {$cr}");
        }

        return ['memo' => $memo, 'lines' => $lines];
    }
}
