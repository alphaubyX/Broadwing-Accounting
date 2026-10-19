<x-layouts.base title="Preview" body-class="bg-white">
    <div data-fit class="overflow-hidden"><div>@include('documents.render', ['doc' => $doc])</div></div>
    @if ($thumb)<style>[data-fit] > div { transform: none !important; } [data-fit] { height: auto !important; }</style>@endif
</x-layouts.base>
