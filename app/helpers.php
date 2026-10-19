<?php

use App\Accounting\Money;
use Carbon\CarbonInterface;

if (! function_exists('money')) {
    /** Format integer cents. */
    function money(int $cents, ?string $currency = null): string
    {
        return Money::format($cents, $currency ?? (\App\Support\CurrentOrganization::get()?->currency ?? 'USD'));
    }
}

if (! function_exists('amount')) {
    /** Format a stored DECIMAL value. */
    function amount(mixed $value, ?string $currency = null): string
    {
        return money(Money::toCents($value), $currency);
    }
}

if (! function_exists('cents')) {
    function cents(mixed $value): int
    {
        return Money::toCents($value);
    }
}

if (! function_exists('fmt_date')) {
    function fmt_date(CarbonInterface|string|null $date): string
    {
        if (! $date) {
            return '—';
        }

        return ($date instanceof CarbonInterface ? $date : \Illuminate\Support\Carbon::parse($date))->format('d M Y');
    }
}

if (! function_exists('display_status')) {
    /** OVERDUE for unpaid documents past their due date. */
    function display_status(string $status, CarbonInterface|null $dueDate): string
    {
        if (in_array($status, ['UNPAID', 'PARTIAL'], true) && $dueDate && $dueDate->lt(today())) {
            return 'OVERDUE';
        }

        return $status;
    }
}

if (! function_exists('qty')) {
    function qty(mixed $value): string
    {
        return rtrim(rtrim(number_format((float) $value, 4, '.', ''), '0'), '.');
    }
}
