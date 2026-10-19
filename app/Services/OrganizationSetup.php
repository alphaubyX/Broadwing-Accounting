<?php

namespace App\Services;

use App\Accounting\Chart;
use App\Models\Account;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;

final class OrganizationSetup
{
    /** Create an organization with branding, owner, starter chart of accounts, mappings and an optional tax. */
    public static function create(array $org, array $owner, ?array $tax = null): Organization
    {
        return DB::transaction(function () use ($org, $owner, $tax) {
            $organization = Organization::create($org);
            $organization->branding()->create([]);
            $organization->users()->create([
                'name' => $owner['name'] ?? null,
                'email' => strtolower($owner['email']),
                'role' => 'OWNER',
                'can_send_invoices' => true,
                'status' => 'ACTIVE',
            ]);

            $byCode = [];
            foreach (Chart::DEFAULT as [$code, $name, $type, $subtype, $mapping]) {
                $account = Account::create([
                    'organization_id' => $organization->id,
                    'code' => $code, 'name' => $name, 'type' => $type, 'subtype' => $subtype,
                    'is_system' => $mapping !== null || in_array($subtype, ['ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE'], true),
                ]);
                $byCode[$code] = $account->id;
                if ($mapping) {
                    DB::table('account_mappings')->insert(['organization_id' => $organization->id, 'key' => $mapping, 'account_id' => $account->id]);
                }
            }

            if ($tax && ! empty($tax['name']) && ! empty($tax['rate'])) {
                $organization->taxes()->create([
                    'name' => $tax['name'],
                    'abbreviation' => $tax['abbreviation'] ?? $tax['name'],
                    'rate' => $tax['rate'],
                    'tax_number' => $org['tax_number'] ?? null,
                    'show_tax_number' => ! empty($org['tax_number']),
                    'account_id' => $byCode['2100'],
                ]);
            }

            return $organization;
        });
    }
}
