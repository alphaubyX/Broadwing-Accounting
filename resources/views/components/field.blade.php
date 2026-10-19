@props(['label', 'hint' => null, 'name' => null])
<label {{ $attributes->merge(['class' => 'block']) }}>
    <span class="label">{{ $label }}</span>
    {{ $slot }}
    @if ($name && $errors->has($name))<span class="mt-1 block text-xs text-red-600">{{ $errors->first($name) }}</span>
    @elseif ($hint)<span class="hint">{{ $hint }}</span>@endif
</label>
