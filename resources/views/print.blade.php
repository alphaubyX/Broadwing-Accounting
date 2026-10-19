<x-layouts.base :title="$doc['number']" body-class="bg-slate-100 print:bg-white">
    <main class="py-6 print:py-0">
        <div class="no-print mx-auto mb-4 flex max-w-[820px] justify-between px-4">
            <a href="{{ $back }}" class="btn-ghost">← Back</a>
            <button type="button" class="btn-primary" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="mx-auto max-w-[820px] overflow-x-auto print:overflow-visible">@include('documents.render', ['doc' => $doc])</div>
    </main>
</x-layouts.base>
