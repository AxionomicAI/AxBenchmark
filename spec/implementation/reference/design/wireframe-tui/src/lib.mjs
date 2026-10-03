// Character-grid primitives for the AxBenchmark TUI wireframes.
// Every frame is a fixed cols×rows grid of cells (1ch × 1 line). Nothing is positioned between cells:
// widgets write characters into the grid and the renderer emits one <div> per terminal row.
import { createHash } from 'node:crypto';

export const SIZES = {
  wide: { id: 'wide', cols: 120, rows: 40, label: '120×40' },
  compact: { id: 'compact', cols: 80, rows: 24, label: '80×24' },
};
// JetBrains Mono advance is 0.6em: 13px → 7.8px per cell; one terminal line = 16px.
export const CELL = { font: 13, w: 7.8, h: 16 };
export const ACCENT = '#e5a50a';
export const ACCENTS = ['#e5a50a', '#3fb6c6', '#c678dd', '#8fbf4f'];

export const sha = (seed) => createHash('sha256').update(seed).digest('hex');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
export const len = (s) => [...String(s)].length;

// Pad or truncate to exactly n cells; truncation ends with an ellipsis, as Textual does.
export const fit = (s, n, align = 'left') => {
  const a = [...String(s)];
  if (n <= 0) return '';
  if (a.length > n) return a.slice(0, n - 1).join('') + '…';
  const gap = n - a.length;
  if (align === 'right') return ' '.repeat(gap) + a.join('');
  if (align === 'center') return ' '.repeat(Math.floor(gap / 2)) + a.join('') + ' '.repeat(Math.ceil(gap / 2));
  return a.join('') + ' '.repeat(gap);
};

export const wrap = (text, n) => {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if (len(line) + 1 + len(word) <= n) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
};

