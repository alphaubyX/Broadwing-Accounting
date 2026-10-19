@php
    $active = $taxes->where('is_archived', false);
    $archived = $taxes->where('is_archived', true);
    $form = fn ($tax) => view('settings.partials.tax-form', ['tax' => $tax, 'liabilityAccounts' => $liabilityAccounts, 'defaultTaxAccount' => $defaultTaxAccount])->render();
@endphp
<x-settings title="Sales taxes">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-slate-900">Sales taxes</h2>
            <p class="text-sm text-slate-500">Taxes you charge on sales and pay on purchases (VAT, GST, sales tax…).</p>
        </div>
        @unless ($creating)<a href="{{ route('settings.taxes', ['new' => 1]) }}" class="btn-primary"><x-icon name="plus" class="h-4 w-4" /> Create a sales tax</a>@endunless
    </div>
    @if ($creating)<div class="mb-4">{!! $form(null) !!}</div>@endif
    <section class="card overflow-x-auto">
        <table class="table">
            <thead><tr><th>Name</th><th>Tax number</th><th>Recoverable</th><th class="text-right">Actions</th></tr></thead>
            <tbody>
            @forelse ($active as $t)
                @if ($editing?->id === $t->id)
                    <tr><td colspan="4">{!! $form($t) !!}</td></tr>
                @else
                    <tr>
                        <td><span class="font-semibold text-slate-900">{{ $t->label() }}</span><span class="italic text-slate-500"> – {{ $t->name }}</span>
                            @if ($t->description)<div class="text-xs text-slate-500">{{ $t->description }}</div>@endif</td>
                        <td class="text-slate-600">{{ $t->tax_number ?? '—' }}@if ($t->tax_number && $t->show_tax_number)<span class="ml-2 text-xs text-slate-400">on invoices</span>@endif</td>
                        <td class="text-slate-600">{{ $t->is_recoverable ? 'Yes' : 'No' }}</td>
                        <td class="whitespace-nowrap text-right">
                            <a href="{{ route('settings.taxes', ['edit' => $t->id]) }}" class="btn-ghost px-2" aria-label="Edit {{ $t->name }}"><x-icon name="pencil" class="h-4 w-4 text-brand-600" /></a>
                            <x-confirm-button :action="route('settings.taxes.destroy', $t)" method="DELETE" :confirm="'Delete '.$t->abbreviation.'? If it\'s already used on transactions it will be archived instead.'" class="btn-ghost px-2" aria-label="Delete {{ $t->name }}">
                                <x-icon name="trash" class="h-4 w-4 text-brand-600" />
                            </x-confirm-button>
                        </td>
                    </tr>
                @endif
            @empty
                <tr><td colspan="4" class="py-8 text-center text-slate-500">No sales taxes yet.</td></tr>
            @endforelse
            </tbody>
        </table>
    </section>
    @if ($archived->isNotEmpty())
        <section class="card mt-4 p-5">
            <h3 class="text-sm font-semibold text-slate-900">Archived taxes</h3>
            <p class="text-xs text-slate-500">Kept because they are used on past transactions.</p>
            <ul class="mt-3 divide-y divide-slate-100 text-sm">
                @foreach ($archived as $t)
                    <li class="flex items-center justify-between py-2"><span class="text-slate-500">{{ $t->label() }} – {{ $t->name }}</span>
                        <x-confirm-button :action="route('settings.taxes.restore', $t)" class="btn-ghost text-xs">Restore</x-confirm-button></li>
                @endforeach
            </ul>
        </section>
    @endif
</x-settings>
