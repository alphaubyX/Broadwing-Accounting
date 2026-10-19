/* Broadwing Accounting – small interactive helpers (Alpine.js components). */

const toCents = (v) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

window.formatMoney = (cents, currency) =>
  (cents < 0 ? '-' : '') + currency + ' ' + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

document.addEventListener('alpine:init', () => {
  /** Line items for sales, POs ("items": qty × price) and expenses ("amounts"). */
  Alpine.data('lineItems', ({ lines, taxes, defaultAccount, mode, currency }) => ({
    lines: lines.length ? lines : [],
    taxes,
    mode,
    currency,
    init() {
      if (!this.lines.length) this.add();
    },
    blank() {
      return { description: '', quantity: '1', unit_price: '', account_id: String(defaultAccount ?? ''), tax_id: '' };
    },
    add() {
      this.lines.push(this.blank());
    },
    remove(i) {
      this.lines.splice(i, 1);
    },
    rate(id) {
      const t = this.taxes.find((t) => String(t.id) === String(id));
      return t ? t.rate : 0;
    },
    amount(l) {
      const qty = this.mode === 'items' ? parseFloat(l.quantity) || 0 : 1;
      return Math.round(qty * toCents(l.unit_price));
    },
    tax(l) {
      const r = this.rate(l.tax_id);
      return r ? Math.round((this.amount(l) * r) / 100) : 0;
    },
    get subtotal() {
      return this.lines.reduce((s, l) => s + this.amount(l), 0);
    },
    get taxTotal() {
      return this.lines.reduce((s, l) => s + this.tax(l), 0);
    },
    money(c) {
      return window.formatMoney(c, this.currency);
    },
  }));

  /** Attach files or take a photo; keeps one combined list in the submitted "files[]" input. */
  Alpine.data('attachmentPicker', () => ({
    files: [],
    previews: [],
    add(list) {
      for (const f of list) {
        this.files.push(f);
        this.previews.push({ name: f.name, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
      }
      this.sync();
    },
    remove(i) {
      this.files.splice(i, 1);
      this.previews.splice(i, 1);
      this.sync();
    },
    sync() {
      const dt = new DataTransfer();
      this.files.forEach((f) => dt.items.add(f));
      this.$refs.store.files = dt.files;
    },
  }));
});

/** Shrink fixed-width documents (820px invoices) to fit their container. */
function fitDocuments() {
  document.querySelectorAll('[data-fit]').forEach((box) => {
    const inner = box.firstElementChild;
    if (!inner) return;
    const scale = Math.min(1, box.clientWidth / 820);
    inner.style.transform = `scale(${scale})`;
    inner.style.transformOrigin = 'top left';
    inner.style.width = '820px';
    box.style.height = inner.offsetHeight * scale + 'px';
  });
}
window.addEventListener('load', fitDocuments);
window.addEventListener('resize', fitDocuments);
document.addEventListener('DOMContentLoaded', fitDocuments);
