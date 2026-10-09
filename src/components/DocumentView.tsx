import clsx from "clsx";

// Presentational invoice / purchase-order renderer. Used for printing / PDF
// and for the live preview under Settings → Invoice & PO design, so it must
// stay free of server-only imports.

export interface BrandingStyle {
  accentColor: string;
  font: string; // sans | serif | mono
  layout: string; // classic | modern | compact
  logoPosition: string; // left | center | right
  addressPosition: string; // left | right
  showTaxNumber: boolean;
}

export interface DocumentOrg {
  name: string;
  addressLines: string[];
  contactLines: string[];
  taxNumber?: string | null;
  taxNumberLabel: string;
  logoUrl?: string | null;
}

export interface DocumentData {
  title: string;
  number: string;
  meta: { label: string; value: string }[];
  partyHeading: string;
  party?: { name: string; lines: string[] } | null;
  showQuantity: boolean;
  lines: { description: string; quantity: string; unitPrice: string; amount: string }[];
  totals: { label: string; value: string; strong?: boolean }[];
  notes?: string | null;
  footer?: string | null;
}

const FONT: Record<string, string> = {
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
};

export function DocumentView({ org, doc, style }: { org: DocumentOrg; doc: DocumentData; style: BrandingStyle }) {
  const modern = style.layout === "modern";
  const compact = style.layout === "compact";
  const accent = style.accentColor;

  const logo = org.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={org.logoUrl} alt={org.name} className={clsx("object-contain", compact ? "max-h-12" : "max-h-20", "max-w-[200px]")} />
  ) : (
    <div className={clsx("font-bold", compact ? "text-lg" : "text-2xl")} style={{ color: modern ? "white" : accent }}>
      {org.name}
    </div>
  );

  const address = (
    <div className={clsx("text-xs leading-5", modern ? "text-white/90" : "text-slate-600")}>
      {org.logoUrl && <div className={clsx("text-sm font-semibold", modern ? "text-white" : "text-slate-900")}>{org.name}</div>}
      {org.addressLines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
      {org.contactLines.map((l, i) => (
        <div key={`c${i}`}>{l}</div>
      ))}
      {style.showTaxNumber && org.taxNumber && (
        <div>
          {org.taxNumberLabel}: {org.taxNumber}
        </div>
      )}
    </div>
  );

  const addressRight = style.addressPosition === "right";
  const header =
    style.logoPosition === "center" ? (
      <div className="flex flex-col items-center gap-3 text-center">
        {logo}
        {address}
      </div>
    ) : (
      <div
        className={clsx(
          "flex items-start justify-between gap-6",
          style.logoPosition === "right" && "flex-row-reverse",
        )}
      >
        <div className={clsx(style.logoPosition === "right" && "text-right")}>
          {logo}
          {(style.logoPosition === "left") !== addressRight && <div className="mt-3">{address}</div>}
        </div>
        {(style.logoPosition === "left") === addressRight && (
          <div className={clsx(style.logoPosition === "left" ? "text-right" : "text-left")}>{address}</div>
        )}
      </div>
    );

  const pad = compact ? "px-8 py-6" : "px-10 py-8";

  return (
    <div className="mx-auto w-full max-w-[820px] bg-white text-slate-800 shadow-sm print:shadow-none" style={{ fontFamily: FONT[style.font] ?? FONT.sans }}>
      <div className={pad} style={modern ? { background: accent } : { borderTop: `6px solid ${accent}` }}>
        {header}
      </div>

      <div className={clsx(pad, "pt-6")}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className={clsx("font-bold uppercase tracking-wide", compact ? "text-xl" : "text-3xl")} style={{ color: accent }}>
              {doc.title}
            </div>
            <div className="mt-1 text-sm text-slate-500">#{doc.number}</div>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm">
            {doc.meta.map((m) => (
              <div key={m.label} className="contents">
                <dt className="text-slate-500">{m.label}</dt>
                <dd className="text-right font-medium">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {doc.party && (
          <div className="mt-6 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
              {doc.partyHeading}
            </div>
            <div className="mt-1 font-semibold">{doc.party.name}</div>
            {doc.party.lines.map((l, i) => (
              <div key={i} className="whitespace-pre-line text-slate-600">
                {l}
              </div>
            ))}
          </div>
        )}

        <table className={clsx("mt-6 w-full text-sm", compact && "text-xs")}>
          <thead>
            <tr style={modern ? { background: accent, color: "white" } : { borderBottom: `2px solid ${accent}` }}>
              <th className="px-2 py-2 text-left font-semibold">Description</th>
              {doc.showQuantity && <th className="w-16 px-2 py-2 text-right font-semibold">Qty</th>}
              {doc.showQuantity && <th className="w-28 px-2 py-2 text-right font-semibold">Price</th>}
              <th className="w-32 px-2 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className={clsx("px-2", compact ? "py-1.5" : "py-2.5")}>{l.description}</td>
                {doc.showQuantity && <td className="px-2 text-right">{l.quantity}</td>}
                {doc.showQuantity && <td className="px-2 text-right">{l.unitPrice}</td>}
                <td className="px-2 text-right">{l.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-64 space-y-1 text-sm">
            {doc.totals.map((t) => (
              <div
                key={t.label}
                className={clsx("flex justify-between", t.strong && "border-t pt-2 text-base font-bold")}
                style={t.strong ? { borderColor: accent } : undefined}
              >
                <dt className={t.strong ? "" : "text-slate-500"}>{t.label}</dt>
                <dd>{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {doc.notes && (
          <div className="mt-8 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</div>
            <p className="mt-1 whitespace-pre-line text-slate-600">{doc.notes}</p>
          </div>
        )}
        {doc.footer && (
          <div className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500 whitespace-pre-line">
            {doc.footer}
          </div>
        )}
      </div>
    </div>
  );
}
