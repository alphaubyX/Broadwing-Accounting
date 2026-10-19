<x-settings title="Password">
    <div class="max-w-xl">
        <h2 class="text-lg font-semibold text-slate-900">App password</h2>
        <p class="mb-4 text-sm text-slate-500">Everyone uses this password to open the app until sign-in through your central Broadwing account is connected.</p>
        <form method="POST" action="{{ route('settings.security.update') }}" class="card space-y-4 p-6">
            @csrf @method('PUT')
            @if (config('broadwing.password_hash'))
                <x-field label="Current password" name="current_password"><input type="password" name="current_password" class="input" required autocomplete="current-password"></x-field>
            @else
                <p class="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">No password is set, so anyone with the address can open the app. Set one now.</p>
            @endif
            <x-field label="New password" name="password" hint="At least 8 characters"><input type="password" name="password" class="input" required minlength="8" autocomplete="new-password"></x-field>
            <x-field label="Repeat new password"><input type="password" name="password_confirmation" class="input" required minlength="8" autocomplete="new-password"></x-field>
            <div class="flex justify-end"><button class="btn-primary">Change password</button></div>
        </form>
    </div>
</x-settings>
