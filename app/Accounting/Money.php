<?php

namespace App\Accounting;

/**
 * Money is calculated in integer minor units (cents) to avoid floating point
 * drift, and stored in the database as DECIMAL(14,2).
 */
final class Money
{
    public static function toCents(mixed $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }
        $n = is_string($value) ? (float) str_replace(',', '', trim($value)) : (float) $value;

        return is_finite($n) ? (int) round($n * 100) : 0;
    }

    public static function fromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    public static function format(int $cents, string $currency = 'USD'): string
    {
        $decimals = in_array($currency, ['JPY'], true) ? 0 : 2;
        $sign = $cents < 0 ? '-' : '';

        return $sign.$currency.' '.number_format(abs($cents) / 100, $decimals);
    }

    /** Format a stored DECIMAL value. */
    public static function formatAmount(mixed $value, string $currency = 'USD'): string
    {
        return self::format(self::toCents($value), $currency);
    }
}