// Cell: c = character, f = foreground/effect classes, b = background class, a = action, d = dimmed by a modal.
// Classes: B0 $background · B1 $surface · B2 $panel · BS block-cursor-blurred · BA $primary · BT $primary tint
//          mu muted · ln rule · ac $primary text · on text on $primary · bd bold · dm dim · it italic · ul underline · rv reverse
export class Grid {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.rows = Array.from({ length: h }, () => Array.from({ length: w }, () => ({ c: ' ', f: '', b: 'B0', a: '', d: false })));
    this.regions = [];
  }
  at(x, y) { return y >= 0 && y < this.h && x >= 0 && x < this.w ? this.rows[y][x] : null; }
  text(x, y, s, f = '', o = {}) {
    let i = 0;
    for (const ch of String(s)) {
      const c = this.at(x + i, y);
      if (c) { c.c = ch; c.f = f; c.d = false; if (o.b) c.b = o.b; if (o.a !== undefined) c.a = o.a; }
      i++;
    }
    return x + i;
  }
  fill(x, y, w, h, b = 'B0') {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const c = this.at(i, j); if (c) Object.assign(c, { c: ' ', f: '', b, a: '', d: false }); }
  }
  paint(x, y, w, h, o) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const c = this.at(i, j); if (c) { if (o.b) c.b = o.b; if (o.f !== undefined) c.f = o.f; } }
  }
  link(x, y, w, h, a) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const c = this.at(i, j); if (c) c.a = a; }
  }
  dim() { for (const r of this.rows) for (const c of r) { c.d = true; c.a = ''; } this.regions = this.regions.map((r) => ({ ...r, under: true })); }
  // Annotation only: the widget a rectangle maps to, drawn as an outline when "widget outlines" is on.
  region(x, y, w, h, widget, sel) { this.regions.push({ x, y, w, h, widget, sel }); }
  hline(x, y, w, f = 'ln', ch = '─') { this.text(x, y, ch.repeat(Math.max(0, w)), f); }
  box(x, y, w, h, o = {}) {
    const f = o.f ?? 'ln';
    const [tl, tr, bl, br] = o.round ? ['╭', '╮', '╰', '╯'] : ['┌', '┐', '└', '┘'];
    if (o.fill) this.fill(x, y, w, h, o.fill);
    this.text(x, y, tl + '─'.repeat(w - 2) + tr, f);
    this.text(x, y + h - 1, bl + '─'.repeat(w - 2) + br, f);
    for (let j = y + 1; j < y + h - 1; j++) { this.text(x, j, '│', f); this.text(x + w - 1, j, '│', f); }
    if (o.title) this.text(x + 2, y, ` ${fit(o.title, w - 6)} `.replace(/ +$/, ' '), o.tf ?? (f === 'ac' ? 'ac bd' : 'bd'));
    if (o.sub) { const s = ` ${o.sub} `; this.text(x + w - 2 - len(s), y + h - 1, s, o.sf ?? 'mu'); }
  }
  html(ctx) {
    return this.rows.map((row) => {
      let out = '', run = null;
      const flush = () => {
        if (!run) return;
        const cls = [run.b, ...run.f.split(' '), run.d ? 'xd' : ''].filter(Boolean).join(' ');
        const t = esc(run.t);
        if (run.a.startsWith('go:') && ctx.href) out += `<a class="${cls} k" href="${ctx.href(run.a.slice(3))}">${t}</a>`;
        else if (run.a.startsWith('do:') && ctx.live) out += `<button type="button" class="${cls} k" onClick="{{ ${run.a.slice(3)} }}">${t}</button>`;
        else out += `<span class="${cls}">${t}</span>`;
        run = null;
      };
      for (const c of row) {
        if (run && run.f === c.f && run.b === c.b && run.a === c.a && run.d === c.d) run.t += c.c;
        else { flush(); run = { f: c.f, b: c.b, a: c.a, d: c.d, t: c.c }; }
      }
      flush();
      return `<div class="r">${out}</div>`;
    }).join('\n');
  }
  overlay() {
    return this.regions.filter((r) => !r.under).map((r) => `<div class="ov" data-widget="${esc(r.widget)}" data-tcss="${esc(r.sel)}" style="left: ${r.x}ch; top: ${r.y * CELL.h}px; width: ${r.w}ch; height: ${r.h * CELL.h}px"><span>${esc(r.widget)} ${esc(r.sel)}</span></div>`).join('\n');
  }
}

// ---------------------------------------------------------------- Textual widgets, drawn into a Grid

// Header(show_clock=False): icon left, "title — sub_title" centered, $panel background.
export const header = (g, title, sub) => {
  g.fill(0, 0, g.w, 1, 'B2');
  g.text(1, 0, '○', 'mu');
  const s = `${title} — ${sub}`;
  const x = Math.floor((g.w - len(s)) / 2);
  g.text(x, 0, title, 'bd');
  g.text(x + len(title), 0, ` — ${sub}`, 'mu');
  g.region(0, 0, g.w, 1, 'Header', '');
};

// Footer: "key description" pairs, key in bold $primary (footer-key). Disabled bindings are dim.
// Keys: { k, d, go?, do?, off? }. Throws when the bindings do not fit, so overflow is caught at build time.
export const footer = (g, keys, right = '^p Palette') => {
  const y = g.h - 1;
  g.fill(0, y, g.w, 1, 'B2');
  let x = 1;
  const rk = right.split(' ')[0], rd = right.slice(rk.length + 1);
  const limit = g.w - (right ? len(right) + 3 : 1);
  for (const key of keys) {
    const need = len(key.k) + 1 + len(key.d) + 2;
    if (x + need - 2 > limit) throw new Error(`Footer overflow at "${key.k} ${key.d}" (${g.w} cols)`);
    const x0 = x;
    x = g.text(x, y, key.k, key.off ? 'mu dm' : 'ac bd');
    x = g.text(x + 1, y, key.d, key.off ? 'mu dm' : '') + 2;
    if (key.go || key.do) g.link(x0, y, x - x0 - 2, 1, key.go ? 'go:' + key.go : 'do:' + key.do);
  }
  if (right) {
    const rx = g.w - 1 - len(right);
    g.text(rx, y, rk, 'ac bd');
    g.text(rx + len(rk) + 1, y, rd, 'mu');
    g.link(rx, y, len(right), 1, 'go:CommandPalette');
  }
  g.region(0, y, g.w, 1, 'Footer', '');
};

