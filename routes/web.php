<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\InstallController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\Settings;
use App\Http\Controllers\SetupController;
use Illuminate\Support\Facades\Route;

// First-run installer (database settings + app password). Disabled once installed.
Route::get('/install', [InstallController::class, 'show'])->name('install');
Route::post('/install', [InstallController::class, 'store'])->name('install.store');

Route::middleware(['installed', 'db-updates'])->group(function () {
    Route::get('/login', [AuthController::class, 'show'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.store');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('app-password')->group(function () {
        Route::get('/setup', [SetupController::class, 'show'])->name('setup');
        Route::post('/setup', [SetupController::class, 'store'])->name('setup.store');

        Route::middleware('organization')->group(function () {
            Route::get('/', DashboardController::class)->name('dashboard');

            Route::resource('sales', SaleController::class)->except('destroy')->whereNumber('sale');
            Route::get('sales/{sale}/print', [SaleController::class, 'print'])->name('sales.print')->whereNumber('sale');
            Route::post('sales/{sale}/approve', [SaleController::class, 'approve'])->name('sales.approve')->whereNumber('sale');
            Route::post('sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void')->whereNumber('sale');
            Route::delete('sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy')->whereNumber('sale');

            Route::resource('expenses', ExpenseController::class)->whereNumber('expense');

            Route::resource('purchase-orders', PurchaseOrderController::class)->parameters(['purchase-orders' => 'po'])->whereNumber('po');
            Route::get('purchase-orders/{po}/print', [PurchaseOrderController::class, 'print'])->name('purchase-orders.print')->whereNumber('po');
            Route::post('purchase-orders/{po}/status', [PurchaseOrderController::class, 'status'])->name('purchase-orders.status')->whereNumber('po');
            Route::post('purchase-orders/{po}/convert', [PurchaseOrderController::class, 'convert'])->name('purchase-orders.convert')->whereNumber('po');

            Route::post('{kind}/{id}/payments', [PaymentController::class, 'store'])->name('payments.store')->whereIn('kind', ['sales', 'expenses'])->whereNumber('id');
            Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy')->whereNumber('payment');

            Route::post('{kind}/{id}/attachments', [AttachmentController::class, 'store'])->name('attachments.store')->whereIn('kind', ['sales', 'expenses', 'purchase-orders'])->whereNumber('id');
            Route::get('files/{attachment}', [AttachmentController::class, 'show'])->name('files.show')->whereNumber('attachment');
            Route::delete('files/{attachment}', [AttachmentController::class, 'destroy'])->name('files.destroy')->whereNumber('attachment');
            Route::get('logo', [AttachmentController::class, 'logo'])->name('files.logo');

            Route::resource('contacts', ContactController::class)->except(['show', 'destroy'])->whereNumber('contact');
            Route::post('contacts/{contact}/archive', [ContactController::class, 'archive'])->name('contacts.archive')->whereNumber('contact');

            Route::get('reports', ReportController::class)->name('reports');

            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('/', [Settings\ProfileController::class, 'edit'])->name('profile');
                Route::put('/', [Settings\ProfileController::class, 'update'])->name('profile.update');

                Route::get('users', [Settings\UserController::class, 'index'])->name('users');
                Route::post('users', [Settings\UserController::class, 'store'])->name('users.store');
                Route::put('users/{user}', [Settings\UserController::class, 'update'])->name('users.update')->whereNumber('user');
                Route::delete('users/{user}', [Settings\UserController::class, 'destroy'])->name('users.destroy')->whereNumber('user');

                Route::get('invoice', [Settings\InvoiceController::class, 'edit'])->name('invoice');
                Route::post('invoice', [Settings\InvoiceController::class, 'update'])->name('invoice.update');
                Route::get('invoice/preview', [Settings\InvoiceController::class, 'preview'])->name('invoice.preview');

                Route::get('dates-currency', [Settings\DatesController::class, 'edit'])->name('dates');
                Route::put('dates-currency', [Settings\DatesController::class, 'update'])->name('dates.update');

                Route::get('taxes', [Settings\TaxController::class, 'index'])->name('taxes');
                Route::post('taxes', [Settings\TaxController::class, 'store'])->name('taxes.store');
                Route::put('taxes/{tax}', [Settings\TaxController::class, 'update'])->name('taxes.update')->whereNumber('tax');
                Route::delete('taxes/{tax}', [Settings\TaxController::class, 'destroy'])->name('taxes.destroy')->whereNumber('tax');
                Route::post('taxes/{tax}/restore', [Settings\TaxController::class, 'restore'])->name('taxes.restore')->whereNumber('tax');

                Route::get('accounts', [Settings\AccountController::class, 'index'])->name('accounts');
                Route::post('accounts', [Settings\AccountController::class, 'store'])->name('accounts.store');
                Route::put('accounts/{account}', [Settings\AccountController::class, 'update'])->name('accounts.update')->whereNumber('account');
                Route::post('accounts/{account}/archive', [Settings\AccountController::class, 'archive'])->name('accounts.archive')->whereNumber('account');

                Route::get('mapping', [Settings\MappingController::class, 'edit'])->name('mapping');
                Route::put('mapping', [Settings\MappingController::class, 'update'])->name('mapping.update');

                Route::get('subscription', [Settings\OtherController::class, 'subscription'])->name('subscription');
                Route::get('export', [Settings\OtherController::class, 'export'])->name('export');
                Route::get('export/{kind}', [Settings\OtherController::class, 'download'])->name('export.download');
                Route::get('security', [Settings\OtherController::class, 'security'])->name('security');
                Route::put('security', [Settings\OtherController::class, 'updatePassword'])->name('security.update');
            });
        });
    });
});
