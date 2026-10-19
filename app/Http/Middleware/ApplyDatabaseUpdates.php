<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * After uploading a new version, apply its database updates on the first
 * request (no terminal needed). A marker file per set of migrations keeps this
 * to a single cheap file check on every other request.
 */
class ApplyDatabaseUpdates
{
    public function handle(Request $request, Closure $next): Response
    {
        $files = glob(database_path('migrations/*.php')) ?: [];
        $marker = storage_path('framework/schema-'.md5(implode('|', array_map('basename', $files))).'.ok');

        if (! file_exists($marker)) {
            $lock = fopen(storage_path('framework/schema.lock'), 'c');
            if ($lock && flock($lock, LOCK_EX)) {
                if (! file_exists($marker)) {
                    Artisan::call('migrate', ['--force' => true]);
                    Log::info('Database updated: '.trim(Artisan::output()));
                    foreach (glob(storage_path('framework/schema-*.ok')) ?: [] as $old) {
                        @unlink($old);
                    }
                    file_put_contents($marker, date('c'));
                }
                flock($lock, LOCK_UN);
            }
        }

        return $next($request);
    }
}