// DataTable. cols: [{ l, w, al }] where w includes one leading pad cell. rows: [{ v:[…], f?, go? }].
// Cell values may be { t, f } for per-cell style. Cursor: $primary when focused, blurred cursor otherwise.
// A label with "\n" gives the table a two-line header (DataTable header_height = 2), e.g. "In tok\n(cached)".
export const table = (g, x, y, w, cols, rows, o = {}) => {
  const sum = cols.reduce((n, c) => n + c.w, 0);
  if (sum !== w) throw new Error(`Table columns sum to ${sum}, expected ${w}: ${cols.map((c) => c.l).join(',')}`);
  const hh = cols.some((c) => String(c.l).includes('\n')) ? 2 : 1;
  g.fill(x, y, w, hh, 'B2');
  let cx = x;
  for (const c of cols) {
    const ls = String(c.l).split('\n');
    ls.forEach((l, j) => g.text(cx, y + hh - ls.length + j, ' ' + fit(l, c.w - 1, c.al), 'bd'));
    cx += c.w;
  }
  y += hh - 1;
  rows.slice(0, o.max ?? rows.length).forEach((r, i) => {
    const ry = y + 1 + i;
    const cur = i === o.cursor;
    const b = cur ? (o.focused ? 'BA' : 'BS') : 'B0';
    g.fill(x, ry, w, 1, b);
    let cx2 = x;
    cols.forEach((c, j) => {
      const v = r.v[j] ?? '';
      const t = typeof v === 'object' ? v.t : v;
      let f = typeof v === 'object' ? v.f : (r.f ?? '');
      if (cur && o.focused) f = 'on' + (f.includes('bd') ? ' bd' : '');
      g.text(cx2, ry, ' ' + fit(t, c.w - 1, c.al), f);
      cx2 += c.w;
    });
    if (r.go) g.link(x, ry, w, 1, 'go:' + r.go);
  });
  return y + 1 + Math.min(rows.length, o.max ?? rows.length);
};

// Tabs (inside TabbedContent): labels on one line, an underline row; the active label is bold with a $primary rule.
export const tabs = (g, x, y, w, labels, active, o = {}) => {
  g.hline(x, y + 1, w, 'ln');
  let cx = x + 1;
  labels.forEach((l, i) => {
    const on = i === active;
    g.text(cx, y, ` ${l} `, on ? (o.focused ? 'ac bd' : 'bd') : 'mu');
    if (on) g.hline(cx, y + 1, len(l) + 2, 'ac bd');
    if (o.go?.[i]) g.link(cx, y, len(l) + 2, 1, 'go:' + o.go[i]);
    cx += len(l) + 3;
  });
};

// Button(compact=True). variant primary = $primary block; default = blurred block; focus = reverse video; off = disabled.
export const button = (g, x, y, label, o = {}) => {
  const s = ` ${label} `;
  let b = o.v === 'primary' ? 'BA' : 'BS', f = o.v === 'primary' ? 'on bd' : '';
  if (o.v === 'error') { b = 'BS'; f = 'bd ul'; }
  if (o.off) { b = 'B2'; f = 'mu dm'; }
  if (o.focus) f += ' rv bd';
  g.text(x, y, s, f, { b });
  if (o.go) g.link(x, y, len(s), 1, 'go:' + o.go);
  return x + len(s);
};
// Right-aligned button row; returns x of the first button.
export const buttons = (g, right, y, list) => {
  const width = list.reduce((n, b) => n + len(b.label) + 2, 0) + (list.length - 1) * 2;
  let x = right - width;
  const x0 = x;
  for (const b of list) x = button(g, x, y, b.label, b) + 2;
  return x0;
};

