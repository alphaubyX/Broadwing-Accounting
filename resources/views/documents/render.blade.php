{{--
  Invoice / purchase-order renderer: contemporary, modern, classic and compact templates.
  Used on screen, for print/PDF and in the Settings preview. Expects $doc from App\Support\Documents.
--}}
@php
    $s = $doc['style'];
    $o = $doc['org'];
    $layout = $s['layout'];
    $modern = $layout === 'modern';
    $compact = $layout === 'compact';
    $accent = $s['accent'];
    $fonts = [
        'sans' => "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        'serif' => "Georgia, Cambria, 'Times New Roman', serif",
        'mono' => "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    ];
    $logoShown = $s['show_logo'] && $o['logo_url'];
    $pad = $compact ? 'px-8 py-6' : 'px-10 py-8';
    $filledHeader = $modern || $layout === 'contemporary';
@endphp
<div class="w-[820px] max-w-none bg-white text-slate-800 shadow-sm print:shadow-none" style="font-family: {{ $fonts[$s['font']] ?? $fonts['sans'] }}">

@php
    $logo = function (bool $onAccent = false) use ($o, $s, $compact, $logoShown, $accent) {
        if ($logoShown) {
            return '<img src="'.e($o['logo_url']).'" alt="'.e($o['name']).'" class="'.($compact ? 'max-h-12' : 'max-h-20').' max-w-[220px] object-contain">';
        }
        return '<div class="font-bold '.($compact ? 'text-lg' : 'text-2xl').'" style="color: '.($onAccent ? 'white' : e($accent)).'">'.e($o['name']).'</div>';
    };
    $address = function (bool $onAccent = false, bool $showName = false) use ($o, $s) {
        $html = '<div class="text-xs leading-5 '.($onAccent ? 'text-white/90' : 'text-slate-600').'">';
        if ($showName) {
            $html .= '<div class="text-sm font-semibold '.($onAccent ? 'text-white' : 'text-slate-900').'">'.e($o['name']).'</div>';
        }
        foreach ($o['address_lines'] as $l) { $html .= '<div>'.e($l).'</div>'; }
        if ($o['contact_lines']) { $html .= '<div class="mt-1"></div>'; }
        foreach ($o['contact_lines'] as $l) { $html .= '<div>'.e($l).'</div>'; }
        if ($s['show_tax_number'] && $o['tax_number']) { $html .= '<div class="mt-1">'.e($o['tax_number_label']).': '.e($o['tax_number']).'</div>'; }
        return $html.'</div>';
    };
    $party = function (string $color) use ($doc) {
        if (! $doc['party']) { return '<div></div>'; }
        $html = '<div class="text-sm"><div class="text-xs font-semibold uppercase tracking-wide" style="color: '.e($color).'">'.e($doc['party_heading']).'</div>';
        $html .= '<div class="mt-1 font-semibold">'.e($doc['party']['name']).'</div>';
        foreach ($doc['party']['lines'] as $l) { $html .= '<div class="whitespace-pre-line text-slate-600">'.e($l).'</div>'; }
        return $html.'</div>';
    };
@endphp

@if ($layout === 'contemporary')
    {{-- Wave-style: logo on one side, title and business details on the other, amount due highlighted. --}}
    <div @class(['flex gap-6 border-b border-slate-200 px-10 py-8',
        'flex-col items-center text-center' => $s['logo_position'] === 'center',
        'items-start justify-between' => $s['logo_position'] !== 'center',
        'flex-row-reverse' => $s['logo_position'] === 'right'])>
        <div>{!! $logoShown ? $logo() : '' !!}</div>
        <div class="{{ $s['logo_position'] === 'center' ? 'text-center' : ($s['logo_position'] === 'right' ? 'text-left' : 'text-right') }}">
            <div class="text-3xl font-light uppercase tracking-wide text-slate-800">{{ $doc['title'] }}</div>
            <div class="mt-3">{!! $address(false, true) !!}</div>
        </div>
    </div>
    <div class="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 px-10 py-6">
        {!! $party('#94a3b8') !!}
        <dl class="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-xs">
            <dt class="text-right text-slate-500">Number:</dt><dd class="font-medium">{{ $doc['number'] }}</dd>
            @foreach ($doc['meta'] as $m)<dt class="text-right text-slate-500">{{ $m['label'] }}:</dt><dd class="font-medium">{{ $m['value'] }}</dd>@endforeach
            <div class="col-span-2 mt-1 grid grid-cols-[auto_auto] gap-x-4 rounded bg-slate-100 px-2 py-1.5">
                <dt class="text-right font-semibold">{{ $doc['highlight']['label'] }}:</dt><dd class="font-bold">{{ $doc['highlight']['value'] }}</dd>
            </div>
        </dl>
    </div>
@else
    @php $addressRight = $s['address_position'] === 'right'; $lp = $s['logo_position']; @endphp
    <div class="{{ $pad }}" style="{{ $modern ? "background: {$accent}" : "border-top: 6px solid {$accent}" }}">
        @if ($lp === 'center')
            <div class="flex flex-col items-center gap-3 text-center">{!! $logo($modern) !!}{!! $address($modern, (bool) $logoShown) !!}</div>
        @else
            <div @class(['flex items-start justify-between gap-6', 'flex-row-reverse' => $lp === 'right'])>
                <div @class(['text-right' => $lp === 'right'])>
                    {!! $logo($modern) !!}
                    @if (($lp === 'left') !== $addressRight)<div class="mt-3">{!! $address($modern, (bool) $logoShown) !!}</div>@endif
                </div>
                @if (($lp === 'left') === $addressRight)
                    <div class="{{ $lp === 'left' ? 'text-right' : 'text-left' }}">{!! $address($modern, (bool) $logoShown) !!}</div>
                @endif
            </div>
        @endif
    </div>
    <div class="{{ $pad }} pb-0 pt-6">
        <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
                <div class="font-bold uppercase tracking-wide {{ $compact ? 'text-xl' : 'text-3xl' }}" style="color: {{ $accent }}">{{ $doc['title'] }}</div>
                <div class="mt-1 text-sm text-slate-500">#{{ $doc['number'] }}</div>
            </div>
            <dl class="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
                @foreach ($doc['meta'] as $m)<dt class="text-slate-500">{{ $m['label'] }}</dt><dd class="text-right font-medium">{{ $m['value'] }}</dd>@endforeach
            </dl>
        </div>
        <div class="mt-6">{!! $party($accent) !!}</div>
    </div>
@endif

    <div class="{{ $compact ? 'px-8 pb-6' : 'px-10 pb-8' }} pt-6">
        <table class="w-full {{ $compact ? 'text-xs' : 'text-sm' }}">
            <thead>
                <tr style="{{ $filledHeader ? "background: {$accent}; color: white" : "border-bottom: 2px solid {$accent}" }}">
                    <th class="px-2 py-2 text-left font-semibold">Description</th>
                    <th class="w-16 px-2 py-2 text-right font-semibold">Qty</th>
                    <th class="w-28 px-2 py-2 text-right font-semibold">Price</th>
                    <th class="w-32 px-2 py-2 text-right font-semibold">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($doc['lines'] as $l)
                    <tr class="border-b border-slate-100">
                        <td class="px-2 {{ $compact ? 'py-1.5' : 'py-2.5' }}">{{ $l['description'] }}</td>
                        <td class="px-2 text-right">{{ $l['quantity'] }}</td>
                        <td class="whitespace-nowrap px-2 text-right">{{ $l['unit_price'] }}</td>
                        <td class="whitespace-nowrap px-2 text-right">{{ $l['amount'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        <div class="mt-4 flex justify-end">
            <dl class="w-72 space-y-1 text-sm">
                @foreach ($doc['totals'] as $t)
                    <div class="flex justify-between gap-4 {{ ! empty($t['strong']) ? 'border-t pt-2 text-base font-bold' : '' }}"
                         style="{{ ! empty($t['strong']) ? 'border-color: '.($layout === 'contemporary' ? '#cbd5e1' : $accent) : '' }}">
                        <dt class="{{ ! empty($t['strong']) ? '' : 'text-slate-500' }}">{{ $t['label'] }}</dt><dd class="whitespace-nowrap">{{ $t['value'] }}</dd>
                    </div>
                @endforeach
            </dl>
        </div>
        @if ($doc['notes'])
            <div class="mt-8 text-sm">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</div>
                <p class="mt-1 whitespace-pre-line text-slate-600">{{ $doc['notes'] }}</p>
            </div>
        @endif
        @if ($doc['footer'])
            <div class="mt-10 whitespace-pre-line border-t border-slate-200 pt-4 text-center text-xs text-slate-500">{{ $doc['footer'] }}</div>
        @endif
    </div>
</div>
