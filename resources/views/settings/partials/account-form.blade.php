@php $type = old('type', $account?->type ?? 'EXPENSE'); @endphp
<form method="POST" action="{{ $account ? route('settings.accounts.update', $account) : route('settings.accounts.store') }}" class="space-y-4 rounded-lg bg-slate-50 p-4"
      x-data="{ type: @js($type), subtypes: @js(collect(\App\Accounting\Chart::SUBTYPES_BY_TYPE)->map(fn ($list) => collect($list)->mapWithKeys(fn ($s) => [$s => \App\Accounting\Chart::SUBTYPES[$s]]))), subtype: @js(old('subtype', $account?->subtype)) }">
    @csrf
    @if ($account) @method('PUT') @endif
    <div class="grid gap-3 sm:grid-cols-[100px_1fr_160px_200px]">
        <x-field label="Code" name="code"><input name="code" value="{{ old('code', $account?->code) }}" class="input" required></x-field>
        <x-field label="Name" name="name"><input name="name" value="{{ old('name', $account?->name) }}" class="input" required></x-field>
        <x-field label="Type" name="type"><select name="type" class="input" x-model="type" @change="subtype = Object.keys(subtypes[type])[0]">
            @foreach (\App\Accounting\Chart::TYPES as $t => $l)<option value="{{ $t }}">{{ $l }}</option>@endforeach
        </select></x-field>
        <x-field label="Detail type" name="subtype"><select name="subtype" class="input" x-model="subtype" x-init="if (!subtype || !subtypes[type][subtype]) subtype = Object.keys(subtypes[type])[0]">
            <template x-for="(label, key) in subtypes[type]" :key="key"><option :value="key" x-text="label" :selected="key === subtype"></option></template>
        </select></x-field>
    </div>
    <x-field label="Description"><input name="description" value="{{ old('description', $account?->description) }}" class="input" placeholder="Optional"></x-field>
    <div class="flex justify-end gap-2">
        <a href="{{ route('settings.accounts') }}" class="btn-ghost">Cancel</a>
        <button class="btn-primary">{{ $account ? 'Save account' : 'Add account' }}</button>
    </div>
</form>
