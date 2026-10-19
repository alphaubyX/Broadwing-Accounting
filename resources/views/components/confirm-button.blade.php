@props(['action', 'method' => 'POST', 'confirm' => null, 'class' => 'btn-secondary', 'fields' => []])
<form method="POST" action="{{ $action }}" class="inline" @if ($confirm) onsubmit="return confirm(@js($confirm))" @endif>
    @csrf
    @if ($method !== 'POST') @method($method) @endif
    @foreach ($fields as $k => $v)<input type="hidden" name="{{ $k }}" value="{{ $v }}">@endforeach
    <button type="submit" class="{{ $class }}" {{ $attributes }}>{{ $slot }}</button>
</form>
