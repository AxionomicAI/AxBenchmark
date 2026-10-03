// Retained results for Inventory web app r1 (12 results: 8 local, 4 imported) and the M06 scoring contract.
// Numbers on the M02 and M06 frames are computed here from raw grades, measurements and weights, never typed in.
// All data is fictional.

// Web quality profile v1 (M06 defaults) in rubric order.
export const QCATS = [
  ['ux', 'User experience', 'UX', 25],
  ['visual', 'Visual quality', 'Visual', 15],
  ['code', 'Code quality', 'Code', 20],
  ['spec', 'Business rules / spec', 'Spec', 25],
  ['robust', 'Robustness', 'Robust', 10],
  ['a11y', 'Accessibility', 'A11y', 5],
];
export const QW = QCATS.map((c) => c[3]);
export const SPEC = 3; // index of the business rules / specification grade

export const JUDGES = {
  A: { short: 'opus-5.5 · high', long: 'Claude Code · claude-opus-5-5 · high' },
  B: { short: 'gpt-6-astra · high', long: 'Codex · gpt-6-astra · high' },
};

const R = (id, run, machine, src, h, model, effort, env, jobs, judge, status, checks, cost, time, g, extra = {}) =>
  ({ id, run, machine, src, h, model, effort, env, jobs, judge, status, checks, cost, time, g, run_uid: `run_${machine === "mike-mbp-m4" ? "mbp" : "lab"}_${run.replaceAll("-", "")}`, configuration_id: `${h.toLowerCase().replaceAll(" ", "_")}_${effort}`, trial_index: 1, trial_count: 1, ...extra });

