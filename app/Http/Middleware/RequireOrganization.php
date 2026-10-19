<?php

namespace App\Http\Middleware;

use App\Support\CurrentOrganization;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

/** The main app needs a business; until one exists, show the setup wizard. */
class RequireOrganization
{
    public function handle(Request $request, Closure $next): Response
    {
        $org = CurrentOrganization::get();
        if (! $org) {
            return redirect()->route('setup');
        }
        View::share('org', $org);

        return $next($request);
    }
}
