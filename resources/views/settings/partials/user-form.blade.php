@php $isOwner = $user?->role === 'OWNER'; $role = old('role', $user?->role ?? 'EDITOR'); @endphp
<form method="POST" action="{{ $user ? route('settings.users.update', $user) : route('settings.users.store') }}" class="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5" x-data="{ role: @js($role) }">
    @csrf
    @if ($user) @method('PUT') @endif
    <div class="grid gap-4 sm:grid-cols-2">
        <x-field label="Name"><input name="name" value="{{ old('name', $user?->name) }}" class="input" placeholder="Optional"></x-field>
        <x-field label="Email" name="email"><input type="email" name="email" value="{{ old('email', $user?->email) }}" class="input" required></x-field>
    </div>
    @if ($isOwner)
        <p class="text-sm text-slate-600">This is the owner of the business. The owner always has full access.</p>
    @else
        <fieldset>
            <legend class="label">Access</legend>
            <div class="grid gap-2 sm:grid-cols-3">
                @foreach (['ADMIN', 'EDITOR', 'VIEWER'] as $r)
                    <label class="cursor-pointer rounded-lg border bg-white p-3 text-sm" :class="role === '{{ $r }}' ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'">
                        <input type="radio" name="role" value="{{ $r }}" x-model="role" class="sr-only">
                        <div class="font-medium text-slate-900">{{ \App\Models\OrgUser::ROLES[$r]['label'] }}</div>
                        <div class="mt-0.5 text-xs text-slate-500">{{ \App\Models\OrgUser::ROLES[$r]['help'] }}</div>
                    </label>
                @endforeach
            </div>
        </fieldset>
        <label class="flex items-center gap-2 text-sm text-slate-700" x-show="role === 'EDITOR'">
            <input type="checkbox" name="can_send_invoices" value="1" @checked(old('can_send_invoices', $user?->can_send_invoices))> Can send invoices to customers
        </label>
    @endif
    <div class="flex justify-end gap-2">
        <a href="{{ route('settings.users') }}" class="btn-ghost">Cancel</a>
        <button class="btn-primary">{{ $user ? 'Save user' : 'Send invite' }}</button>
    </div>
</form>
