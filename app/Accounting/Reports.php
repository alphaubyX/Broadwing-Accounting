<?php

namespace App\Accounting;

use App\Models\Account;
use Illuminate\Support\Facades\DB;

final class Reports
{
    /**
     * Sum journal lines per account for a date range (inclusive).
     *
     * @return list<array{account: Account, debit: int, credit: int, balance: int}>
     *                                                                              balance is in the account's natural direction (positive = normal)
     */
    public static function balances(int $organizationId, ?string $from = null, ?string $to = null): array
    {
        $sums = DB::table('journal_lines')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
            ->where('journal_entries.organization_id', $organizationId)
            ->when($from, fn ($q) => $q->where('journal_entries.date', '>=', $from))
            ->when($to, fn ($q) => $q->where('journal_entries.date', '<=', $to))
            ->groupBy('journal_lines.account_id')
            ->select('journal_lines.account_id', DB::raw('SUM(debit) as debit'), DB::raw('SUM(credit) as credit'))
            ->get()->keyBy('account_id');

        return Account::where('organization_id', $organizationId)->orderBy('code')->get()->map(function (Account $a) use ($sums) {
            $s = $sums->get($a->id);
            $debit = Money::toCents($s->debit ?? 0);
            $credit = Money::toCents($s->credit ?? 0);
            $net = $debit - $credit;

            return ['account' => $a, 'debit' => $debit, 'credit' => $credit, 'balance' => Chart::isDebitNormal($a->type) ? $net : -$net];
        })->all();
    }

    private static function pick(array $rows, string $type, ?array $subtypes = null): array
    {
        return array_values(array_filter($rows, fn ($r) => $r['account']->type === $type
            && ($subtypes === null || in_array($r['account']->subtype, $subtypes, true))
            && ($r['debit'] !== 0 || $r['credit'] !== 0)));
    }

    private static function sum(array $rows): int
    {
        return array_sum(array_column($rows, 'balance'));
    }

    public static function profitAndLoss(int $organizationId, string $from, string $to): array
    {
        $rows = self::balances($organizationId, $from, $to);
        $income = self::pick($rows, 'INCOME');
        $costOfSales = self::pick($rows, 'EXPENSE', ['COST_OF_SALES']);
        $expenses = self::pick($rows, 'EXPENSE', ['OPERATING_EXPENSE', 'OTHER_EXPENSE']);
        $gross = self::sum($income) - self::sum($costOfSales);

        return [
            'income' => $income, 'income_total' => self::sum($income),
            'cost_of_sales' => $costOfSales, 'cost_of_sales_total' => self::sum($costOfSales),
            'gross_profit' => $gross,
            'expenses' => $expenses, 'expense_total' => self::sum($expenses),
            'net_profit' => $gross - self::sum($expenses),
        ];
    }

    public static function balanceSheet(int $organizationId, string $asOf): array
    {
        $rows = self::balances($organizationId, null, $asOf);
        $assets = self::pick($rows, 'ASSET');
        $liabilities = self::pick($rows, 'LIABILITY');
        $equity = self::pick($rows, 'EQUITY');
        // No year-end closing entries yet: accumulated profit is shown as one equity line.
        $earnings = self::sum(self::pick($rows, 'INCOME')) - self::sum(self::pick($rows, 'EXPENSE'));

        return [
            'assets' => $assets, 'asset_total' => self::sum($assets),
            'liabilities' => $liabilities, 'liability_total' => self::sum($liabilities),
            'equity' => $equity, 'earnings' => $earnings, 'equity_total' => self::sum($equity) + $earnings,
        ];
    }

    public static function trialBalance(int $organizationId, string $asOf): array
    {
        $lines = [];
        foreach (self::balances($organizationId, null, $asOf) as $r) {
            if ($r['debit'] === 0 && $r['credit'] === 0) {
                continue;
            }
            $net = $r['debit'] - $r['credit'];
            $lines[] = ['account' => $r['account'], 'debit' => max($net, 0), 'credit' => max(-$net, 0)];
        }

        return ['lines' => $lines, 'debit_total' => array_sum(array_column($lines, 'debit')), 'credit_total' => array_sum(array_column($lines, 'credit'))];
    }
}