// Input(compact=True). Focused: $primary tint background and a reverse-video caret.
export const input = (g, x, y, w, value, o = {}) => {
  const b = o.focus ? 'BT' : 'B1';
  g.fill(x, y, w, 1, b);
  if (value) g.text(x + 1, y, fit(value, w - 2), o.f ?? '');
  else if (o.ph) g.text(x + 1, y, fit(o.ph, w - 2), 'mu it');
  if (o.focus) { const cx = x + 1 + Math.min(len(value || ''), w - 3); const c = g.at(cx, y); g.text(cx, y, c.c, 'rv'); }
};

export const radios = (g, x, y, options, sel, o = {}) => {
  let cx = x;
  options.forEach((l, i) => {
    const on = i === sel;
    const s = `${on ? '●' : '○'} ${l}`;
    const hl = o.focus && i === (o.hi ?? sel);
    g.text(cx, y, s, hl ? 'bd' : on ? '' : 'mu', hl ? { b: 'BT' } : {});
    cx += len(s) + 3;
  });
};
export const check = (g, x, y, label, on, o = {}) => g.text(x, y, `${on ? '■' : '□'} ${label}`, o.focus ? 'bd' : on ? '' : 'mu', o.focus ? { b: 'BT' } : {});

// ProgressBar(show_eta=False): filled █ in $primary, remainder ░, percentage right.
export const progress = (g, x, y, w, pct) => {
  const bw = w - 5, n = Math.round(bw * pct / 100);
  g.text(x, y, '█'.repeat(n), 'ac');
  g.text(x + n, y, '░'.repeat(bw - n), 'ln');
  g.text(x + bw, y, fit(`${pct}%`, 5, 'right'), 'mu');
};

// LoadingIndicator stand-in: pulsing dots drawn at one instant.
export const loading = (g, x, y, w, label) => {
  const s = '● ● ● ● ●';
  const sx = x + Math.floor((w - len(s)) / 2);
  ['ac', 'ac', 'mu', 'ln', 'ln'].forEach((f, i) => g.text(sx + i * 2, y, '●', f));
  if (label) g.text(x + Math.floor((w - len(label)) / 2), y + 2, label, 'mu');
};

export const scrollbar = (g, x, y, h, start, size) => {
  for (let j = 0; j < h; j++) g.text(x, y + j, j >= start && j < start + size ? '█' : '░', j >= start && j < start + size ? 'mu' : 'ln');
};

// Static paragraph, wrapped to w. Returns the next free row.
export const para = (g, x, y, w, text, f = '') => { const ls = wrap(text, w); ls.forEach((l, i) => g.text(x, y + i, l, f)); return y + ls.length; };

// Label/value rows (Static with a .kv class).
export const kv = (g, x, y, lw, w, pairs) => {
  let yy = y;
  for (const [k, v, f] of pairs) {
    g.text(x, yy, fit(k, lw), 'mu');
    const ls = Array.isArray(v) ? v : [v];
    ls.forEach((l, i) => g.text(x + lw, yy + i, fit(l, w - lw), f ?? ''));
    yy += ls.length;
  }
  return yy;
};

// Notice (Static.notice.-error / -warning / -success): glyph + bold first line, wrapped body.
export const notice = (g, x, y, w, kind, title, body) => {
  const glyph = { error: '✗', warning: '▲', success: '✓', info: '●' }[kind];
  g.text(x, y, glyph, kind === 'error' ? 'bd' : kind === 'success' ? 'ac' : 'bd');
  g.text(x + 2, y, fit(title, w - 2), 'bd');
  return body ? para(g, x + 2, y + 1, w - 2, body, 'mu') : y + 1;
};

