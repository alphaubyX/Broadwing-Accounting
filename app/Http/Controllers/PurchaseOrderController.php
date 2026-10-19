<?php

namespace App\Http\Controllers;

use App\Accounting\Chart;
use App\Accounting\Ledger;
use App\Models\Contact;
use App\Models\Expense;
use App\Models\PurchaseOrder;
use App\Services\AttachmentStore;
use App\Services\LinePricer;
use App\Services\Sequence;
use App\Support\CurrentOrganization;
use App\Support\Documents;
use App\Support\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{
    private function find(int $id): PurchaseOrder
    {
        return PurchaseOrder::where('organization_id', CurrentOrganization::require()->id)->findOrFail($id);
    }

    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $status = $request->query('status', 'all');
        $orders = PurchaseOrder::with('contact')->where('organization_id', $org->id)
            ->when($status === 'open', fn ($q) => $q->whereIn('status', ['DRAFT', 'SENT']))
            ->when($status === 'billed', fn ($q) => $q->where('status', 'BILLED'))
            ->latest('date')->latest('id')->limit(200)->get();

        return view('purchase-orders.index', compact('orders', 'status'));
    }

    private function formData(): array
    {
        $org = CurrentOrganization::require();

        return [
            'vendors' => Options::contacts($org->id, 'VENDOR'),
            'categories' => Options::accounts($org->id, null, Chart::PURCHASE_CATEGORIES),
            'taxes' => Options::taxes($org->id),
            'defaultExpenseId' => Options::mapped($org->id, 'DEFAULT_EXPENSE'),
        ];
    }

    public function create()
    {
        return view('purchase-orders.form', $this->formData() + ['po' => new PurchaseOrder([
            'date' => today(), 'notes' => CurrentOrganization::require()->brand()->po_notes,
        ])]);
    }

    public function edit(int $po)
    {
        $po = $this->find($po);
        abort_unless($po->isOpen(), 404);

        return view('purchase-orders.form', $this->formData() + ['po' => $po->load('lines')]);
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(Request $request, int $po)
    {
        return $this->save($request, $this->find($po));
    }

    private function save(Request $request, ?PurchaseOrder $existing)
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'lines' => ['required', 'array'],
        ], [], ['contact_id' => 'vendor']);
        if ($existing && ! $existing->isOpen()) {
            throw ValidationException::withMessages(['date' => 'Billed or cancelled purchase orders cannot be edited.']);
        }
        if (! Contact::where('organization_id', $org->id)->whereKey($data['contact_id'])->exists()) {
            throw ValidationException::withMessages(['contact_id' => 'Unknown vendor.']);
        }
        $priced = LinePricer::price($org->id, $data['lines'], true);

        $po = DB::transaction(function () use ($org, $existing, $data, $priced, $request) {
            $fields = collect($data)->only(['contact_id', 'date', 'expected_date', 'reference', 'notes'])->all() + [
                'subtotal' => $priced['subtotal'], 'tax_total' => $priced['tax_total'], 'total' => $priced['total'],
            ];
            if ($existing) {
                $existing->update($fields);
                $existing->lines()->delete();
                $po = $existing;
            } else {
                $po = PurchaseOrder::create($fields + [
                    'organization_id' => $org->id,
                    'number' => Sequence::next($org->id, 'PO', $org->brand()->po_prefix),
                ]);
                AttachmentStore::attach($org->id, 'purchase_order_id', $po->id, array_merge($request->file('files', []), $request->file('camera', [])));
            }
            $po->lines()->createMany($priced['rows']);

            return $po;
        });

        return redirect()->route('purchase-orders.show', $po);
    }

    public function show(int $po)
    {
        return view('purchase-orders.show', ['po' => $this->find($po)->load(['contact', 'lines.tax', 'attachments', 'expense'])]);
    }

    public function print(int $po)
    {
        $po = $this->find($po)->load(['contact', 'lines.tax']);

        return view('print', ['doc' => Documents::purchaseOrder(CurrentOrganization::require(), $po), 'back' => route('purchase-orders.show', $po)]);
    }

    public function status(Request $request, int $po)
    {
        $po = $this->find($po);
        $status = $request->validate(['status' => ['required', 'in:DRAFT,SENT,CANCELLED']])['status'];
        if ($po->status === 'BILLED') {
            return back()->withErrors(['action' => 'This purchase order has already been billed.']);
        }
        $po->update(['status' => $status]);

        return back()->with('status', "{$po->number} updated.");
    }

    /** Turn a purchase order into an expense on payment terms (a bill). */
    public function convert(int $po)
    {
        $org = CurrentOrganization::require();
        $po = $this->find($po)->load('lines');
        if (! $po->isOpen()) {
            return back()->withErrors(['action' => 'This purchase order cannot be billed.']);
        }
        $defaultExpense = Options::mapped($org->id, 'DEFAULT_EXPENSE');

        $expense = DB::transaction(function () use ($org, $po, $defaultExpense) {
            $expense = Expense::create([
                'organization_id' => $org->id,
                'number' => Sequence::next($org->id, 'EXP', $org->brand()->expense_prefix),
                'contact_id' => $po->contact_id,
                'date' => today(),
                'due_date' => today()->addDays($org->default_payment_terms),
                'description' => "Purchase order {$po->number}",
                'reference' => $po->reference,
                'settlement' => 'ON_TERMS',
                'subtotal' => $po->subtotal,
                'tax_total' => $po->tax_total,
                'total' => $po->total,
                'purchase_order_id' => $po->id,
            ]);
            $expense->lines()->createMany($po->lines->map(fn ($l) => [
                'position' => $l->position,
                'description' => (float) $l->quantity == 1.0 ? $l->description : $l->description.' × '.qty($l->quantity),
                'amount' => $l->amount,
                'tax_amount' => $l->tax_amount,
                'account_id' => $l->account_id ?? $defaultExpense,
                'tax_id' => $l->tax_id,
            ])->all());
            $po->update(['status' => 'BILLED']);
            Ledger::syncPaymentStatus($expense);
            Ledger::repostExpense($expense->refresh());

            return $expense;
        });

        return redirect()->route('expenses.show', $expense)->with('status', "{$po->number} converted to {$expense->number}.");
    }

    public function destroy(int $po)
    {
        $po = $this->find($po);
        if ($po->expense) {
            return back()->withErrors(['action' => "This purchase order is linked to expense {$po->expense->number}. Delete that first."]);
        }
        foreach ($po->attachments as $a) {
            AttachmentStore::delete($a->storage_path);
        }
        $po->delete();

        return redirect()->route('purchase-orders.index')->with('status', "{$po->number} deleted.");
    }
}
