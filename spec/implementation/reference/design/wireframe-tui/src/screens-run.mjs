// M11 · Run scheduling and persistent lifecycle.
// RunScreen is the run overview: one lane per harness (2×2), the active configuration of each lane and its queue,
// task progress, and an event log. RunConfigScreen (M05) is the per-configuration detail opened from a lane.
// Detaching, reconnecting and stopping are separate actions. All data is fictional.
import { Grid, fit, len, wrap, sha, header, footer, table, buttons, para, kv, notice, toast, modal, progress, radios } from './lib.mjs';
import { contextPane } from './screens-context.mjs';
import { SHA, s8, step } from './screens.mjs';
import { runListDetail } from './screens-tui.mjs';

// ---------------------------------------------------------------- data

const T = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const NAMES = { T1: 'Repository and scaffold', T2: 'Inventory data and persistence', T3: 'Inventory management', T4: 'Inventory lookup', T5: 'Shopping cart', T6: 'Checkout', T7: 'Test and fix' };

// Lane: harness, active configuration and its queue. tasks: one glyph per task (✓ done · ✗ failed · ● running · ○ not started · – not run).
const L = (harness, d) => ({ harness, ...d });
// D4: a local endpoint has no API charge, but in a parallel run its shared energy is never divided, so its cost is unknown.
const LOCAL = 'unknown · local endpoint, parallel run';
// D9: the computed identity after an approved file changed on disk during run 2026-09-29-c.
export const HALT_SHA = sha('axbenchmark/template/inventory-web-app/r1/edited-checks-during-run');

