@props(['status'])
@php
    $styles = [
        'DRAFT' => 'bg-slate-100 text-slate-600', 'UNPAID' => 'bg-amber-50 text-amber-700', 'OVERDUE' => 'bg-red-50 text-red-700',
        'PARTIAL' => 'bg-sky-50 text-sky-700', 'PAID' => 'bg-emerald-50 text-emerald-700', 'VOID' => 'bg-slate-100 text-slate-400 line-through',
        'SENT' => 'bg-sky-50 text-sky-700', 'BILLED' => 'bg-emerald-50 text-emerald-700', 'CANCELLED' => 'bg-slate-100 text-slate-400',
    ];
    $label = $status === 'PARTIAL' ? 'Part paid' : ucfirst(strtolower($status));
@endphp
<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {{ $styles[$status] ?? $styles['DRAFT'] }}">{{ $label }}</span>