// checks: p passed · f failed · u unverified · n not run.  time: seconds.
// cost: the cost that counts for rankings (D4), USD, or null when unknown. basis says how it was formed:
//   reported · estimate (price table, source and date in `price`) · energy (local endpoint in a sequential run:
//   measured kWh in its execution windows × the frozen tariff, `scope` names what was measured) · unknown.
//   A local endpoint in a parallel run has no API charge but its cost stays unknown: shared energy is never divided.
// billing: the account's billing kind frozen at launch (api · subscription · local · unknown), read from the harness's
//   status output or declared by the user in the catalog (BILLING below, labelled "declared by user" wherever
//   the cost basis is shown). Unknown never yields verified $0. Costs are USD; display conversion uses frozen rates (R3-2).
// partial: measurements that cover only part of the tasks; with positive weight they count as missing (D11).
export const RESULTS = [
  R('R-0928a-1', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Claude Code', 'claude-opus-5-5', 'medium', 'clean', 4, 'A', 'complete', { p: 30, f: 0, u: 0, n: 0 }, 4.82, 2292, [4, 5, 4, 5, 4, 4], { basis: 'estimate', sub: true, price: 'anthropic.com/pricing · 2026-09-26' }),
  R('R-0928a-2', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Codex', 'gpt-6-sol', 'medium', 'clean', 4, 'A', 'complete', { p: 30, f: 0, u: 0, n: 0 }, 3.10, 2645, [4, 4, 5, 4, 4, 3], { basis: 'reported' }),
  R('R-0928a-3', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Grok CLI', 'grok-4.7-fast', 'default', 'clean', 4, 'A', 'complete', { p: 29, f: 0, u: 1, n: 0 }, 0.92, 3090, [4, 4, 4, 4, 4, 4], { basis: 'estimate', price: 'x.ai/api · 2026-09-15' }),
  R('R-0928a-4', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 4, 'A', 'complete', { p: 27, f: 3, u: 0, n: 0 }, null, 5530, [3, 3, 4, 3, 3, 3], { basis: 'unknown', local: true }),
  R('R-0925b-1', '2026-09-25-b', 'mike-mbp-m4', 'local', 'Claude Code', 'claude-opus-5-5', 'high', 'current', 1, 'A', 'complete', { p: 30, f: 0, u: 0, n: 0 }, 6.40, 1904, [5, 4, 5, 5, 4, 4], { basis: 'reported' }),
  R('R-0925b-2', '2026-09-25-b', 'mike-mbp-m4', 'local', 'Codex', 'gpt-6-sol', 'high', 'current', 1, 'A', 'failed', { p: 17, f: 0, u: 0, n: 13 }, 2.05, 2710, null, { failedAt: 'T5', basis: 'reported', partial: { cost: 'covers 5 of 7 tasks', time: 'covers 5 of 7 tasks' } }),
  R('R-0921a-1', '2026-09-21-a', 'mike-mbp-m4', 'local', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 2, 'A', 'complete', { p: 30, f: 0, u: 0, n: 0 }, null, 4802, [4, 3, 4, 4, 4, 3], { basis: 'unknown', local: true }),
  R('R-0921a-2', '2026-09-21-a', 'mike-mbp-m4', 'local', 'Grok CLI', 'grok-4.7', 'high', 'clean', 2, 'A', 'complete', { p: 30, f: 0, u: 0, n: 0 }, null, 2830, [4, 4, 4, 4, 3, 4], { basis: 'unknown' }),
  R('R-0924lab-1', '2026-09-24-lab', 'lab-linux-4090', 'imported', 'Claude Code', 'claude-sonnet-5-5', 'medium', 'clean', 3, 'B', 'complete', { p: 30, f: 0, u: 0, n: 0 }, 2.35, 2120, [4, 4, 5, 5, 4, 3], { basis: 'reported' }),
  R('R-0924lab-2', '2026-09-24-lab', 'lab-linux-4090', 'imported', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 3, 'B', 'complete', { p: 30, f: 0, u: 0, n: 0 }, null, 1720, [4, 3, 4, 4, 4, 3], { basis: 'unknown', local: true }),
  R('R-0924lab-3', '2026-09-24-lab', 'lab-linux-4090', 'imported', 'Codex', 'gpt-6-sol', 'low', 'clean', 3, 'B', 'complete', { p: 30, f: 0, u: 0, n: 0 }, 1.20, 1805, [4, 4, 4, 3, 4, 3], { basis: 'estimate', price: 'openai.com/api/pricing · 2026-09-20' }),
  R('R-0919lab-1', '2026-09-19-lab', 'lab-linux-4090', 'imported', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 1, 'B', 'complete', { p: 29, f: 1, u: 0, n: 0 }, 0.0145, 1650, [4, 3, 4, 4, 3, 3], { basis: 'energy', local: true, kwh: 0.0807, tariff: 0.18, scope: 'CPU package + GPU' }),
];
export const byId = Object.fromEntries(RESULTS.map((r) => [r.id, r]));

// ---------------------------------------------------------------- formatting

export const dur = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
};
export const usd = (c) => (c == null ? 'unknown' : `$${c.toFixed(2)}`);
export const cfgName = (r) => `${r.h} · ${r.model} · ${r.effort === 'default' ? 'harness default' : r.effort}`;
export const cfgShort = (r) => `${r.h} · ${r.model} · ${r.effort === 'default' ? 'default' : r.effort}`;
export const checksText = (c) => [c.p && `${c.p}✓`, c.f && `${c.f}✗`, c.u && `${c.u}?`, c.n && `${c.n}○`].filter(Boolean).join(' ');
export const statusText = (r) => (r.status === 'complete' ? '✓ complete' : `✗ failed ${r.failedAt}`);
export const f1 = (n) => n.toFixed(1);
export const f2 = (n) => n.toFixed(2);

// ---------------------------------------------------------------- M06 contract

// Every weight finite and ≥ 0, positive total, known keys. Returns an error string or null.
export const validate = (weights, keys) => {
  for (const [k, v] of Object.entries(weights)) {
    if (!keys.includes(k)) return `Unknown component “${k}”`;
    if (!Number.isFinite(v)) return `${k} must be a finite number`;
    if (v < 0) return `${k} must be 0 or more`;
  }
  if (Object.values(weights).reduce((a, b) => a + b, 0) <= 0) return 'At least one weight must be positive';
  return null;
};
export const normalize = (ws) => { const t = ws.reduce((a, b) => a + b, 0); return ws.map((w) => w / t); };
export const quality = (g, qw = QW) => normalize(qw).reduce((n, a, i) => n + a * g[i], 0);

// Default shortlist gates, in the order they are explained.
export const gates = (r) => {
  const out = [];
  if (r.status !== 'complete') out.push(`failed at ${r.failedAt}`);
  if (r.checks.f) out.push(`${r.checks.f} check${r.checks.f > 1 ? 's' : ''} failed`);
  if (r.checks.u) out.push(`${r.checks.u} unverified`);
  if (!r.g) out.push('no grades');
  else if (r.g[SPEC] < 4) out.push(`spec ${r.g[SPEC]} < 4`);
  return out;
};

// D11 · a partial or unknown measurement counts as missing wherever it carries positive weight. The reason is shown
// next to the entry, which stays in every table with its ▲ value and coverage.
export const costMissing = (r) => (r.cost == null ? (r.local ? 'cost unknown · local endpoint, parallel run: shared energy not divided' : 'cost unknown') : r.partial?.cost ? `cost partial · ${r.partial.cost}` : null);
export const timeMissing = (r) => (r.time == null ? 'time unknown' : r.partial?.time ? `time partial · ${r.partial.time}` : null);

// D4 · the basis printed next to every cost.
export const basisText = (r) => ({
  reported: () => (r.partial?.cost ? 'reported ▲ partial' : 'reported'),
  estimate: () => `estimate · ${r.sub ? `subscription${BILLING[r.id]?.[1] === 'declared' ? ', declared by user' : ''} · ` : ''}price table ${r.price}`,
  energy: () => `energy estimate · ${r.scope} · ${(r.kwh * 1000).toFixed(1)} Wh × $${r.tariff.toFixed(2)}/kWh`,
  unknown: () => (r.local ? 'unknown · local, parallel run' : 'unknown · no usage reported'),
}[r.basis]());

// Billing kind per result (R3-1): source is 'status' (the harness's status output, no model call), 'declared' (the
// user's catalog declaration, labelled) or null when nothing tells. Local endpoints need no account.
export const BILLING = {
  'R-0928a-1': ['subscription', 'declared'], 'R-0928a-2': ['api', 'status'], 'R-0928a-3': ['unknown', null], 'R-0928a-4': ['local', null],
  'R-0925b-1': ['api', 'status'], 'R-0925b-2': ['api', 'status'], 'R-0921a-1': ['local', null], 'R-0921a-2': ['unknown', null],
  'R-0924lab-1': ['api', 'status'], 'R-0924lab-2': ['local', null], 'R-0924lab-3': ['unknown', null], 'R-0919lab-1': ['local', null],
};
export const billingText = (r) => { const [k, src] = BILLING[r.id]; return src === 'declared' ? `${k} · declared by user` : k; };

// Combined ranking for one judge group. rw = [cost, time, quality] raw weights.
export function combined(results, rw = [1, 1, 1], qw = QW) {
  const [wc, wt, wq] = normalize(rw);
  const eligible = results.filter((r) => !gates(r).length);
  const missing = (r) => [wc > 0 && costMissing(r), wt > 0 && timeMissing(r)].filter(Boolean);
  const pop = eligible.filter((r) => !missing(r).length);
  const minC = Math.min(...pop.map((r) => r.cost)), minT = Math.min(...pop.map((r) => r.time));
  const rows = pop.map((r) => {
    const q = quality(r.g, qw);
    const c = wc === 0 ? 0 : minC === 0 ? (r.cost === 0 ? 100 * wc : 0) : 100 * wc * minC / r.cost;
    const t = wt === 0 ? 0 : 100 * wt * minT / r.time;
    const qq = 100 * wq * q / 5;
    return { r, q, c, t, qq, score: c + t + qq };
  }).sort((a, b) => b.score - a.score || (a.r.id < b.r.id ? -1 : 1));
  const why = (r) => gates(r).concat(missing(r));
  return { w: [wc, wt, wq], minC, minT, rows, eligible, why };
}

export const shortlists = (results, qw = QW) => {
  const el = results.filter((r) => !gates(r).length);
  return {
    cost: el.filter((r) => !costMissing(r)).sort((a, b) => a.cost - b.cost || (a.id < b.id ? -1 : 1)).slice(0, 5),
    time: el.filter((r) => !timeMissing(r)).sort((a, b) => a.time - b.time || (a.id < b.id ? -1 : 1)).slice(0, 5),
    quality: el.map((r) => ({ r, q: quality(r.g, qw) })).sort((a, b) => b.q - a.q || (a.r.id < b.r.id ? -1 : 1)).slice(0, 5),
  };
};

// Measured tables: highest known cost first, unknown last, then id.
export const byCost = (rs) => [...rs].sort((a, b) => (a.cost == null) - (b.cost == null) || (b.cost ?? 0) - (a.cost ?? 0) || (a.id < b.id ? -1 : 1));

// ---------------------------------------------------------------- D7 · trials

// Several trials of one configuration run one after another, each from a fresh baseline, and each is its own result
// with its own judge session. Tables show every trial, then the mean and the min–max range; rankings use the means,
// and a configuration is eligible only when every trial is. Inventory r1 results have one trial each (the default);
// this fixture is Orders REST API r3 (6 results: 2 configurations × 3 trials, backend profile, judge group A).
export const BACKEND_CATS = [
  ['dx', 'Developer experience', 'DX', 25],
  ['api', 'API / interface design', 'API', 15],
  ['code', 'Code quality', 'Code', 20],
  ['spec', 'Business rules / spec', 'Spec', 25],
  ['robust', 'Robustness', 'Robust', 10],
  ['ops', 'Operability / docs', 'Ops', 5],
];
const T = (id, trial, checks, cost, time, g, extra = {}) => ({ id, trial, checks, cost, time, g, status: 'complete', ...extra });
export const TRIAL_RUN = { run: '2026-09-27-t', template: 'Orders REST API r3', machine: 'mike-mbp-m4', trials: 3, jobs: 2, checks: 18 };
export const TRIAL_CONFIGS = [
  { h: 'Codex', model: 'gpt-6-sol', effort: 'medium', basis: 'reported', trials: [
    T('R-0927t-1', 1, { p: 18, f: 0, u: 0, n: 0 }, 2.84, 2410, [4, 4, 4.5, 4, 4, 3.5], { inp: 3120, out: 142, cached: 2620, rs: 40, gen: { n: 142310, d: '1778.875' }, files: 27, loc: 1840 }),
    T('R-0927t-2', 2, { p: 18, f: 0, u: 0, n: 0 }, 3.12, 2655, [4, 3.5, 4, 4, 4, 3.5], { inp: 3480, out: 158, cached: 2950, rs: 46, gen: { n: 158420, d: '2640.333' }, files: 29, loc: 1912 }),
    T('R-0927t-3', 3, { p: 18, f: 0, u: 0, n: 0 }, 2.97, 2530, [4.5, 4, 4.5, 4.5, 4, 4], { inp: 3305, out: 150, cached: 2800, rs: 43, gen: { n: 150060, d: '2000.800' }, files: 28, loc: 1876 }),
  ] },
  { h: 'Claude Code', model: 'claude-sonnet-5-5', effort: 'medium', basis: 'estimate', price: 'anthropic.com/pricing · 2026-09-26', trials: [
    T('R-0927t-4', 1, { p: 18, f: 0, u: 0, n: 0 }, 1.96, 1980, [4, 4, 4, 4.5, 4, 3.5], { inp: 2410, out: 118, cached: 1950, rs: 30, gen: { n: 118240, d: '1478.000' }, files: 25, loc: 1702 }),
    T('R-0927t-5', 2, { p: 17, f: 1, u: 0, n: 0 }, 2.21, 2140, [4, 3.5, 4, 3.5, 3.5, 3], { inp: 1805, out: 131, cached: 1400, rs: 35, gen: { n: 131250, d: '1562.500' }, files: 26, loc: 1790 }),
    T('R-0927t-6', 3, { p: 18, f: 0, u: 0, n: 0 }, 2.08, 2065, [4, 4, 4.5, 4, 4, 3.5], { inp: 2560, out: 124, cached: 2100, rs: 32, gen: { n: 124180, d: '1552.250' }, files: 25, loc: 1744 }),
  ] },
];
// { mean, min, max } of numbers; null when any value is missing, so a gap never shrinks the range.
export const stats = (xs) => (xs.some((x) => x == null) ? null : { mean: xs.reduce((a, b) => a + b, 0) / xs.length, min: Math.min(...xs), max: Math.max(...xs) });
export const trialGates = (c) => c.trials.flatMap((t) => (t.checks.f ? [`trial ${t.trial}: ${t.checks.f} check failed`] : []).concat(t.g[SPEC] < 4 ? [`trial ${t.trial}: spec ${t.g[SPEC]} < 4`] : []));

// ---------------------------------------------------------------- R173–R176 · benchmark statistics

// Competitor execution only (planning, grading, observers and probes have their own accounts). Per result:
//   inp/cached, out/rs · normalized cumulative request traffic in k tokens; cached ⊂ input and reasoning ⊂ output are
//     native detail categories with their own coverage: null = not exposed (shown "?"), never zero. usage: 'partial'
//     when the request roster is incomplete (▲).
//   gen · per-request generation throughput: exact matched output n over the summed generation seconds d of the
//     requests that pair a normalized output with a positive window of the same basis. Windows of concurrent subagents
//     are summed, never unioned; whole-task time is never used. req = [paired, discovered]; full = all output tokens.
//     basis 'proxy' = proxy_stream_window v1 · 'native' = native_decode v1; they are never converted into each other.
//   files/loc · regular paths and physical text lines (LF, CRLF and lone CR count once) of the immutable final delivered
//     snapshot, baseline included; binary files count as files, never as lines.
const ST = (inp, cached, out, rs, gen, files, loc, extra = {}) => ({ inp, cached, out, rs, gen, files, loc, locState: 'known', usage: 'known', ...extra });
const GEN = (n, d, req, basis, state = 'known', full = n) => ({ n, d, req, basis, state, full });
export const STATS = {
  'R-0928a-1': ST(2840, 2310, 141, 52, GEN(141206, '1874.250', [38, 38], 'proxy'), 41, 3206),
  'R-0928a-2': ST(3420, 2950, 158, 71, GEN(158402, '2121.600', [52, 52], 'proxy'), 36, 2688),
  'R-0928a-3': ST(3113, null, 173, 68, GEN(165038, '1410.800', [41, 44], 'proxy', 'partial', 173118), 38, 2914),
  'R-0928a-4': ST(4950, 4100, 212, 96, GEN(212560, '5021.800', [61, 61], 'native'), 33, 2412),
  'R-0925b-1': ST(2610, 2200, 166, 74, GEN(166030, '2301.500', [40, 40], 'proxy'), 44, 3481),
  'R-0925b-2': ST(1920, 1545, 97, 53, GEN(75180, '1010.400', [31, 36], 'proxy', 'partial', null), 29, 1955, { usage: 'partial' }),
  'R-0921a-1': ST(4620, 3900, 205, 91, GEN(205110, '4712.000', [58, 58], 'native'), 31, 2236),
  'R-0921a-2': ST(null, null, null, null, GEN(null, null, [0, null], 'proxy', 'unknown', null), 40, 3018, { usage: 'unknown' }),
  'R-0924lab-1': ST(2200, 1820, 132, 40, GEN(132140, '1590.000', [35, 35], 'proxy'), 39, 3050),
  'R-0924lab-2': ST(4400, 3700, 198, 88, GEN(198020, '1420.000', [57, 57], 'native'), 34, 2530),
  'R-0924lab-3': ST(2950, 2500, 120, 22, GEN(120000, '1500.000', [30, 30], 'proxy'), 32, 2301),
  'R-0919lab-1': ST(4210, null, 190, 85, GEN(190030, '1380.000', [55, 55], 'native'), 35, 2598, { locState: 'partial', locNote: 'data/seed.csv · unmarked Windows-1252, not guessed' }),
};
export const BASIS = { proxy: 'proxy stream window', native: 'native decode' };
export const rate = (gen) => (gen.n == null || gen.d == null ? null : gen.n / Number(gen.d));
const kM = (k) => (k >= 1000 ? `${(k / 1000).toFixed(2)}M` : `${k}k`);
const mark = (state) => (state === 'partial' ? '▲ ' : '');
// Primary column text. Detail categories keep their own markers: "?" not exposed, never 0.
export const genText = (s, o = {}) => {
  const x = rate(s.gen);
  if (x == null) return '—';
  return `${mark(s.gen.state)}${x.toFixed(1)}${o.basis ? ` ${s.gen.basis}` : ''}`;
};
export const inText = (s) => (s.inp == null ? 'unknown' : `${mark(s.usage)}${kM(s.inp)} (${s.cached == null ? '?' : kM(s.cached)})`);
export const outText = (s) => (s.out == null ? 'unknown' : `${mark(s.usage)}${s.out}k (${s.rs == null ? '?' : `${s.rs}k`})`);
export const locText = (n) => n.toLocaleString('en-US');
export const secText = (d) => Number(d).toLocaleString('en-US', { minimumFractionDigits: 3 });
export const filesLocText = (s) => `${s.files} / ${s.locState === 'partial' ? '▲ ' : ''}${locText(s.loc)}`;

// RankingWeightsV2: exactly eight components. Defaults keep cost, time and quality equal and the five statistics at 0;
// a statistic needs an explicit direction before its weight can become positive.
export const FACTORS = [
  ['cost', 'Cost', 'lower'], ['time', 'Time', 'lower'], ['quality', 'Quality', 'higher'],
  ['generation_rate', 'Gen tok/s', null], ['input_tokens', 'In tok', null], ['output_tokens', 'Out tok', null], ['file_count', 'Files', null], ['loc', 'LOC', null],
];
export const NEW_KEYS = FACTORS.slice(3).map((f) => f[0]);
export const planV2 = (rw = [1, 1, 1], extra = {}, dirs = {}) => ({
  schema_version: 2,
  weights: { cost: rw[0], time: rw[1], quality: rw[2], ...Object.fromEntries(NEW_KEYS.map((k) => [k, 0])), ...extra },
  directions: { cost: 'lower', time: 'lower', quality: 'higher', ...Object.fromEntries(NEW_KEYS.map((k) => [k, null])), ...dirs },
});
export const validatePlan = (plan) => {
  const keys = FACTORS.map((f) => f[0]);
  const err = validate(plan.weights, keys);
  if (err) return err;
  const missing = keys.find((k) => !(k in plan.weights));
  if (missing) return `${missing} is missing · schema 2 needs all eight weights`;
  const nodir = NEW_KEYS.find((k) => plan.weights[k] > 0 && !['higher', 'lower'].includes(plan.directions[k]));
  return nodir ? `${FACTORS.find((f) => f[0] === nodir)[1]} needs higher or lower before it can carry weight` : null;
};
// Value of a statistic for ranking, or the typed reason it cannot rank. Only called for positively weighted keys.
export const metricOf = (r, key, policy = { timing: 'proxy' }) => {
  const s = STATS[r.id];
  if (key === 'generation_rate') {
    if (s.gen.state === 'unknown') return { why: 'metric_unknown · Gen tok/s' };
    if (s.gen.basis !== policy.timing) return { why: `metric_basis_incompatible · Gen tok/s ${s.gen.basis === 'native' ? 'native decode' : 'proxy window'}` };
    if (s.gen.state === 'partial') return { why: `metric_partial · Gen tok/s ${s.gen.req[0]} of ${s.gen.req[1] ?? '?'} requests` };
    return { x: rate(s.gen) };
  }
  if (key === 'input_tokens' || key === 'output_tokens') {
    const x = key === 'input_tokens' ? s.inp : s.out, label = key === 'input_tokens' ? 'In tok' : 'Out tok';
    if (x == null) return { why: `metric_unknown · ${label}` };
    if (s.usage === 'partial') return { why: `metric_partial · ${label}` };
    return { x };
  }
  if (key === 'file_count') return s.files == null ? { why: 'metric_unknown · Files' } : { x: s.files };
  if (s.loc == null) return { why: 'metric_unknown · LOC' };
  return s.locState === 'partial' ? { why: 'metric_partial · LOC' } : { x: s.loc };
};

// Combined ranking over the eight-key plan. Zero-weight components are skipped before lookup, so their unknown values
// never exclude anyone; references come from the one eligible population. With every statistic at 0 this returns
// exactly what combined() returns (verify.mjs checks both judge groups).
export function rank8(results, plan, qw = QW, policy = { timing: 'proxy' }) {
  const err = validatePlan(plan);
  if (err) throw new Error(err);
  const keys = FACTORS.map((f) => f[0]);
  const tot = keys.reduce((n, k) => n + plan.weights[k], 0);
  const w = Object.fromEntries(keys.map((k) => [k, plan.weights[k] / tot]));
  const on = NEW_KEYS.filter((k) => w[k] > 0);
  const eligible = results.filter((r) => !gates(r).length);
  const missing = (r) => [w.cost > 0 && costMissing(r), w.time > 0 && timeMissing(r), ...on.map((k) => metricOf(r, k, policy).why)].filter(Boolean);
  const pop = eligible.filter((r) => !missing(r).length);
  const ref = {};
  if (w.cost > 0) ref.cost = Math.min(...pop.map((r) => r.cost));
  if (w.time > 0) ref.time = Math.min(...pop.map((r) => r.time));
  for (const k of on) { const xs = pop.map((r) => metricOf(r, k, policy).x); ref[k] = plan.directions[k] === 'lower' ? Math.min(...xs) : Math.max(...xs); }
  const factor = (k, x) => {
    const m = ref[k], dir = plan.directions[k];
    if (dir === 'lower') return m === 0 ? (x === 0 ? 1 : 0) : m / x;
    return m === 0 ? 1 : x / m;
  };
  const rows = pop.map((r) => {
    const q = quality(r.g, qw);
    const parts = {
      cost: w.cost === 0 ? 0 : ref.cost === 0 ? (r.cost === 0 ? 100 * w.cost : 0) : 100 * w.cost * ref.cost / r.cost,
      time: w.time === 0 ? 0 : 100 * w.time * ref.time / r.time,
      quality: 100 * w.quality * q / 5,
    };
    for (const k of on) parts[k] = 100 * w[k] * factor(k, metricOf(r, k, policy).x);
    return { r, q, parts, x: Object.fromEntries(on.map((k) => [k, metricOf(r, k, policy).x])), score: Object.values(parts).reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.score - a.score || (a.r.id < b.r.id ? -1 : 1));
  const why = (r) => gates(r).concat(missing(r));
  return { w, on, ref, rows, eligible, why };
}

// Across trials: input, output, files and LOC rank by the exact mean of trial totals; generation by the pooled ratio
// Σ n / Σ d, which is not the mean of the trial rates. Any missing trial value leaves the summary unknown.
export const pooled = (trials) => {
  const n = trials.reduce((a, t) => a + t.gen.n, 0), d = trials.reduce((a, t) => a + Number(t.gen.d), 0);
  const rs = trials.map((t) => t.gen.n / Number(t.gen.d));
  return { n, d, x: n / d, min: Math.min(...rs), max: Math.max(...rs), meanOfRates: rs.reduce((a, b) => a + b, 0) / rs.length };
};
