<?php

namespace App\Http\Controllers\Settings;

use App\Accounting\Mapping;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MappingController extends Controller
{
    public function edit()
    {
        $org = CurrentOrganization::require();

        return view('settings.mapping', [
            'accounts' => Account::where('organization_id', $org->id)->where('is_archived', false)->orderBy('code')->get(),
            'current' => DB::table('account_mappings')->where('organization_id', $org->id)->pluck('account_id', 'key')->all(),
        ]);
    }

    public function update(Request $request)
    {
        $org = CurrentOrganization::require();
        $accounts = Account::where('organization_id', $org->id)->where('is_archived', false)->get()->keyBy('id');
        $rows = [];
        foreach (Mapping::KEYS as $key => $def) {
            $account = $accounts->get((int) $request->input($key));
            if (! $account || ! in_array($account->type, $def['types'], true)) {
                throw ValidationException::withMessages([$key => "Choose a valid account for \"{$def['label']}\"."]);
            }
            $rows[] = ['organization_id' => $org->id, 'key' => $key, 'account_id' => $account->id];
        }
        DB::transaction(function () use ($rows) {
            foreach ($rows as $r) {
                DB::table('account_mappings')->updateOrInsert(['organization_id' => $r['organization_id'], 'key' => $r['key']], ['account_id' => $r['account_id']]);
            }
        });

        return back()->with('status', 'Saved.');
    }
}
