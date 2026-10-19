<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\OrgUser;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $order = ['OWNER' => 0, 'ADMIN' => 1, 'EDITOR' => 2, 'VIEWER' => 3];
        $users = OrgUser::where('organization_id', $org->id)->get()->sortBy(fn ($u) => [$order[$u->role] ?? 9, $u->email])->values();

        return view('settings.users', [
            'users' => $users,
            'editing' => $request->query('edit') ? $users->firstWhere('id', (int) $request->query('edit')) : null,
            'inviting' => (bool) $request->query('invite'),
        ]);
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(Request $request, int $user)
    {
        return $this->save($request, OrgUser::where('organization_id', CurrentOrganization::require()->id)->findOrFail($user));
    }

    private function save(Request $request, ?OrgUser $user)
    {
        $org = CurrentOrganization::require();
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('org_users')->where('organization_id', $org->id)->ignore($user?->id)],
            'role' => ['nullable', 'in:ADMIN,EDITOR,VIEWER'],
        ], ['email.unique' => 'That person already has access.']);
        // The owner's role is fixed; ownership transfer will come with central Broadwing accounts.
        $role = $user?->role === 'OWNER' ? 'OWNER' : ($data['role'] ?? 'EDITOR');
        $fields = [
            'name' => $data['name'] ?? null,
            'email' => $data['email'],
            'role' => $role,
            'can_send_invoices' => in_array($role, ['OWNER', 'ADMIN'], true) || $request->boolean('can_send_invoices'),
        ];
        $user ? $user->update($fields) : OrgUser::create($fields + ['organization_id' => $org->id, 'status' => 'INVITED']);

        return redirect()->route('settings.users')->with('status', $user ? 'User saved.' : 'Invitation recorded.');
    }

    public function destroy(int $user)
    {
        $u = OrgUser::where('organization_id', CurrentOrganization::require()->id)->findOrFail($user);
        if ($u->role === 'OWNER') {
            return back()->withErrors(['action' => "The owner can't be removed."]);
        }
        $u->delete();

        return back()->with('status', "{$u->email} removed.");
    }
}
