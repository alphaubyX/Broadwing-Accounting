<?php

namespace App\Services;

use App\Accounting\Money;
use App\Accounting\Totals;
use App\Models\Account;
use App\Models\Tax;
use Illuminate\Validation\ValidationException;

/** Validates submitted line items against the organization's accounts/taxes and computes amounts. */
final class LinePricer
{
    /**
     * @param  array<int, array<string, mixed>>  $input  rows of description, quantity, unit_price, account_id, tax_id
     * @return array{rows: list<array<string, mixed>>, subtotal: string, tax_total: string, total: string}
     */
    public static function price(int $organizationId, array $input, bool $useQuantity, ?string $fallbackDescription = null): array
    {
        $accountIds = Account::where('organization_id', $organizationId)->pluck('id')->map(fn ($id) => (int) $id)->all();
        $taxes = Tax::where('organization_id', $organizationId)->get()->keyBy('id');

        $lines = [];
        foreach ($input as $row) {
            $description = trim((string) ($row['description'] ?? ''));
            $price = trim((string) ($row['unit_price'] ?? ''));
            if ($description === '' && ($price === '' || (float) $price == 0.0)) {
                continue; // blank row
            }
            if ($price !== '' && ! is_numeric(str_replace(',', '', $price))) {
                self::fail('Please check the amounts on the line items.');
            }
            $qty = $useQuantity ? trim((string) ($row['quantity'] ?? '1')) : '1';
            if (! is_numeric($qty)) {
                self::fail('Please check the quantities on the line items.');
            }
            $description = $description !== '' ? $description : (string) $fallbackDescription;
            if ($description === '') {
                self::fail('Every line needs a description.');
            }
            $accountId = (int) ($row['account_id'] ?? 0);
            if (! in_array($accountId, $accountIds, true)) {
                self::fail('Choose an account for every line.');
            }
            $taxId = ($row['tax_id'] ?? '') !== '' ? (int) $row['tax_id'] : null;
            if ($taxId !== null && ! $taxes->has($taxId)) {
                self::fail('Unknown tax selected.');
            }
            $lines[] = [
                'description' => mb_substr($description, 0, 500),
                'quantity' => (float) $qty,
                'unit_price' => (float) str_replace(',', '', $price === '' ? '0' : $price),
                'account_id' => $accountId,
                'tax_id' => $taxId,
            ];
        }
        if (! $lines) {
            self::fail('Add at least one line with an amount.');
        }

        $totals = Totals::document(array_map(fn ($l) => [
            'quantity' => $l['quantity'],
            'unit_price_cents' => Money::toCents($l['unit_price']),
            'tax_rate' => $l['tax_id'] ? $taxes[$l['tax_id']]->rateNumber() : 0,
        ], $lines));
        if ($totals['total_cents'] < 0) {
            self::fail('The total cannot be negative.');
        }

        $rows = [];
        foreach ($lines as $i => $l) {
            $rows[] = $l + [
                'position' => $i,
                'amount' => Money::fromCents($totals['lines'][$i]['amount_cents']),
                'tax_amount' => Money::fromCents($totals['lines'][$i]['tax_cents']),
            ];
        }

        return [
            'rows' => $rows,
            'subtotal' => Money::fromCents($totals['subtotal_cents']),
            'tax_total' => Money::fromCents($totals['tax_cents']),
            'total' => Money::fromCents($totals['total_cents']),
        ];
    }

    private static function fail(string $message): never
    {
        throw ValidationException::withMessages(['lines' => $message]);
    }
}
