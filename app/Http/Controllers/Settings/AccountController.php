<?php

namespace App\Http\Controllers\Settings;

use App\Accounting\Chart;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $accounts = Account::withCount('mappings')->where('organization_id', $org->id)->orderBy('is_archived')->orderBy('code')->get();

        return view('settings.accounts', [
            'accounts' => $accounts,
            'editing' => $request->query('edit') ? $accounts->firstWhere('id', (int) $request->query('edit')) : null,
            'adding' => (bool) $request->query('add'),
        ]);
    }

    private function validated(Request $request, ?Account $account): array
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('accounts')->where('organization_id', $org->id)->ignore($account?->id)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(array_keys(Chart::TYPES))],
            'subtype' => ['required', 'string'],
            'description' => ['nullable', 'string', 'max:2000'],
        ], ['code.unique' => 'That code is already used by another account.']);
        if (! in_array($data['subtype'], Chart::SUBTYPES_BY_TYPE[$data['type']], true)) {
            throw ValidationException::withMessages(['subtype' => 'Choose a detail type that matches the account type.']);
        }
        if ($account && $account->type !== $data['type'] && ($account->is_system || $account->journalLines()->exists())) {
            throw ValidationException::withMessages(['type' => 'The type of an account that is in use cannot be changed.']);
        }

        return $data;
    }

    public function store(Request $request)
    {
        Account::create($this->validated($request, null) + ['organization_id' => CurrentOrganization::require()->id]);

        return redirect()->route('settings.accounts')->with('status', 'Account added.');
    }

    public function update(Request $request, int $account)
    {
        $account = Account::where('organization_id', CurrentOrganization::require()->id)->findOrFail($account);
        $account->update($this->validated($request, $account));

        return redirect()->route('settings.accounts')->with('status', 'Account saved.');
    }

    public function archive(int $account)
    {
        $account = Account::where('organization_id', CurrentOrganization::require()->id)->findOrFail($account);
        if (! $account->is_archived && $account->mappings()->exists()) {
            return back()->withErrors(['action' => 'This account is used in Account mapping. Change the mapping first.']);
        }
        $account->update(['is_archived' => ! $account->is_archived]);

        return back()->with('status', $account->is_archived ? 'Account archived.' : 'Account restored.');
    }
}
