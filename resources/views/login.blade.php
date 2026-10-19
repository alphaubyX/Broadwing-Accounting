<x-layouts.plain title="Broadwing Accounting" subtitle="Enter the password to continue." width="max-w-sm">
    <form method="POST" action="{{ route('login.store') }}" class="card space-y-4 p-6">
        @csrf
        <x-field label="Password"><input type="password" name="password" class="input" required autofocus autocomplete="current-password"></x-field>
        <button class="btn-primary w-full">Sign in</button>
    </form>
</x-layouts.plain>
