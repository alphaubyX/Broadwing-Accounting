import clsx from "clsx";

// Presentational invoice / purchase-order renderer. Used for printing / PDF
// and for the live preview under Settings → Invoice customization, so it must
// stay free of server-only imports.

export const TEMPLATES = [
  { value: "contemporary", label: "Contemporary" },
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "compact", label: "Compact" },
] as const;

export interface BrandingStyle {
  accentColor: string;
  font: string; // sans | serif | mono
  layout: string; // contemporary | modern | classic | compact
  logoPosition: string; // left | center | right
  addressPosition: string; // left | right
  showTaxNumber: boolean;
  showLogo: boolean;
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
  /** Highlighted figure in the header (amount due / order total). */
  highlight?: { label: string; value: string };
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
  const layout = TEMPLATES.some((t) => t.value === style.layout) ? style.layout : "contemporary";
  return (
    <div
      className="mx-auto w-full max-w-[820px] bg-white text-slate-800 shadow-sm print:shadow-none"
      style={{ fontFamily: FONT[style.font] ?? FONT.sans }}
    >
      {layout === "contemporary" ? <ContemporaryHeader org={org} doc={doc} style={style} /> : <BandHeader org={org} doc={doc} style={style} layout={layout} />}
      <Body doc={doc} style={style} layout={layout} />
    </div>
  );
}

function Logo({ org, style, onAccent }: { org: DocumentOrg; style: BrandingStyle; onAccent?: boolean }) {
  const compact = style.layout === "compact";
  if (style.showLogo && org.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={org.logoUrl} alt={org.name} className={clsx("object-contain", compact ? "max-h-12" : "max-h-20", "max-w-[220px]")} />;
  }
  return (
    <div className={clsx("font-bold", compact ? "text-lg" : "text-2xl")} style={{ color: onAccent ? "white" : style.accentColor }}>
      {org.name}
    </div>
  );
}

function Address({ org, style, onAccent, showName }: { org: DocumentOrg; style: BrandingStyle; onAccent?: boolean; showName: boolean }) {
  return (
    <div className={clsx("text-xs leading-5", onAccent ? "text-white/90" : "text-slate-600")}>
      {showName && <div className={clsx("text-sm font-semibold", onAccent ? "text-white" : "text-slate-900")}>{org.name}</div>}
      {org.addressLines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
      {org.contactLines.length > 0 && <div className="mt-1" />}
      {org.contactLines.map((l, i) => (
        <div key={`c${i}`}>{l}</div>
      ))}
      {style.showTaxNumber && org.taxNumber && (
        <div className="mt-1">
          {org.taxNumberLabel}: {org.taxNumber}
        </div>
      )}
    </div>
  );
}

/** Wave-style: logo on one side, title and business details on the other, amount due highlighted. */
function ContemporaryHeader({ org, doc, style }: { org: DocumentOrg; doc: DocumentData; style: BrandingStyle }) {
  const logoShown = style.showLogo && !!org.logoUrl;
  const centered = style.logoPosition === "center";
  return (
    <>
      <div
        className={clsx(
          "flex gap-6 border-b border-slate-200 px-10 py-8",
          centered ? "flex-col items-center text-center" : "items-start justify-between",
          style.logoPosition === "right" && "flex-row-reverse",
        )}
      >
        <div>{logoShown ? <Logo org={org} style={style} /> : <div />}</div>
        <div className={clsx(centered ? "text-center" : style.logoPosition === "right" ? "text-left" : "text-right")}>
          <div className="text-3xl font-light uppercase tracking-wide text-slate-800">{doc.title}</div>
          <div className="mt-3">
            <Address org={org} style={style} showName />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 px-10 py-6">
        <PartyBlock doc={doc} accent="#94a3b8" />
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-xs">
          <dt className="text-right text-slate-500">Number:</dt>
          <dd className="font-medium">{doc.number}</dd>
          {doc.meta.map((m) => (
            <div key={m.label} className="contents">
              <dt className="text-right text-slate-500">{m.label}:</dt>
              <dd className="font-medium">{m.value}</dd>
            </div>
          ))}
          {doc.highlight && (
            <div className="col-span-2 mt-1 grid grid-cols-[auto_auto] gap-x-4 rounded bg-slate-100 px-2 py-1.5">
              <dt className="text-right font-semibold">{doc.highlight.label}:</dt>
              <dd className="font-bold">{doc.highlight.value}</dd>
            </div>
          )}
        </dl>
      </div>
    </>
  );
}

function PartyBlock({ doc, accent }: { doc: DocumentData; accent: string }) {
  if (!doc.party) return <div />;
  return (
    <div className="text-sm">
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
  );
}

/** Modern (coloured band), classic (accent rule) and compact headers. */
function BandHeader({ org, doc, style, layout }: { org: DocumentOrg; doc: DocumentData; style: BrandingStyle; layout: string }) {
  const modern = layout === "modern";
  const compact = layout === "compact";
  const accent = style.accentColor;
  const logoShown = style.showLogo && !!org.logoUrl;
  const address = <Address org={org} style={style} onAccent={modern} showName={logoShown} />;
  const addressRight = style.addressPosition === "right";
  const pad = compact ? "px-8 py-6" : "px-10 py-8";

  const header =
    style.logoPosition === "center" ? (
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo org={org} style={style} onAccent={modern} />
        {address}
      </div>
    ) : (
      <div className={clsx("flex items-start justify-between gap-6", style.logoPosition === "right" && "flex-row-reverse")}>
        <div className={clsx(style.logoPosition === "right" && "text-right")}>
          <Logo org={org} style={style} onAccent={modern} />
          {(style.logoPosition === "left") !== addressRight && <div className="mt-3">{address}</div>}
        </div>
        {(style.logoPosition === "left") === addressRight && (
          <div className={clsx(style.logoPosition === "left" ? "text-right" : "text-left")}>{address}</div>
        )}
      </div>
    );

  return (
    <>
      <div className={pad} style={modern ? { background: accent } : { borderTop: `6px solid ${accent}` }}>
        {header}
      </div>
      <div className={clsx(pad, "pb-0 pt-6")}>
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
        <div className="mt-6">
          <PartyBlock doc={doc} accent={accent} />
        </div>
      </div>
    </>
  );
}

function Body({ doc, style, layout }: { doc: DocumentData; style: BrandingStyle; layout: string }) {
  const compact = layout === "compact";
  const filled = layout === "modern" || layout === "contemporary";
  const accent = style.accentColor;
  return (
    <div className={clsx(compact ? "px-8 pb-6" : "px-10 pb-8", "pt-6")}>
      <table className={clsx("w-full text-sm", compact && "text-xs")}>
        <thead>
          <tr style={filled ? { background: accent, color: "white" } : { borderBottom: `2px solid ${accent}` }}>
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
        <dl className="w-72 space-y-1 text-sm">
          {doc.totals.map((t) => (
            <div
              key={t.label}
              className={clsx("flex justify-between gap-4", t.strong && "border-t pt-2 text-base font-bold")}
              style={t.strong ? { borderColor: layout === "contemporary" ? "#cbd5e1" : accent } : undefined}
            >
              <dt className={t.strong ? "" : "text-slate-500"}>{t.label}</dt>
              <dd className="whitespace-nowrap">{t.value}</dd>
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
        <div className="mt-10 whitespace-pre-line border-t border-slate-200 pt-4 text-center text-xs text-slate-500">{doc.footer}</div>
      )}
    </div>
  );
}
