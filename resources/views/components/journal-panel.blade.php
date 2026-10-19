@props(['sources'])
{{-- The double-entry lines behind a transaction, for transparency. $sources: [[type, id], ...] --}}
@php
    $entries = \App\Models\JournalEntry::with('lines.account')
        ->where('organization_id', $org->id)
        ->where(function ($q) use ($sources) {
            foreach ($sources as [$type, $id]) {
                $q->orWhere(fn ($w) => $w->where('source_type', $type)->where('source_id', $id));
            }
        })->orderBy('date')->orderBy('id')->get();
@endphp
<details class="card p-5">
    <summary class="cursor-pointer text-sm font-semibold text-slate-900">Accounting entries</summary>
    @forelse ($entries as $e)
        <div class="mt-4">
            <div class="text-xs text-slate-500">{{ $e->memo }}</div>
            <table class="table mt-1 text-xs">
                <thead><tr><th class="px-2">Account</th><th class="px-2 text-right">Debit</th><th class="px-2 text-right">Credit</th></tr></thead>
                <tbody>
                @foreach ($e->lines as $l)
                    <tr>
                        <td class="px-2 py-1.5">{{ $l->account->label() }}</td>
                        <td class="px-2 py-1.5 text-right">{{ cents($l->debit) ? amount($l->debit) : '' }}</td>
                        <td class="px-2 py-1.5 text-right">{{ cents($l->credit) ? amount($l->credit) : '' }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @empty
        <p class="mt-3 text-sm text-slate-500">Not posted to the books (draft or void).</p>
    @endforelse
</details>
