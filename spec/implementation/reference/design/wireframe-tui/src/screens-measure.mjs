// M10 · Execution measurements and cost accounting.
// MeasurementsScreen (m from a result's Outcomes tab) shows every measurement category per task with its source,
// coverage and cost basis; TimingScreen separates benchmark elapsed time from excluded phases; the cost-basis and
// currency/energy dialogs keep reported amounts, estimates and unknowns apart. Totals agree with results-data.mjs.
import { Grid, fit, len, header, footer, table, buttons, input, check, para, kv, notice, modal, select } from './lib.mjs';
import { SHA, s8 } from './screens.mjs';
import { results, GROK_TASKS, GROK_GEN } from './screens-results.mjs';
import { setup } from './screens-setup.mjs';
import { RESULTS, byId, dur, usd, f1, f2, quality, stats, TRIAL_RUN, TRIAL_CONFIGS, trialGates, checksText, BILLING, STATS, rate, BASIS, locText, secText, pooled } from './results-data.mjs';

const k = (n) => (n >= 1000 ? `${(n / 1000).toFixed(2)}M` : `${n}k`);

// R-0928a-3 · Grok CLI. Input/output match the Outcomes tab; reasoning is a subset of output; cache is not exposed.
// Grok CLI reports no cost, so cost = known usage × the xAI price table recorded at launch (x.ai/api, 2026-09-15).
const RATE = { in: 0.25, out: 0.80 };
const REASONING = [3, 8, 17, 5, 14, 12, 9];
const GROK = GROK_TASKS.map(([id, t, ex, ch, s, tok, c], i) => {
  const [inp, out] = tok.split(' / ').map((x) => parseInt(x, 10));
  return { id, t, ex, ch, s, inp, out, rs: REASONING[i], c, gen: GROK_GEN[i] };
});
const genCell = (gen) => (gen?.n == null ? { t: '—', f: 'mu' } : gen.req[0] < gen.req[1] ? { t: `▲ ${f1(gen.n / Number(gen.d))}`, f: 'bd' } : f1(gen.n / Number(gen.d)));

