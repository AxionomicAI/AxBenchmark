// M10 · Execution measurements and cost accounting.
// MeasurementsScreen (m from a result's Outcomes tab) shows every measurement category per task with its source,
// coverage and cost basis; TimingScreen separates benchmark elapsed time from excluded phases; the cost-basis and
// currency/energy dialogs keep reported amounts, estimates and unknowns apart. Totals agree with results-data.mjs.
import { Grid, fit, len, header, footer, table, buttons, input, check, para, kv, notice, modal } from './lib.mjs';
import { SHA, s8 } from './screens.mjs';
import { results, GROK_TASKS } from './screens-results.mjs';
import { setup } from './screens-setup.mjs';
import { RESULTS, byId, dur, usd, f2 } from './results-data.mjs';

const k = (n) => (n >= 1000 ? `${(n / 1000).toFixed(2)}M` : `${n}k`);

// R-0928a-3 · Grok CLI. Input/output match the Outcomes tab; reasoning is a subset of output; cache is not exposed.
// Grok CLI reports no cost, so cost = known usage × xAI list rates recorded in the catalog.
const RATE = { in: 0.25, out: 0.80 };
const REASONING = [3, 8, 17, 5, 14, 12, 9];
const GROK = GROK_TASKS.map(([id, t, ex, ch, s, tok, c], i) => {
  const [inp, out] = tok.split(' / ').map((x) => parseInt(x, 10));
  return { id, t, ex, ch, s, inp, out, rs: REASONING[i], c };
});

// R-0925b-2 · Codex, sequential run, authentication failure at T5. Totals match results-data (2710 s, $2.05).
const CODEX = [
  { id: 'T1', t: 'Repository and scaffold', st: '✓ exit 0', ch: '2✓', s: 300, inp: 210, ca: 160, out: 11, rs: 6, c: 0.22 },
  { id: 'T2', t: 'Inventory data and persistence', st: '✓ exit 0', ch: '4✓', s: 520, inp: 380, ca: 300, out: 19, rs: 10, c: 0.38 },
  { id: 'T3', t: 'Inventory management', st: '✓ exit 0', ch: '5✓', s: 760, inp: 610, ca: 495, out: 31, rs: 17, c: 0.61 },
  { id: 'T4', t: 'Inventory lookup', st: '✓ exit 0', ch: '2✓', s: 410, inp: 300, ca: 240, out: 14, rs: 8, c: 0.31 },
  { id: 'T5', t: 'Shopping cart', st: '✗ auth 401', ch: '4○', s: 720, inp: 420, ca: 350, out: 22, rs: 12, c: 0.53, partial: true },
  { id: 'T6', t: 'Checkout', st: '○ not run', ch: '3○', s: null },
  { id: 'T7', t: 'Test and fix', st: '○ not run', ch: '1○', s: null },
];

function measureChrome(g, r, sub) {
  const W = g.w, compact = W < 100;
  header(g, 'AxBenchmark', compact ? `Result ${r.id} · measurements` : `Result ${r.id} · ${sub}`);
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(compact
    ? `● ${r.machine} · ${r.h} · ${r.model} · r1 ${s8(SHA.inv1)} · ${r.status === 'complete' ? '✓ complete' : `✗ halted ${r.failedAt}`}`
    : `● Local · ${r.machine} · run ${r.run} · ${r.h} · ${r.model} · ${r.effort === 'default' ? 'harness default' : r.effort} · ${r.env} · jobs ${r.jobs} · r1 ${s8(SHA.inv1)} · ${r.status === 'complete' ? '✓ complete' : `✗ halted at ${r.failedAt}`}`, W - 2), r.status === 'complete' ? '' : 'bd');
  g.region(0, 1, W, 1, 'Static', '#result-bar');
}

const COLS = (w) => {
  const c = [{ l: '#', w: 4 }, { l: 'Task', w: 25 }, { l: 'Process', w: 11 }, { l: 'Checks', w: 8 }, { l: 'Time', w: 8, al: 'right' }, { l: 'Input', w: 8, al: 'right' }, { l: 'Cached', w: 8, al: 'right' }, { l: 'Output', w: 8, al: 'right' }, { l: 'Reason.', w: 8, al: 'right' }, { l: 'Cost', w: 8, al: 'right' }];
  return [...c, { l: 'Basis · coverage', w: w - c.reduce((n, x) => n + x.w, 0) }];
};

