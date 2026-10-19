@props(['title' => null])
@php
    $nav = [
        ['dashboard', 'Dashboard', 'dashboard', ''],
        ['sales.index', 'Sales', 'receipt', 'sales'],
        ['expenses.index', 'Expenses', 'wallet', 'expenses'],
        ['purchase-orders.index', 'Purchase orders', 'clipboard', 'purchase-orders'],
        ['contacts.index', 'Contacts', 'users', 'contacts'],
        ['reports', 'Reports', 'chart', 'reports'],
    ];
    $active = fn (string $prefix) => $prefix === '' ? request()->is('/') : request()->is($prefix, $prefix.'/*');
    $item = fn ($route, $label, $icon, $prefix) => [$route, $label, $icon, $active($prefix)];
@endphp
<x-layouts.base :title="$title">
<div class="flex min-h-screen flex-col md:flex-row">
    <aside class="no-print flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <div class="flex items-center gap-3 px-5 py-5">
            @if ($org->logo_path)
                <img src="{{ $org->logoUrl() }}" alt="" class="h-9 w-9 rounded-md object-contain">
            @else
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500 text-sm font-bold text-white">{{ mb_strtoupper(mb_substr($org->name, 0, 1)) }}</div>
            @endif
            <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-slate-900">{{ $org->name }}</div>
                <div class="text-xs text-slate-500">Broadwing Accounting</div>
            </div>
        </div>
        <nav class="flex flex-1 flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
            @foreach (array_merge($nav, [['settings.profile', 'Settings', 'settings', 'settings']]) as $i => [$route, $label, $icon, $prefix])
                <a href="{{ route($route) }}" @class([
                    'flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition',
                    'md:hidden' => $prefix === 'settings',
                    'bg-brand-50 text-brand-700' => $active($prefix),
                    'text-slate-600 hover:bg-slate-100 hover:text-slate-900' => ! $active($prefix),
                ])><x-icon :name="$icon" />{{ $label }}</a>
            @endforeach
        </nav>
        <div class="hidden space-y-1 px-3 py-4 md:block">
            <a href="{{ route('settings.profile') }}" @class(['flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                'bg-brand-50 text-brand-700' => $active('settings'), 'text-slate-600 hover:bg-slate-100' => ! $active('settings')])><x-icon name="settings" />Settings</a>
            @if (config('broadwing.password_hash'))
                <form method="POST" action="{{ route('logout') }}">@csrf
                    <button class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"><x-icon name="logout" />Sign out</button>
                </form>
            @endif
        </div>
    </aside>
    <main class="min-w-0 flex-1">
        <div class="mx-auto max-w-6xl px-4 py-8 md:px-8">
            <x-alerts />
            {{ $slot }}
        </div>
    </main>
</div>
</x-layouts.base>