// R-0925b-2 · Codex, sequential run, authentication failure at T5. Totals match results-data (2710 s, $2.05).
const CODEX = [
  { id: 'T1', t: 'Repository and scaffold', st: '✓ exit 0', ch: '6✓', s: 300, inp: 210, ca: 160, out: 11, rs: 6, c: 0.22, gen: { n: 11040, d: '150.000', req: [7, 7] } },
  { id: 'T2', t: 'Inventory data and persistence', st: '✓ exit 0', ch: '4✓', s: 520, inp: 380, ca: 300, out: 19, rs: 10, c: 0.38, gen: { n: 19060, d: '255.000', req: [8, 8] } },
  { id: 'T3', t: 'Inventory management', st: '✓ exit 0', ch: '5✓', s: 760, inp: 610, ca: 495, out: 31, rs: 17, c: 0.61, gen: { n: 31020, d: '415.000', req: [10, 10] } },
  { id: 'T4', t: 'Inventory lookup', st: '✓ exit 0', ch: '2✓', s: 410, inp: 300, ca: 240, out: 14, rs: 8, c: 0.31, gen: { n: 14060, d: '190.400', req: [6, 6] } },
  { id: 'T5', t: 'Shopping cart', st: '✗ auth 401', ch: '6○', s: 720, inp: 420, ca: 350, out: 22, rs: 12, c: 0.53, partial: true, gen: { n: null, d: null, req: [0, 5] } },
  { id: 'T6', t: 'Checkout', st: '○ not run', ch: '4○', s: null },
  { id: 'T7', t: 'Test and fix', st: '○ not run', ch: '3○', s: null },
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
  const c = [{ l: '#', w: 4 }, { l: 'Task', w: 18 }, { l: 'Process', w: 12 }, { l: 'Checks', w: 8 }, { l: 'Time', w: 8, al: 'right' }, { l: 'Input', w: 8, al: 'right' }, { l: 'Cached', w: 8, al: 'right' }, { l: 'Output', w: 7, al: 'right' }, { l: 'Reas.', w: 7, al: 'right' }, { l: 'Gen tok/s', w: 10, al: 'right' }, { l: 'Cost', w: 8, al: 'right' }];
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
    kv(g, 2, 14, 12, W - 4, [
      ['Cost', 'API-equivalent estimate · Grok CLI reports none'],
      ['Prices', '$0.25 in · $0.80 out per M · x.ai/api · 2026-09-15'],
      ['Cached', '? not exposed · no discount applied'],
      ['Reasoning', `${tot.rs}k, part of output · never added again`],
      ['Elapsed', `${dur(tot.s)} · 7 task processes, tool work included`],
      ['Excluded', 'verification 7:30 · judging 3:25 · queue 0:00'],
      ['Gen tok/s', `▲ ${f1(rate(STATS[r.id].gen))} · 41 of 44 requests paired · proxy window`],
      ['Files / LOC', `${STATS[r.id].files} / ${locText(STATS[r.id].loc)} · final snapshot, baseline included`],
    ]);
    footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 't', d: 'Timing', go: 'TimingPhases' }, { k: 'b', d: 'Basis', go: 'CostBasis' }, { k: 'g', d: 'Gen', go: 'ThroughputDetail' }, { k: 'a', d: 'Files', go: 'ArtifactStats' }]);
    return g;
  }
  g.box(0, 2, W, 12, { f: tf ? 'ac' : 'ln', title: 'Per task and total · every category, with its source', sub: 'USD' });
  const rows = GROK.map((t) => ({ v: [t.id, t.t, `✓ exit ${t.ex}`, t.ch, dur(t.s), `${t.inp}k`, { t: '?', f: 'it' }, `${t.out}k`, `${t.rs}k`, genCell(t.gen), usd(t.c), t.gen.req[0] < t.gen.req[1] ? { t: `est. · ${t.gen.req[0]}/${t.gen.req[1]} req ▲`, f: 'bd' } : `est. · ${t.gen.req[0]}/${t.gen.req[1]} req`], go: t.gen.req[0] < t.gen.req[1] ? 'ThroughputDetail' : 'TaskChecks' }));
  const S = STATS[r.id];
  rows.push({ v: ['Σ', 'Configuration · 7 tasks', '✓ 7 of 7', '29✓ 1?', dur(tot.s), k(tot.inp), { t: '?', f: 'it' }, `${tot.out}k`, `${tot.rs}k`, { t: `▲ ${f1(rate(S.gen))}`, f: 'bd' }, usd(tot.c), 'est. · 41/44 req ▲'], f: 'bd' });
  table(g, 1, 3, W - 2, COLS(W - 2), rows, { cursor: 2, focused: tf });
  g.region(1, 3, W - 2, 9, 'DataTable', '#measurements');
  g.text(2, 12, fit('cached ⊂ input, reasoning ⊂ output: never added · ? not exposed · Gen tok/s = paired output ÷ Σ request windows', W - 4), 'mu');

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
    ['Prices', 'x.ai/api price table · retrieved 2026-09-15'],
    ['', 'recorded with the launch evidence (M04)'],
    ['Labelled', 'estimate · price source and date, everywhere'],
    ['Time', '11:05 · start to exit, tool work included'],
    ['Gen tok/s', '44,020 ÷ 376.300 s = 117.0 · 9 of 9 requests'],
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
  buttons(g, W - 1, H - 2, [{ label: 'Gen tok/s detail', go: 'ThroughputDetail' }, { label: 'Files / LOC', go: 'ArtifactStats' }, { label: 'Timing of the run', go: 'TimingPhases', focus: focus === 'timing' }, { label: 'Cost basis of all results', go: 'CostBasis' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 't', d: 'Timing', go: 'TimingPhases' }, { k: 'b', d: 'Cost basis', go: 'CostBasis' }, { k: 'u', d: 'Currency', go: 'CurrencyEnergy' }, { k: 'g', d: 'Gen tok/s', go: 'ThroughputDetail' }, { k: 'a', d: 'Files / LOC', go: 'ArtifactStats' }, { k: 'x', d: 'Context', go: 'ContextDetailRetained' }, { k: 'tab', d: 'Focus', do: 'next' }]);
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
    ? { v: [t.id, t.t, { t: t.st, f: 'mu' }, { t: t.ch, f: 'mu' }, '—', '—', '—', '—', '—', { t: '—', f: 'mu' }, '—', { t: 'unknown · not run', f: 'mu' }] }
    : { v: [t.id, t.t, t.partial ? { t: t.st, f: 'bd' } : t.st, t.ch, P(dur(t.s), t.partial), P(`${t.inp}k`, t.partial), P(`${t.ca}k`, t.partial), P(`${t.out}k`, t.partial), P(`${t.rs}k`, t.partial), t.gen.n == null ? { t: '— ▲', f: 'bd' } : genCell(t.gen), P(usd(t.c), t.partial), t.partial ? { t: 'reported · no end ▲', f: 'bd' } : 'reported · complete'] }));
  const S = STATS[r.id];
  rows.push({ v: ['Σ', 'Configuration · 7 tasks', { t: '✗ halted T5', f: 'bd' }, '17✓ 13○', `${dur(tot.s)} ▲`, `${k(tot.inp)} ▲`, `${k(tot.ca)} ▲`, `${tot.out}k ▲`, `${tot.rs}k ▲`, `▲ ${f1(rate(S.gen))}`, `${usd(tot.c)} ▲`, 'reported · 5/7 ▲'], f: 'bd' });
  const gs = done.filter((t) => t.gen.n != null);
  if (gs.reduce((a, t) => a + t.gen.n, 0) !== S.gen.n || gs.reduce((a, t) => a + Number(t.gen.d), 0).toFixed(3) !== Number(S.gen.d).toFixed(3)) throw new Error('Codex generation pairs disagree with STATS');
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
    ['Gen tok/s', `▲ ${f1(rate(S.gen))} matched subset · T1–T4 ${locText(S.gen.n)} ÷ ${secText(S.gen.d)} s · T5 has no final total, so never ÷ by T5 time`],
    ['Rankings', 'cost, time and every statistic are partial · counted as missing in any ranking that weights them (M06)'],
  ]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 't', d: 'Timing', go: 'TimingPhases' }, { k: 'b', d: 'Cost basis', go: 'CostBasis' }, { k: 'g', d: 'Gen tok/s', go: 'ThroughputDetail' }, { k: 'a', d: 'Files / LOC', go: 'ArtifactStats' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- ThroughputScreen · R174 per-request generation throughput

// R-0928a-3, T3 and T5 requests. T3's two subagent streams overlap and are both summed in full. T5 lost the end of
// three streams: their 8,080 output tokens stay in the output total and out of the rate.
const REQS = [
  ['r3-4', 'T3', 'sub · tests', '21:16:10.402', '21:16:49.006', '38.604', 4520],
  ['r3-5', 'T3', 'sub · lint', '21:16:12.950', '21:16:40.118', '27.168', 3180],
  ['r5-1', 'T5', 'main', '21:31:04.211', '21:31:50.411', '46.200', 5400],
  ['r5-2', 'T5', 'main', '21:32:20.007', '21:33:12.307', '52.300', 6120],
  ['r5-3', 'T5', 'sub · cart', '21:33:40.660', '21:34:23.260', '42.600', 4980],
  ['r5-4', 'T5', 'main', '21:35:01.118', '21:35:49.818', '48.700', 5700],
  ['r5-5', 'T5', 'main', '21:36:30.500', '21:37:11.700', '41.200', 4800],
  ['r5-6', 'T5', 'main', '21:38:02.300', null, null, 2960],
  ['r5-7', 'T5', 'sub · ui', '21:38:05.940', null, null, 2480],
  ['r5-8', 'T5', 'main', '21:39:12.025', null, null, 2640],
];

export function throughputDetail(sz, focus = 'requests') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const r = byId['R-0928a-3'], S = STATS[r.id], x = rate(S.gen);
  measureChrome(g, r, 'Gen tok/s · per-request generation throughput');
  const t5 = REQS.filter((q) => q[1] === 'T5'), t5m = t5.filter((q) => q[4]);
  const T5 = GROK_GEN[4];
  if (t5m.reduce((a, q) => a + q[6], 0) !== T5.n || t5m.reduce((a, q) => a + Number(q[5]), 0).toFixed(3) !== Number(T5.d).toFixed(3) || t5.reduce((a, q) => a + q[6], 0) !== T5.full) throw new Error('T5 requests disagree with GROK_GEN');
  g.box(0, 2, W, 9, { f: focus === 'value' ? 'ac' : 'ln', title: '▲ Partial matched subset · never divided as if complete', sub: 'exact values · rounded only here' });
  g.region(0, 2, W, 9, 'Static', '#throughput-value.kv');
  kv(g, 2, 3, 12, 56, [
    ['Gen tok/s', `▲ ${x.toFixed(2)} · per-request, not wall clock`, 'bd'],
    ['Matched', `${locText(S.gen.n)} output tok ÷ ${secText(S.gen.d)} s`],
    ['Requests', `${S.gen.req[0]} of ${S.gen.req[1]} paired · 3 T5 streams have no end`],
    ['Coverage', `${(S.gen.n / S.gen.full * 100).toFixed(1)}% of ${locText(S.gen.full)} output tokens`],
    ['Never', [`✗ ${locText(S.gen.full)} ÷ ${secText(S.gen.d)} s = ${(S.gen.full / Number(S.gen.d)).toFixed(2)}`, 'all output over only the paired windows']],
  ]);
  kv(g, 62, 3, 11, 56, [
    ['Basis', `${BASIS[S.gen.basis]} v1 · start → end`],
    ['Covers', 'output incl. reasoning (68k ⊂ 173k)'],
    ['Clock', 'proxy monotonic · per request · 1 ms'],
    ['Policies', 'tok-norm v1 3c1a9e0f… · pair v1 7b2d41aa…'],
    ['Evidence', '44 receipts · 41 timing pairs · digests'],
    ['Not used', 'task time · time to first token · tool time'],
  ]);
  const tf = focus === 'requests';
  g.box(0, 11, W, 15, { f: tf ? 'ac' : 'ln', title: 'Requests · T3 overlap and T5 · 10 of 44', sub: 'enter opens the request log' });
  const rows = REQS.map(([id, task, agent, a, b, d, n]) => ({ v: [id, task, agent, a, b ?? { t: '— no end', f: 'bd' }, d ?? '—', locText(n), d ? f1(n / Number(d)) : '—', d ? (task === 'T3' ? `✓ paired · overlaps ${id === 'r3-4' ? 'r3-5' : 'r3-4'}, summed` : '✓ paired') : { t: '✗ stream cut · no end', f: 'bd' }] }));
  rows.push({ v: ['Σ T5', '', '5 of 8', '', '', secText(T5.d), `${locText(T5.n)} of ${locText(T5.full)}`, f1(T5.n / Number(T5.d)), 'unpaired 8,080 stay in output'], f: 'bd' });
  table(g, 1, 12, W - 2, [{ l: 'Request', w: 8 }, { l: 'Task', w: 5 }, { l: 'Agent', w: 12 }, { l: 'Start', w: 13 }, { l: 'End', w: 13 }, { l: 'Window s', w: 9, al: 'right' }, { l: 'Output tok', w: 17, al: 'right' }, { l: 'Rate', w: 7, al: 'right' }, { l: '', w: 1 }, { l: 'Pair', w: W - 2 - 85 }],
    rows.map((x) => ({ ...x, v: [...x.v.slice(0, 8), '', x.v[8]] })), { cursor: 7, focused: tf });
  g.region(1, 12, W - 2, 12, 'DataTable', '#requests');
  const rf = focus === 'rules';
  g.box(0, 26, 60, 12, { f: rf ? 'ac' : 'ln', title: 'Rules applied' });
  g.region(0, 26, 60, 12, 'Static', '#throughput-rules');
  let y = 27;
  for (const t of ['Concurrent subagent windows are summed, never unioned: r3-4 and r3-5 overlap for 27.168 s and both count in full.', 'A request enters the rate only with its own output and a positive window of the same basis.', 'Proxy windows are never relabelled as native decode, and the mean of rates is never used.']) { g.text(2, y, '●', 'ac'); y = para(g, 4, y, 54, t, 'mu'); }
  g.box(60, 26, 60, 12, { f: 'ln', title: 'Ranking effect' });
  g.region(60, 26, 60, 12, 'Static', '#throughput-effect');
  y = kv(g, 62, 27, 12, 56, [
    ['Original', 'weight 0 · not looked up · excludes nobody'],
    ['If weighted', 'excluded · metric_partial · Gen tok/s'],
    ['Pi results', 'native decode · a separate cohort'],
  ]);
  para(g, 62, y + 1, 56, 'Gen tok/s describes the whole tested configuration, including the proxy. It is not a model speed claim and never enters the judge’s input.', 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'Measurements' }, { k: 'enter', d: 'Request log', go: 'EvidenceViewer' }, { k: 'a', d: 'Files / LOC', go: 'ArtifactStats' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- ArtifactStatsScreen · R174 final delivered files and LOC

const KINDS = [
  ['Source', 'js · html · css', 18, 2050, 'UTF-8', 'js/app.js · js/cart.js · index.html'],
  ['Tests', 'js', 9, 512, 'UTF-8', 'tests/cart.test.js · tests/orders.test.js'],
  ['Documentation', 'md', 3, 168, 'UTF-8', 'README.md · docs/decisions.md'],
  ['Text assets', 'svg · json', 6, 184, 'UTF-8 · 1 UTF-16 LE BOM', 'assets/icon.svg · data/sample.json'],
  ['Binary assets', 'png · ico', 2, null, 'binary', 'assets/logo.png · favicon.ico'],
];
const EXCLUDED = [
  ['.git/', '214', 'VCS metadata'],
  ['node_modules/', '1,180', 'declared dependency path'],
  ['.axbenchmark/', '46', 'engine evidence'],
  ['public/fixtures', '1', 'symlink · never followed'],
];

export function artifactStats(sz, focus = 'kinds') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const r = byId['R-0928a-3'], S = STATS[r.id];
  if (KINDS.reduce((a, k) => a + k[2], 0) !== S.files || KINDS.reduce((a, k) => a + (k[3] ?? 0), 0) !== S.loc) throw new Error('Artifact kinds disagree with STATS');
  measureChrome(g, r, 'Files / LOC · final delivered snapshot');
  g.box(0, 2, W, 8, { f: focus === 'snapshot' ? 'ac' : 'ln', title: `${S.files} files / ${locText(S.loc)} LOC · final snapshot size (baseline included)` });
  g.region(0, 2, W, 8, 'Static', '#snapshot.kv');
  kv(g, 2, 3, 11, 56, [
    ['Snapshot', 'final delivered · after T7 · commit 9b31e07'],
    ['Manifest', `sha256 ${s8(SHA.cfg)}… · immutable, pinned`],
    ['Scope', 'delivered workspace · fixed by template r1'],
    ['Policy', 'files-loc v1 · frozen with the manifest'],
    ['Baseline', '5 template files survive · 61 lines'],
  ]);
  kv(g, 62, 3, 11, 56, [
    ['Files', `${S.files} regular paths · each counted once`],
    ['', 'binary assets count as files, never as lines'],
    ['LOC', `${locText(S.loc)} physical text lines`],
    ['', 'blank lines, comments and docs included'],
    ['', 'not logical code size, never quality'],
  ]);
  const kf = focus === 'kinds';
  g.box(0, 10, W, 10, { f: kf ? 'ac' : 'ln', title: 'Included · by kind', sub: 'enter lists the paths' });
  table(g, 1, 11, W - 2, [{ l: 'Kind', w: 16 }, { l: 'Extensions', w: 16 }, { l: 'Files', w: 7, al: 'right' }, { l: 'LOC', w: 8, al: 'right' }, { l: '', w: 2 }, { l: 'Encoding', w: 26 }, { l: 'Examples', w: W - 2 - 75 }],
    [...KINDS.map(([k, e, f, l, enc, ex]) => ({ v: [k, e, String(f), l == null ? { t: '—', f: 'mu' } : locText(l), '', l == null ? { t: 'binary · no lines', f: 'mu' } : enc, ex] })),
      { v: ['Σ', '', String(S.files), locText(S.loc), '', 'strict decoding, no guess', ''], f: 'bd' }], { cursor: 3, focused: kf });
  g.region(1, 11, W - 2, 8, 'DataTable', '#artifact-stats');
  const ef = focus === 'excluded';
  g.box(0, 20, 60, 8, { f: ef ? 'ac' : 'ln', title: 'Excluded · same rules for every result' });
  table(g, 1, 21, 58, [{ l: 'Path', w: 17 }, { l: 'Entries', w: 9, al: 'right' }, { l: '', w: 1 }, { l: 'Reason', w: 31 }], EXCLUDED.map(([p, n, why]) => ({ v: [p, n, '', why] })), { cursor: ef ? 3 : -1, focused: ef });
  g.region(1, 21, 58, 5, 'DataTable', '#excluded');
  g.box(60, 20, 60, 8, { title: 'Lines', f: 'ln' });
  g.region(60, 20, 60, 8, 'Static', '#line-rules');
  kv(g, 62, 21, 11, 56, [
    ['Endings', 'LF, CRLF and lone CR each end one line'],
    ['Last line', 'counts once if text follows the last ending'],
    ['Encodings', 'UTF-8 (BOM optional) · UTF-16 with a BOM'],
    ['Unknown', 'undecodable text → LOC partial, never 0'],
    ['Frozen', 'later workspace edits never change counts'],
  ]);
  g.box(0, 28, W, H - 30, { title: 'Ranking effect', f: 'ln' });
  g.region(0, 28, W, H - 30, 'Static', '#artifact-effect');
  let y = kv(g, 2, 29, 12, W - 4, [
    ['Original', 'Files and LOC weigh 0 · not looked up · they exclude nobody'],
    ['If weighted', 'two independent factors, each with a direction · trial means rank; a Σ over trials is just snapshot sizes'],
    ['Partial LOC', `R-0919lab-1 · ${STATS['R-0919lab-1'].locNote} · its file count stays complete`],
  ]);
  para(g, 2, y + 1, W - 4, 'More files or lines never means better quality. Delivered code, tests and docs still reach the judge as evidence; these counts do not.', 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'Measurements' }, { k: 'enter', d: 'Paths' }, { k: 'g', d: 'Gen tok/s', go: 'ThroughputDetail' }, { k: 'tab', d: 'Focus', do: 'next' }]);
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

