@props(['title'])
@php
    $groups = [
        'Business' => [['settings.profile', 'Business profile']],
        'User management' => [['settings.users', 'Users']],
        'Sales & payments' => [['settings.invoice', 'Invoice customization']],
        'Accounting' => [['settings.dates', 'Dates & currency'], ['settings.taxes', 'Sales taxes'], ['settings.accounts', 'Chart of accounts'], ['settings.mapping', 'Account mapping']],
        'Other' => [['settings.subscription', 'Manage subscription'], ['settings.export', 'Data export'], ['settings.security', 'Password']],
    ];
@endphp
<x-layouts.app :title="$title">
    <x-page-header title="Settings" subtitle="Set up your business once — everything else just works." />
    <div class="grid gap-6 md:grid-cols-[210px_1fr]">
        <nav class="flex gap-4 overflow-x-auto md:flex-col md:gap-5">
            @foreach ($groups as $group => $items)
                <div class="flex shrink-0 items-center gap-1 md:block">
                    <div class="hidden px-3 pb-1 text-xs font-medium text-slate-500 md:block">{{ $group }}</div>
                    @foreach ($items as [$route, $label])
                        <a href="{{ route($route) }}" @class(['block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium',
                            'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200' => request()->routeIs($route),
                            'text-slate-600 hover:bg-slate-100' => ! request()->routeIs($route)])>{{ $label }}</a>
                    @endforeach
                </div>
            @endforeach
        </nav>
        <div class="min-w-0">{{ $slot }}</div>
    </div>
</x-layouts.app>
