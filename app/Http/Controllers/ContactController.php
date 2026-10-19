<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    private function find(int $id): Contact
    {
        return Contact::where('organization_id', CurrentOrganization::require()->id)->findOrFail($id);
    }

    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $status = $request->query('status', 'all');
        $contacts = Contact::where('organization_id', $org->id)
            ->when($status === 'customers', fn ($q) => $q->whereIn('type', ['CUSTOMER', 'BOTH'])->where('is_archived', false))
            ->when($status === 'vendors', fn ($q) => $q->whereIn('type', ['VENDOR', 'BOTH'])->where('is_archived', false))
            ->when($status === 'archived', fn ($q) => $q->where('is_archived', true))
            ->when($status === 'all', fn ($q) => $q->where('is_archived', false))
            ->orderBy('name')->get();

        return view('contacts.index', compact('contacts', 'status'));
    }

    public function create(Request $request)
    {
        return view('contacts.form', ['contact' => new Contact(['type' => in_array($request->query('type'), ['CUSTOMER', 'VENDOR', 'BOTH'], true) ? $request->query('type') : 'CUSTOMER'])]);
    }

    public function edit(int $contact)
    {
        return view('contacts.form', ['contact' => $this->find($contact)]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'type' => ['required', 'in:CUSTOMER,VENDOR,BOTH'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'tax_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    public function store(Request $request)
    {
        Contact::create($this->validated($request) + ['organization_id' => CurrentOrganization::require()->id]);

        return redirect()->route('contacts.index')->with('status', 'Contact saved.');
    }

    public function update(Request $request, int $contact)
    {
        $this->find($contact)->update($this->validated($request));

        return redirect()->route('contacts.index')->with('status', 'Contact saved.');
    }

    public function archive(int $contact)
    {
        $c = $this->find($contact);
        $c->update(['is_archived' => ! $c->is_archived]);

        return back()->with('status', $c->is_archived ? 'Contact archived.' : 'Contact restored.');
    }
}
