<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function show(Request $request)
    {
        if (! config('broadwing.password_hash') || $request->session()->get('broadwing_signed_in')) {
            return redirect()->route('dashboard');
        }

        return view('login');
    }

    public function login(Request $request)
    {
        $request->validate(['password' => ['required', 'string']]);
        $key = 'login:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors(['password' => 'Too many attempts. Try again in '.RateLimiter::availableIn($key).' seconds.']);
        }
        if (! Hash::check($request->input('password'), (string) config('broadwing.password_hash'))) {
            RateLimiter::hit($key, 60);

            return back()->withErrors(['password' => 'That password is not correct.']);
        }
        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put('broadwing_signed_in', true);

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
