<?php

namespace App\Http\Controllers;

use App\Accounting\Chart;
use App\Accounting\Ledger;
use App\Models\Contact;
use App\Models\Sale;
use App\Services\AttachmentStore;
use App\Services\LinePricer;
use App\Services\Sequence;
use App\Support\CurrentOrganization;
use App\Support\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    private const FILTERS = ['draft' => ['DRAFT'], 'open' => ['UNPAID', 'PARTIAL'], 'paid' => ['PAID']];

    private function find(int $id): Sale
    {
        return Sale::where('organization_id', CurrentOrganization::require()->id)->findOrFail($id);
    }

    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $status = $request->query('status', 'all');
        $sales = Sale::with('contact')->where('organization_id', $org->id)
            ->when(isset(self::FILTERS[$status]), fn ($q) => $q->whereIn('status', self::FILTERS[$status]))
            ->latest('date')->latest('id')->limit(200)->get();

        return view('sales.index', compact('sales', 'status'));
    }

    private function formData(): array
    {
        $org = CurrentOrganization::require();

        return [
            'customers' => Options::contacts($org->id, 'CUSTOMER'),
            'incomeAccounts' => Options::accounts($org->id, ['INCOME']),
            'depositAccounts' => Options::accounts($org->id, null, Chart::RECEIVE_INTO),
            'taxes' => Options::taxes($org->id),
            'defaultIncomeId' => Options::mapped($org->id, 'DEFAULT_INCOME'),
            'defaultBankId' => Options::mapped($org->id, 'DEFAULT_BANK'),
        ];
    }

    public function create()
    {
        return view('sales.form', $this->formData() + ['sale' => new Sale([
            'date' => today(), 'settlement' => 'ON_TERMS',
            'notes' => CurrentOrganization::require()->brand()->invoice_notes,
        ])]);
    }

    public function edit(int $sale)
    {
        $sale = $this->find($sale);
        abort_if($sale->status === 'VOID', 404);

        return view('sales.form', $this->formData() + ['sale' => $sale]);
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(Request $request, int $sale)
    {
        return $this->save($request, $this->find($sale));
    }

    /** Create or update a sale. intent=draft keeps it out of the books; intent=approve posts it. */
    private function save(Request $request, ?Sale $existing)
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'settlement' => ['required', 'in:PAID_NOW,ON_TERMS'],
            'contact_id' => ['nullable', 'integer'],
            'date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'paid_into_account_id' => ['nullable', 'integer'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'lines' => ['required', 'array'],
        ]);
        $approve = $request->input('intent') !== 'draft';
        $onTerms = $data['settlement'] === 'ON_TERMS';

        if ($existing?->status === 'VOID') {
            throw ValidationException::withMessages(['date' => 'A voided sale cannot be edited.']);
        }
        if ($existing && ! $onTerms && $existing->payments()->exists()) {
            throw ValidationException::withMessages(['settlement' => 'This sale already has payments recorded. Remove them before marking it as paid now.']);
        }
        $contactId = $data['contact_id'] ?? null;
        if ($contactId && ! Contact::where('organization_id', $org->id)->whereKey($contactId)->exists()) {
            throw ValidationException::withMessages(['contact_id' => 'Unknown customer.']);
        }
        if ($onTerms && ! $contactId) {
            throw ValidationException::withMessages(['contact_id' => 'Choose a customer for a sale on payment terms.']);
        }
        $paidInto = $onTerms ? null : ($data['paid_into_account_id'] ?? null);
        if (! $onTerms && ! array_key_exists((int) $paidInto, Options::accounts($org->id, null, Chart::RECEIVE_INTO))) {
            throw ValidationException::withMessages(['paid_into_account_id' => 'Choose the account the money went into.']);
        }
        $priced = LinePricer::price($org->id, $data['lines'], true);

        $sale = DB::transaction(function () use ($org, $existing, $data, $priced, $approve, $onTerms, $contactId, $paidInto, $request) {
            // Drafts stay drafts until approved; posted sales keep their status and
            // syncPaymentStatus recalculates paid / part paid below.
            $isDraft = ! $existing || $existing->status === 'DRAFT';
            $fields = [
                'contact_id' => $contactId,
                'date' => $data['date'],
                'due_date' => $onTerms ? ($data['due_date'] ?? null) : null,
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'settlement' => $data['settlement'],
                'paid_into_account_id' => $paidInto,
                'status' => $isDraft ? ($approve ? 'UNPAID' : 'DRAFT') : $existing->status,
                'subtotal' => $priced['subtotal'],
                'tax_total' => $priced['tax_total'],
                'total' => $priced['total'],
            ];
            if ($existing) {
                $existing->update($fields);
                $existing->lines()->delete();
                $sale = $existing;
            } else {
                $sale = Sale::create($fields + [
                    'organization_id' => $org->id,
                    'number' => Sequence::next($org->id, 'INV', $org->brand()->invoice_prefix),
                ]);
                AttachmentStore::attach($org->id, 'sale_id', $sale->id, array_merge($request->file('files', []), $request->file('camera', [])));
            }
            $sale->lines()->createMany($priced['rows']);
            Ledger::syncPaymentStatus($sale);
            Ledger::repostSale($sale->refresh());

            return $sale;
        });

        return redirect()->route('sales.show', $sale);
    }

    public function show(int $sale)
    {
        $org = CurrentOrganization::require();
        $sale = $this->find($sale)->load(['contact', 'lines.tax', 'payments.account', 'attachments', 'paidIntoAccount']);

        return view('sales.show', [
            'sale' => $sale,
            'bankAccounts' => Options::accounts($org->id, null, Chart::RECEIVE_INTO),
            'defaultBankId' => Options::mapped($org->id, 'DEFAULT_BANK'),
        ]);
    }

    public function print(int $sale)
    {
        $sale = $this->find($sale)->load(['contact', 'lines.tax']);

        return view('print', ['doc' => \App\Support\Documents::sale(CurrentOrganization::require(), $sale), 'back' => route('sales.show', $sale)]);
    }

    public function approve(int $sale)
    {
        $sale = $this->find($sale);
        abort_unless($sale->status === 'DRAFT', 422, 'Only drafts can be approved.');
        DB::transaction(function () use ($sale) {
            $sale->update(['status' => 'UNPAID']);
            Ledger::syncPaymentStatus($sale);
            Ledger::repostSale($sale->refresh());
        });

        return back()->with('status', "{$sale->number} approved.");
    }

    public function void(int $sale)
    {
        $sale = $this->find($sale);
        if ($sale->payments()->exists()) {
            return back()->withErrors(['action' => 'Remove the payments on this sale before voiding it.']);
        }
        DB::transaction(function () use ($sale) {
            $sale->update(['status' => 'VOID', 'amount_paid' => 0]);
            Ledger::repostSale($sale);
        });

        return back()->with('status', "{$sale->number} voided.");
    }

    public function destroy(int $sale)
    {
        $sale = $this->find($sale);
        if (! in_array($sale->status, ['DRAFT', 'VOID'], true)) {
            return back()->withErrors(['action' => 'Only drafts and voided sales can be deleted. Void it first.']);
        }
        foreach ($sale->attachments as $a) {
            AttachmentStore::delete($a->storage_path);
        }
        $sale->delete();

        return redirect()->route('sales.index')->with('status', "{$sale->number} deleted.");
    }
}
