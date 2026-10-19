<x-settings title="Manage subscription">
    <div class="max-w-2xl space-y-4">
        <h2 class="text-lg font-semibold text-slate-900">Manage subscription</h2>
        <section class="card p-6">
            <h3 class="text-base font-semibold text-slate-900">Current plan</h3>
            <div class="mt-3 flex items-center gap-2"><span class="rounded bg-slate-100 px-2 py-1 text-sm font-bold uppercase tracking-wide text-slate-700">{{ $org->plan === 'STARTER' ? 'Starter' : $org->plan }}</span><span class="text-lg font-medium text-slate-900">Plan</span></div>
            <ul class="mt-5 space-y-2 text-sm text-slate-600">
                @foreach (['Unlimited sales, expenses and purchase orders', 'Receipt capture and attachments', 'Profit & loss, balance sheet and trial balance', 'Excel, CSV and receipt exports'] as $f)
                    <li class="flex items-start gap-2"><x-icon name="check" class="mt-0.5 h-4 w-4 text-emerald-600" />{{ $f }}</li>
                @endforeach
            </ul>
        </section>
        <p class="text-center text-sm text-slate-500">Billing and plan changes will be managed from your central Broadwing account.</p>
    </div>
</x-settings>