// Source, scope or coverage beside each basis (D4). The cost and basis come from results-data.mjs.
const SOURCE = {
  'R-0928a-1': 'anthropic.com/pricing 09-26',
  'R-0928a-2': 'Codex 0.98.0 · complete',
  'R-0928a-3': 'x.ai/api 09-15 · no cache split',
  'R-0928a-4': 'jobs 4 · energy not divided',
  'R-0925b-1': 'Claude Code 3.4.1 · complete',
  'R-0925b-2': '▲ covers 5 of 7 tasks',
  'R-0921a-1': 'jobs 2 · energy not divided',
  'R-0921a-2': 'no usage reported · no estimate',
  'R-0924lab-1': 'Claude Code 3.4.0 · complete',
  'R-0924lab-2': 'jobs 3 · energy not divided',
  'R-0924lab-3': 'openai.com/api/pricing 09-20',
  'R-0919lab-1': '80.7 Wh × $0.18/kWh · CPU+GPU',
};
const BASIS_WORD = { reported: 'reported', estimate: 'estimate', energy: 'energy estimate', unknown: 'unknown' };
// R3-1 · billing kind frozen at launch: from the harness's status output, declared by the user in the catalog, or unknown.
const billingCell = (r) => {
  const [k, src] = BILLING[r.id];
  if (src === 'declared') return { t: `${k} · declared by user`, f: 'bd' };
  if (src === 'status') return `${k} · harness status`;
  return k === 'local' ? 'local endpoint · no account' : { t: 'unknown · not stated', f: 'it' };
};

