@props(['title', 'subtitle' => null])
<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
        <h1 class="flex flex-wrap items-center gap-3 text-2xl font-semibold text-slate-900">{{ $title }}{{ $badge ?? '' }}</h1>
        @if ($subtitle)<p class="mt-1 text-sm text-slate-500">{{ $subtitle }}</p>@endif
    </div>
    @isset($actions)<div class="flex flex-wrap items-center gap-2">{{ $actions }}</div>@endisset
</div>
