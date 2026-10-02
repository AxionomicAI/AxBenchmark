// Regenerate the TUI artboards, canvas index and flat preview in ../preview/. Run: node src/build.mjs
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { SIZES, CELL, ACCENT, ACCENTS, esc, len } from './lib.mjs';
import { CSS, FONT_LINK } from './theme.mjs';
import { GROUPS as M01_GROUPS, SYSTEM } from './boards.mjs';
import { MODULE_GROUPS, MODULE_PAGES } from './boards-modules.mjs';
import { LATER_GROUPS, LATER_PAGES } from './boards-later.mjs';
import { reportPage, REPORT_CSS } from './screens-report.mjs';
import { designSystem, navMap, widgetStates, NAV_H, STATES_H } from './system.mjs';

// M01 groups live on the 'wide' page; M02–M14 groups name their own page.
const GROUPS = [...M01_GROUPS.map((g) => ({ ...g, page: 'wide' })), ...MODULE_GROUPS, ...LATER_GROUPS];

const LEGEND_W = 440, PAD = 24, GAP = 32;
const SUFFIX = { wide: '', compact: '-80x24' };
const out = new URL('../preview/', import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const all = [...SYSTEM, ...GROUPS.flatMap((g) => g.boards.map((b) => ({ ...b, group: g.id })))];
const byName = Object.fromEntries(all.map((b) => [b.name, b]));
if (Object.keys(byName).length !== all.length) throw new Error('Duplicate board name');
const sizesOf = (b) => b.sizes ?? ['wide'];
const file = (name, size) => `${name}${SUFFIX[size]}.dc.html`;
const target = (name, size) => {
  const b = byName[name];
  if (!b) throw new Error('Unknown board link: ' + name);
  return sizesOf(b).includes(size) ? size : sizesOf(b)[0];
};
const ctxFor = (size, mode) => ({
  live: mode === 'dc',
  href: (name) => (mode === 'dc' ? file(name, target(name, size)) : `#${name}-${target(name, size)}`),
});

// ---------------------------------------------------------------- legend and frame

const legendHtml = (lg, ctx, focusList) => `<aside class="lg" style="width: ${LEGEND_W}px; flex-shrink: 0">
<div class="lg-h"><b>${esc(lg.screen)}</b><span class="mut">${esc(lg.file)}</span></div>
<h3>Widget tree</h3>
<pre>${esc(lg.tree)}</pre>
<h3>${esc(lg.selTitle ?? 'IDs and classes · TCSS')}</h3>
<table>${lg.sel.map(([s, r]) => `<tr><td><code>${esc(s)}</code></td><td>${esc(r)}</td></tr>`).join('')}</table>
<h3>${esc(lg.keysTitle ?? 'Key bindings')}</h3>
<table>${lg.keys.map(([k, a, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${a ? `<code>${esc(a)}</code><br>` : ''}<span class="mut">${esc(d)}</span></td></tr>`).join('')}</table>
${focusList.length > 1 ? `<h3>Focus order · tab</h3><ol>${focusList.map(([, l]) => `<li>${esc(l)}</li>`).join('')}</ol>` : ''}
<h3>States and related frames</h3>
<div class="rel">${lg.states.map(([l, n]) => `<a href="${ctx.href(n)}">${esc(l)}</a>`).join('')}</div>
<h3>Notes</h3>
<ul>${lg.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
</aside>`;

const lines = (s, n) => Math.max(1, Math.ceil(len(s) / n));
const legendHeight = (lg, focusList) => {
  let h = 60;
  h += 40 + lg.tree.split('\n').length * 16 + 18;
  h += 40 + lg.sel.reduce((n, [s, r]) => n + Math.max(lines(s, 24), lines(r, 34)) * 17 + 7, 0);
  h += 40 + lg.keys.reduce((n, [, a, d]) => n + (1 + lines(d, 44)) * 17 + 7, 0);
  if (focusList.length > 1) h += 40 + focusList.length * 21;
  h += 40 + 40;
  h += 40 + lg.notes.reduce((n, t) => n + lines(t, 54) * 17 + 4, 0);
  return h;
};

function screenBoard(b, size, mode) {
  const sz = SIZES[size];
  const ctx = ctxFor(size, mode);
  const focusList = b.focus?.[size] ?? [['none', '—']];
  const grids = focusList.map(([key]) => b.render(sz, key));
  const termW = sz.cols * CELL.w, termH = sz.rows * CELL.h;
  const w = Math.ceil(PAD * 2 + termW + GAP + LEGEND_W);
  const leftH = PAD * 2 + 18 + 10 + termH + 10 + 34 + 10 + 40;
  const h = Math.ceil(Math.max(leftH, legendHeight(b.legend, focusList) + PAD * 2) * 1.06 / 20) * 20;
  const live = mode === 'dc';
  const frames = live && grids.length > 1
    ? grids.map((g, i) => `<sc-if value="{{ fv${i} }}" hint-placeholder-val="{{ ${i === 0} }}">\n${g.html(ctx)}\n</sc-if>`).join('\n')
    : grids[0].html(ctx);
  const overlay = live ? `<sc-if value="{{ outlines }}" hint-placeholder-val="{{ false }}">\n${grids[0].overlay()}\n</sc-if>` : '';
  const controls = live
    ? `<div class="ctl">${grids.length > 1 ? `<button type="button" class="kb" onClick="{{ prev }}">shift+tab</button><button type="button" class="kb" onClick="{{ next }}">tab · next focus</button><span>focus {{ focusStep }} · <b>{{ focusName }}</b></span>` : `<span>focus · <b>${esc(focusList[0][1])}</b></span>`}<button type="button" class="kb" onClick="{{ toggleOutlines }}">{{ outlineLabel }}</button></div>`
    : `<div class="ctl"><span>focus · <b>${esc(focusList[0][1])}</b></span></div>`;
  const root = live
    ? `<div class="ax t-{{ theme }}" style="--ac: {{ accent }}; width: ${w}px; height: ${h}px; display: flex; align-items: flex-start; gap: ${GAP}px; padding: ${PAD}px; overflow: hidden">`
    : `<div class="ax" style="width: ${w}px; display: flex; align-items: flex-start; gap: ${GAP}px; padding: ${PAD}px">`;
  const body = `${root}
<div style="display: flex; flex-direction: column; gap: 10px; flex-shrink: 0">
<div class="cap"><b>${esc(b.title)}</b> · ${esc(b.legend.screen)} · ${sz.label} cells</div>
<div class="term" style="width: ${sz.cols}ch; height: ${termH}px">
${frames}
${overlay}
</div>
${controls}
</div>
${legendHtml(b.legend, ctx, focusList)}
</div>`;
  return { body, w, h, focusNames: focusList.map(([, l]) => l) };
}

function specialBoard(b, mode) {
  const ctx = ctxFor('wide', mode);
  const inner = { system: designSystem, navmap: navMap, states: widgetStates, report: reportPage }[b.special](ctx);
  const w = 1456, h = { system: 2560, navmap: NAV_H, states: STATES_H, report: 3040 }[b.special];
  const live = mode === 'dc';
  const root = live
    ? `<div class="ax t-{{ theme }}" style="--ac: {{ accent }}; width: ${w}px; height: ${h}px; padding: 40px 48px; overflow: hidden">`
    : `<div class="ax" style="width: ${w}px; padding: 40px 48px">`;
  return { body: `${root}\n${inner}\n</div>`, w, h, focusNames: ['—'], css: b.special === 'report' ? REPORT_CSS : '' };
}

const logic = (names) => `class Component extends DCLogic {
  renderVals() {
    const s = this.state || {};
    const names = ${JSON.stringify(names)};
    const n = names.length;
    const f = s.focus || 0;
    const o = !!s.outlines;
    const vals = {
      theme: this.props.theme ?? 'dark',
      accent: this.props.accent ?? '${ACCENT}',
      focusName: names[f],
      focusStep: (f + 1) + ' of ' + n,
      outlines: o,
      outlineLabel: o ? 'hide widget outlines' : 'show widget outlines',
      next: () => this.setState({ focus: (f + 1) % n, outlines: o }),
      prev: () => this.setState({ focus: (f + n - 1) % n, outlines: o }),
      toggleOutlines: () => this.setState({ focus: f, outlines: !o }),
    };
    for (let i = 0; i < n; i++) vals['fv' + i] = f === i;
    return vals;
  }
}`;

const props = (w, h) => JSON.stringify({
  theme: { editor: 'enum', options: ['dark', 'light'], default: 'dark', section: 'Wireframe' },
  accent: { editor: 'color', default: ACCENT, options: ACCENTS, section: 'Wireframe' },
  $preview: { width: w, height: h },
});

const doc = (title, built) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${FONT_LINK}
<style>${CSS}${built.css ?? ''}</style>
</helmet>
${built.body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${props(built.w, built.h)}'>
${logic(built.focusNames)}
</script>
</body>
</html>
`;

// ---------------------------------------------------------------- artboards + canvas index

const PAGES = [
  { id: 'system', name: 'Design system · map' },
  { id: 'wide', name: '120×40 · M01 library and identity' },
  ...MODULE_PAGES,
  ...LATER_PAGES,
  { id: 'compact', name: '80×24 · compact reflow' },
];
const boards = {}, order = [], notes = {};
const ROW_GAP = 460, COL_GAP = 80;
const built = {};

const place = (page, rows) => {
  let y = 0;
  for (const row of rows) {
    let x = 0, maxH = 0;
    for (const { b, size } of row.items) {
      const r = b.special ? specialBoard(b, 'dc') : screenBoard(b, size, 'dc');
      const name = b.name === 'NavMap' ? 'Main' : b.name;
      const f = file(name, size);
      writeFileSync(new URL(f, out), doc(`${b.title} · ${SIZES[size].label}`, r));
      boards[f] = { x, y, w: r.w, h: r.h, title: `${b.name}${SUFFIX[size]} · ${b.title}`, page, is_interactive: true };
      order.push(f);
      built[`${b.name}-${size}`] = true;
      x += r.w + COL_GAP;
      maxH = Math.max(maxH, r.h);
    }
    if (row.title) notes[`row-${page}-${row.id}`] = { x: 0, y: y - 300, text: row.title, kind: 'title1', maxW: Math.min(8000, Math.max(1456, x - COL_GAP)), page };
    y += maxH + ROW_GAP;
  }
};

// The navigation map is the canvas entry and is written as Main.dc.html.
const MAIN = { ...byName.NavMap, name: 'Main' };
byName.Main = MAIN;
place('system', [{ id: 'system', title: 'AxBenchmark TUI · design system and navigation', items: [{ b: MAIN, size: 'wide' }, { b: byName.DesignSystem, size: 'wide' }] }]);
for (const p of PAGES.filter((p) => p.id !== 'system' && p.id !== 'compact')) place(p.id, GROUPS.filter((g) => g.page === p.id).map((g) => ({ id: g.id, title: g.title, items: g.boards.map((b) => ({ b, size: sizesOf(b)[0] })) })));
place('compact', GROUPS.map((g) => ({ id: g.id, title: `${g.title} · 80×24`, items: g.boards.filter((b) => sizesOf(b).includes('compact') && sizesOf(b).includes('wide')).map((b) => ({ b, size: 'compact' })) })).filter((r) => r.items.length));

const ABOUT = 'AxBenchmark terminal UI, modules M01–M18 (template library and identity, retained results, environment readiness, model catalog, headless execution and isolation, weights and rankings, setup and launch, verification and evidence, the default inventory benchmark, measurements and cost, run orchestration, quality judging, the HTML report, the command line, the terminal interface, custom template planning, ZIP exchange and hardware monitoring). M13 also shows a wireframe of the generated HTML file, and M14 plain terminal output. Low-fidelity Textual wireframes: fixed character grids at 120×40 and 80×24, grayscale plus one accent named by Textual theme variables. Proposed design, not implemented; example data is fictional except the inventory task prompts; M02, M06, M10 and M13 numbers are computed from one shared set of 12 results. Press Play to follow links; inside a frame use "tab · next focus" and "show widget outlines". Tweaks switch dark/light and the accent.';
for (const p of PAGES) notes['about-' + p.id] = { x: -560, y: 0, w: 460, page: p.id, fill: 'gray', text: ABOUT };

const canvas = { v: 3, attachments: {}, createdOnFiles: { v: 1, at: '2026-10-01T21:40:00Z' }, title: 'AxBenchmark TUI Wireframes', launch: { view: 'canvas', page: 'system' }, pages: PAGES, boards, order, notes, designSystems: [] };
writeFileSync(new URL('canvas.json', out), JSON.stringify(canvas, null, 2) + '\n');

// ---------------------------------------------------------------- flat preview (no canvas needed)

const sections = [
  { id: 'system', title: 'Design system and navigation', note: 'Theme variables, text effects, widget catalogue, glyphs, rules and the flow map for M01–M18.', items: [{ b: MAIN, size: 'wide' }, { b: byName.DesignSystem, size: 'wide' }] },
  ...GROUPS.map((g) => ({ id: g.id, title: g.title, note: g.note, items: g.boards.flatMap((b) => sizesOf(b).map((size) => ({ b, size }))) })),
];
const article = ({ b, size }) => {
  const r = b.special ? specialBoard(b, 'static') : screenBoard(b, size, 'static');
  return `<article class="board" id="${b.name === 'NavMap' || b.name === 'Main' ? 'Main' : b.name}-${size}" data-size="${size}" style="--w: ${r.w}"><h3>${esc(b.title)} <span>${SIZES[size].label} · ${esc(file(b.name, size))}</span></h3><div class="fit">${r.body}</div></article>`;
};
writeFileSync(new URL('preview.html', out), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AxBenchmark TUI · M01–M18 wireframes</title>
${FONT_LINK}
<style>${CSS}${REPORT_CSS}
html,body{background:var(--chrome);color:var(--fg)}
body{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace}
.top{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;padding:14px 24px;background:var(--paper);border-bottom:1px solid var(--ln);font-size:13px}
.top h1{margin:0;font-size:16px}.top nav{display:flex;flex-wrap:wrap;gap:6px 16px}.top a{color:var(--ac)}
.top label{display:flex;gap:6px;align-items:center;color:var(--mu)}
.top select{font:inherit;background:var(--bg);color:var(--fg);border:1px solid var(--ln);padding:4px 6px}
main{padding:8px 24px 64px}
section>h2{margin:36px 0 4px;font-size:20px}section>p{margin:0 0 16px;max-width:960px;color:var(--mu);font-size:13px;line-height:20px}
.board{margin:0 0 28px}.board h3{margin:0 0 8px;font-size:14px}.board h3 span{color:var(--mu);font-weight:400;font-size:12px}
.fit{zoom:var(--s,1);width:max-content;outline:1px solid var(--ln)}
:root[data-size="wide"] .board[data-size="compact"],:root[data-size="compact"] .board[data-size="wide"]:not([id^="Main"]):not([id^="DesignSystem"]){display:none}
@media(max-width:600px){.top{position:static}main{padding:8px 12px 48px}}
</style></head>
<body class="t-dark" style="--ac: ${ACCENT}">
<header class="top"><h1>AxBenchmark TUI · M01–M18 wireframes</h1>
<label>Theme <select id="theme"><option value="dark">dark</option><option value="light">light</option></select></label>
<label>Size <select id="size"><option value="all">120×40 and 80×24</option><option value="wide">120×40</option><option value="compact">80×24</option></select></label>
<nav>${sections.map((s) => `<a href="#sec-${s.id}">${esc(s.title)}</a>`).join('')}</nav></header>
<main class="ax" style="background: transparent">${sections.map((s) => `<section id="sec-${s.id}"><h2>${esc(s.title)}</h2><p>${esc(s.note)}</p>${s.items.map(article).join('\n')}</section>`).join('\n')}</main>
<script>
(() => {
  const root = document.documentElement, body = document.body;
  const get = (k, d) => { try { return localStorage.getItem('axbenchmark-tui-' + k) || d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem('axbenchmark-tui-' + k, v); } catch {} };
  const theme = document.getElementById('theme'), size = document.getElementById('size');
  const apply = () => { body.className = 't-' + theme.value; root.dataset.size = size.value; fit(); };
  const fit = () => document.querySelectorAll('.board').forEach((b) => { const w = +getComputedStyle(b).getPropertyValue('--w'); b.style.setProperty('--s', Math.min(1, (innerWidth - 50) / w).toFixed(4)); });
  theme.value = get('theme', 'dark'); size.value = get('size', 'all');
  theme.onchange = () => { set('theme', theme.value); apply(); }; size.onchange = () => { set('size', size.value); apply(); };
  addEventListener('resize', fit); apply();
})();
</script>
</body></html>
`);

writeFileSync(new URL('../index.html', import.meta.url), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AxBenchmark · TUI wireframe preview</title>
  <script>location.replace('./preview/preview.html' + location.search + location.hash);</script>
</head>
<body><p><a href="./preview/preview.html">Open the AxBenchmark TUI wireframe preview</a></p></body>
</html>
`);

console.log(`Built ${order.length} artboards (${Object.keys(built).length} frames) and preview/preview.html.`);