export function costBasis(sz, focus = 'table') {
  const g = results(sz, 'none');
  const m = modal(g, 112, 37, 'Cost basis · 12 results of r1', { sel: '#cost-basis' });
  let y = m.y;
  const tf = focus === 'table';
  table(g, m.x, y, m.w, [{ l: 'Result', w: 15 }, { l: 'Cost', w: 9, al: 'right' }, { l: 'Basis', w: 17 }, { l: 'Billing at launch', w: 33 }, { l: 'Source · scope · coverage', w: m.w - 74 }],
    RESULTS.map((r) => {
      const b = BASIS_WORD[r.basis] + (r.local && r.basis === 'unknown' ? ' · local' : '');
      const c = SOURCE[r.id];
      return { v: [`${r.id}${r.src === 'imported' ? ' ↓' : ''}`, r.cost == null ? { t: 'unknown', f: 'it' } : r.partial?.cost ? { t: `${usd(r.cost)} ▲`, f: 'bd' } : usd(r.cost), r.basis === 'unknown' ? { t: b, f: 'it' } : b, billingCell(r), c.startsWith('▲') ? { t: c, f: 'bd' } : c] };
    }), { cursor: 0, focused: tf });
  g.region(m.x, y, m.w, 13, 'DataTable', '#basis-table');
  y += 14;
  y = kv(g, m.x, y, 16, m.w, [
    ['Reported', 'the harness or provider stated the charge · always preferred'],
    ['Estimate', 'known usage × price table at launch · source and date · subscriptions labelled'],
    ['Energy estimate', 'local endpoint in a sequential run · kWh in its windows × tariff'],
    ['Verified zero', 'engine confirms complete USD zero with supported billing and evidence · none here'],
    ['Unverified zero', 'reported 0 without qualifying evidence → unknown (unverified_zero_cost)'],
    ['Billing', 'frozen at launch · harness status output, or “declared by user” in the catalog (M04)'],
  ]);
  y++;
  g.text(m.x, y++, 'Currency · costs are computed and ranked in USD', 'bd');
  y = kv(g, m.x, y, 16, m.w, [
    ['Display', 'each run’s frozen display currency · all four runs froze USD, so values show as $'],
    ['Rates', 'from each run’s RateSnapshot · every r1 price was in USD, so nothing needed converting'],
    ['No rate', ['e.g. a price in EUR launched without an EUR rate → unknown · no_rate_conversion', 'never estimated with a guessed or later rate · out of cost-weighted rankings']],
  ]);
  g.paint(m.x + 16, y - 2, m.w - 16, 1, { f: 'it' });
  g.region(m.x, y - 4, m.w, 4, 'Static', '#basis-currency.kv');
  y++;
  y = para(g, m.x, y, m.w, 'A subscription, unknown billing or a missing price or rate is never $0. In a parallel run shared energy is never divided, so a local configuration has no cost to rank: it stays unknown, sorted last and out of cost-weighted rankings (M06).', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Currency and energy…', go: 'CurrencyEnergy' }, { label: 'Close', v: 'primary', go: 'Results', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Results' }, { k: 'enter', d: 'Open measurements', go: 'Measurements' }, { k: 'u', d: 'Currency and energy', go: 'CurrencyEnergy' }], '');
  return g;
}