// ---------------------------------------------------------------- MeasurementsScreen · complete result

export function measurements(sz, focus = 'tasks') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const r = byId['R-0928a-3'];
  measureChrome(g, r, 'measurements and cost');
  const tot = { s: GROK.reduce((n, t) => n + t.s, 0), inp: GROK.reduce((n, t) => n + t.inp, 0), out: GROK.reduce((n, t) => n + t.out, 0), rs: GROK.reduce((n, t) => n + t.rs, 0), c: GROK.reduce((n, t) => n + t.c, 0) };
  if (dur(tot.s) !== dur(r.time) || f2(tot.c) !== f2(r.cost)) throw new Error('Measurements disagree with R-0928a-3');
  for (const t of GROK) if (f2(t.inp / 1000 * RATE.in + t.out / 1000 * RATE.out) !== f2(t.c)) throw new Error(`Rate estimate disagrees for ${t.id}`);
  const tf = focus === 'tasks';
  if (compact) {
    g.box(0, 2, W, 11, { f: tf ? 'ac' : 'ln', title: 'Per task · estimate from known usage' });
    table(g, 1, 3, W - 2, [{ l: '#', w: 4 }, { l: 'Task', w: 22 }, { l: 'Process', w: 9 }, { l: 'Time', w: 8, al: 'right' }, { l: 'In', w: 7, al: 'right' }, { l: 'Out', w: 6, al: 'right' }, { l: 'Cost', w: 8, al: 'right' }, { l: 'Basis', w: W - 2 - 64 }],
      [...GROK.map((t) => ({ v: [t.id, t.t, '✓ exit 0', dur(t.s), `${t.inp}k`, `${t.out}k`, usd(t.c), 'estimate'] })),
        { v: ['Σ', 'Seven tasks', '7 of 7', dur(tot.s), k(tot.inp), `${tot.out}k`, usd(tot.c), 'estimate'], f: 'bd' }], { cursor: 7, focused: tf });
    g.region(1, 3, W - 2, 9, 'DataTable', '#measurements');
    g.box(0, 13, W, H - 14, { title: 'Accounting', f: focus === 'rules' ? 'ac' : 'ln' });
    g.region(0, 13, W, H - 14, 'Static', '#accounting.kv');
    kv(g, 2, 14, 11, W - 4, [
      ['Cost', 'API-equivalent estimate · Grok CLI reports none'],
      ['Rates', '$0.25 in · $0.80 out per M · catalog 2026-09-15'],
      ['Cached', '? not exposed · no discount applied'],
      ['Reasoning', `${tot.rs}k, part of output · never added again`],
      ['Elapsed', `${dur(tot.s)} · 7 task processes, tool work included`],
      ['Excluded', 'verification 7:30 · judging 3:25 · queue 0:00'],
    ]);
    footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 't', d: 'Timing', go: 'TimingPhases' }, { k: 'b', d: 'Basis', go: 'CostBasis' }]);
    return g;
  }
  g.box(0, 2, W, 12, { f: tf ? 'ac' : 'ln', title: 'Per task and total · every category, with its source', sub: 'USD' });
  const rows = GROK.map((t) => ({ v: [t.id, t.t, `✓ exit ${t.ex}`, t.ch, dur(t.s), `${t.inp}k`, { t: '?', f: 'it' }, `${t.out}k`, `${t.rs}k`, usd(t.c), 'estimate · complete'], go: 'TaskChecks' }));
  rows.push({ v: ['Σ', 'Configuration · 7 tasks', '✓ 7 of 7', '20✓ 1?', dur(tot.s), k(tot.inp), { t: '?', f: 'it' }, `${tot.out}k`, `${tot.rs}k`, usd(tot.c), 'estimate · 7 of 7'], f: 'bd' });
  table(g, 1, 3, W - 2, COLS(W - 2), rows, { cursor: 2, focused: tf });
  g.region(1, 3, W - 2, 9, 'DataTable', '#measurements');
  g.text(2, 12, fit('Reasoning ⊂ output and cached ⊂ input: shown apart, never added to the total. ? = not exposed by the harness.', W - 4), 'mu');

  const af = focus === 'rules';
  g.box(0, 14, 60, 18, { f: af ? 'ac' : 'ln', title: 'T3 · how the numbers were formed' });
  g.region(0, 14, 60, 18, 'Static', '#formation.kv');
  let y = kv(g, 2, 15, 11, 56, [
    ['Usage', '6 running totals + 1 final total'],
    ['', '→ counted once, from the final: 702k / 44k'],
    ['Reasoning', '17k reported · already inside the 44k output'],
    ['Cached', '? Grok CLI 1.9.2 does not expose cache reads'],
    ['Cost', 'no reported cost for this task'],
    ['Estimate', '702k × $0.25/M + 44k × $0.80/M = $0.21'],
    ['Rates', 'xAI list price · catalog 2026-09-15 (M04)'],
    ['Labelled', 'API-equivalent estimate, wherever it is shown'],
    ['Time', '11:05 · start to exit, tool work included'],
  ]);
  para(g, 2, y + 1, 56, 'Without cache reads the estimate cannot apply a cache discount, so it may overstate cost. That limitation travels with exports and the report.', 'mu');

  const ef = focus === 'elapsed';
  g.box(60, 14, 60, 18, { f: ef ? 'ac' : 'ln', title: 'Benchmark elapsed and excluded phases' });
  g.region(60, 14, 60, 18, 'Static', '#phases.kv');
  y = kv(g, 62, 15, 18, 56, [
    ['Benchmark elapsed', `${dur(tot.s)} · sum of the 7 task processes`, 'bd'],
    ['Includes', 'the harness’s tool work and testing'],
  ]);
  y++;
  g.text(62, y++, 'Reported separately, never added', 'bd');
  y = kv(g, 62, y, 18, 56, [
    ['Queue', '0:00 · started at launch (jobs 4)'],
    ['Planning', 'none · built-in template'],
    ['Verification', '7:30 · outside the task process'],
    ['Judging', '3:25 · one fresh session (M12)'],
    ['Experiment', '1:56:00 · whole run, 4 configurations'],
  ]);
  y++;
  para(g, 62, y, 56, 'Concurrent configurations overlap in clock time, so the experiment is shorter than the sum of their elapsed times.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Timing of the run', go: 'TimingPhases', focus: focus === 'timing' }, { label: 'Cost basis of all results', go: 'CostBasis' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 't', d: 'Timing', go: 'TimingPhases' }, { k: 'b', d: 'Cost basis', go: 'CostBasis' }, { k: 'u', d: 'Currency and energy', go: 'CurrencyEnergy' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- MeasurementsScreen · halted configuration

export function measurementsPartial(sz, focus = 'tasks') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const r = byId['R-0925b-2'];
  measureChrome(g, r, 'measurements and cost');
  const done = CODEX.filter((t) => t.s != null);
  const tot = { s: done.reduce((n, t) => n + t.s, 0), c: done.reduce((n, t) => n + t.c, 0), inp: done.reduce((n, t) => n + t.inp, 0), ca: done.reduce((n, t) => n + t.ca, 0), out: done.reduce((n, t) => n + t.out, 0), rs: done.reduce((n, t) => n + t.rs, 0) };
  if (dur(tot.s) !== dur(r.time) || f2(tot.c) !== f2(r.cost)) throw new Error('Measurements disagree with R-0925b-2');
  const tf = focus === 'tasks';
  g.box(0, 2, W, 12, { f: tf ? 'ac' : 'ln', title: 'Per task and total · ▲ partial · — unknown, never zero', sub: 'USD' });
  const P = (v, p) => (p ? { t: `${v} ▲`, f: 'bd' } : v);
  const rows = CODEX.map((t) => (t.s == null
    ? { v: [t.id, t.t, { t: t.st, f: 'mu' }, { t: t.ch, f: 'mu' }, '—', '—', '—', '—', '—', '—', { t: 'unknown · not run', f: 'mu' }] }
    : { v: [t.id, t.t, t.partial ? { t: t.st, f: 'bd' } : t.st, t.ch, P(dur(t.s), t.partial), P(`${t.inp}k`, t.partial), P(`${t.ca}k`, t.partial), P(`${t.out}k`, t.partial), P(`${t.rs}k`, t.partial), P(usd(t.c), t.partial), t.partial ? { t: 'reported · partial', f: 'bd' } : 'reported · complete'] }));
  rows.push({ v: ['Σ', 'Configuration · 7 tasks', { t: '✗ halted T5', f: 'bd' }, '13✓ 8○', `${dur(tot.s)} ▲`, `${k(tot.inp)} ▲`, `${k(tot.ca)} ▲`, `${tot.out}k ▲`, `${tot.rs}k ▲`, `${usd(tot.c)} ▲`, 'reported · 5/7 ▲'], f: 'bd' });
  table(g, 1, 3, W - 2, COLS(W - 2), rows, { cursor: 4, focused: tf });
  g.region(1, 3, W - 2, 9, 'DataTable', '#measurements');
  g.text(2, 12, fit('The total covers T1–T5 only and stays marked partial. It is never shown as the cost of a complete benchmark.', W - 4), 'mu');
  let y = notice(g, 1, 15, W - 2, 'error', 'T5 halted · authentication failed (401) at 21:47:12 · configuration stopped', 'The OpenAI token expired mid-task. Codex had reported usage up to 21:47:09; the final total never arrived, so T5 time, tokens and cost are kept as partial. T6 and T7 never started: their measurements are unknown, not zero, and their status stays visible beside them.');
  g.region(1, 15, W - 2, y - 15, 'Static', '#halt.notice.-error');
  y++;
  const ef = focus === 'sources';
  g.box(0, y, W, H - 2 - y, { f: ef ? 'ac' : 'ln', title: 'Sources and coverage' });
  g.region(0, y, W, H - 2 - y, 'Static', '#coverage.kv');
  kv(g, 2, y + 1, 16, W - 4, [
    ['Cost basis', 'reported by Codex 0.98.0 per task · no estimate added for the same usage'],
    ['Tokens', 'harness-reported · input, cached, output and reasoning · cached ⊂ input, reasoning ⊂ output'],
    ['Coverage', 'complete for T1–T4 · partial for T5 · none for T6–T7'],
    ['Elapsed', `${dur(tot.s)} ▲ · T5 counted up to the failure · sequential run, so no queue time`],
    ['Status', 'halted by an authentication failure · not an interruption, not a timeout'],
  ]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 't', d: 'Timing', go: 'TimingPhases' }, { k: 'b', d: 'Cost basis', go: 'CostBasis' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- TimingScreen · run 2026-09-28-a

export function timingPhases(sz, focus = 'table') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Run 2026-09-28-a · timing');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(`Inventory web app r1 · sha256 ${s8(SHA.inv1)}… · 4 configurations at once (jobs 4) · mike-mbp-m4 · launched 19:02:10`, W - 2));
  g.region(0, 1, W, 1, 'Static', '#run-bar');
  const rs = ['R-0928a-1', 'R-0928a-2', 'R-0928a-3', 'R-0928a-4'].map((id) => byId[id]);
  const VER = [400, 425, 450, 550], JUD = [190, 220, 205, 245];
  const FREEZE = 20, judgeStart = FREEZE + Math.max(...rs.map((r, i) => r.time + VER[i]));
  const total = judgeStart + JUD.reduce((a, b) => a + b, 0);
  if (dur(total) !== '1:56:00') throw new Error('Experiment duration changed: ' + dur(total));

  // Timeline: x = seconds × scale. Each task process (█) is followed by its verification (▒); judging is sequential after all.
  const cf = focus === 'chart';
  g.box(0, 2, W, 15, { f: cf ? 'ac' : 'ln', title: 'Timeline · clock time from launch', sub: '█ task process · ▒ verification · ░ judging' });
  g.region(0, 2, W, 15, 'Static', '#timeline');
  const LX = 16, TW = W - LX - 3, scale = TW / total;
  const ticks = [0, 1800, 3600, 5400, total];
  ticks.forEach((t) => { const x = LX + Math.min(TW - 1, Math.round(t * scale)); g.text(x, 3, '┬', 'ln'); g.text(Math.min(x, W - 3 - len(dur(t))), 4, dur(t), 'mu'); });
  g.text(2, 5, 'freeze', 'mu'); g.text(LX, 5, '▌', 'ac');
  const frac = GROK_TASKS.map((t) => t[4] / 3090);
  rs.forEach((r, i) => {
    const y = 6 + i;
    g.text(2, y, fit(r.h, LX - 3), 'bd');
    let t = FREEZE;
    frac.forEach((f) => {
      const a = Math.round(t * scale), d = r.time * f, v = VER[i] / 7;
      const b = Math.round((t + d) * scale), c = Math.round((t + d + v) * scale);
      g.text(LX + a, y, '█'.repeat(Math.max(1, b - a)), 'ac');
      if (c > b) g.text(LX + b, y, '▒'.repeat(c - b), 'mu');
      t += d + v;
    });
  });
  let t = judgeStart;
  ['A', 'B', 'C', 'D'].forEach((l, i) => {
    const y = 11;
    const a = Math.round(t * scale), b = Math.round((t + JUD[i]) * scale);
    g.text(LX + a, y, '░'.repeat(Math.max(1, b - a)), 'ln');
    t += JUD[i];
  });
  g.text(2, 11, 'judging', 'mu');
  g.text(LX + Math.round(judgeStart * scale) - 22, 12, fit('4 reviews, one at a time ┘', 26), 'mu');
  g.text(2, 14, fit('Bars show when work happened; the length of █ alone is each configuration’s benchmark elapsed time.', W - 4), 'mu');
  g.text(2, 15, fit('No queue: every harness had its own lane. Planning: none, the built-in template has approved tasks.', W - 4), 'mu');

  const tf = focus === 'table';
  g.box(0, 17, W, 10, { f: tf ? 'ac' : 'ln', title: 'Per configuration · benchmark elapsed is the only time that ranks' });
  table(g, 1, 18, W - 2, [{ l: 'Configuration', w: 40 }, { l: 'Benchmark elapsed', w: 19, al: 'right' }, { l: 'Queue', w: 8, al: 'right' }, { l: 'Planning', w: 10, al: 'right' }, { l: 'Verification', w: 14, al: 'right' }, { l: 'Judging', w: 10, al: 'right' }, { l: 'Status', w: W - 2 - 101 }],
    [...rs.map((r, i) => ({ v: [`${r.h} · ${r.model} · ${r.effort === 'default' ? 'default' : r.effort}`, { t: dur(r.time), f: 'bd' }, '0:00', '—', dur(VER[i]), dur(JUD[i]), '✓ complete'], go: i === 2 ? 'Measurements' : undefined })),
      { v: ['Σ of configurations', dur(rs.reduce((n, r) => n + r.time, 0)), '0:00', '—', dur(VER.reduce((a, b) => a + b)), dur(JUD.reduce((a, b) => a + b)), ''], f: 'mu' },
      { v: ['Experiment · launch to last review', { t: dur(total), f: 'bd' }, '', '', '', '', 'clock time'], f: 'bd' }], { cursor: 2, focused: tf });
  g.region(1, 18, W - 2, 8, 'DataTable', '#phase-table');
  para(g, 1, 28, W - 2, 'Benchmark elapsed is the sum of a configuration’s task process durations, including the harness’s own tool work and testing. Queueing, planning, external verification and judging are excluded from it and shown on their own. The experiment duration is clock time for the whole run; with four configurations at once it is shorter than the sum of their elapsed times.', 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'Measurements' }, { k: 'enter', d: 'Open measurements', go: 'Measurements' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- cost basis across the 12 results (over Results)

const BASIS = {
  'R-0928a-1': ['subscription estimate', 'usage known'],
  'R-0928a-2': ['reported', 'complete'],
  'R-0928a-3': ['estimate · list price', 'cache not exposed'],
  'R-0928a-4': ['$0 verified · local', 'no charge'],
  'R-0925b-1': ['reported', 'complete'],
  'R-0925b-2': ['reported', '▲ partial T5–T7'],
  'R-0921a-1': ['$0 verified · local', 'no charge'],
  'R-0921a-2': ['unknown', 'no usage, no rate'],
  'R-0924lab-1': ['reported', 'complete'],
  'R-0924lab-2': ['$0 verified · local', 'no charge'],
  'R-0924lab-3': ['estimate · list price', 'complete'],
  'R-0919lab-1': ['$0 verified · local', 'no charge'],
};

export function costBasis(sz, focus = 'table') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 28, 'Cost basis · 12 results of r1', { sel: '#cost-basis' });
  let y = m.y;
  const tf = focus === 'table';
  table(g, m.x, y, m.w, [{ l: 'Result', w: 12 }, { l: 'Model', w: 19 }, { l: 'Cost', w: 9, al: 'right' }, { l: 'Basis', w: 22 }, { l: 'Coverage', w: m.w - 62 }],
    RESULTS.map((r) => {
      const [b, c] = BASIS[r.id];
      return { v: [r.id, `${r.src === 'imported' ? '↓' : ' '} ${r.model}`, r.cost == null ? { t: 'unknown', f: 'it' } : usd(r.cost), b.startsWith('unknown') ? { t: b, f: 'it' } : b, c.startsWith('▲') ? { t: c, f: 'bd' } : c] };
    }), { cursor: 0, focused: tf });
  g.region(m.x, y, m.w, 13, 'DataTable', '#basis-table');
  y += 14;
  y = kv(g, m.x, y, 13, m.w, [
    ['Reported', 'the harness or provider stated the charge · always preferred'],
    ['Estimate', 'known usage × recorded rates · labelled API-equivalent everywhere'],
    ['Subscription', 'not $0 · estimated from usage when it is known'],
    ['$0 verified', 'local endpoint with no provider charge · energy is separate'],
    ['Unknown', 'no usage or no rate · shown as unknown, sorted last, never $0'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'An estimate is never added to a reported amount for the same usage. Rankings and the report keep these labels next to every cost.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Currency and energy…', go: 'CurrencyEnergy' }, { label: 'Close', v: 'primary', go: 'Results', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Results' }, { k: 'enter', d: 'Open measurements', go: 'Measurements' }, { k: 'u', d: 'Currency and energy', go: 'CurrencyEnergy' }], '');
  return g;
}

// ---------------------------------------------------------------- currency and energy (Setup, recorded at launch)

export function currencyEnergy(sz, focus = 'rate') {
  const g = setup(sz, 'none');
  const m = modal(g, 86, 27, 'Currency and energy · recorded with the benchmark', { sel: '#currency-energy' });
  let y = m.y;
  g.text(m.x, y, 'Primary', 'mu'); g.text(m.x + 14, y++, fit('USD · every cost is shown in USD first', m.w - 14), 'bd');
  y++;
  check(g, m.x, y++, 'Also show COP', true, { focus: focus === 'cop' });
  g.text(m.x + 2, y, 'Rate', 'mu'); input(g, m.x + 14, y, 16, '4012.50', { focus: focus === 'rate' }); g.text(m.x + 31, y++, fit('COP per USD · supplied by you', m.w - 31), 'mu');
  g.text(m.x + 2, y, 'As of', 'mu'); input(g, m.x + 14, y, 16, '2026-10-01', { focus: focus === 'date' }); g.text(m.x + 31, y++, fit('stored with the run and its exports', m.w - 31), 'mu');
  g.region(m.x, y - 3, m.w, 3, 'Vertical', '#cop');
  y = notice(g, m.x + 2, y, m.w - 2, 'warning', 'The README’s exchange rate is historical', 'It is never used for new runs. Without a supplied rate, COP is not shown.');
  y++;
  check(g, m.x, y++, 'Estimate electricity cost', true, { focus: focus === 'tariff-on' });
  g.text(m.x + 2, y, 'Tariff', 'mu'); input(g, m.x + 14, y, 16, '0.18', { focus: focus === 'tariff' }); g.text(m.x + 31, y++, fit('USD per kWh · supplied by you', m.w - 31), 'mu');
  g.region(m.x, y - 2, m.w, 2, 'Vertical', '#tariff');
  y++;
  g.text(m.x, y++, 'What the energy estimate can cover on mike-mbp-m4 (M18)', 'bd');
  y = kv(g, m.x, y, 14, m.w, [
    ['Measured', 'CPU package and GPU · powermetrics · needs root'],
    ['Not measured', 'display, memory, storage, cloud inference hardware'],
    ['Scope label', 'CPU package + GPU only · never “whole-system”'],
    ['Concurrency', 'shared by the whole experiment · not split per configuration'],
    ['Provider cost', 'kept apart · energy is never added to a provider charge'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Converting to COP does not turn an estimate into a charge or fill partial coverage. Missing energy data stays partial or unknown in the estimate.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Setup' }, { label: 'Save', v: 'primary', go: 'Setup', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Save', go: 'Setup' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

import { loading } from './lib.mjs';
const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const MEASURE_WIDGET_STATES = [
  { widget: 'DataTable#measurements', label: 'M10 · Measurements', states: [
    ['Loading', mini('Per task and total', (g, x, y, w) => loading(g, x, y + 1, w, 'Reading usage events for 7 tasks…'))],
    ['Empty', mini('Per task and total', (g, x, y, w) => { centered(g, y + 1, 'No measurements yet', 'bd'); centered(g, y + 2, 'T1 has not finished. Values appear per task.', 'mu'); })],
    ['Error', mini('Per task and total', (g, x, y, w) => { notice(g, x, y, w, 'error', 'usage.jsonl could not be parsed', 'Line 212 is malformed. Affected values stay unknown; nothing is estimated in their place.'); })],
  ] },
];
