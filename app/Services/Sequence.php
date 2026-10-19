<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class Sequence
{
    /** Allocate the next unique, human-readable transaction number, e.g. INV-0007. Call inside a transaction. */
    public static function next(int $organizationId, string $key, string $prefix): string
    {
        DB::table('sequences')->insertOrIgnore(['organization_id' => $organizationId, 'key' => $key, 'next' => 1]);
        $row = DB::table('sequences')->where('organization_id', $organizationId)->where('key', $key)->lockForUpdate()->first();
        DB::table('sequences')->where('organization_id', $organizationId)->where('key', $key)->update(['next' => $row->next + 1]);

        return $prefix.str_pad((string) $row->next, 4, '0', STR_PAD_LEFT);
    }
}