// ---------------------------------------------------------------- currency and energy (Setup, recorded at launch)

// R3-2 · rates to USD held by the catalog (M04, CatalogRates), as units per 1 USD. Collected during an explicit catalog
// refresh, never during a run; the user's rate overrides the collected one and is labelled. Same values as the catalog.
const SETUP_RATES = [
  ['USD', '1', 'fixed', '—', { t: '✓ frozen · needed', f: '' }],
  ['EUR', '0.9226', 'open.er-api.com · collected', '2026-10-01 16:00', 'available'],
  ['GBP', '0.7870', 'open.er-api.com · collected', '2026-10-01 16:00', 'available'],
  ['CNY', '7.1891', 'open.er-api.com · collected', '2026-10-01 16:00', 'available'],
  ['COP', '4000.00', { t: '▲ supplied by you · collected 4016.06', f: 'bd' }, '2026-10-02 09:12', 'available · labelled'],
];

// st.analysis: opened from Results (e) after the runs; the tariff is then an analysis setting, labelled alternative.
// There is no analysis-time display currency: values keep each run's frozen display currency (R3-2).
export function currencyEnergy(sz, focus = 'currency', st = {}) {
  if (st.analysis) return tariffAnalysis(sz, focus);
  const g = setup(sz, 'none');
  const m = modal(g, 100, 37, 'Currency and energy · frozen with the run at launch', { sel: '#currency-energy' });
  let y = m.y;
  const L = 18;
  g.text(m.x, y, 'Display currency', 'mu'); select(g, m.x + L, y, 9, 'USD', { focus: focus === 'currency' });
  g.region(m.x + L, y, 9, 1, 'Select', '#display-currency');
  g.text(m.x + L + 10, y++, fit('default USD · display only · costs are computed and ranked in USD', m.w - L - 10), 'mu');
  y++;
  g.text(m.x, y++, fit('Exchange rates · units per 1 USD · catalog refresh 2026-10-01 21:38 (M04)', m.w), 'bd');
  const rf = focus === 'rates';
  table(g, m.x, y, m.w, [{ l: 'Cur', w: 5 }, { l: '1 USD =', w: 10, al: 'right' }, { l: 'Source', w: 39 }, { l: 'Date', w: 18 }, { l: 'At launch', w: m.w - 72 }],
    SETUP_RATES.map((v) => ({ v })), { cursor: rf ? 0 : -1, focused: rf });
  g.region(m.x, y, m.w, SETUP_RATES.length + 1, 'DataTable', '#rate-table');
  y += SETUP_RATES.length + 2;
  y = kv(g, m.x, y, L, m.w, [
    ['RateSnapshot', 'prices USD (Anthropic, OpenAI, xAI) · display USD · tariff USD → only USD 1'],
    ['', 'other currencies add their rate, source and date · beside PriceSnapshot'],
    ['No rate', ['a currency without a rate at launch is frozen as missing: its values show', '“unknown · no_rate_conversion”, never a guess']],
    ['Refresh', 'rates change only by a catalog refresh (F5 there), never during a run'],
  ]);
  g.region(m.x, y - 5, m.w, 5, 'Static', '#rate-snapshot.kv');
  y++;
  check(g, m.x, y++, 'Electricity tariff · optional', true, { focus: focus === 'tariff-on' });
  g.text(m.x + 2, y, 'Tariff', 'mu'); input(g, m.x + L, y, 16, '0.18', { focus: focus === 'tariff' }); select(g, m.x + L + 17, y, 9, 'USD', { focus: focus === 'tariff-currency' }); g.text(m.x + L + 27, y++, fit('per kWh · its currency’s rate is frozen too', m.w - L - 27), 'mu');
  g.region(m.x + L, y - 1, 16, 1, 'Input', '#tariff-per-kwh');
  g.region(m.x + L + 17, y - 1, 9, 1, 'Select', '#tariff-currency');
  g.text(m.x + L, y++, fit('can be changed later in Results as an analysis tariff, labelled alternative', m.w - L), 'mu');
  g.region(m.x, y - 3, m.w, 3, 'Vertical', '#tariff');
  y++;
  g.text(m.x, y++, 'What the energy estimate can cover on mike-mbp-m4 (M18)', 'bd');
  y = kv(g, m.x, y, L, m.w, [
    ['Measured', 'CPU package and GPU · powermetrics · ▲ no permission yet'],
    ['Not measured', 'display, memory, storage, cloud inference hardware'],
    ['Scope label', 'CPU package + GPU only · never “whole-system”'],
    ['Sequential', 'local cost = kWh in its windows × tariff · ranked as “energy estimate”'],
    ['Parallel', 'shared energy is never divided · a local configuration’s cost stays unknown'],
    ['Provider cost', 'kept apart · energy is never added to an API charge'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Converting does not turn an estimate into a charge or fill partial coverage. The README’s historical exchange rate is never used.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Setup' }, { label: 'Save', v: 'primary', go: 'Setup', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Save', go: 'Setup' }], '');
  return g;
}

