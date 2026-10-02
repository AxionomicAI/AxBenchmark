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
  ({ id, run, machine, src, h, model, effort, env, jobs, judge, status, checks, cost, time, g, ...extra });

// checks: p passed · f failed · u unverified · n not run.  cost: USD or null (unknown).  time: seconds.
export const RESULTS = [
  R('R-0928a-1', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Claude Code', 'claude-opus-5-5', 'medium', 'clean', 4, 'A', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 4.82, 2292, [4, 5, 4, 5, 4, 4]),
  R('R-0928a-2', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Codex', 'gpt-6-sol', 'medium', 'clean', 4, 'A', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 3.10, 2645, [4, 4, 5, 4, 4, 3]),
  R('R-0928a-3', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Grok CLI', 'grok-4.7-fast', 'default', 'clean', 4, 'A', 'complete', { p: 20, f: 0, u: 1, n: 0 }, 0.92, 3090, [4, 4, 4, 4, 4, 4]),
  R('R-0928a-4', '2026-09-28-a', 'mike-mbp-m4', 'local', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 4, 'A', 'complete', { p: 18, f: 3, u: 0, n: 0 }, 0, 5530, [3, 3, 4, 3, 3, 3]),
  R('R-0925b-1', '2026-09-25-b', 'mike-mbp-m4', 'local', 'Claude Code', 'claude-opus-5-5', 'high', 'current', 1, 'A', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 6.40, 1904, [5, 4, 5, 5, 4, 4]),
  R('R-0925b-2', '2026-09-25-b', 'mike-mbp-m4', 'local', 'Codex', 'gpt-6-sol', 'high', 'current', 1, 'A', 'failed', { p: 13, f: 0, u: 0, n: 8 }, 2.05, 2710, null, { failedAt: 'T5' }),
  R('R-0921a-1', '2026-09-21-a', 'mike-mbp-m4', 'local', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 2, 'A', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 0, 4802, [4, 3, 4, 4, 4, 3]),
  R('R-0921a-2', '2026-09-21-a', 'mike-mbp-m4', 'local', 'Grok CLI', 'grok-4.7', 'high', 'clean', 2, 'A', 'complete', { p: 21, f: 0, u: 0, n: 0 }, null, 2830, [4, 4, 4, 4, 3, 4]),
  R('R-0924lab-1', '2026-09-24-lab', 'lab-linux-4090', 'imported', 'Claude Code', 'claude-sonnet-5-5', 'medium', 'clean', 3, 'B', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 2.35, 2120, [4, 4, 5, 5, 4, 3]),
  R('R-0924lab-2', '2026-09-24-lab', 'lab-linux-4090', 'imported', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 3, 'B', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 0, 1720, [4, 3, 4, 4, 4, 3]),
  R('R-0924lab-3', '2026-09-24-lab', 'lab-linux-4090', 'imported', 'Codex', 'gpt-6-sol', 'low', 'clean', 3, 'B', 'complete', { p: 21, f: 0, u: 0, n: 0 }, 1.20, 1805, [4, 4, 4, 3, 4, 3]),
  R('R-0919lab-1', '2026-09-19-lab', 'lab-linux-4090', 'imported', 'Pi', 'qwen3.5-35b-a3b', 'default', 'clean', 1, 'B', 'complete', { p: 20, f: 1, u: 0, n: 0 }, 0, 1650, [4, 3, 4, 4, 3, 3]),
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

// Combined ranking for one judge group. rw = [cost, time, quality] raw weights.
export function combined(results, rw = [1, 1, 1], qw = QW) {
  const [wc, wt, wq] = normalize(rw);
  const eligible = results.filter((r) => !gates(r).length);
  const missing = (r) => [wc > 0 && r.cost == null && 'cost unknown', wt > 0 && r.time == null && 'time unknown'].filter(Boolean);
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
    cost: el.filter((r) => r.cost != null).sort((a, b) => a.cost - b.cost || (a.id < b.id ? -1 : 1)).slice(0, 5),
    time: el.filter((r) => r.time != null).sort((a, b) => a.time - b.time || (a.id < b.id ? -1 : 1)).slice(0, 5),
    quality: el.map((r) => ({ r, q: quality(r.g, qw) })).sort((a, b) => b.q - a.q || (a.r.id < b.r.id ? -1 : 1)).slice(0, 5),
  };
};

// Measured tables: highest known cost first, unknown last, then id.
export const byCost = (rs) => [...rs].sort((a, b) => (a.cost == null) - (b.cost == null) || (b.cost ?? 0) - (a.cost ?? 0) || (a.id < b.id ? -1 : 1));
