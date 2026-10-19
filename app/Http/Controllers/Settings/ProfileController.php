<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function edit()
    {
        return view('settings.profile');
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:255'],
            'tax_number_label' => ['nullable', 'string', 'max:255'],
        ]);
        $data['tax_number_label'] = $data['tax_number_label'] ?: 'Tax number';
        CurrentOrganization::require()->update($data);

        return back()->with('status', 'Saved.');
    }
}
