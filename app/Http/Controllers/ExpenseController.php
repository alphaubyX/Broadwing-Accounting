<?php

namespace App\Http\Controllers;

use App\Accounting\Chart;
use App\Accounting\Ledger;
use App\Models\Contact;
use App\Models\Expense;
use App\Services\AttachmentStore;
use App\Services\LinePricer;
use App\Services\Sequence;
use App\Support\CurrentOrganization;
use App\Support\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    private function find(int $id): Expense
    {
        return Expense::where('organization_id', CurrentOrganization::require()->id)->findOrFail($id);
    }

    public function index(Request $request)
    {
        $org = CurrentOrganization::require();
        $status = $request->query('status', 'all');
        $expenses = Expense::with(['contact', 'lines.account'])->withCount('attachments')->where('organization_id', $org->id)
            ->when($status === 'open', fn ($q) => $q->whereIn('status', ['UNPAID', 'PARTIAL']))
            ->when($status === 'paid', fn ($q) => $q->where('status', 'PAID'))
            ->when($status === 'noreceipt', fn ($q) => $q->doesntHave('attachments'))
            ->latest('date')->latest('id')->limit(200)->get();

        return view('expenses.index', compact('expenses', 'status'));
    }

    private function formData(): array
    {
        $org = CurrentOrganization::require();

        return [
            'vendorNames' => array_values(Options::contacts($org->id, 'VENDOR')),
            'categories' => Options::accounts($org->id, null, Chart::PURCHASE_CATEGORIES),
            'payFromAccounts' => Options::accounts($org->id, null, Chart::PAY_FROM),
            'taxes' => Options::taxes($org->id),
            'defaultExpenseId' => Options::mapped($org->id, 'DEFAULT_EXPENSE'),
            'defaultBankId' => Options::mapped($org->id, 'DEFAULT_BANK'),
        ];
    }

    public function create()
    {
        return view('expenses.form', $this->formData() + ['expense' => new Expense(['date' => today(), 'settlement' => 'PAID_NOW'])]);
    }

    public function edit(int $expense)
    {
        return view('expenses.form', $this->formData() + ['expense' => $this->find($expense)->load(['lines', 'contact'])]);
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(Request $request, int $expense)
    {
        return $this->save($request, $this->find($expense));
    }

    private function save(Request $request, ?Expense $existing)
    {
        $org = CurrentOrganization::require();
        $data = $request->validate([
            'settlement' => ['required', 'in:PAID_NOW,ON_TERMS'],
            'payee' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'description' => ['required', 'string', 'max:500'],
            'reference' => ['nullable', 'string', 'max:255'],
            'paid_from_account_id' => ['nullable', 'integer'],
            'lines' => ['required', 'array'],
        ]);
        $onTerms = $data['settlement'] === 'ON_TERMS';
        if ($existing && ! $onTerms && $existing->payments()->exists()) {
            throw ValidationException::withMessages(['settlement' => 'This expense already has payments recorded. Remove them before marking it as paid now.']);
        }
        $paidFrom = $onTerms ? null : ($data['paid_from_account_id'] ?? null);
        if (! $onTerms && ! array_key_exists((int) $paidFrom, Options::accounts($org->id, null, Chart::PAY_FROM))) {
            throw ValidationException::withMessages(['paid_from_account_id' => 'Choose the account it was paid from.']);
        }
        // Lines without their own description inherit the expense description.
        $priced = LinePricer::price($org->id, $data['lines'], false, $data['description']);

        // "Paid to" is free text; link it to a contact when the name matches one.
        $payee = trim((string) ($data['payee'] ?? ''));
        $contact = $payee !== '' ? Contact::where('organization_id', $org->id)->where('is_archived', false)->whereRaw('LOWER(name) = ?', [mb_strtolower($payee)])->first() : null;

        $expense = DB::transaction(function () use ($org, $existing, $data, $priced, $onTerms, $paidFrom, $payee, $contact, $request) {
            $fields = [
                'contact_id' => $contact?->id,
                'payee_name' => $contact ? null : ($payee !== '' ? $payee : null),
                'date' => $data['date'],
                'due_date' => $onTerms ? ($data['due_date'] ?? null) : null,
                'description' => $data['description'],
                'reference' => $data['reference'] ?? null,
                'settlement' => $data['settlement'],
                'paid_from_account_id' => $paidFrom,
                'status' => 'UNPAID',
                'subtotal' => $priced['subtotal'],
                'tax_total' => $priced['tax_total'],
                'total' => $priced['total'],
            ];
            if ($existing) {
                $existing->update($fields);
                $existing->lines()->delete();
                $expense = $existing;
            } else {
                $expense = Expense::create($fields + [
                    'organization_id' => $org->id,
                    'number' => Sequence::next($org->id, 'EXP', $org->brand()->expense_prefix),
                ]);
            }
            $expense->lines()->createMany(array_map(fn ($r) => collect($r)->except(['quantity', 'unit_price'])->all(), $priced['rows']));
            AttachmentStore::attach($org->id, 'expense_id', $expense->id, array_merge($request->file('files', []), $request->file('camera', [])));
            Ledger::syncPaymentStatus($expense);
            Ledger::repostExpense($expense->refresh());

            return $expense;
        });

        return redirect()->route('expenses.show', $expense);
    }

    public function show(int $expense)
    {
        $org = CurrentOrganization::require();
        $expense = $this->find($expense)->load(['contact', 'lines.account', 'lines.tax', 'payments.account', 'attachments', 'paidFromAccount', 'purchaseOrder']);

        return view('expenses.show', [
            'expense' => $expense,
            'payFrom' => Options::accounts($org->id, null, Chart::PAY_FROM),
            'defaultBankId' => Options::mapped($org->id, 'DEFAULT_BANK'),
        ]);
    }

    public function destroy(int $expense)
    {
        $org = CurrentOrganization::require();
        $expense = $this->find($expense);
        DB::transaction(function () use ($org, $expense) {
            Ledger::delete($org->id, 'PAYMENT', $expense->payments()->pluck('id')->all());
            Ledger::delete($org->id, 'EXPENSE', [$expense->id]);
            $expense->purchaseOrder?->update(['status' => 'SENT']);
            foreach ($expense->attachments as $a) {
                AttachmentStore::delete($a->storage_path);
            }
            $expense->delete();
        });

        return redirect()->route('expenses.index')->with('status', "{$expense->number} deleted.");
    }
}
