<?php

namespace App\Support;

use App\Models\Contact;
use App\Models\Organization;
use App\Models\PurchaseOrder;
use App\Models\Sale;

/**
 * Builds the data for an invoice / purchase-order document. The same
 * structure feeds the on-screen view, the print/PDF page and the live preview
 * in Settings → Invoice customization (resources/views/documents/render.blade.php).
 */
final class Documents
{
    public static function orgBlock(Organization $org, ?string $logoUrl = null): array
    {
        return [
            'name' => $org->legal_name ?: $org->name,
            'address_lines' => $org->addressLines(),
            'contact_lines' => $org->contactLines(),
            'tax_number' => $org->tax_number,
            'tax_number_label' => $org->tax_number_label,
            'logo_url' => $logoUrl ?? $org->logoUrl(),
        ];
    }

    private static function party(?Contact $c): ?array
    {
        if (! $c) {
            return null;
        }

        return ['name' => $c->name, 'lines' => array_values(array_filter([$c->address, $c->email, $c->phone, $c->tax_number ? "Tax no: {$c->tax_number}" : null]))];
    }

    /** One total line per tax, e.g. "VAT 5% (100123456700003)", like a real tax invoice. */
    private static function taxTotals($lines, string $currency): array
    {
        $byTax = [];
        foreach ($lines as $l) {
            if (! $l->tax) {
                continue;
            }
            $byTax[$l->tax->id] ??= ['tax' => $l->tax, 'cents' => 0];
            $byTax[$l->tax->id]['cents'] += cents($l->tax_amount);
        }

        return array_values(array_map(fn ($t) => [
            'label' => $t['tax']->abbreviation.' '.qty($t['tax']->rate).'%'.($t['tax']->show_tax_number && $t['tax']->tax_number ? " ({$t['tax']->tax_number})" : ''),
            'value' => money($t['cents'], $currency),
        ], $byTax));
    }

    private static function lines($lines, string $currency): array
    {
        return $lines->map(fn ($l) => [
            'description' => $l->description,
            'quantity' => qty($l->quantity),
            'unit_price' => amount($l->unit_price, $currency),
            'amount' => amount($l->amount, $currency),
        ])->all();
    }

    public static function sale(Organization $org, Sale $sale): array
    {
        $c = $org->currency;
        $brand = $org->brand();
        $due = cents($sale->total) - cents($sale->amount_paid);
        $totals = [['label' => 'Subtotal', 'value' => amount($sale->subtotal, $c)], ...self::taxTotals($sale->lines, $c), ['label' => 'Total', 'value' => amount($sale->total, $c), 'strong' => true]];
        if (cents($sale->amount_paid) > 0) {
            $totals[] = ['label' => 'Paid', 'value' => amount($sale->amount_paid, $c)];
            $totals[] = ['label' => 'Amount due', 'value' => money($due, $c), 'strong' => true];
        }

        return [
            'org' => self::orgBlock($org),
            'style' => $brand->style(),
            'title' => $brand->invoice_title,
            'number' => $sale->number,
            'meta' => array_values(array_filter([
                ['label' => 'Date', 'value' => fmt_date($sale->date)],
                $sale->due_date ? ['label' => 'Due date', 'value' => fmt_date($sale->due_date)] : null,
                $sale->reference ? ['label' => 'Reference', 'value' => $sale->reference] : null,
            ])),
            'highlight' => ['label' => "Amount due ({$c})", 'value' => money($due, $c)],
            'party_heading' => 'Bill to',
            'party' => self::party($sale->contact),
            'lines' => self::lines($sale->lines, $c),
            'totals' => $totals,
            'notes' => $sale->notes,
            'footer' => $brand->invoice_footer,
        ];
    }

    public static function purchaseOrder(Organization $org, PurchaseOrder $po): array
    {
        $c = $org->currency;
        $brand = $org->brand();

        return [
            'org' => self::orgBlock($org),
            'style' => $brand->style(),
            'title' => $brand->po_title,
            'number' => $po->number,
            'meta' => array_values(array_filter([
                ['label' => 'Date', 'value' => fmt_date($po->date)],
                $po->expected_date ? ['label' => 'Delivery by', 'value' => fmt_date($po->expected_date)] : null,
                $po->reference ? ['label' => 'Reference', 'value' => $po->reference] : null,
            ])),
            'highlight' => ['label' => "Order total ({$c})", 'value' => amount($po->total, $c)],
            'party_heading' => 'Vendor',
            'party' => self::party($po->contact),
            'lines' => self::lines($po->lines, $c),
            'totals' => [['label' => 'Subtotal', 'value' => amount($po->subtotal, $c)], ...self::taxTotals($po->lines, $c), ['label' => 'Total', 'value' => amount($po->total, $c), 'strong' => true]],
            'notes' => $po->notes,
            'footer' => $brand->po_footer,
        ];
    }

    /** Sample document for the invoice-customization preview. */
    public static function sample(Organization $org, array $style, array $texts, string $kind): array
    {
        $c = $org->currency;
        $m = fn (int $cents) => money($cents, $c);
        $invoice = $kind !== 'po';

        return [
            'org' => self::orgBlock($org),
            'style' => $style,
            'title' => $invoice ? $texts['invoice_title'] : $texts['po_title'],
            'number' => ($invoice ? $texts['invoice_prefix'] : $texts['po_prefix']).'0072',
            'meta' => [['label' => 'Date', 'value' => '01 Jan 2026'], ['label' => $invoice ? 'Payment due' : 'Delivery by', 'value' => '31 Jan 2026']],
            'highlight' => ['label' => ($invoice ? 'Amount due' : 'Order total')." ({$c})", 'value' => $m(183750)],
            'party_heading' => $invoice ? 'Bill to' : 'Vendor',
            'party' => ['name' => $invoice ? 'Sarah and Daniel Robinson' : 'Sample Supplier Co.', 'lines' => ['823 Main Street, Unit B', 'sarah@example.com']],
            'lines' => [
                ['description' => 'Location scouting', 'quantity' => '1', 'unit_price' => $m(20000), 'amount' => $m(20000)],
                ['description' => 'Photography and editing', 'quantity' => '10', 'unit_price' => $m(15000), 'amount' => $m(150000)],
                ['description' => 'Print album', 'quantity' => '1', 'unit_price' => $m(5000), 'amount' => $m(5000)],
            ],
            'totals' => [['label' => 'Subtotal', 'value' => $m(175000)], ['label' => 'VAT 5%', 'value' => $m(8750)], ['label' => 'Total', 'value' => $m(183750), 'strong' => true]],
            'notes' => $invoice ? $texts['invoice_notes'] : $texts['po_notes'],
            'footer' => $invoice ? $texts['invoice_footer'] : $texts['po_footer'],
        ];
    }
}
