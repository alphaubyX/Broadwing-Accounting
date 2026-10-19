<?php

namespace App\Http\Controllers;

use App\Accounting\Fiscal;
use App\Services\OrganizationSetup;
use App\Support\Currencies;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SetupController extends Controller
{
    public function show()
    {
        if (CurrentOrganization::get()) {
            return redirect()->route('dashboard');
        }

        return view('setup');
    }

    public function store(Request $request)
    {
        abort_if((bool) CurrentOrganization::get(), 403, 'An organization is already set up.');

        $data = $request->validate([
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', Rule::in(array_keys(Currencies::ALL))],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:255'],
            'fiscal_year_end_month' => ['required', 'integer', 'between:1,12'],
            'fiscal_year_end_day' => ['required', 'integer', 'between:1,31'],
            'tax_name' => ['nullable', 'string', 'max:255'],
            'tax_rate' => ['nullable', 'numeric', 'between:0,100'],
        ]);
        if ($data['fiscal_year_end_day'] > Fiscal::daysInMonth((int) $data['fiscal_year_end_month'])) {
            return back()->withInput()->withErrors(['fiscal_year_end_day' => 'Choose a valid day for that month.']);
        }

        OrganizationSetup::create(
            collect($data)->only(['name', 'legal_name', 'currency', 'email', 'phone', 'address_line1', 'city', 'country', 'tax_number', 'fiscal_year_end_month', 'fiscal_year_end_day'])->all(),
            ['name' => $data['owner_name'] ?? null, 'email' => $data['owner_email']],
            ['name' => $data['tax_name'] ?? null, 'abbreviation' => $data['tax_name'] ?? null, 'rate' => $data['tax_rate'] ?? null],
        );
        CurrentOrganization::forget();

        return redirect()->route('settings.profile')->with('welcome', true);
    }
}
