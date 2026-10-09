"use client";

import { useActionState, useState } from "react";
import clsx from "clsx";
import { DocumentView, type BrandingStyle, type DocumentOrg } from "@/components/DocumentView";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney } from "@/lib/money";
import { saveBranding } from "../actions";

type BrandingState = BrandingStyle & {
  invoiceTitle: string;
  invoiceNotes: string;
  invoiceFooter: string;
  poTitle: string;
  poNotes: string;
  poFooter: string;
  invoicePrefix: string;
  expensePrefix: string;
  poPrefix: string;
};

const SWATCHES = ["#2f6fed", "#0f766e", "#16a34a", "#b45309", "#dc2626", "#7c3aed", "#db2777", "#0f172a"];

function Choice({ name, value, current, onPick, children }: { name: string; value: string; current: string; onPick: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className={clsx("cursor-pointer rounded-lg border px-3 py-1.5 text-sm", current === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onPick(value)} className="sr-only" />
      {children}
    </label>
  );
}

export function BrandingForm({ org, currency, initial }: { org: DocumentOrg; currency: string; initial: BrandingState }) {
  const [s, setS] = useState(initial);
  const [preview, setPreview] = useState<"invoice" | "po">("invoice");
  const [state, formAction] = useActionState(saveBranding, {});
  const set = <K extends keyof BrandingState>(k: K) => (v: BrandingState[K]) => setS((p) => ({ ...p, [k]: v }));
  const m = (n: number) => formatMoney(n, currency);

  const sample = {
    title: preview === "invoice" ? s.invoiceTitle : s.poTitle,
    number: preview === "invoice" ? `${s.invoicePrefix}0001` : `${s.poPrefix}0001`,
    meta: [
      { label: "Date", value: "01 Jan 2026" },
      { label: preview === "invoice" ? "Due date" : "Delivery by", value: "31 Jan 2026" },
    ],
    partyHeading: preview === "invoice" ? "Bill to" : "Vendor",
    party: { name: preview === "invoice" ? "Sample Customer LLC" : "Sample Supplier Co.", lines: ["12 Example Street", "contact@example.com"] },
    showQuantity: true,
    lines: [
      { description: "Consulting services", quantity: "10", unitPrice: m(15000), amount: m(150000) },
      { description: "Setup fee", quantity: "1", unitPrice: m(25000), amount: m(25000) },
    ],
    totals: [
      { label: "Subtotal", value: m(175000) },
      { label: "Tax", value: m(8750) },
      { label: "Total", value: m(183750), strong: true },
    ],
    notes: preview === "invoice" ? s.invoiceNotes : s.poNotes,
    footer: preview === "invoice" ? s.invoiceFooter : s.poFooter,
  };

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="card h-fit space-y-5 p-5">
        <FormError error={state.error} />
        <Field label="Template">
          <div className="flex flex-wrap gap-2">
            {["classic", "modern", "compact"].map((v) => (
              <Choice key={v} name="layout" value={v} current={s.layout} onPick={set("layout")}>{v[0].toUpperCase() + v.slice(1)}</Choice>
            ))}
          </div>
        </Field>
        <Field label="Accent colour">
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((c) => (
              <button key={c} type="button" onClick={() => set("accentColor")(c)} className={clsx("h-7 w-7 rounded-full ring-offset-2", s.accentColor === c && "ring-2 ring-slate-400")} style={{ background: c }} aria-label={c} />
            ))}
            <input type="color" name="accentColor" value={s.accentColor} onChange={(e) => set("accentColor")(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200" />
          </div>
        </Field>
        <Field label="Font">
          <div className="flex flex-wrap gap-2">
            {[["sans", "Modern"], ["serif", "Classic serif"], ["mono", "Typewriter"]].map(([v, l]) => (
              <Choice key={v} name="font" value={v} current={s.font} onPick={set("font")}>{l}</Choice>
            ))}
          </div>
        </Field>
        <Field label="Logo position">
          <div className="flex gap-2">
            {["left", "center", "right"].map((v) => (
              <Choice key={v} name="logoPosition" value={v} current={s.logoPosition} onPick={set("logoPosition")}>{v[0].toUpperCase() + v.slice(1)}</Choice>
            ))}
          </div>
        </Field>
        <Field label="Your address">
          <div className="flex gap-2">
            {[["left", "Under logo"], ["right", "Opposite logo"]].map(([v, l]) => (
              <Choice key={v} name="addressPosition" value={v} current={s.addressPosition} onPick={set("addressPosition")}>{l}</Choice>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="showTaxNumber" checked={s.showTaxNumber} onChange={(e) => set("showTaxNumber")(e.target.checked)} />
          Show my tax number
        </label>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Invoices</h3>
          <Field label="Title"><input name="invoiceTitle" value={s.invoiceTitle} onChange={(e) => set("invoiceTitle")(e.target.value)} className="input" /></Field>
          <Field label="Default notes / payment instructions"><textarea name="invoiceNotes" rows={3} value={s.invoiceNotes} onChange={(e) => set("invoiceNotes")(e.target.value)} className="input" placeholder="Bank: … IBAN: …" /></Field>
          <Field label="Footer"><input name="invoiceFooter" value={s.invoiceFooter} onChange={(e) => set("invoiceFooter")(e.target.value)} className="input" placeholder="Thank you for your business!" /></Field>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Purchase orders</h3>
          <Field label="Title"><input name="poTitle" value={s.poTitle} onChange={(e) => set("poTitle")(e.target.value)} className="input" /></Field>
          <Field label="Default notes"><textarea name="poNotes" rows={2} value={s.poNotes} onChange={(e) => set("poNotes")(e.target.value)} className="input" /></Field>
          <Field label="Footer"><input name="poFooter" value={s.poFooter} onChange={(e) => set("poFooter")(e.target.value)} className="input" /></Field>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Numbering</h3>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Sales"><input name="invoicePrefix" value={s.invoicePrefix} onChange={(e) => set("invoicePrefix")(e.target.value)} className="input" /></Field>
            <Field label="Expenses"><input name="expensePrefix" value={s.expensePrefix} onChange={(e) => set("expensePrefix")(e.target.value)} className="input" /></Field>
            <Field label="POs"><input name="poPrefix" value={s.poPrefix} onChange={(e) => set("poPrefix")(e.target.value)} className="input" /></Field>
          </div>
          <p className="hint">Each transaction gets a unique number, e.g. {s.invoicePrefix}0001.</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          {state.ok && <span className="text-sm text-emerald-600">Saved ✓</span>}
          <SubmitButton>Save design</SubmitButton>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-3 flex gap-2">
          <Choice name="_preview" value="invoice" current={preview} onPick={() => setPreview("invoice")}>Invoice preview</Choice>
          <Choice name="_preview" value="po" current={preview} onPick={() => setPreview("po")}>Purchase order preview</Choice>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
          <DocumentView org={org} doc={sample} style={s} />
        </div>
      </div>
    </form>
  );
}