// Textual Toast (app.notify): $panel block with a $primary bar, docked bottom-right above the footer.
export const toast = (g, title, body, w = 44) => {
  const ls = wrap(body, w - 4);
  const h = ls.length + 3, x = g.w - w - 1, y = g.h - 1 - h - 1;
  g.fill(x, y, w, h, 'B2');
  for (let j = 0; j < h; j++) g.text(x, y + j, '▌', 'ac', { b: 'B2' });
  g.text(x + 2, y + 1, fit(title, w - 4), 'bd', { b: 'B2' });
  ls.forEach((l, i) => g.text(x + 2, y + 2 + i, l, 'mu', { b: 'B2' }));
  g.region(x, y, w, h, 'Toast', '.-success');
};

// ModalScreen: dims the screen underneath, then draws a centered dialog with a round $primary border.
// Returns the content box (x, y, w) inside "padding: 1 2".
export const modal = (g, w, h, title, o = {}) => {
  g.dim();
  const x = Math.floor((g.w - w) / 2);
  const bottom = o.footer === false ? g.h : g.h - 1;
  const y = Math.max(0, Math.floor((bottom - h) / 2));
  g.box(x, y, w, h, { round: true, f: 'ac', fill: 'B1', title, sub: o.sub });
  g.region(x, y, w, h, 'Vertical', o.sel ?? '#dialog');
  return { x: x + 3, y: y + 2, w: w - 6, bottom: y + h - 3, right: x + w - 3, top: y };
};

// Tree with guides. nodes: [{ t, depth, last, open, sel, f, go }]
export const tree = (g, x, y, w, nodes, o = {}) => {
  nodes.forEach((n, i) => {
    const yy = y + i;
    let prefix = '';
    if (n.depth > 0) prefix = '  '.repeat(n.depth - 1) + (n.last ? '└─ ' : '├─ ');
    const mark = n.kids ? (n.open ? '▾ ' : '▸ ') : '';
    const sel = n.sel;
    const b = sel ? (o.focused ? 'BA' : 'BS') : 'B0';
    g.fill(x, yy, w, 1, b);
    g.text(x, yy, prefix, sel && o.focused ? 'on' : 'ln');
    g.text(x + len(prefix), yy, fit(mark + n.t, w - len(prefix)), sel && o.focused ? 'on bd' : (n.f ?? ''));
    if (n.go) g.link(x, yy, w, 1, 'go:' + n.go);
  });
  return y + nodes.length;
};

// Select(compact=True): current value and a ▾ on $surface; focused = $primary tint.
export const select = (g, x, y, w, value, o = {}) => {
  g.fill(x, y, w, 1, o.focus ? 'BT' : 'B1');
  g.text(x + 1, y, fit(value, w - 4), o.f ?? '');
  g.text(x + w - 2, y, '▾', o.focus ? 'ac bd' : 'mu');
};

// Labelled Select controls laid out left to right; throws when they do not fit.
export const selects = (g, x, y, w, items) => {
  let cx = x;
  for (const it of items) {
    const need = len(it.l) + 1 + it.w;
    if (cx + need > x + w) throw new Error(`Select row overflow at "${it.l}" (${g.w} cols)`);
    g.text(cx, y, it.l, 'mu');
    select(g, cx + len(it.l) + 1, y, it.w, it.v, { focus: it.focus });
    g.region(cx + len(it.l) + 1, y, it.w, 1, 'Select', it.sel ?? '');
    cx += need + 2;
  }
  return cx;
};

// Readiness glyphs: ✓ established · ✗ failed or absent · ? unknown · ▲ limited · ○ not applicable.
export const READY = { ok: '✓', fail: '✗', unknown: '?', warn: '▲', na: '○', cache: '◷' };
export const rcell = (kind, text) => ({ t: `${READY[kind]} ${text}`, f: kind === 'ok' ? '' : kind === 'fail' ? 'bd' : kind === 'na' ? 'mu' : kind === 'warn' ? 'bd' : 'it' });