const RUNS = {
  // Default scheduling, one configuration per harness, 4 at once. Matches RunConfig, RunIsolation and LaunchRecord.
  live: {
    id: '2026-10-01-a', bar: '● 3 of 4 running · 1 complete · one configuration per harness, up to 4 at once (jobs 4) · tasks sequential',
    lanes: [
      L('Claude Code', { cfg: 'claude-opus-5-5 · medium', state: 'done', tasks: '✓✓✓✓✓✓✓', now: 'complete 21:35:37 · final regression 30✓', elapsed: '36:50', cost: '$4.61 · API-equivalent estimate', go: 'RunConfig' }),
      L('Codex', { cfg: 'gpt-6-sol · medium', state: 'run', tasks: '✓✓✓✓●○○', now: 'T5 Shopping cart · 10:58 in this task', elapsed: '41:12', cost: '$1.92 · reported · T1–T4', live: '46.3 tok/s · context 84.2k of 272k · 31%', go: 'RunConfig' }),
      L('Grok CLI', { cfg: 'grok-4.7-fast · harness default', state: 'run', tasks: '✓✓✓●○○○', now: 'T4 Inventory lookup · 0:22 in this task', elapsed: '24:57', cost: '$0.41 · estimate · T1–T3', live: '112 tok/s · context ? not reported', go: 'RunConfig' }),
      L('Pi', { cfg: 'qwen3.5-35b-a3b · harness default', state: 'run', tasks: '✓✓●○○○○', now: 'T3 Inventory management · 14:05 in this task', elapsed: '39:31', cost: LOCAL, live: '29.4 tok/s · context 21.4k of 32k · 65%', go: 'RunConfig' }),
    ],
    events: [
      ['20:58:47', 'run', 'frozen · template 3f9c2e71… · configuration and original weights · 4 configurations start together'],
      ['21:35:37', 'claude', 'T7 exit 0 · 7 of 7 tasks · final regression started on a disposable copy'],
      ['21:35:59', 'verify', 'Claude Code final regression 30✓ · evidence saved · waiting for judging after the run'],
      ['21:38:20', 'codex', 'T5 policy: allowed · npx serve -l 41021 (ports 41020–41029)'],
      ['21:39:40', 'grok', 'T4 started · new process 49820 · workspace at T3 commit 7aa01c3'],
      ['21:40:02', 'pi', 'T3 harness retried 1 request (HTTP 429) · recorded as a harness-internal retry'],
    ],
  },
  // Five entries, two for Claude Code: the second waits in its lane.
  queued: {
    id: '2026-10-02-a', bar: '● 4 of 5 running · 1 queued · one configuration per harness, up to 4 at once (jobs 4) · tasks sequential',
    lanes: [
      L('Claude Code', { cfg: '#1 claude-opus-5-5 · medium', state: 'run', tasks: '✓✓●○○○○', now: 'T3 Inventory management · 6:12 in this task', elapsed: '19:40', cost: '$1.37 · API-equivalent estimate', queue: '#2 claude-opus-5-5 · high · starts when #1 ends' }),
      L('Codex', { cfg: '#3 gpt-6-sol · medium', state: 'run', tasks: '✓●○○○○○', now: 'T2 Inventory data and persistence · 9:30', elapsed: '17:04', cost: '$0.58 · reported · T1' }),
      L('Grok CLI', { cfg: '#4 grok-4.7-fast · harness default', state: 'run', tasks: '✓✓●○○○○', now: 'T3 Inventory management · 2:48 in this task', elapsed: '13:31', cost: '$0.17 · estimate · T1–T2' }),
      L('Pi', { cfg: '#5 qwen3.5-35b-a3b · harness default', state: 'run', tasks: '✓●○○○○○', now: 'T2 Inventory data and persistence · 11:15', elapsed: '18:52', cost: LOCAL }),
    ],
    events: [
      ['09:12:05', 'run', 'frozen · 5 entries · 4 lanes · #2 queued behind #1 (same harness)'],
      ['09:12:06', 'run', 'started #1 Claude Code · #3 Codex · #4 Grok CLI · #5 Pi'],
      ['09:21:40', 'grok', 'T1 exit 0 · checks 6✓ · T2 started in a new process'],
      ['09:25:33', 'claude', 'T2 exit 0 · checks 4✓ · T3 started in a new process'],
      ['09:31:52', 'pi', 'T2 is using the T1 workspace commit 41d0e2a'],
    ],
  },
  // Same five entries with --jobs 1: one configuration at a time, in entry order.
  seq: {
    id: '2026-10-02-b', bar: '● 1 of 5 running · 4 waiting · sequential (jobs 1) · one configuration at a time, entry order · tasks sequential',
    lanes: [
      L('Claude Code', { cfg: '#1 claude-opus-5-5 · medium', state: 'run', tasks: '✓✓✓●○○○', now: 'T4 Inventory lookup · 3:40 in this task', elapsed: '24:18', cost: '$1.98 · API-equivalent estimate', queue: '#2 claude-opus-5-5 · high · 2nd in the run' }),
      L('Codex', { cfg: '#3 gpt-6-sol · medium', state: 'wait', tasks: '○○○○○○○', now: 'waiting · 3rd in the run', elapsed: '—', cost: '—' }),
      L('Grok CLI', { cfg: '#4 grok-4.7-fast · harness default', state: 'wait', tasks: '○○○○○○○', now: 'waiting · 4th in the run', elapsed: '—', cost: '—' }),
      L('Pi', { cfg: '#5 qwen3.5-35b-a3b · harness default', state: 'wait', tasks: '○○○○○○○', now: 'waiting · 5th in the run', elapsed: '—', cost: '—' }),
    ],
    events: [
      ['13:02:11', 'run', 'frozen · 5 entries · sequential (jobs 1) · recorded with every result'],
      ['13:02:12', 'run', 'started #1 Claude Code · the other 4 wait in entry order'],
      ['13:22:40', 'claude', 'T3 exit 0 · checks 5✓ · T4 started in a new process'],
    ],
  },
  // D9: an approved template file changed on disk; the first detection halted the whole run with explicit-stop cleanup.
  halted: {
    id: '2026-09-29-c', frozen: `Approved template ${s8(SHA.inv1)}… · computed ${s8(HALT_SHA)}… on disk at 15:12:40 · the run is over and none of it is compared`, bar: '✗ Run halted 15:12:40 · template identity invalidated · 4 configurations interrupted · cleanup complete',
    lanes: [
      L('Claude Code', { cfg: 'claude-opus-5-5 · medium', state: 'halt', tasks: '✓✓✓✓✗––', now: '✗ interrupted at T5 · template identity invalidated', elapsed: '31:02', cost: '$3.18 ▲ · estimate · T5 partial', note: 'recorded as interrupted · never compared' }),
      L('Codex', { cfg: 'gpt-6-sol · medium', state: 'halt', tasks: '✓✓✓✗–––', now: '✗ interrupted at T4 · template identity invalidated', elapsed: '33:47', cost: '$1.66 ▲ · reported · T4 partial', note: 'recorded as interrupted · never compared' }),
      L('Grok CLI', { cfg: 'grok-4.7-fast · harness default', state: 'halt', tasks: '✓✓✓✓✗––', now: '✗ interrupted at T5 · template identity invalidated', elapsed: '29:15', cost: '$0.49 ▲ · estimate · T5 partial', note: 'recorded as interrupted · never compared' }),
      L('Pi', { cfg: 'qwen3.5-35b-a3b · harness default', state: 'halt', tasks: '✓✓✗––––', now: '✗ interrupted at T3 · template identity invalidated', elapsed: '34:40', cost: LOCAL, note: 'recorded as interrupted · never compared' }),
    ],
    events: [
      ['15:12:40', 'run', '✗ template identity invalidated · checks/acceptance.v1.json and tasks/T6-checkout.md changed on disk'],
      ['15:12:40', 'run', 'halting the whole run · same cleanup as an explicit stop · 4 configurations'],
      ['15:12:44', 'run', '4 process trees ended · service npx serve :41021 stopped · 4 browser contexts closed · ports released'],
      ['15:12:46', 'run', '4 results saved as interrupted · approved and computed SHA-256 and changed paths recorded · evidence kept'],
    ],
  },
  // Ordinary failure, timeout, authentication failure and a harness-internal retry, all recorded as they happened.
  fail: {
    id: '2026-09-30-b', bar: '● 2 of 4 running · 1 halted · 1 complete · failures are recorded as they happened · nothing is rerun',
    lanes: [
      L('Claude Code', { cfg: 'claude-opus-5-5 · medium', state: 'halt', tasks: '✓✓✗–––', now: '✗ halted at T3 · authentication failed (401)', elapsed: '22:46', cost: '$1.52 · estimate · T3 partial', note: 'T4–T7 not run · the other configurations continue' }),
      L('Codex', { cfg: 'gpt-6-sol · medium', state: 'run', tasks: '✓✓✓✗●○○', now: 'T5 Shopping cart · from the T4 workspace', elapsed: '3:41:09', cost: '$5.88 · reported · T1–T4', note: 'T4 ✗ timeout 3:00:00 · no rerun · T5 continues' }),
      L('Grok CLI', { cfg: 'grok-4.7-fast · harness default', state: 'run', tasks: '✓✓✓✓✓●○', now: 'T6 Checkout · 7:02 in this task', elapsed: '46:20', cost: '$0.66 · estimate · T1–T5', note: 'T2: 2 harness-internal retries · recorded' }),
      L('Pi', { cfg: 'qwen3.5-35b-a3b · harness default', state: 'done', tasks: '✓✓✓✓✓✗✓', now: 'complete · T6 exit 1 · T7 used the T6 workspace', elapsed: '1:34:02', cost: LOCAL }),
    ],
    events: [
      ['10:41:15', 'claude', '✗ T3 exit 1 · 401 token expired · configuration halted · process tree ended'],
      ['12:37:51', 'codex', '✗ T4 timeout at 3:00:00 · process tree ended · outcome saved as timeout'],
      ['12:37:52', 'codex', 'T5 started from the T4 workspace as it was · no earlier workspace substituted'],
      ['12:52:10', 'pi', '✗ T6 exit 1 · ordinary failure · T7 starts from the T6 workspace'],
      ['13:24:40', 'pi', 'T7 exit 0 · configuration complete · 6 of 7 tasks succeeded'],
    ],
  },
};

