<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Tax;
use App\Support\CurrentOrganization;
use App\Support\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaxController extends Controller
{
    private function find(int $id): Tax
    {
        return Tax::where('organization_id', CurrentOrganization::require()->id)->findOrFail($id);
    }

    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $taxes = Tax::with('account')->where('organization_id', $org->id)->orderBy('abbreviation')->get();

        return view('settings.taxes', [
            'taxes' => $taxes,
            'liabilityAccounts' => Options::accounts($org->id, ['LIABILITY']),
            'defaultTaxAccount' => Options::mapped($org->id, 'SALES_TAX'),
            'editing' => $request->query('edit') ? $taxes->firstWhere('id', (int) $request->query('edit')) : null,
            'creating' => (bool) $request->query('new'),
        ]);
    }

    private function validated(Request $request): array
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'abbreviation' => ['required', 'string', 'max:40'],
            'description' => ['nullable', 'string', 'max:2000'],
            'rate' => ['required', 'numeric', 'between:0,100'],
            'tax_number' => ['nullable', 'string', 'max:255'],
            'account_id' => ['required', 'integer'],
        ], [], ['rate' => 'tax rate']);
        if (! Account::where('organization_id', $org->id)->where('type', 'LIABILITY')->whereKey($data['account_id'])->exists()) {
            throw ValidationException::withMessages(['account_id' => 'Choose a liability account for this tax.']);
        }

        return $data + ['show_tax_number' => $request->boolean('show_tax_number'), 'is_recoverable' => $request->boolean('is_recoverable')];
    }

    public function store(Request $request)
    {
        Tax::create($this->validated($request) + ['organization_id' => CurrentOrganization::require()->id]);

        return redirect()->route('settings.taxes')->with('status', 'Sales tax created.');
    }

    public function update(Request $request, int $tax)
    {
        $this->find($tax)->update($this->validated($request));

        return redirect()->route('settings.taxes')->with('status', 'Sales tax saved.');
    }

    /** Delete an unused tax; a tax already used on transactions is archived instead so history stays intact. */
    public function destroy(int $tax)
    {
        $tax = $this->find($tax);
        $used = DB::table('sale_lines')->where('tax_id', $tax->id)->exists()
            || DB::table('expense_lines')->where('tax_id', $tax->id)->exists()
            || DB::table('purchase_order_lines')->where('tax_id', $tax->id)->exists();
        $used ? $tax->update(['is_archived' => true]) : $tax->delete();

        return back()->with('status', $used ? "{$tax->abbreviation} is used on transactions, so it was archived." : "{$tax->abbreviation} deleted.");
    }

    public function restore(int $tax)
    {
        $this->find($tax)->update(['is_archived' => false]);

        return back()->with('status', 'Sales tax restored.');
    }
}