// Analysis mode (over Results): change the tariff after the fact. Only energy estimates are recalculated, the result is
// labelled alternative like alternative weights, and the recorded tariff stays in every original record.
function tariffAnalysis(sz, focus = 'tariff') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 25, 'Electricity tariff · analysis setting', { sel: '#currency-energy' });
  const r = byId['R-0919lab-1'];
  const alt = 0.22;
  let y = m.y;
  y = kv(g, m.x, y, 14, m.w, [
    ['Recorded', '0.18 USD/kWh · frozen with runs 2026-09-19-lab and 09-24-lab'],
    ['', 'no tariff recorded for the mike-mbp-m4 runs'],
  ]);
  y++;
  g.text(m.x, y, 'Tariff', 'mu'); input(g, m.x + 14, y, 16, String(alt), { focus: focus === 'tariff' }); select(g, m.x + 31, y, 9, 'USD', { focus: focus === 'tariff-currency' }); g.text(m.x + 41, y++, fit('per kWh · ▲ alternative', m.w - 41), 'bd');
  g.region(m.x + 14, y - 1, 16, 1, 'Input', '#tariff-per-kwh');
  g.region(m.x + 31, y - 1, 9, 1, 'Select', '#tariff-currency');
  y++;
  g.text(m.x, y++, 'What it recalculates', 'bd');
  table(g, m.x, y, m.w, [{ l: 'Result', w: 15 }, { l: 'Energy', w: 10, al: 'right' }, { l: 'Recorded', w: 11, al: 'right' }, { l: 'Alternative', w: 13, al: 'right' }, { l: 'Basis', w: m.w - 49 }], [
    { v: ['R-0919lab-1 ↓', `${(r.kwh * 1000).toFixed(1)} Wh`, usd(r.cost), { t: usd(r.kwh * alt), f: 'bd' }, 'energy estimate · sequential'] },
    { v: ['R-0924lab-2 ↓', '—', 'unknown', { t: 'unknown', f: 'it' }, 'parallel · energy not divided'] },
    { v: ['R-0928a-4', '—', 'unknown', { t: 'unknown', f: 'it' }, 'parallel · no energy measured'] },
  ], { cursor: -1 });
  g.region(m.x, y, m.w, 4, 'DataTable', '#tariff-effect');
  y += 5;
  para(g, m.x, y, m.w, 'Applying relabels Results, Rankings and the report “alternative” until you reset. Provider costs, measurements and every original record are unchanged; nothing is rerun.', 'mu');
  const x0 = buttons(g, m.right, m.bottom, [{ label: 'Reset to recorded', focus: focus === 'reset' }, { label: 'Cancel', go: 'Results' }, { label: 'Apply as alternative', v: 'primary', go: 'ResultsAnalysisTariff', focus: focus === 'apply' }]);
  g.region(x0, m.bottom, 19, 1, 'Button', '#reset');
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'r', d: 'Reset to recorded' }, { k: '^s', d: 'Apply as alternative', go: 'ResultsAnalysisTariff' }], '');
  return g;
}

