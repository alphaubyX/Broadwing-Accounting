@props(['month' => 12, 'day' => 31])
<div x-data="{ month: {{ (int) old('fiscal_year_end_month', $month) }}, day: {{ (int) old('fiscal_year_end_day', $day) }},
              max() { return new Date(2000, this.month, 0).getDate() } }"
     x-effect="if (day > max()) day = max()">
    <span class="label">Fiscal year end</span>
    <div class="flex gap-2">
        <select name="fiscal_year_end_month" aria-label="Fiscal year end month" class="input" x-model.number="month">
            @foreach (\App\Accounting\Fiscal::MONTHS as $i => $m)<option value="{{ $i + 1 }}">{{ $m }}</option>@endforeach
        </select>
        <select name="fiscal_year_end_day" aria-label="Fiscal year end day" class="input w-24" x-model.number="day">
            <template x-for="d in max()" :key="d"><option :value="d" x-text="d" :selected="d === day"></option></template>
        </select>
    </div>
</div>
