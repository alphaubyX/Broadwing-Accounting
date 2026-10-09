"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ImagePlus } from "lucide-react";
import { DocumentView, TEMPLATES, type BrandingStyle, type DocumentData, type DocumentOrg } from "@/components/DocumentView";
import { Field } from "@/components/Field";
import { ScaledPreview } from "@/components/ScaledPreview";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney } from "@/lib/money";
import { saveInvoiceSettings } from "../actions";

type Settings = BrandingStyle & {
  defaultPaymentTerms: string;
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

const SWATCHES = ["#444444", "#2f6fed", "#0f766e", "#16a34a", "#b45309", "#dc2626", "#7c3aed", "#db2777"];
const HEX = /^#[0-9a-fA-F]{6}$/;

function Choice({ name, value, current, onPick, children }: { name: string; value: string; current: string; onPick: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className={clsx("cursor-pointer rounded-lg border px-3 py-1.5 text-sm", current === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onPick(value)} className="sr-only" />
      {children}
    </label>
  );
}

function sampleDocument(s: Settings, kind: "invoice" | "po", currency: string): DocumentData {
  const m = (n: number) => formatMoney(n, currency);
  const invoice = kind === "invoice";
  return {
    title: invoice ? s.invoiceTitle : s.poTitle,
    number: invoice ? `${s.invoicePrefix}0072` : `${s.poPrefix}0072`,
    meta: [
      { label: "Date", value: "01 Jan 2026" },
      { label: invoice ? "Payment due" : "Delivery by", value: "31 Jan 2026" },
    ],
    highlight: { label: invoice ? `Amount due (${currency})` : `Order total (${currency})`, value: m(183750) },
    partyHeading: invoice ? "Bill to" : "Vendor",
    party: { name: invoice ? "Sarah and Daniel Robinson" : "Sample Supplier Co.", lines: ["823 Main Street, Unit B", "sarah@example.com"] },
    showQuantity: true,
    lines: [
      { description: "Location scouting", quantity: "1", unitPrice: m(20000), amount: m(20000) },
      { description: "Photography and editing", quantity: "10", unitPrice: m(15000), amount: m(150000) },
      { description: "Print album", quantity: "1", unitPrice: m(5000), amount: m(5000) },
    ],
    totals: [
      { label: "Subtotal", value: m(175000) },
      { label: "VAT 5%", value: m(8750) },
      { label: "Total", value: m(183750), strong: true },
    ],
    notes: invoice ? s.invoiceNotes : s.poNotes,
    footer: invoice ? s.invoiceFooter : s.poFooter,
  };
}

export function InvoiceSettingsForm({ org, currency, initial }: { org: DocumentOrg; currency: string; initial: Settings }) {
  const [s, setS] = useState(initial);
  const [hex, setHex] = useState(initial.accentColor);
  const [preview, setPreview] = useState<"invoice" | "po">("invoice");
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState(saveInvoiceSettings, {});
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setAccent = (v: string) => {
    setHex(v);
    if (HEX.test(v)) set("accentColor")(v.toLowerCase());
  };

  // After a successful save the server copy of the logo is current again.
  useEffect(() => {
    if (state.ok) {
      setRemoveLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [state]);

  const previewOrg: DocumentOrg = { ...org, logoUrl };

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[400px_1fr]">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Invoice customization</h2>
          <p className="text-sm text-slate-500">
            How your invoices and purchase orders look. Your address and contact details come from the Business profile.
          </p>
        </div>
        <FormError error={state.error} />

        <section className="card space-y-5 p-5">
          <h3 className="text-sm font-semibold text-slate-900">General settings</h3>
          <div>
            <span className="label">Logo</span>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-44 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="max-h-16 max-w-40 object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <label className="btn-secondary cursor-pointer">
                  <ImagePlus className="h-4 w-4" /> {logoUrl ? "Change logo" : "Upload logo"}
                  <input
                    ref={fileRef}
                    type="file"
                    name="logo"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setLogoUrl(URL.createObjectURL(f));
                        setRemoveLogo(false);
                      }
                    }}
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    className="block font-medium text-brand-600 hover:underline"
                    onClick={() => {
                      setLogoUrl(null);
                      setRemoveLogo(true);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
            <input type="hidden" name="removeLogo" value={removeLogo ? "1" : ""} />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="showLogo" checked={s.showLogo} onChange={(e) => set("showLogo")(e.target.checked)} />
              Display logo
            </label>
          </div>

          <div>
            <span className="label">Accent colour</span>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  className={clsx("h-7 w-7 rounded-full ring-offset-2", s.accentColor === c && "ring-2 ring-slate-400")}
                  style={{ background: c }}
                  aria-label={`Use ${c}`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input type="color" value={s.accentColor} onChange={(e) => setAccent(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-slate-200" aria-label="Pick a colour" />
              <input
                name="accentColor"
                value={hex}
                onChange={(e) => setAccent(e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`)}
                className={clsx("input w-32 font-mono", !HEX.test(hex) && "border-red-300")}
                aria-label="Hex colour"
                maxLength={7}
              />
              <span className="text-sm text-slate-500">Hex</span>
              <span className="h-10 w-10 rounded-lg border border-slate-200" style={{ background: s.accentColor }} />
            </div>
          </div>

          <div>
            <span className="label">Template</span>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <label key={t.value} className="cursor-pointer">
                  <input type="radio" name="layout" value={t.value} checked={s.layout === t.value} onChange={() => set("layout")(t.value)} className="sr-only" />
                  <div className={clsx("relative h-40 overflow-hidden rounded-lg border-2 bg-white", s.layout === t.value ? "border-brand-500" : "border-slate-200 hover:border-slate-300")}>
                    <div className="pointer-events-none absolute left-0 top-0 w-[820px] origin-top-left scale-[0.215]" aria-hidden>
                      <DocumentView org={previewOrg} doc={sampleDocument(s, "invoice", currency)} style={{ ...s, layout: t.value }} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-sm">
                    <span className={clsx("h-4 w-4 rounded-full border-2", s.layout === t.value ? "border-[5px] border-brand-500" : "border-slate-300")} />
                    {t.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

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
          {s.layout !== "contemporary" && (
            <Field label="Your address">
              <div className="flex gap-2">
                {[["left", "Under logo"], ["right", "Opposite logo"]].map(([v, l]) => (
                  <Choice key={v} name="addressPosition" value={v} current={s.addressPosition} onPick={set("addressPosition")}>{l}</Choice>
                ))}
              </div>
            </Field>
          )}
          {s.layout === "contemporary" && <input type="hidden" name="addressPosition" value={s.addressPosition} />}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="showTaxNumber" checked={s.showTaxNumber} onChange={(e) => set("showTaxNumber")(e.target.checked)} />
            Show my business tax number under the address
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Invoices</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title"><input name="invoiceTitle" value={s.invoiceTitle} onChange={(e) => set("invoiceTitle")(e.target.value)} className="input" /></Field>
            <Field label="Payment terms (days)"><input name="defaultPaymentTerms" type="number" min={0} max={365} value={s.defaultPaymentTerms} onChange={(e) => set("defaultPaymentTerms")(e.target.value)} className="input" /></Field>
          </div>
          <Field label="Default notes / payment instructions"><textarea name="invoiceNotes" rows={3} value={s.invoiceNotes} onChange={(e) => set("invoiceNotes")(e.target.value)} className="input" placeholder="Bank: … IBAN: …" /></Field>
          <Field label="Footer"><input name="invoiceFooter" value={s.invoiceFooter} onChange={(e) => set("invoiceFooter")(e.target.value)} className="input" placeholder="Thank you for your business!" /></Field>
        </section>

        <section className="card space-y-4 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Purchase orders</h3>
          <Field label="Title"><input name="poTitle" value={s.poTitle} onChange={(e) => set("poTitle")(e.target.value)} className="input" /></Field>
          <Field label="Default notes"><textarea name="poNotes" rows={2} value={s.poNotes} onChange={(e) => set("poNotes")(e.target.value)} className="input" /></Field>
          <Field label="Footer"><input name="poFooter" value={s.poFooter} onChange={(e) => set("poFooter")(e.target.value)} className="input" /></Field>
        </section>

        <section className="card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Numbering</h3>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Sales"><input name="invoicePrefix" value={s.invoicePrefix} onChange={(e) => set("invoicePrefix")(e.target.value)} className="input" /></Field>
            <Field label="Expenses"><input name="expensePrefix" value={s.expensePrefix} onChange={(e) => set("expensePrefix")(e.target.value)} className="input" /></Field>
            <Field label="POs"><input name="poPrefix" value={s.poPrefix} onChange={(e) => set("poPrefix")(e.target.value)} className="input" /></Field>
          </div>
          <p className="hint">Each transaction gets a unique number, e.g. {s.invoicePrefix}0001.</p>
        </section>

        <div className="flex items-center justify-end gap-3">
          {state.ok && <span className="text-sm text-emerald-600">Saved ✓</span>}
          <SubmitButton>Save all changes</SubmitButton>
        </div>
      </div>

      <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <div className="mb-3 flex gap-2">
          <Choice name="_preview" value="invoice" current={preview} onPick={() => setPreview("invoice")}>Invoice preview</Choice>
          <Choice name="_preview" value="po" current={preview} onPick={() => setPreview("po")}>Purchase order preview</Choice>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
          <ScaledPreview>
            <DocumentView org={previewOrg} doc={sampleDocument(s, preview, currency)} style={s} />
          </ScaledPreview>
        </div>
      </div>
    </form>
  );
}
