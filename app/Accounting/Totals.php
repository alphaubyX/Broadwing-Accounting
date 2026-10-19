<?php

namespace App\Accounting;

/** Pure document maths. All amounts are integer cents; prices are tax-exclusive. */
final class Totals
{
    /**
     * @param  array{quantity?: float|int, unit_price_cents: int, tax_rate?: float|int|null}  $line
     * @return array{amount_cents: int, tax_cents: int}
     */
    public static function line(array $line): array
    {
        $qty = $line['quantity'] ?? 1;
        $amount = (int) round($qty * $line['unit_price_cents']);
        $rate = $line['tax_rate'] ?? 0;
        $tax = $rate ? (int) round($amount * $rate / 100) : 0;

        return ['amount_cents' => $amount, 'tax_cents' => $tax];
    }

    /**
     * @param  list<array{quantity?: float|int, unit_price_cents: int, tax_rate?: float|int|null}>  $lines
     * @return array{lines: list<array{amount_cents: int, tax_cents: int}>, subtotal_cents: int, tax_cents: int, total_cents: int}
     */
    public static function document(array $lines): array
    {
        $results = array_map([self::class, 'line'], $lines);
        $subtotal = array_sum(array_column($results, 'amount_cents'));
        $tax = array_sum(array_column($results, 'tax_cents'));

        return ['lines' => $results, 'subtotal_cents' => $subtotal, 'tax_cents' => $tax, 'total_cents' => $subtotal + $tax];
    }

    public static function paymentStatus(int $totalCents, int $paidCents): string
    {
        if ($paidCents >= $totalCents) {
            return 'PAID';
        }

        return $paidCents > 0 ? 'PARTIAL' : 'UNPAID';
    }
}