const GLYPH_F = { '✓': 'ac', '✗': 'bd', '●': 'ac bd', '○': 'mu', '–': 'mu' };
const STATE = { run: ['●', 'running', 'ac'], done: ['✓', 'complete', 'ac'], wait: ['○', 'waiting', 'mu'], halt: ['✗', 'halted', 'bd'] };

// ---------------------------------------------------------------- lane (one harness)

function lane(g, x, y, w, h, d, n, focused) {
  g.box(x, y, w, h, { f: focused ? 'ac' : 'ln', title: `${d.harness}`, sub: `lane ${n}` });
  g.region(x, y, w, h, 'Vertical', `#lane-${n}.pane`);
  const [gl, word, f] = STATE[d.state];
  const ix = x + 2, iw = w - 4;
  let yy = y + 1;
  g.text(ix, yy, gl, f); g.text(ix + 2, yy, word, d.state === 'halt' ? 'bd' : ''); g.text(ix + 3 + len(word), yy++, fit(`· ${d.cfg}`, iw - len(word) - 3), 'mu');
  const tasks = [...d.tasks.padEnd(7, '–')];
  tasks.forEach((c, i) => { g.text(ix + i * 6, yy, T[i], c === '●' ? 'bd' : 'mu'); g.text(ix + i * 6 + 3, yy, c, GLYPH_F[c] ?? ''); });
  yy++;
  const done = tasks.filter((c) => c === '✓' || c === '✗').length;
  progress(g, ix, yy++, iw, Math.round(done / 7 * 100));
  yy = kv(g, ix, yy, 9, iw, [
    ['Now', d.now, d.state === 'halt' ? 'bd' : ''],
    ['Elapsed', d.elapsed === '—' ? '—' : `${d.elapsed} · sum of task processes`],
    ['Cost', d.cost],
    ['Queue', d.queue ?? 'none in this lane', d.queue ? 'bd' : 'mu'],
    ...(d.live ? [['Live', d.live]] : []),
  ]);
  if (d.note) g.text(ix, yy, fit(d.note, iw), 'mu');
  if (d.go) g.link(x, y, w, 1, 'go:' + d.go);
}

// ---------------------------------------------------------------- RunScreen

