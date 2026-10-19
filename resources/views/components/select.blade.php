@props(['name', 'options', 'selected' => null, 'placeholder' => null])
<select name="{{ $name }}" {{ $attributes->merge(['class' => 'input']) }}>
    @if ($placeholder !== null)<option value="">{{ $placeholder }}</option>@endif
    @foreach ($options as $value => $label)
        <option value="{{ $value }}" @selected((string) old($name, $selected) === (string) $value)>{{ $label }}</option>
    @endforeach
</select>
