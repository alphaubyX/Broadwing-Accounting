<?php

namespace App\Http\Controllers\Settings;

use App\Accounting\Fiscal;
use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Support\Currencies;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DatesController extends Controller
{
    /** Currency can only change while the books are empty, as amounts are not converted. */
    private function locked(int $orgId): bool
    {
        return JournalEntry::where('organization_id', $orgId)->exists();
    }

    public function edit()
    {
        $org = CurrentOrganization::require();

        return view('settings.dates', [
            'locked' => $this->locked($org->id),
            'fy' => Fiscal::year(today()->toDateString(), $org->fiscal_year_end_month, $org->fiscal_year_end_day),
        ]);
    }

    public function update(Request $request)
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'fiscal_year_end_month' => ['required', 'integer', 'between:1,12'],
            'fiscal_year_end_day' => ['required', 'integer', 'between:1,31'],
            'currency' => ['required', Rule::in(array_keys(Currencies::ALL))],
        ]);
        if ($data['fiscal_year_end_day'] > Fiscal::daysInMonth((int) $data['fiscal_year_end_month'])) {
            return back()->withErrors(['fiscal_year_end_day' => 'Choose a valid day for that month.']);
        }
        if ($data['currency'] !== $org->currency && $this->locked($org->id)) {
            return back()->withErrors(['currency' => "The business currency can't be changed once transactions have been recorded."]);
        }
        $org->update($data);

        return back()->with('status', 'Saved.');
    }
}
