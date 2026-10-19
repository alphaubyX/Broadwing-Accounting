<?php

namespace App\Support;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Tax;
use Illuminate\Support\Facades\DB;

/** Lists for form drop-downs. */
final class Options
{
    /** @return array<int, string> id => "code · name" */
    public static function accounts(int $organizationId, ?array $types = null, ?array $subtypes = null): array
    {
        return Account::where('organization_id', $organizationId)->where('is_archived', false)
            ->when($types, fn ($q) => $q->whereIn('type', $types))
            ->when($subtypes, fn ($q) => $q->whereIn('subtype', $subtypes))
            ->orderBy('code')->get()->mapWithKeys(fn (Account $a) => [$a->id => $a->label()])->all();
    }

    /** @return list<array{id: int, label: string, rate: float}> */
    public static function taxes(int $organizationId): array
    {
        return Tax::where('organization_id', $organizationId)->where('is_archived', false)->orderBy('abbreviation')->get()
            ->map(fn (Tax $t) => ['id' => $t->id, 'label' => $t->label(), 'rate' => $t->rateNumber()])->all();
    }

    /** @return array<int, string> */
    public static function contacts(int $organizationId, string $role): array
    {
        return Contact::where('organization_id', $organizationId)->where('is_archived', false)
            ->whereIn('type', [$role, 'BOTH'])->orderBy('name')->pluck('name', 'id')->all();
    }

    public static function mapped(int $organizationId, string $key): ?int
    {
        $id = DB::table('account_mappings')->where('organization_id', $organizationId)->where('key', $key)->value('account_id');

        return $id ? (int) $id : null;
    }

    /** Lines for re-editing: from old() input after a validation error, or from the model. */
    public static function editableLines($lines, bool $withQuantity): array
    {
        return collect($lines)->map(fn ($l) => [
            'description' => $l->description,
            'quantity' => $withQuantity ? qty($l->quantity) : '1',
            'unit_price' => number_format(\App\Accounting\Money::toCents($withQuantity ? $l->unit_price : $l->amount) / 100, 2, '.', ''),
            'account_id' => (string) $l->account_id,
            'tax_id' => (string) ($l->tax_id ?? ''),
        ])->values()->all();
    }
}
