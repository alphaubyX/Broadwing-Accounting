<x-settings title="Dates & currency">
    <div class="max-w-2xl">
        <h2 class="text-lg font-semibold text-slate-900">Dates & currency</h2>
        <p class="mb-4 text-sm text-slate-500">Used for your reports and every amount in the app.</p>
        <form method="POST" action="{{ route('settings.dates.update') }}" class="card space-y-5 p-6">
            @csrf @method('PUT')
            <div>
                <x-fiscal-year-end :month="$org->fiscal_year_end_month" :day="$org->fiscal_year_end_day" />
                <p class="hint">Current fiscal year: {{ fmt_date($fy['from']) }} – {{ fmt_date($fy['to']) }}</p>
            </div>
            <x-field label="Business currency" name="currency" :hint="$locked ? 'The currency is locked because transactions have already been recorded in it.' : 'Choose carefully: it can\'t be changed after you record your first transaction.'">
                @if ($locked)
                    <input type="hidden" name="currency" value="{{ $org->currency }}">
                    <div class="py-2 text-sm font-medium text-slate-900">{{ $org->currency }} — {{ \App\Support\Currencies::ALL[$org->currency] ?? '' }}</div>
                @else
                    <x-select name="currency" :options="collect(\App\Support\Currencies::ALL)->mapWithKeys(fn ($n, $c) => [$c => $c.' — '.$n])" :selected="$org->currency" />
                @endif
            </x-field>
            <div class="flex justify-end"><button class="btn-primary">Save</button></div>
        </form>
    </div>
</x-settings>