// Below 100×30 the run is list and detail (RunListDetail, M15); the 2×2 layout is drawn only at full size (W6).
export function runOverview(sz, focus = 'lane1', st = {}) {
  if (sz.id === 'compact') return runListDetail(sz, focus.startsWith('lane') ? 'list' : 'log');
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const run = st.data ?? RUNS[st.run ?? 'live'];
  header(g, 'AxBenchmark', `Run ${run.id} · Inventory web app r1`);
  g.fill(0, 1, W, 1, 'B1');
  if (st.reattached) {
    g.text(1, 1, '●', 'ac');
    g.text(3, 1, fit('Reattached 21:52:08 · detached 21:44:30–21:52:08 · the run kept going and nothing was restarted · 3 of 4 running', W - 4));
  } else g.text(1, 1, fit(run.bar, W - 2), run.id === '2026-09-30-b' || run.bar.startsWith('✗') ? 'bd' : '');
  g.region(0, 1, W, 1, 'Static', '#run-bar');

  g.text(1, 2, '■', 'ac');
  g.text(3, 2, fit(run.frozen ?? `UID run_mbp_${run.id.replaceAll("-", "")} · origin mike-mbp-m4 · selected codex_medium / trial 1 · frozen ${s8(SHA.inv1)}`, W - 4), 'mu');
  g.region(0, 2, W, 1, 'Static', '#frozen');
  const lw = W / 2, lh = 11;
  run.lanes.forEach((d, i) => lane(g, (i % 2) * lw, 3 + Math.floor(i / 2) * lh, lw, lh, d, i + 1, focus === `lane${i}`));
  const ey = 3 + 2 * lh, eh = H - 1 - ey;
  const ef = focus === 'events';
  g.box(0, ey, W, eh, { f: ef ? 'ac' : 'ln', title: 'Events · all configurations', sub: 'follows new lines' });
  g.region(0, ey, W, eh, 'RichLog', '#events');
  run.events.slice(-(eh - 2)).forEach(([t, s, m], i) => {
    g.text(2, ey + 1 + i, fit(t, 10), 'mu'); g.text(12, ey + 1 + i, fit(s, 8), s === 'run' ? 'bd' : 'mu');
    g.text(20, ey + 1 + i, fit(m, W - 22), m.startsWith('✗') ? 'bd' : '');
  });
  if (st.reattached) toast(g, '✓ Reattached to 2026-10-01-a', 'Observing the existing processes. No task was restarted and no new trial was created.', 46);
  footer(g, [{ k: 'enter', d: 'Open configuration', go: 'RunConfig' }, { k: 's', d: 'Stop configuration', go: 'StopConfirm' }, { k: 'S', d: 'Stop run', go: 'StopConfirm' }, { k: 'v', d: 'Live view', go: 'HarnessLive' }, { k: 'd', d: 'Detach', go: 'RunDetach' }, { k: 'e', d: 'Edit', off: true, go: 'ActiveLocked' }, { k: 'tab', d: 'Lane', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- live view (v on a lane)
// HarnessLiveScreen watches one configuration's current task process: the code it is writing, its thinking (as far as
// the harness exposes it), its actions, output tok/s and context use. Read-only: it never sends input to the harness.

const LIVE_CODE = [
  [38, ' ', 'function recalcTotals() {'],
  [39, ' ', '  let total = 0;'],
  [40, ' ', '  for (const { qty, price } of cart.values()) {'],
  [41, ' ', '    total += qty * price;'],
  [42, ' ', '  }'],
  [43, ' ', '  totals.subtotal = round2(total);'],
  [44, ' ', '  totals.tax = round2(total * TAX_RATE);'],
  [45, ' ', '  totals.total = round2(totals.subtotal + totals.tax);'],
  [46, ' ', '  render.totals(totals);'],
  [47, ' ', '}'],
  [48, ' ', ''],
  [49, ' ', 'export function getCart() {'],
  [50, ' ', '  return [...cart.entries()];'],
  [51, ' ', '}'],
  [52, ' ', ''],
  [53, ' ', 'export function addItem(id, qty = 1) {'],
  [54, ' ', '  const item = inventory.get(id);'],
  [55, ' ', '  if (!stock.reserve(id, qty)) return false;'],
  [56, ' ', '  cart.set(id, { qty, price: item.price });'],
  [57, ' ', '  recalcTotals();'],
  [58, ' ', '  return true;'],
  [59, ' ', '}'],
  [60, ' ', ''],
  [61, ' ', 'export function removeItem(id) {'],
  [62, ' ', '  const line = cart.get(id);'],
  [63, ' ', '  if (!line) return;'],
  [64, '-', '  cart.delete(id);'],
  [64, '+', '  cart.delete(id);'],
  [65, '+', '  stock.release(id, line.qty);'],
  [66, '+', '  recalcTotals();'],
  [67, '+', '  badge.update(cart.size);'],
  [68, '+', '  storage.save(cart);'],
  [69, ' ', '}'],
];
const LIVE_THINK = 'The total must use the price at the moment an item is added. Spec §Cart: totals update on every quantity change and stock never goes below 0. removeItem does not release stock or recalculate — fix that path first, then add a test for it.';
const LIVE = {
  codex: {
    harness: 'Codex 0.98.0', cfg: 'Codex · gpt-6-sol · medium', model: 'gpt-6-sol', effort: ['medium', '? unverified', 'it'], pid: 48211, task: 'T5 Shopping cart', inTask: '10:58',
    rate: 46.3, spark: '▁▂▄▆▇▆▅▇█▆▅▃▄▆▇█▇▆', rateNote: 'avg 41.8 · peak 72.0 · measured from the stream',
    ctx: [84.2, 272], ctxNote: 'reported by harness', usage: 'in 612.4k (cached 498.0k) · out 18.9k (reasoning 7.2k) · $0.41 reported',
    thinking: 'summarized', thinkTok: '1.4k',
  },
  grok: {
    harness: 'Grok CLI 1.9.3', cfg: 'Grok CLI · grok-4.7-fast · harness default', model: 'grok-4.7-fast', effort: ['harness default', '(no argument passed)', 'mu'], pid: 49820, task: 'T5 Shopping cart', inTask: '6:02',
    rate: 112, spark: '▃▅▇█▇▆▇█▇▅▆▇█▇▆▅▇█', rateNote: 'measured from the stream · the harness reports no rate',
    ctx: null, ctxNote: 'not reported by Grok CLI · no bar is drawn and no size is guessed', usage: 'in ? · out 11.2k so far (stream) · reasoning reported at task end only · estimate after the task',
    thinking: 'none', thinkTok: '',
  },
};

// st: { who: 'codex' | 'grok', adds: added lines streamed so far (0–5), thinking: false hides it, paused: follow off,
//       rate / ctx overrides for animation frames, engine: false = no decision engine configured (context labels native only) }
export function harnessLive(sz, focus = 'code', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const L = { ...LIVE[st.who ?? 'codex'] };
  if (st.rate != null) L.rate = st.rate;
  if (st.ctx != null && L.ctx) L.ctx = [st.ctx, L.ctx[1]];
  const adds = st.adds ?? 5, showThink = st.thinking !== false && L.thinking !== 'none';
  header(g, 'AxBenchmark', compact ? `Live · ${L.cfg.split(' · ')[0]} · trial 1` : `UID run_mbp_20261001a · ${L.cfg} · trial 1 · live view`);

  // task line: the one place that says what is running, with which model and effort
  g.fill(0, 1, W, 1, 'B1');
  let x = g.text(1, 1, '●', 'ac') + 1;
  x = g.text(x, 1, L.task, 'bd');
  x = g.text(x, 1, ` · ${L.inTask} │ `, 'mu');
  x = g.text(x, 1, L.model);
  x = g.text(x, 1, ' · effort ', 'mu');
  x = g.text(x, 1, L.effort[0]);
  x = g.text(x + 1, 1, L.effort[1], L.effort[2]);
  if (!compact) g.text(x, 1, fit(` │ ${L.harness} · pid ${L.pid} · clean · read-only`, W - x - 1), 'mu');
  g.region(0, 1, W, 1, 'Static', '#live-task');

  const rateTxt = `${L.rate.toFixed(L.rate >= 100 ? 0 : 1)} tok/s`;
  const pct = L.ctx ? Math.round(L.ctx[0] / L.ctx[1] * 100) : null;
  const ctxTxt = L.ctx ? `${L.ctx[0].toFixed(1)}k of ${L.ctx[1]}k` : '? not reported';
  const bar = (bx, y, w) => { const n = Math.round(w * pct / 100); g.text(bx, y, '█'.repeat(n), 'ac'); g.text(bx + n, y, '░'.repeat(w - n), 'ln'); };

  // code pane rows: unchanged and removed lines, then the added lines streamed so far, caret on the newest
  const shown = LIVE_CODE.filter((c) => c[1] !== '+').slice(0, -1)
    .concat(LIVE_CODE.filter((c) => c[1] === '+').slice(0, adds), adds >= 5 ? [LIVE_CODE.at(-1)] : []);
  const codeRows = (cx, cy, cw, max) => {
    shown.slice(-max).forEach(([n, k, t], i) => {
      const y = cy + i, last = k === '+' && i === Math.min(shown.length, max) - 1 && adds < 5;
      const live = k === '+' && adds < 5 && t === LIVE_CODE.filter((c) => c[1] === '+')[adds - 1]?.[2];
      if (k === '+') g.fill(cx, y, cw, 1, 'BT');
      const o = k === '+' ? { b: 'BT' } : {};
      g.text(cx, y, fit(String(n), 4, 'right'), 'ln', o);
      g.text(cx + 5, y, k === ' ' ? ' ' : k === '+' ? '+' : '−', k === '+' ? 'ac' : 'mu', o);
      const body = live && !last ? t : live ? t.slice(0, Math.max(1, t.length - 4)) : t;
      const ex = g.text(cx + 6, y, fit(body, cw - 7), k === '-' ? 'mu dm' : '', o);
      if (live) g.text(ex, y, ' ', 'rv', o);
    });
  };

  if (compact) {
    g.text(1, 2, 'Out ', 'mu'); x = g.text(5, 2, rateTxt, 'bd'); g.text(x + 1, 2, L.spark.slice(0, 10), 'ac');
    x = g.text(x + 12, 2, '│ Context ', 'mu');
    if (L.ctx) { x = g.text(x, 2, ctxTxt, 'bd'); bar(x + 1, 2, 12); g.text(x + 14, 2, `${pct}%`, 'bd'); }
    else g.text(x, 2, ctxTxt, 'bd');
    g.region(0, 2, W, 1, 'Static', '#live-meters');
    const ch = H - 1 - 3 - (showThink ? 5 : 0);
    g.box(0, 3, W, ch, { f: 'ac', title: `Code being written · src/cart.js`, sub: adds >= 5 ? 'saved' : `+${adds} −1 so far` });
    codeRows(1, 4, W - 2, ch - 2);
    g.region(0, 3, W, ch, 'Vertical', '#live-code.pane');
    if (showThink) {
      const ty = 3 + ch;
      g.box(0, ty, W, 5, { title: `Thinking · ${L.thinking} · ${L.thinkTok} tok` });
      const tl = wrap(LIVE_THINK, W - 4);
      tl.slice(0, 3).forEach((l, i) => g.text(2, ty + 1 + i, i === 2 && tl.length > 3 ? fit(l + ' …', W - 4) : l, 'mu it'));
      g.region(0, ty, W, 5, 'Collapsible', '#live-thinking');
    }
    footer(g, [{ k: 'esc', d: 'Run', go: 'RunOverview' }, { k: 't', d: showThink ? 'Hide thinking' : 'Thinking' }, { k: 'a', d: 'Actions' }, { k: 'c', d: 'Context', go: 'ContextDetail' }, { k: 'f', d: 'Follow' }, { k: '[ ]', d: 'File' }]);
    return g;
  }

  // throughput and context
  g.box(0, 2, W, 5, { title: 'Throughput and context', sub: 'live · advisory · Gen tok/s is retained by M10' });
  g.region(0, 2, W, 5, 'Vertical', '#live-meters.pane');
  g.text(2, 3, 'Output', 'mu'); x = g.text(11, 3, rateTxt, 'bd'); x = g.text(x + 2, 3, L.spark, 'ac');
  g.text(x + 2, 3, fit(`last 60 s · ${L.rateNote}`, W - x - 4), 'mu');
  g.text(2, 4, 'Context', 'mu');
  if (L.ctx) { x = g.text(11, 4, ctxTxt, 'bd'); bar(x + 2, 4, 32); x = g.text(x + 35, 4, `${pct}%`, 'bd'); g.text(x + 2, 4, fit(`${L.ctxNote} · this conversation only`, W - x - 4), 'mu'); }
  else { x = g.text(11, 4, ctxTxt, 'bd'); g.text(x + 2, 4, fit(L.ctxNote, W - x - 4), 'mu'); }
  g.text(2, 5, 'Task', 'mu'); g.text(11, 5, fit(`${L.usage}${L.ctx ? ' · cached ⊂ in, reasoning ⊂ out' : ''}`, W - 13), 'mu');

  // thinking and actions
  const af = focus === 'activity', lw = 52, py = 7, ph = H - 1 - py;
  g.box(0, py, lw, ph, { f: af ? 'ac' : 'ln', title: 'Thinking and actions', sub: st.paused ? 'paused · 3 new ↓' : 'following new lines' });
  g.region(0, py, lw, ph, 'RichLog', '#live-activity');
  let y = py + 1;
  const act = (t, verb, what, f = '', note = '') => { g.text(2, y, t, 'mu'); x = g.text(11, y, verb, f === 'live' ? 'ac' : ''); x = g.text(x + 1, y, what, 'bd'); if (note) g.text(x + 1, y, fit(note, lw - 2 - x - 1), 'mu'); y++; };
  act('21:41:47', '▸ run', 'npm test', '', '      ✓ 21 passed');
  act('21:42:05', '▸ git', 'commit', '', '→ 8c2d417');
  if (L.thinking === 'none') {
    g.text(2, y, '21:42:06', 'mu'); g.text(11, y, '○', 'ln'); g.text(13, y++, fit('thinking not exposed by this harness', lw - 15), 'mu');
    g.text(13, y++, fit('reasoning tokens come with the task total', lw - 15), 'mu');
  } else {
    g.text(2, y, '21:42:06', 'mu'); g.text(11, y, showThink ? '▾' : '▸', 'ac'); x = g.text(13, y, 'thinking', 'bd'); g.text(x, y++, ` · ${L.thinking} · ${L.thinkTok} tok`, 'mu');
    if (showThink) y = para(g, 11, y, lw - 13, LIVE_THINK, 'mu it');
  }
  act('21:42:31', '▸ read', 'src/cart.js', '', '1–96');
  act('21:42:38', '▸ read', 'src/stock.js', '', '1–40');
  if (adds >= 5) act('21:43:02', '✓ edit', 'src/cart.js', '', '+5 −1 · saved');
  else { g.text(2, y, '21:42:41', 'mu'); g.text(11, y, '●', 'ac'); x = g.text(13, y, 'edit src/cart.js', 'bd'); g.text(x, y++, ' · writing…', 'mu'); }
  y++;
  g.text(2, y++, 'Next in the plan the harness reported', 'mu');
  [['○', 'add tests/cart.test.js · removeItem'], ['○', 'run npm test · commit']].forEach(([gl, t]) => { g.text(2, y, gl, 'ln'); g.text(4, y++, t); });
  g.text(2, py + ph - 2, fit('Watching never sends input to the harness.', lw - 4), 'mu');

  // code being written, above the context window of the same task process
  const cf = focus === 'code', cx = lw, cw = W - lw, ch = 18, xh = ph - ch;
  g.box(cx, py, cw, ch, { f: cf ? 'ac' : 'ln', title: 'Code being written · src/cart.js', sub: adds >= 5 ? 'saved 21:43:02' : `+${adds} −1 so far` });
  g.region(cx, py, cw, ch, 'Vertical', '#live-code.pane');
  g.text(cx + 2, py + 1, 'Files', 'mu'); x = g.text(cx + 9, py + 1, '● src/cart.js', 'ac bd');
  g.text(x + 2, py + 1, fit('~ index.html +22 −1  ~ src/inventory.js +12 −2  ↓ 11', cw - (x - cx) - 4), 'mu');
  g.region(cx + 2, py + 1, cw - 4, 1, 'Tabs', '#live-files');
  g.hline(cx + 1, py + 2, cw - 2);
  codeRows(cx + 1, py + 3, cw - 2, ch - 5);
  g.text(cx + 2, py + ch - 2, fit(adds >= 5 ? 'Saved · diff against the T4 commit 5b1e9a0.' : 'Streams as the harness writes; final when the file is saved.', cw - 4), 'mu');
  contextPane(g, cx, py + ch, cw, xh, st.who ?? 'codex', { focus: focus === 'context', engine: st.engine });

  footer(g, [{ k: 'esc', d: 'Run', go: 'RunOverview' }, { k: 't', d: showThink ? 'Hide thinking' : 'Thinking', off: L.thinking === 'none' }, { k: 'c', d: 'Context', go: (st.who ?? 'codex') === 'grok' ? 'ContextDetailHistory' : 'ContextDetail' }, ...(st.engine === false ? [{ k: 'x', d: 'Configure engine', go: 'Setup' }] : []), { k: 'f', d: st.paused ? 'Follow' : 'Pause' }, { k: '[ ]', d: 'File' }, { k: '/', d: 'Search' }, ...(st.engine === false ? [] : [{ k: 'enter', d: 'Config', go: 'RunConfig' }]), { k: 'tab', d: 'Pane', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- detach

export function runDetach(sz, focus = 'detach') {
  const g = runOverview(sz, 'none');
  const m = modal(g, 84, 22, 'Detach from run 2026-10-01-a', { sel: '#detach' });
  let y = m.y;
  g.text(m.x, y, '●', 'ac'); g.text(m.x + 2, y++, fit('The run keeps going without this window', m.w - 2), 'bd');
  y = para(g, m.x + 2, y, m.w - 2, 'Detaching, closing the terminal or quitting AxBenchmark only stops observing. Processes, verification and judging continue, and nothing is recorded as interrupted.', 'mu');
  y++;
  g.text(m.x, y++, 'Come back with', 'bd');
  y = kv(g, m.x, y, 22, m.w, [
    ['Library', 'ctrl+r Reconnect in the status bar'],
    ['Command line', 'axbenchmark --attach run_mbp_20261001a'],
    ['Status only', 'axbenchmark status run_mbp_20261001a'],
  ]);
  g.region(m.x, y - 3, m.w, 3, 'Static', '#reattach.kv');
  y++;
  para(g, m.x, y, m.w, 'Reconnecting observes the same processes; it never restarts a task or starts another trial. To end the work, use Stop (s or S) instead.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'RunOverview' }, { label: 'Stop instead…', go: 'StopConfirm' }, { label: 'Detach', v: 'primary', go: 'Library', focus: focus === 'detach' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'RunOverview' }, { k: 'enter', d: 'Detach', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- explicit stop

export function stopConfirm(sz, focus = 'scope') {
  const g = runOverview(sz, 'none');
  const m = modal(g, 86, 24, 'Stop · run 2026-10-01-a', { sel: '#stop' });
  let y = m.y;
  const sf = focus === 'scope';
  g.text(m.x, y++, 'What to stop', 'bd');
  radios(g, m.x, y++, ['This configuration · Codex · gpt-6-sol · medium', 'The whole run · 3 running'], 0, { focus: sf });
  g.region(m.x, y - 1, m.w, 1, 'RadioSet', '#stop-scope');
  y++;
  g.text(m.x, y++, 'Cleanup · retention settles separately', 'bd');
  table(g, m.x, y, m.w, [{ l: 'Kind', w: 12 }, { l: 'Item', w: 44 }, { l: 'Action', w: m.w - 56 }], [
    { v: ['Process', 'codex exec · pid 48211 · 3 child processes', 'SIGTERM, then SIGKILL'] },
    { v: ['Service', 'npx serve -l 41021 · started in T5', 'stopped'] },
    { v: ['Browser', 'Playwright context ctx-codex', 'closed'] },
    { v: ['Ports', '41020–41029', 'released'] },
  ], { cursor: focus === 'items' ? 0 : -1, focused: focus === 'items' });
  g.region(m.x, y, m.w, 5, 'DataTable', '#cleanup');
  y += 6;
  g.text(m.x, y++, 'Recorded outcome', 'bd');
  y = kv(g, m.x, y, 12, m.w, [
    ['T5', 'interrupted · stopped by you at 10:58 · snapshot and log kept'],
    ['T6, T7', 'not run · never reported as zero time or zero cost'],
    ['Other lanes', 'Claude Code, Grok CLI and Pi continue unchanged'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Run stop remains available while judging or finalizing; completed configurations cannot be stopped. Detach stops observing only.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'RunOverview' }, { label: 'Stop configuration', v: 'primary', go: 'StopCleanup', focus: focus === 'stop' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'RunOverview' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'enter', d: 'Stop', go: 'StopCleanup' }], '');
  return g;
}

export function stopCleanup(sz) {
  const g = runOverview(sz, 'none');
  const m = modal(g, 84, 19, 'Stopping Codex · gpt-6-sol · medium', { sel: '#stopping' });
  let y = m.y;
  step(g, m.x, y++, m.w, 'done', 'Sent SIGTERM to pid 48211 and its process group');
  step(g, m.x, y++, m.w, 'done', '3 child processes ended within 4 s · no SIGKILL needed');
  step(g, m.x, y++, m.w, 'done', 'Service npx serve -l 41021 stopped · port 41021 free');
  step(g, m.x, y++, m.w, 'done', 'Browser context ctx-codex closed');
  step(g, m.x, y++, m.w, 'now', 'Saving T5 as interrupted · snapshot, partial log and measurements');
  step(g, m.x, y++, m.w, 'todo', 'Mark T6 and T7 as not run');
  g.region(m.x, m.y, m.w, 6, 'Vertical', '#stop-steps');
  y++;
  para(g, m.x, y, m.w, 'Cleanup complete; retention is pending. A storage error keeps its remedy visible and report status pending. Other configurations continue.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Hide', v: 'primary', go: 'RunOverview', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Hide · cleanup continues', go: 'RunOverview' }], '');
  return g;
}

// ---------------------------------------------------------------- halted run · template identity invalidated (D9)

export function runHalted(sz, focus = 'close') {
  const g = runOverview(sz, 'none', { run: 'halted' });
  const m = modal(g, 86, 31, 'Run 2026-09-29-c halted · template identity invalidated', { sel: '#halted' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'An approved file of Inventory web app r1 changed on disk during the run', 'The first detection halted the whole run. Active work stopped; unsealed results become interrupted. Sealed facts stay intact; every result is marked non-comparable.');
  g.region(m.x, m.y, m.w, y - m.y, 'Static', '.notice.-error');
  y++;
  const y0 = y;
  g.text(m.x, y, 'Approved', 'mu'); g.text(m.x + 10, y++, SHA.inv1);
  g.text(m.x, y, 'Computed', 'mu'); g.text(m.x + 10, y++, HALT_SHA, 'bd');
  g.text(m.x + 10, y++, fit('recomputed at 15:12:40 before the next task’s checks · never rebound', m.w - 10), 'mu');
  g.region(m.x, y0, m.w, 3, 'Static', '#halt-identities');
  y++;
  table(g, m.x, y, m.w, [{ l: 'Changed path', w: 28 }, { l: 'Change', w: 31 }, { l: 'On disk', w: m.w - 59 }], [
    { v: ['checks/acceptance.v1.json', { t: '~ modified · 6.2 KB → 6.3 KB', f: 'bd' }, 'was read-only 0444'] },
    { v: ['tasks/T6-checkout.md', { t: '~ modified · 150 B → 171 B', f: 'bd' }, 'was read-only 0444'] },
  ], { cursor: focus === 'paths' ? 0 : -1, focused: focus === 'paths' });
  g.region(m.x, y, m.w, 3, 'DataTable', '#changed-paths');
  y += 4;
  y = kv(g, m.x, y, 13, m.w, [
    ['Recorded', '4 results · interrupted · “template identity invalidated”'],
    ['Kept', 'evidence, logs, snapshots and partial measurements (▲)'],
    ['Never', 'rebound to r1 or another revision · never compared · inspection evidence retained'],
    ['Command line', 'axbenchmark status 2026-09-29-c shows the same reason'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Restore the files from r1, or save the change as a new revision, then launch again. A new revision’s results are never compared with r1’s.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open evidence', go: 'EvidenceViewer' }, { label: 'Save change as revision…', go: 'Revise' }, { label: 'Close', v: 'primary', go: 'Library', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- restricted actions while running

export function activeLocked(sz) {
  const g = runOverview(sz, 'none');
  const m = modal(g, 84, 22, 'Not available while the run is active', { sel: '#locked' });
  let y = m.y;
  y = para(g, m.x, y, m.w, 'Run 2026-10-01-a compares frozen inputs. Changing them now would change the comparison, so these actions stay unavailable in every interface (TUI and CLI).', 'mu');
  y++;
  table(g, m.x, y, m.w, [{ l: 'Action', w: 38 }, { l: 'While running', w: m.w - 38 }], [
    { v: ['Inspect lanes, logs, checks', '✓ available'] },
    { v: ['Detach and reconnect', '✓ available · the run continues'] },
    { v: ['Stop a configuration or the run', '✓ available · explicit, with cleanup'] },
    { v: ['Edit task prompts or the template', { t: '✗ frozen · revise after the run (M01)', f: 'bd' }] },
    { v: ['Change models or efforts', { t: '✗ frozen · applies to future runs only', f: 'bd' }] },
    { v: ['Change original weights', { t: '✗ frozen · alternatives later (M06)', f: 'bd' }] },
    { v: ['Send hints to a competitor', { t: '✗ never possible', f: 'bd' }] },
  ], { cursor: 3, focused: false });
  g.region(m.x, y, m.w, 8, 'DataTable', '#allowed');
  y += 9;
  para(g, m.x, y, m.w, 'Approved files are read-only on disk. If one changes anyway, the first detection halts the whole run: every configuration is recorded as interrupted and never given another identity.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', go: 'RunOverview', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'RunOverview' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

import { loading } from './lib.mjs';
const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const RUN_WIDGET_STATES = [
  { widget: 'Vertical#lane-1', label: 'M11 · Run lane', states: [
    ['Loading', mini('Claude Code', (g, x, y, w) => loading(g, x, y + 1, w, 'Attaching to run 2026-10-01-a…'))],
    ['Empty', mini('Claude Code', (g, x, y, w) => { centered(g, y + 1, 'No configuration in this lane', 'bd'); centered(g, y + 2, 'Claude Code was not selected for this run.', 'mu'); })],
    ['Error', mini('Claude Code', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Run state could not be read', 'runs/2026-10-01-a/state.json is locked. The run itself is unaffected. Retrying…'); })],
  ] },
];
