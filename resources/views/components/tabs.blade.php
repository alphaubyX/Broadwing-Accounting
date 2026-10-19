@props(['route', 'current', 'tabs'])
<div class="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
    @foreach ($tabs as $value => $label)
        <a href="{{ $value === 'all' ? route($route) : route($route, ['status' => $value]) }}" @class([
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium',
            'border-brand-500 text-brand-700' => $current === $value,
            'border-transparent text-slate-500 hover:text-slate-800' => $current !== $value,
        ])>{{ $label }}</a>
    @endforeach
</div>
