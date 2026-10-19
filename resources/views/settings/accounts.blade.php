<x-settings title="Chart of accounts">
    <div class="card mb-4 p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="max-w-xl text-sm text-slate-600">Accounts are the buckets your money is sorted into. Each type has a natural side:
                <strong>assets &amp; expenses increase with debits</strong>, <strong>liabilities, equity &amp; income increase with credits</strong>.
                You never need to pick debit or credit yourself — the app does it from the account type.</p>
            @unless ($adding)<a href="{{ route('settings.accounts', ['add' => 1]) }}" class="btn-primary">Add account</a>@endunless
        </div>
        @if ($adding)<div class="mt-4">@include('settings.partials.account-form', ['account' => null])</div>@endif
    </div>
    @foreach (\App\Accounting\Chart::TYPES as $type => $typeLabel)
        <section class="card mb-4 overflow-x-auto">
            <div class="flex items-center justify-between px-5 pt-4">
                <h2 class="text-sm font-semibold text-slate-900">{{ $typeLabel }}</h2>
                <span class="text-xs text-slate-500">Increases with {{ \App\Accounting\Chart::isDebitNormal($type) ? 'debits' : 'credits' }}</span>
            </div>
            <table class="table mt-2"><tbody>
                @foreach ($accounts->where('type', $type) as $a)
                    @if ($editing?->id === $a->id)
                        <tr><td colspan="4">@include('settings.partials.account-form', ['account' => $a])</td></tr>
                    @else
                        <tr class="{{ $a->is_archived ? 'opacity-50' : '' }}">
                            <td class="w-20 text-slate-500">{{ $a->code }}</td>
                            <td><div class="font-medium text-slate-900">{{ $a->name }}</div>@if ($a->description)<div class="text-xs text-slate-500">{{ $a->description }}</div>@endif</td>
                            <td class="text-slate-600">{{ \App\Accounting\Chart::SUBTYPES[$a->subtype] ?? $a->subtype }}
                                @if ($a->mappings_count)<span class="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">default</span>@endif
                                @if ($a->is_archived)<span class="ml-2 text-xs">archived</span>@endif</td>
                            <td class="whitespace-nowrap text-right">
                                <a href="{{ route('settings.accounts', ['edit' => $a->id]) }}" class="btn-ghost text-xs">Edit</a>
                                <x-confirm-button :action="route('settings.accounts.archive', $a)" class="btn-ghost text-xs">{{ $a->is_archived ? 'Restore' : 'Archive' }}</x-confirm-button>
                            </td>
                        </tr>
                    @endif
                @endforeach
            </tbody></table>
        </section>
    @endforeach
</x-settings>
