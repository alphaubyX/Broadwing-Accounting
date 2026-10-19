<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Send every request to the installer until the app is configured. */
class EnsureInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('broadwing.installed')) {
            return redirect()->route('install');
        }

        return $next($request);
    }
}
