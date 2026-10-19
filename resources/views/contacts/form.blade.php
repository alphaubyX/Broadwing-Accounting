@php $isNew = ! $contact->exists; @endphp
<x-layouts.app :title="$isNew ? 'New contact' : $contact->name">
    <x-page-header :title="$isNew ? 'New contact' : $contact->name" />
    <form method="POST" action="{{ $isNew ? route('contacts.store') : route('contacts.update', $contact) }}" class="card max-w-2xl space-y-4 p-6">
        @csrf
        @unless ($isNew) @method('PUT') @endunless
        <div class="grid gap-4 sm:grid-cols-2">
            <x-field label="Name" name="name" class="sm:col-span-2"><input name="name" value="{{ old('name', $contact->name) }}" class="input" required autofocus></x-field>
            <x-field label="Type"><x-select name="type" :options="\App\Models\Contact::TYPES" :selected="$contact->type" /></x-field>
            <x-field label="Tax number"><input name="tax_number" value="{{ old('tax_number', $contact->tax_number) }}" class="input"></x-field>
            <x-field label="Email" name="email"><input type="email" name="email" value="{{ old('email', $contact->email) }}" class="input"></x-field>
            <x-field label="Phone"><input name="phone" value="{{ old('phone', $contact->phone) }}" class="input"></x-field>
            <x-field label="Address" class="sm:col-span-2"><textarea name="address" rows="3" class="input">{{ old('address', $contact->address) }}</textarea></x-field>
            <x-field label="Notes" class="sm:col-span-2"><textarea name="notes" rows="2" class="input">{{ old('notes', $contact->notes) }}</textarea></x-field>
        </div>
        <div class="flex justify-end gap-2">
            <a href="{{ route('contacts.index') }}" class="btn-ghost">Cancel</a>
            <button class="btn-primary">Save contact</button>
        </div>
    </form>
</x-layouts.app>
