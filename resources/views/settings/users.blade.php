@php
    $form = function ($user) {
        return view('settings.partials.user-form', ['user' => $user])->render();
    };
@endphp
<x-settings title="Users">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-slate-900">{{ $org->name }} users</h2>
            <p class="max-w-2xl text-sm text-slate-500">Invite people to work in this business. Only give access to people you trust, since users can see your transactions and other business information.</p>
        </div>
        @unless ($inviting)<a href="{{ route('settings.users', ['invite' => 1]) }}" class="btn-primary"><x-icon name="user-plus" class="h-4 w-4" /> Invite user</a>@endunless
    </div>
    <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Sign-in will come from your central Broadwing account. Until then this list records who should have access and with what role; invitations aren't emailed yet.
    </div>
    @if ($inviting)<div class="mb-4">{!! $form(null) !!}</div>@endif
    <section class="card divide-y divide-slate-100">
        @foreach ($users as $u)
            @if ($editing?->id === $u->id)
                <div class="p-4">{!! $form($u) !!}</div>
            @else
                <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                        <div class="text-sm text-slate-900">
                            @if ($u->name)<span class="font-medium">{{ $u->name }} · </span>@endif{{ $u->email }}
                            @if ($u->status === 'INVITED')<span class="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Invite pending</span>@endif
                        </div>
                        <div class="mt-1 text-sm font-medium text-slate-600">{{ \App\Models\OrgUser::ROLES[$u->role]['label'] }}{{ $u->role === 'EDITOR' && $u->can_send_invoices ? ' + Send invoices' : '' }}</div>
                    </div>
                    <div class="flex gap-2">
                        @if ($u->role !== 'OWNER')
                            <x-confirm-button :action="route('settings.users.destroy', $u)" method="DELETE" :confirm="'Remove '.$u->email.'\'s access?'" class="btn-secondary rounded-full">Delete</x-confirm-button>
                        @endif
                        <a href="{{ route('settings.users', ['edit' => $u->id]) }}" class="btn-primary rounded-full">Edit</a>
                    </div>
                </div>
            @endif
        @endforeach
    </section>
</x-settings>
