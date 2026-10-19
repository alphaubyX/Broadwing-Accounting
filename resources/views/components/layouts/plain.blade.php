@props(['title' => null, 'subtitle' => null, 'width' => 'max-w-2xl'])
<x-layouts.base :title="$title">
    <main class="mx-auto {{ $width }} px-4 py-12">
        <div class="mb-8 text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">B</div>
            <h1 class="text-2xl font-semibold text-slate-900">{{ $title }}</h1>
            @if ($subtitle)<p class="mt-2 text-sm text-slate-500">{{ $subtitle }}</p>@endif
        </div>
        <x-alerts />
        {{ $slot }}
    </main>
</x-layouts.base>
