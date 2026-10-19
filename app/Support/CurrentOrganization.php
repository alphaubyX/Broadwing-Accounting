<?php

namespace App\Support;

use App\Models\Organization;

/**
 * Single-organization mode: the app works with the first organization. When
 * Broadwing's central sign-in arrives, this is the one place that will resolve
 * the organization from the signed-in user instead.
 */
final class CurrentOrganization
{
    private static ?Organization $org = null;

    public static function get(): ?Organization
    {
        return self::$org ??= Organization::with('branding')->orderBy('id')->first();
    }

    public static function require(): Organization
    {
        $org = self::get();
        abort_if(! $org, 404);

        return $org;
    }

    public static function forget(): void
    {
        self::$org = null;
    }
}
