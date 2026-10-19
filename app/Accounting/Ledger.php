<?php

namespace App\Accounting;

use App\Models\Expense;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Database side of the ledger: loads documents, builds postings with the pure
 * rules in Posting, and (re)writes the journal entries for a source document.
 * Call inside a DB transaction.
 */
final class Ledger
{
    /** @return array<string, int> mapping key => account id */
    public static function accountMap(int $organizationId): array
    {
        $map = DB::table('account_mappings')->where('organization_id', $organizationId)->pluck('account_id', 'key')->all();
        foreach (Mapping::KEYS as $key => $def) {
            if (empty($map[$key])) {
                throw new RuntimeException("Account mapping \"{$def['label']}\" is not set. Fix it under Settings → Account mapping.");
            }
        }

        return $map;
    }

    private static function write(int $organizationId, string $type, int $sourceId, string $number, $date, ?array $posting): void
    {
        self::delete($organizationId, $type, [$sourceId]);
        if (! $posting) {
            return;
        }
        $entry = JournalEntry::create([
            'organization_id' => $organizationId,
            'date' => $date,
            'memo' => mb_substr($posting['memo'], 0, 500),
            'source_type' => $type,
            'source_id' => $sourceId,
            'source_number' => $number,
        ]);
        foreach ($posting['lines'] as $l) {
            $entry->lines()->create([
                'account_id' => $l['account_id'],
                'debit' => Money::fromCents($l['debit']),
                'credit' => Money::fromCents($l['credit']),
            ]);
        }
    }

    /** @param  int[]  $sourceIds */
    public static function delete(int $organizationId, string $type, array $sourceIds): void
    {
        if ($sourceIds) {
            JournalEntry::where('organization_id', $organizationId)->where('source_type', $type)->whereIn('source_id', $sourceIds)->delete();
        }
    }

    private static function docLines($lines): array
    {
        return $lines->map(fn ($l) => [
            'account_id' => $l->account_id,
            'amount_cents' => Money::toCents($l->amount),
            'tax_cents' => Money::toCents($l->tax_amount),
            'tax_account_id' => $l->tax?->account_id,
            'tax_recoverable' => $l->tax ? (bool) $l->tax->is_recoverable : true,
        ])->all();
    }

    public static function repostSale(Sale $sale): void
    {
        $sale->load(['lines.tax', 'contact']);
        $posting = Posting::sale([
            'number' => $sale->number,
            'counterparty' => $sale->contact?->name,
            'settlement' => $sale->settlement,
            'status' => $sale->status,
            'money_account_id' => $sale->paid_into_account_id,
            'lines' => self::docLines($sale->lines),
        ], self::accountMap($sale->organization_id));
        self::write($sale->organization_id, 'SALE', $sale->id, $sale->number, $sale->date, $posting);
    }

    public static function repostExpense(Expense $expense): void
    {
        $expense->load(['lines.tax', 'contact']);
        $posting = Posting::expense([
            'number' => $expense->number,
            'counterparty' => $expense->payee(),
            'settlement' => $expense->settlement,
            'status' => $expense->status,
            'money_account_id' => $expense->paid_from_account_id,
            'lines' => self::docLines($expense->lines),
        ], self::accountMap($expense->organization_id));
        self::write($expense->organization_id, 'EXPENSE', $expense->id, $expense->number, $expense->date, $posting);
    }

    public static function repostPayment(Payment $payment): void
    {
        $payment->load(['sale', 'expense']);
        $posting = Posting::payment([
            'number' => $payment->number,
            'amount_cents' => Money::toCents($payment->amount),
            'bank_account_id' => $payment->account_id,
            'kind' => $payment->sale_id ? 'SALE' : 'EXPENSE',
            'document_number' => $payment->sale?->number ?? $payment->expense?->number ?? '',
        ], self::accountMap($payment->organization_id));
        self::write($payment->organization_id, 'PAYMENT', $payment->id, $payment->number, $payment->date, $posting);
    }

    /** Recalculate amount_paid and status of a sale/expense from its payments. */
    public static function syncPaymentStatus(Sale|Expense $doc): void
    {
        $doc->refresh();
        if (in_array($doc->status, ['DRAFT', 'VOID'], true)) {
            return;
        }
        $total = Money::toCents($doc->total);
        $paid = $doc->settlement === 'PAID_NOW'
            ? $total
            : $doc->payments()->get()->sum(fn ($p) => Money::toCents($p->amount));
        $doc->update(['amount_paid' => Money::fromCents($paid), 'status' => Totals::paymentStatus($total, $paid)]);
    }
}
