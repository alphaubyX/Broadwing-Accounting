<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Temporary site-wide password until Broadwing's central sign-in exists. */
class RequirePassword
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('broadwing.password_hash') && ! $request->session()->get('broadwing_signed_in')) {
            return redirect()->guest(route('login'));
        }

        return $next($request);
    }
}