// ---------------------------------------------------------------- MeasurementsScreen · configurations with trials (D7)

export function measurementsTrials(sz, focus = 'codex') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const R = TRIAL_RUN;
  header(g, 'AxBenchmark', `Run ${R.run} · ${R.template} · measurements per trial`);
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(`● ${R.machine} · ${R.template} · 2 configurations × ${R.trials} trials · jobs ${R.jobs} · trials in turn, each from a fresh baseline`, W - 2));
  g.region(0, 1, W, 1, 'Static', '#result-bar');
  const cols = [{ l: 'Trial', w: 12 }, { l: 'Checks', w: 7 }, { l: 'Elapsed', w: 12, al: 'right' }, { l: 'Cost', w: 11, al: 'right' }, { l: 'Quality', w: 10, al: 'right' }, { l: 'Gen tok/s', w: 13, al: 'right' }, { l: 'In tok\n(cached)', w: 15, al: 'right' }, { l: 'Out tok\n(reasoning)', w: 15, al: 'right' }, { l: 'Files / LOC', w: W - 2 - 95, al: 'right' }];
  const M = (n) => `${(n / 1000).toFixed(2)}M`;
  const range = (xs, f = String) => `${f(Math.min(...xs))}–${f(Math.max(...xs))}`;
  const box = (c, y, key) => {
    const f = focus === key, gates = trialGates(c), T = c.trials;
    g.box(0, y, W, 10, { f: f ? 'ac' : 'ln', title: `${c.h} · ${c.model} · ${c.effort} · ${T.length} trials · ${c.basis === 'reported' ? 'cost reported' : 'cost estimate'} · proxy windows`, sub: gates.length ? `✗ not ranked · ${gates[0]}` : '✓ eligible · every trial passed' });
    const S = (k) => stats(T.map(k));
    const st = { s: S((t) => t.time), c: S((t) => t.cost), q: S((t) => quality(t.g)) };
    const mean = (k) => T.reduce((a, t) => a + t[k], 0) / T.length, sum = (k) => T.reduce((a, t) => a + t[k], 0);
    const pg = pooled(T);
    table(g, 1, y + 1, W - 2, cols, [
      ...T.map((t) => ({ v: [`${t.trial} ${t.id}`, t.checks.f ? { t: checksText(t.checks), f: 'bd' } : checksText(t.checks), dur(t.time), usd(t.cost), f2(quality(t.g)), f1(t.gen.n / Number(t.gen.d)), `${M(t.inp)} (${M(t.cached)})`, `${t.out}k (${t.rs}k)`, `${t.files} / ${locText(t.loc)}`] })),
      { v: ['Mean', '', dur(Math.round(st.s.mean)), usd(st.c.mean), f2(st.q.mean), `${f2(pg.x)} pooled`, `${M(mean('inp'))} (${M(mean('cached'))})`, `${+mean('out').toFixed(1)}k (${+mean('rs').toFixed(1)}k)`, `${+mean('files').toFixed(2)} / ${locText(+mean('loc').toFixed(2))}`], f: 'bd' },
      { v: ['Min–max', '', `${dur(st.s.min)}–${dur(st.s.max)}`, `${usd(st.c.min)}–${f2(st.c.max)}`, `${f2(st.q.min)}–${f2(st.q.max)}`, `${f1(pg.min)}–${f1(pg.max)}`, range(T.map((t) => t.inp), M), range(T.map((t) => t.out), (n) => `${n}k`), `${range(T.map((t) => t.files))} / ${range(T.map((t) => t.loc), locText)}`], f: 'mu' },
      { v: ['Total', '', '', '', '', `${(pg.n / 1000).toFixed(1)}k÷${Math.round(pg.d)}s`, M(sum('inp')), `${sum('out')}k`, { t: `Σ sizes ${sum('files')} / ${locText(sum('loc'))}`, f: 'mu' }], f: 'mu' },
    ], { cursor: key === 'codex' ? 0 : 1, focused: f });
    g.region(1, y + 1, W - 2, 5, 'DataTable', key === 'codex' ? '#measurements' : '#measurements-2');
    g.region(1, y + 6, W - 2, 3, 'Static', key === 'codex' ? '#trial-summary' : '#trial-summary-2');
  };
  box(TRIAL_CONFIGS[0], 2, 'codex');
  box(TRIAL_CONFIGS[1], 12, 'claude');
  const rf = focus === 'rules', p0 = pooled(TRIAL_CONFIGS[0].trials);
  g.box(0, 22, W, H - 24, { f: rf ? 'ac' : 'ln', title: 'How trials are combined' });
  g.region(0, 22, W, H - 24, 'Static', '#trial-rules.kv');
  let y = kv(g, 2, 23, 14, W - 4, [
    ['Each trial', 'a separate result, linked to its configuration and trial index · own baseline, own judge session'],
    ['Shown', 'every trial, then means (cost, time, Q, In, Out, Files, LOC), pooled Gen tok/s and min–max'],
    ['Pooled', `Codex ${locText(p0.n)} ÷ ${secText(p0.d.toFixed(3))} s = ${f2(p0.x)} tok/s · the mean of the trial rates (${f2(p0.meanOfRates)}) is never used`],
    ['Totals', 'Σ tokens stay beside the means · Σ files only sums snapshot sizes, never a project file count'],
    ['Rankings', 'means and the pooled rate · eligible only when every trial of the configuration is (M06)'],
    ['Claude Code', 'trial 2 failed check T4_check2 and graded spec 3.5 → listed with that reason, not ranked'],
    ['Default', '1 trial · Inventory r1 results have one trial each: a single row and no range'],
  ]);
  para(g, 2, y + 1, W - 4, 'Elapsed is the sum of each trial’s task processes; the time between trials (a fresh baseline copy) is not part of any trial.', 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 'enter', d: 'Open trial' }, { k: 't', d: 'Timing' }, { k: 'tab', d: 'Focus', do: 'next' }]);
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
  { widget: 'DataTable#artifact-stats', label: 'M10 · Files / LOC · final snapshot', states: [
    ['Loading', mini('Included · by kind', (g, x, y, w) => loading(g, x, y + 1, w, 'Counting the pinned final snapshot…'))],
    ['Empty', mini('Included · by kind', (g, x, y, w) => { centered(g, y + 1, 'No final snapshot yet', 'bd'); centered(g, y + 2, 'Counted once the trial delivers T7. Never 0.', 'mu'); })],
    ['Error', mini('Included · by kind', (g, x, y, w) => { notice(g, x, y, w, 'warning', 'LOC partial · 1 file not decoded', 'data/seed.csv is unmarked Windows-1252; it is not guessed. 35 files stay complete; LOC shows ▲.'); })],
  ] },
  { widget: 'DataTable#requests', label: 'M10 · Gen tok/s · request pairs', states: [
    ['Loading', mini('Requests', (g, x, y, w) => loading(g, x, y + 1, w, 'Pairing usage and timing receipts…'))],
    ['Empty', mini('Requests', (g, x, y, w) => { centered(g, y + 1, 'No request was discovered', 'bd'); centered(g, y + 2, 'An empty roster proves no work: Gen tok/s unknown.', 'mu'); })],
    ['Error', mini('Requests', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Clock mismatch on 2 windows', 'Start and end come from different clock domains. Those requests stay unpaired; nothing is inferred.'); })],
  ] },
];
