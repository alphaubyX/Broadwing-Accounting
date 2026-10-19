<?php

namespace App\Http\Controllers;

use App\Accounting\Ledger;
use App\Accounting\Money;
use App\Models\Account;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\Sequence;
use App\Support\CurrentOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function store(Request $request, string $kind, int $id)
    {
        $org = CurrentOrganization::require();
        abort_unless(in_array($kind, ['sales', 'expenses'], true), 404);
        $doc = ($kind === 'sales' ? Sale::query() : Expense::query())->where('organization_id', $org->id)->findOrFail($id);

        $data = $request->validate([
            'date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'account_id' => ['required', 'integer'],
            'method' => ['nullable', 'string', 'max:50'],
            'reference' => ['nullable', 'string', 'max:255'],
        ]);
        $amount = Money::toCents($data['amount']);
        $due = Money::toCents($doc->total) - Money::toCents($doc->amount_paid);
        $errors = match (true) {
            $doc->settlement === 'PAID_NOW' => 'This transaction was already paid in full.',
            in_array($doc->status, ['DRAFT', 'VOID'], true) => 'Approve the document before recording payments.',
            $amount > $due => 'The amount due is only '.Money::fromCents($due).'.',
            ! Account::where('organization_id', $org->id)->whereKey($data['account_id'])->exists() => 'Unknown account.',
            default => null,
        };
        if ($errors) {
            return back()->withErrors(['amount' => $errors])->withInput();
        }

        DB::transaction(function () use ($org, $doc, $data, $amount, $kind) {
            $payment = Payment::create([
                'organization_id' => $org->id,
                'number' => Sequence::next($org->id, 'PAY', 'PAY-'),
                'date' => $data['date'],
                'amount' => Money::fromCents($amount),
                'account_id' => $data['account_id'],
                'method' => $data['method'] ?? null,
                'reference' => $data['reference'] ?? null,
                'sale_id' => $kind === 'sales' ? $doc->id : null,
                'expense_id' => $kind === 'expenses' ? $doc->id : null,
            ]);
            Ledger::repostPayment($payment);
            Ledger::syncPaymentStatus($doc);
        });

        return back()->with('status', 'Payment recorded.');
    }

    public function destroy(int $payment)
    {
        $org = CurrentOrganization::require();
        $payment = Payment::where('organization_id', $org->id)->findOrFail($payment);
        DB::transaction(function () use ($org, $payment) {
            Ledger::delete($org->id, 'PAYMENT', [$payment->id]);
            $doc = $payment->sale ?? $payment->expense;
            $payment->delete();
            if ($doc) {
                Ledger::syncPaymentStatus($doc);
            }
        });

        return back()->with('status', 'Payment removed.');
    }
}
