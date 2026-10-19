<x-settings title="Account mapping">
    <div class="card mb-4 p-5 text-sm text-slate-600">
        <h2 class="mb-2 font-semibold text-slate-900">How transactions hit your books</h2>
        <ul class="list-disc space-y-1 pl-5">
            <li><strong>Sale on terms:</strong> Debit Accounts receivable · Credit Income · Credit Sales tax</li>
            <li><strong>Cash sale:</strong> Debit Bank · Credit Income · Credit Sales tax</li>
            <li><strong>Customer payment:</strong> Debit Bank · Credit Accounts receivable</li>
            <li><strong>Expense paid now:</strong> Debit Expense category · Debit Tax (if recoverable) · Credit Bank / card</li>
            <li><strong>Bill on terms:</strong> Debit Expense category · Debit Tax (if recoverable) · Credit Accounts payable</li>
            <li><strong>Bill payment:</strong> Debit Accounts payable · Credit Bank</li>
        </ul>
        <p class="mt-2">Choose which accounts are used for each automatic entry below.</p>
    </div>
    <form method="POST" action="{{ route('settings.mapping.update') }}" class="card space-y-5 p-6">
        @csrf @method('PUT')
        <div class="grid gap-5 sm:grid-cols-2">
            @foreach (\App\Accounting\Mapping::KEYS as $key => $def)
                <x-field :label="$def['label']" :hint="$def['help']" :name="$key">
                    <x-select :name="$key" :options="$accounts->whereIn('type', $def['types'])->mapWithKeys(fn ($a) => [$a->id => $a->label()])" :selected="$current[$key] ?? null" placeholder="Choose an account…" />
                </x-field>
            @endforeach
        </div>
        <div class="flex justify-end"><button class="btn-primary">Save mapping</button></div>
    </form>
</x-settings>
