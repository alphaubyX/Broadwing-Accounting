<x-layouts.app title="Contacts">
    <x-page-header title="Contacts" subtitle="Customers you sell to and vendors you buy from.">
        <x-slot:actions><a href="{{ route('contacts.create') }}" class="btn-primary"><x-icon name="plus" class="h-4 w-4" /> New contact</a></x-slot:actions>
    </x-page-header>
    <x-tabs route="contacts.index" :current="$status" :tabs="['all' => 'All', 'customers' => 'Customers', 'vendors' => 'Vendors', 'archived' => 'Archived']" />
    <div class="card overflow-x-auto">
        @if ($contacts->isEmpty())
            <p class="px-6 py-16 text-center text-sm text-slate-500">No contacts yet.</p>
        @else
            <table class="table">
                <thead><tr><th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th></th></tr></thead>
                <tbody>
                @foreach ($contacts as $c)
                    <tr class="hover:bg-slate-50">
                        <td><a href="{{ route('contacts.edit', $c) }}" class="font-medium text-slate-900 hover:text-brand-600">{{ $c->name }}</a></td>
                        <td class="text-slate-600">{{ \App\Models\Contact::TYPES[$c->type] ?? $c->type }}</td>
                        <td class="text-slate-600">{{ $c->email ?? '—' }}</td>
                        <td class="text-slate-600">{{ $c->phone ?? '—' }}</td>
                        <td class="text-right"><x-confirm-button :action="route('contacts.archive', $c)" class="btn-ghost text-xs">{{ $c->is_archived ? 'Restore' : 'Archive' }}</x-confirm-button></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        @endif
    </div>
</x-layouts.app>
