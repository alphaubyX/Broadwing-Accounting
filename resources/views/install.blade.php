<x-layouts.plain title="Install Broadwing Accounting" subtitle="Connect the app to your MySQL database and choose a password. This page disappears once installation is complete.">
    @php $ok = collect($checks)->every(fn ($c) => $c[1]); @endphp
    <section class="card mb-6 p-6">
        <h2 class="mb-3 text-sm font-semibold text-slate-900">Server check</h2>
        <ul class="grid gap-1.5 text-sm sm:grid-cols-2">
            @foreach ($checks as [$label, $passed])
                <li class="flex items-center gap-2 {{ $passed ? 'text-slate-600' : 'font-medium text-red-600' }}">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full {{ $passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600' }}">{!! $passed ? '&#10003;' : '&#10005;' !!}</span>{{ $label }}
                </li>
            @endforeach
        </ul>
        @unless ($ok)
            <p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Fix the items marked in red (cPanel → Select PHP Version → Extensions, or File Manager permissions), then reload this page.</p>
        @endunless
    </section>

    <form method="POST" action="{{ route('install.store') }}" class="card space-y-6 p-6">
        @csrf
        <section class="grid gap-4 sm:grid-cols-2">
            <h2 class="text-sm font-semibold text-slate-900 sm:col-span-2">MySQL database <span class="font-normal text-slate-500">(from cPanel → MySQL Databases)</span></h2>
            <x-field label="Database name" name="db_database" hint="Full name incl. prefix, e.g. markhorc_accounting"><input name="db_database" value="{{ old('db_database') }}" class="input" required></x-field>
            <x-field label="Database user" name="db_username" hint="Full name incl. prefix"><input name="db_username" value="{{ old('db_username') }}" class="input" required autocomplete="off"></x-field>
            <x-field label="Database password" name="db_password" class="sm:col-span-2"><input type="password" name="db_password" class="input" autocomplete="new-password"></x-field>
            <x-field label="Host" name="db_host" hint="Almost always localhost"><input name="db_host" value="{{ old('db_host', 'localhost') }}" class="input" required></x-field>
            <x-field label="Port" name="db_port"><input name="db_port" value="{{ old('db_port', '3306') }}" class="input" required inputmode="numeric"></x-field>
        </section>
        <section class="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <h2 class="text-sm font-semibold text-slate-900 sm:col-span-2">App password <span class="font-normal text-slate-500">(protects the app until Broadwing sign-in is connected)</span></h2>
            <x-field label="Password" name="app_password" hint="At least 8 characters"><input type="password" name="app_password" class="input" required minlength="8" autocomplete="new-password"></x-field>
            <x-field label="Repeat password"><input type="password" name="app_password_confirmation" class="input" required minlength="8" autocomplete="new-password"></x-field>
        </section>
        <div class="flex justify-end"><button class="btn-primary" @disabled(! $ok)>Install</button></div>
    </form>
</x-layouts.plain>
