// M03 · Environment discovery and readiness, and M04 · Model, effort and capability catalog.
// EnvironmentScreen (F2) reports each prerequisite independently: ✓ established · ✗ failed or absent · ? unknown ·
// ▲ limited · ○ not applicable · ◷ cached. CatalogScreen (m) shows catalog entries with their source and age.
// All data is fictional.
import { Grid, fit, len, header, footer, table, button, buttons, input, radios, para, kv, notice, toast, modal, tree, select, rcell, loading } from './lib.mjs';
import { setup } from './screens-setup.mjs';

// ---------------------------------------------------------------- M03 · data per state

const HARNESS_COLS = (w) => [{ l: 'Harness', w: 14 }, { l: 'Version', w: 10 }, { l: 'Authentication', w: 18 }, { l: 'Models', w: 16 }, { l: 'Headless', w: w - 58 }];

const harnessRows = (st) => {
  if (st.noHarness) return ['Claude Code', 'Codex', 'Grok CLI', 'Pi'].map((h) => [h, '—', rcell('na', 'not checked'), rcell('na', 'not checked'), rcell('fail', 'not found')]);
  if (st.offline) return [
    ['Claude Code', '3.4.1', rcell('unknown', 'offline'), rcell('cache', 'cache · 3 d'), rcell('unknown', 'offline')],
    ['Codex', '0.98.0', rcell('unknown', 'offline'), rcell('cache', 'cache · 3 d'), rcell('unknown', 'offline')],
    ['Grok CLI', '1.9.2', rcell('unknown', 'offline'), rcell('cache', 'bundled'), rcell('unknown', 'offline')],
    ['Pi', '0.31.0', rcell('na', 'local endpoint'), rcell('ok', '2 · endpoint'), rcell('ok', 'probe ok')],
  ];
  const grok = st.authFail
    ? ['Grok CLI', '1.9.2', rcell('fail', 'rejected · 401'), rcell('unknown', 'needs auth'), rcell('fail', 'blocked by auth')]
    : ['Grok CLI', '1.9.2', rcell('ok', 'verified'), rcell('ok', '4 · live'), rcell('ok', 'probe ok')];
  return [
    ['Claude Code', '3.4.1', rcell('ok', 'verified'), rcell('ok', '9 · live'), rcell('ok', 'probe ok')],
    ['Codex', '0.98.0', rcell('ok', 'verified'), rcell('ok', '6 · live'), rcell('ok', 'probe ok')],
    grok,
    ['Pi', '0.31.0', rcell('na', 'local endpoint'), rcell('ok', '2 · endpoint'), rcell('ok', 'probe ok')],
  ];
};

const RUNTIMES = (linux) => [
  ['Python', rcell('ok', linux ? '3.12.3' : '3.12.6'), 'AxBenchmark itself'],
  ['Git', rcell('ok', linux ? '2.43.0' : '2.47.1'), 'baselines, snapshots, commits'],
  ['Node.js', rcell('ok', '22.11.0'), 'JavaScript templates, verifiers'],
  ['Playwright for Python', rcell('ok', '1.52.0'), 'browser acceptance checks'],
  ['Chromium (Playwright)', rcell('ok', '140.0'), 'browser checks, screenshots'],
];

const COLLECTORS = (linux) => linux ? [
  ['CPU utilization', rcell('ok', 'psutil 6.1'), 'process tree · 1 s samples'],
  ['CPU package power', rcell('fail', 'permission'), 'RAPL energy is root-only'],
  ['NVIDIA GPU · RTX 3090', rcell('fail', 'missing driver'), 'NVML library not found'],
  ['Intel iGPU utilization', rcell('fail', 'collector failed'), 'intel_gpu_top exited 139'],
  ['Intel iGPU power', rcell('fail', 'unsupported hw'), 'UHD 770 exposes no counter'],
  ['CPU temperature', rcell('fail', 'missing tool'), 'lm-sensors not installed'],
] : [
  ['CPU utilization', rcell('ok', 'psutil 6.1'), 'process tree · 1 s samples'],
  ['Memory', rcell('ok', 'psutil 6.1'), 'RSS of run processes'],
  ['GPU utilization', rcell('ok', 'IOReport'), 'whole GPU, not per process'],
  ['CPU power', rcell('warn', 'permission'), 'insufficient permission · see guide'],
  ['GPU power', rcell('warn', 'permission'), 'insufficient permission · see guide'],
  ['SoC temperature', rcell('fail', 'unsupported hw'), 'no public interface'],
];

// ---------------------------------------------------------------- M03 · EnvironmentScreen

export function environment(sz, focus = 'harnesses', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const linux = !!st.linux;
  header(g, 'AxBenchmark', 'Environment');
  g.fill(0, 1, W, 1, 'B1');
  const host = compact ? (linux ? 'lab-linux-02' : 'mike-mbp-m4') : linux ? 'Ubuntu 24.04 · x86_64 · lab-linux-02' : 'macOS 26.0 · arm64 · mike-mbp-m4';
  const bar = st.noHarness ? ['✗', compact ? 'No supported harness · runs blocked' : 'No supported harness found — planning and runs are blocked', 'bd']
    : st.offline ? ['▲', compact ? 'Offline · cached models shown' : 'Offline · live checks unavailable · local findings and cached models shown', 'bd']
    : st.authFail ? ['▲', `${host} · 3 of 4 harnesses ready · Grok CLI ${compact ? 'auth' : 'authentication'} failed`, 'bd']
    : ['●', `${host} · 4 of 4 harnesses ready · checked ${st.rechecked ? '21:44' : '21:38'}`, ''];
  g.text(1, 1, bar[0], bar[0] === '●' ? 'ac' : 'bd');
  g.text(3, 1, fit(bar[1], W - 18), bar[2]);
  g.text(W - 12, 1, 'F5', 'ac bd'); g.text(W - 9, 1, 'Recheck');
  g.region(0, 1, W, 1, 'Static', '#env-summary');

  const lw = compact ? W : 72;
  const hf = focus === 'harnesses';
  g.box(0, 2, lw, 7, { f: hf ? 'ac' : 'ln', title: 'Harnesses', sub: 'found ≠ authenticated ≠ usable' });
  const hcur = st.authFail || st.rechecked ? 2 : st.linux ? -1 : 0;
  table(g, 1, 3, lw - 2, HARNESS_COLS(lw - 2), harnessRows(st).map((v) => ({ v })), { cursor: hcur, focused: hf });
  g.region(1, 3, lw - 2, 5, 'DataTable', '#harnesses');

  if (compact) {
    const line = (y, label, items) => {
      g.text(1, y, fit(label, 11), 'bd');
      let x = 12;
      for (const it of items) { const s = `${it.t} `; if (x + len(s) > W - 1) break; g.text(x, y, s, it.f); x += len(s) + 1; }
    };
    line(9, 'Runtimes', RUNTIMES(linux).map(([n, c]) => ({ t: `${c.t.slice(0, 1)} ${n.replace(' for Python', '').replace(' (Playwright)', '')}`, f: c.f })));
    line(10, 'Collectors', COLLECTORS(linux).map(([n, c]) => ({ t: `${c.t.slice(0, 1)} ${n.replace(' utilization', '')}`, f: c.f })));
    g.region(1, 9, W - 2, 2, 'Static', '#readiness-strip');
    const y = 11, h = H - 1 - y;
    const sel = st.authFail ? 'Grok CLI · authentication failed' : st.noHarness ? 'No supported harness' : 'Claude Code 3.4.1 · ready';
    g.box(0, y, W, h, { title: sel, f: focus === 'detail' ? 'ac' : 'ln' });
    g.region(0, y, W, h, 'Static', '#summary');
    if (st.authFail) {
      para(g, 2, y + 1, W - 4, '✗ grok reported 401 Unauthorized for the configured xAI key. ✓ Executable and version 1.9.2 found. ? Models and efforts for this account stay unknown until it signs in.');
      para(g, 2, y + 5, W - 4, 'Sign in again or update XAI_API_KEY, then F5. AxBenchmark never edits credentials. Other harnesses are unaffected.', 'mu');
    } else {
      para(g, 2, y + 1, W - 4, '✓ executable · ✓ version 3.4.1 · ✓ authentication (status check) · ✓ headless probe 21:38 · ✓ clean-mode controls');
      para(g, 2, y + 4, W - 4, '? Effective effort is known only after a run, if the harness reports it. ? Access to each model is confirmed at launch.', 'mu');
    }
    footer(g, [{ k: 'esc', d: 'Back', go: 'Library' }, { k: 'f5', d: 'Recheck', go: st.authFail ? 'EnvironmentRechecked' : undefined }, { k: 'm', d: 'Models', go: 'Catalog' }, { k: 'd', d: 'Docs' }]);
    return g;
  }

  const rf = focus === 'runtimes';
  g.box(0, 9, lw, 8, { f: rf ? 'ac' : 'ln', title: 'Runtimes and browser' });
  table(g, 1, 10, lw - 2, [{ l: 'Runtime', w: 24 }, { l: 'Status', w: 14 }, { l: 'Needed for', w: lw - 2 - 38 }], RUNTIMES(linux).map((v) => ({ v })), { cursor: rf ? 0 : -1, focused: rf });
  g.region(1, 10, lw - 2, 6, 'DataTable', '#runtimes');
  const cf = focus === 'collectors';
  g.box(0, 17, lw, 9, { f: cf ? 'ac' : 'ln', title: 'Hardware collectors', sub: 'optional · never block a run' });
  table(g, 1, 18, lw - 2, [{ l: 'Collector', w: 24 }, { l: 'Status', w: 19 }, { l: 'Scope or cause', w: lw - 2 - 43 }], COLLECTORS(linux).map((v) => ({ v })), { cursor: linux ? 1 : -1, focused: cf });
  g.region(1, 18, lw - 2, 7, 'DataTable', '#collectors');
  g.box(0, 26, lw, H - 1 - 26 - 1, { title: 'Model information', f: 'ln' });
  g.region(0, 26, lw, H - 28, 'Static', '#models-summary');
  kv(g, 2, 27, 14, lw - 4, st.offline ? [
    ['Claude Code', '◷ 9 models · cached 2026-09-28 18:02 · 3 days old'],
    ['Codex', '◷ 6 models · cached 2026-09-28 18:02 · 3 days old'],
    ['Grok CLI', '◷ 4 models · bundled baseline 2026-09-15 only'],
    ['Pi', '✓ 2 models · local endpoint localhost:8080 reachable'],
  ] : [
    ['Claude Code', '✓ 9 models · discovered 21:38 · Anthropic'],
    ['Codex', '✓ 6 models · discovered 21:38 · OpenAI'],
    ['Grok CLI', st.authFail ? '? not listed · discovery needs authentication' : '✓ 4 models · discovered 21:38 · xAI'],
    ['Pi', '✓ 2 models · local endpoint localhost:8080'],
  ]);
  g.text(2, 32, fit('Catalog presence never proves access · m opens the catalog', lw - 4), 'mu');

  // Detail pane for the selected row
  const dx = lw + 2, dw = W - lw - 4, df = focus === 'detail';
  const dh = H - 2 - 2;
  let y = 3;
  const sec = (t) => { g.text(dx, y++, t, 'bd'); };
  const item = (glyph, text, f = '') => { g.text(dx, y, glyph, glyph === '✓' ? 'ac' : 'bd'); y = para(g, dx + 2, y, dw - 2, text, f); };
  if (st.noHarness) {
    g.box(lw, 2, W - lw, dh, { f: df ? 'ac' : 'ln', title: 'Set up a harness' });
    y = notice(g, dx, y, dw, 'error', 'No supported harness is installed', 'Planning and runs need at least one of Claude Code, Codex, Grok CLI or Pi.');
    y++;
    sec('Install guides · macOS and Linux');
    for (const [h, d] of [['Claude Code', 'docs/harnesses/claude-code.md'], ['Codex', 'docs/harnesses/codex.md'], ['Grok CLI', 'docs/harnesses/grok-cli.md'], ['Pi', 'docs/harnesses/pi.md']]) {
      g.text(dx, y, fit(h, 13), ''); g.text(dx + 13, y++, fit(d, dw - 13), 'ac ul');
    }
    y++;
    sec('Still available');
    for (const t of ['Library browsing', 'Template and result ZIP import/export', 'Saved results and HTML reports']) item('✓', t);
    y++;
    para(g, dx, y, dw, 'Install the harness yourself, then press F5. AxBenchmark never installs tools or changes permissions.', 'mu');
    buttons(g, W - 3, H - 4, [{ label: 'Recheck', v: 'primary', focus: df }, { label: 'Open guides' }]);
  } else if (linux) {
    g.box(lw, 2, W - lw, dh, { f: df ? 'ac' : 'ln', title: 'CPU package power · RAPL' });
    item('✗', 'Insufficient permission', 'bd');
    y = para(g, dx + 2, y, dw - 2, '/sys/class/powercap/intel-rapl:0/energy_uj exists but only root can read it.', 'mu');
    y++;
    sec('Effect');
    y = para(g, dx, y, dw, 'Benchmarks run normally. CPU power is reported as unavailable, with this cause, in results and reports.', 'mu');
    y++;
    sec('To enable it on Linux');
    y = para(g, dx, y, dw, 'Give your user read access to the powercap energy files, for example with a udev rule, then press F5.', 'mu');
    g.text(dx, y++, fit('docs/collectors/linux-rapl.md', dw), 'ac ul');
    y++;
    sec('Why the other rows differ');
    for (const [c, t] of [['missing driver', 'install the NVIDIA driver'], ['collector failed', 'see the collector log'], ['unsupported hw', 'nothing to install'], ['missing tool', 'install lm-sensors']]) {
      g.text(dx, y, fit(c, 17), 'mu'); g.text(dx + 17, y++, fit(t, dw - 17));
    }
    y++;
    para(g, dx, y, dw, 'AxBenchmark never installs tools or changes permissions.', 'mu');
    buttons(g, W - 3, H - 4, [{ label: 'Open guide' }, { label: 'Recheck', v: 'primary', focus: df }]);
  } else if (st.authFail) {
    g.box(lw, 2, W - lw, dh, { f: df ? 'ac' : 'ln', title: 'Grok CLI 1.9.2' });
    sec('Failed');
    item('✗', 'Authentication: grok reported 401 Unauthorized for the configured xAI key.', 'bd');
    y++;
    sec('Established');
    item('✓', 'Executable /opt/homebrew/bin/grok');
    item('✓', 'Version 1.9.2 · supported for headless runs');
    y++;
    sec('Unknown');
    item('?', 'Models and efforts for this account · discovery needs authentication');
    y++;
    sec('Effect');
    y = para(g, dx, y, dw, 'Grok CLI entries cannot launch. Claude Code, Codex and Pi are unaffected.', 'mu');
    y++;
    sec('Fix');
    y = para(g, dx, y, dw, 'Sign in again with Grok CLI, or update XAI_API_KEY in your shell, then press F5. AxBenchmark never edits credentials.', 'mu');
    g.text(dx, y + 1, fit('docs/harnesses/grok-cli.md', dw), 'ac ul');
    buttons(g, W - 3, H - 4, [{ label: 'Open guide' }, { label: 'Recheck', v: 'primary', go: 'EnvironmentRechecked', focus: df }]);
  } else if (st.offline) {
    g.box(lw, 2, W - lw, dh, { f: df ? 'ac' : 'ln', title: 'Claude Code 3.4.1' });
    sec('Established locally');
    item('✓', 'Executable /opt/homebrew/bin/claude · version 3.4.1');
    y++;
    sec('Unknown while offline');
    item('?', 'Authentication · could not be checked. This is not a rejection; last verified 2026-09-28 18:02.');
    item('?', 'Headless probe · needs the provider');
    y++;
    sec('Cached');
    item('◷', '9 models from 2026-09-28 18:02 (3 days). Cached entries do not prove current access.');
    y++;
    sec('Effect');
    para(g, dx, y, dw, 'You can browse and configure. Launch checks again and stops an entry whose access fails. Pi uses a local endpoint and can still run.', 'mu');
    buttons(g, W - 3, H - 4, [{ label: 'Model catalog', go: 'Catalog' }, { label: 'Recheck', v: 'primary', focus: df }]);
  } else {
    g.box(lw, 2, W - lw, dh, { f: df ? 'ac' : 'ln', title: st.rechecked ? 'Grok CLI 1.9.2' : 'Claude Code 3.4.1' });
    sec('Established');
    if (st.rechecked) {
      item('✓', 'Authentication · verified 21:44 (was ✗ rejected at 21:38)');
      item('✓', 'Headless probe · one-turn request completed');
      item('✓', '4 models discovered · xAI');
    } else {
      item('✓', 'Executable /opt/homebrew/bin/claude');
      item('✓', 'Version 3.4.1 · supported for headless runs');
      item('✓', 'Authentication · status check passed');
      item('✓', 'Headless probe · one-turn request completed 21:38');
      item('✓', 'Clean-mode controls available');
    }
    y++;
    sec('Not established here');
    item('?', 'Effective effort · reported after a run only if the harness exposes it');
    item('?', 'Access to each model · confirmed at launch');
    y++;
    sec('Models');
    y = para(g, dx, y, dw, st.rechecked ? '4 from live discovery · 21:44' : '9 from live discovery · 21:38 · m opens the catalog', 'mu');
    g.text(dx, y + 1, fit(st.rechecked ? 'docs/harnesses/grok-cli.md' : 'docs/harnesses/claude-code.md', dw), 'ac ul');
    buttons(g, W - 3, H - 4, [{ label: 'Model catalog', go: 'Catalog' }, { label: 'Recheck', focus: df }]);
  }
  g.region(lw, 2, W - lw, dh, 'VerticalScroll', '#detail-pane.pane');
  if (st.rechecked) toast(g, '✓ Recheck complete · 1 change', 'Grok CLI authentication ✗ rejected → ✓ verified. AxBenchmark installed and changed nothing.', 46);
  footer(g, [{ k: 'esc', d: 'Back', go: 'Library' }, { k: 'f5', d: 'Recheck', go: st.authFail ? 'EnvironmentRechecked' : undefined }, { k: 'enter', d: 'Details' }, { k: 'm', d: 'Model catalog', go: 'Catalog', off: !!st.noHarness }, { k: 'd', d: 'Docs' }, { k: 'c', d: 'Copy path' }, { k: 'tab', d: 'Pane', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- M04 · CatalogScreen

const CLAUDE_MODELS = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', eff: 'low medium high', def: 'medium', img: '✓', price: '5 / 25', src: 'discovered' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', eff: 'low medium high', def: 'medium', img: '✓', price: '3 / 15', src: 'discovered' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', eff: '? unknown', def: '?', img: '✓', price: '1 / 5', src: 'bundled' },
  { id: 'claude-fable-5-1', name: 'Claude Fable 5.1', eff: 'low medium high max', def: 'high', img: '✓', price: '? unknown', src: 'override' },
];
const CODEX_MODELS = [
  { id: 'gpt-6-sol', eff: 'low medium high', def: 'medium', img: '✓', price: '1.25 / 10', src: 'cache · 3 d' },
  { id: 'gpt-6-astra', eff: 'low medium high', def: 'medium', img: '✓', price: '10 / 40', src: 'cache · 3 d' },
  { id: 'gpt-6-sol-mini', eff: 'low medium', def: 'low', img: '?', price: '? unknown', src: 'bundled' },
];

const providerTree = (sel) => [
  { t: 'Claude Code 3.4.1', depth: 0, kids: true, open: true, f: 'bd' },
  { t: 'Anthropic · personal', depth: 1, last: true, sel: sel === 'claude', go: 'Catalog' },
  { t: 'Codex 0.98.0', depth: 0, kids: true, open: true, f: 'bd' },
  { t: 'OpenAI · personal', depth: 1, last: true, sel: sel === 'codex', go: 'CatalogRefreshFailed' },
  { t: 'Grok CLI 1.9.2', depth: 0, kids: true, open: true, f: 'bd' },
  { t: 'xAI · personal', depth: 1, last: true },
  { t: 'Pi 0.31.0', depth: 0, kids: true, open: true, f: 'bd' },
  { t: 'llama.cpp · :8080', depth: 1 },
  { t: 'OpenRouter · personal', depth: 1, last: true },
];

// R3-2 · exchange rates to USD, collected by M04's ExchangeRateSource during an explicit refresh (never during a run).
// A user-supplied rate overrides the collected one and is labelled. The README's historical COP rate is never used.
export const RATES = [
  { cur: 'USD', rate: '1', layer: 'fixed', src: '—', at: '—' },
  { cur: 'EUR', rate: '1.0839', layer: 'collected', src: 'open.er-api.com/v6/latest/USD', at: '2026-10-01 16:00' },
  { cur: 'GBP', rate: '1.2706', layer: 'collected', src: 'open.er-api.com/v6/latest/USD', at: '2026-10-01 16:00' },
  { cur: 'CNY', rate: '0.1391', layer: 'collected', src: 'open.er-api.com/v6/latest/USD', at: '2026-10-01 16:00' },
  { cur: 'COP', rate: '0.000250', layer: 'override', src: 'supplied by you · collected 0.000249', at: '2026-10-02 09:12', user: true },
];

const modelCols = (w) => [{ l: 'Model', w: w - 64 }, { l: 'Supported efforts', w: 22 }, { l: 'Default', w: 9 }, { l: 'Image', w: 6 }, { l: 'Price in/out', w: 13 }, { l: 'Source', w: 14 }];

export function catalog(sz, focus = 'models', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const failed = !!st.failed;
  header(g, 'AxBenchmark', 'Model catalog');
  g.fill(0, 1, W, 1, 'B1');
  if (failed) { g.text(1, 1, '✗', 'bd'); g.text(3, 1, fit(compact ? 'Refresh failed 21:41 · showing last valid data (3 days)' : 'Refresh failed 21:41 · Codex model request timed out · last valid catalog and rates kept (3 days)', W - 18), 'bd'); }
  else g.text(1, 1, fit(compact ? 'catalog 2026.09.2 · discovered 21:38 · rates 10-01 · 3 overrides' : 'catalog 2026.09.2 · bundled 09-15 · discovered 21:38 · rates to USD 2026-10-01 · 3 overrides, which win', W - 15));
  g.text(W - 12, 1, 'F5', 'ac bd'); g.text(W - 9, 1, 'Refresh');
  g.region(0, 1, W, 1, 'Static', '#catalog-bar');
  const models = failed ? CODEX_MODELS : CLAUDE_MODELS;
  const cur = failed ? 0 : 2;
  const mf = focus === 'models';
  let x0 = 0;
  if (compact) {
    g.text(1, 2, 'Harness', 'mu'); select(g, 9, 2, 34, failed ? 'Codex 0.98.0 · OpenAI' : 'Claude Code 3.4.1 · Anthropic', { focus: focus === 'provider' });
    g.text(45, 2, fit('personal · subscription, declared', W - 46), 'mu');
    g.box(0, 3, W, models.length + 3, { f: mf ? 'ac' : 'ln', title: 'Models' });
    table(g, 1, 4, W - 2, [{ l: 'Model', w: 20 }, { l: 'Efforts', w: 22 }, { l: 'Default', w: 9 }, { l: 'Img', w: 5 }, { l: 'Source', w: W - 2 - 56 }],
      models.map((m) => ({ v: [m.id, m.eff, m.def, m.img, m.src] })), { cursor: cur, focused: mf });
    const y = 3 + models.length + 3;
    const m = models[cur];
    g.box(0, y, W, H - 1 - y, { title: m.id, f: focus === 'detail' ? 'ac' : 'ln' });
    kv(g, 2, y + 1, 12, W - 4, [
      ['Efforts', '? unknown for Claude Code 3.4.1 · Anthropic'],
      ['In a run', '→ harness default · no effort argument'],
      ['Pricing', '$1 in · $5 out per Mtok · USD · bundled 2026-09-15'],
      ['Billing', 'subscription · declared by user · account personal'],
      ['Sources', 'override — · discovered: listed only · bundled ✓'],
      ['Rates', 'to USD · open.er-api.com 2026-10-01 · COP supplied by you'],
    ]);
    g.text(2, y + 8, fit('Listed is not ready: access is checked in Environment and at launch.', W - 4), 'mu');
    footer(g, [{ k: 'esc', d: 'Back', go: 'Environment' }, { k: 'f5', d: 'Refresh' }, { k: 'o', d: 'Override', go: 'CatalogOverride' }, { k: 'r', d: 'Rates', go: 'CatalogRates' }, { k: '/', d: 'Filter' }]);
    return g;
  }

  const tf = focus === 'providers';
  g.box(0, 2, 32, H - 3, { f: tf ? 'ac' : 'ln', title: 'Harness · provider' });
  g.region(0, 2, 32, H - 3, 'Vertical', '#providers-pane.pane');
  const ty = tree(g, 2, 3, 28, providerTree(failed ? 'codex' : 'claude'), { focused: tf });
  g.region(2, 3, 28, 9, 'Tree', '#providers');
  const ky = kv(g, 2, ty + 1, 9, 28, failed
    ? [['Account', 'personal'], ['Harness', '0.98.0'], ['Catalog', 'for 0.98.x'], ['Source', '◷ cache · 3 d']]
    : [['Account', 'personal'], ['Billing', ['subscription', 'declared by user']], ['Harness', '3.4.1'], ['Catalog', 'for 3.4.x'], ['Source', '✓ live 21:38'], ['Default', 'sonnet-5-5 · config']]);
  const py = para(g, 2, ky + 1, 28, 'The same model name under another harness, provider, account or version is a separate entry.', 'mu');
  // Rates to USD: collected during an explicit refresh (R3-2); a failed refresh keeps the last valid rates.
  let ry = py + 1;
  g.text(2, ry, 'Rates to USD', 'bd'); g.text(25, ry, 'r', 'ac bd'); g.link(2, ry++, 28, 1, 'go:CatalogRates');
  for (const r of RATES.slice(1)) {
    g.text(2, ry, r.cur, 'mu'); g.text(7, ry, fit(r.rate, 9));
    g.text(17, ry++, fit(r.user ? '▲ yours 10-02' : failed ? '◷ ecb · 10-01' : 'ecb · 10-01', 13), r.user ? 'bd' : 'mu');
  }
  g.region(2, py + 1, 28, ry - py - 1, 'Static', '#rates-summary');
  x0 = 32;
  const w = W - x0;
  g.box(x0, 2, w, models.length + 3, { f: mf ? 'ac' : 'ln', title: failed ? 'Codex · OpenAI · personal' : 'Claude Code · Anthropic · personal', sub: `${models.length} models` });
  table(g, x0 + 1, 3, w - 2, modelCols(w - 2), models.map((m) => ({ v: [m.id, m.eff.startsWith('?') ? { t: m.eff, f: 'it' } : m.eff, m.def, m.img, m.price.startsWith('?') ? { t: m.price, f: 'it' } : m.price, m.src] })), { cursor: cur, focused: mf });
  g.region(x0 + 1, 3, w - 2, models.length + 1, 'DataTable', '#models');
  const dy = 2 + models.length + 3, dh = H - 2 - dy - 1;
  const df = focus === 'detail';
  const dx = x0 + 2, dw = w - 4;
  const m = models[cur];
  g.box(x0, dy, w, dh, { f: df ? 'ac' : 'ln', title: failed ? 'Refresh failed · last valid catalog kept' : `${m.id} · ${m.name}` });
  g.region(x0, dy, w, dh, 'VerticalScroll', '#entry-detail.pane');
  let y = dy + 1;
  if (failed) {
    y = notice(g, dx, y, dw, 'error', 'Codex model request timed out after 20 s · 21:41', 'Nothing in the catalog changed. The entries above are the last valid data, shown with their source and age.');
    y++;
    for (const [gl, t] of [
      ['◷', 'Cached entries keep their original source, retrieval time and harness version (0.98.0).'],
      ['?', 'Cache and bundled data never prove current account access; Environment and launch check that.'],
      ['✓', 'Your overrides are stored separately and are never touched by a refresh.'],
      ['▲', 'gpt-6-sol-mini has only bundled data: image input and pricing stay unknown, not guessed.'],
      ['◷', 'Exchange rates keep their 2026-10-01 values from open.er-api.com; nothing was converted with a guess.'],
    ]) { g.text(dx, y, gl, gl === '✓' ? 'ac' : 'bd'); y = para(g, dx + 2, y, dw - 2, t, 'mu'); }
    buttons(g, W - 3, dy + dh - 2, [{ label: 'Show error log' }, { label: 'Retry refresh', v: 'primary', focus: df }]);
  } else {
    y = kv(g, dx, y, 18, dw, [
      ['Applies to', 'Claude Code 3.4.x · Anthropic · account personal'],
      ['Supported efforts', '? unknown for this combination'],
      ['Default effort', '? unknown'],
      ['In a run', '→ “harness default”: no effort argument is passed'],
      ['Image input', '✓ supported'],
      ['Pricing', '$1.00 in · $5.00 out per Mtok · USD · bundled table 2026-09-15'],
      ['Billing (account)', 'subscription · declared by user · not in the harness status'],
    ]);
    y++;
    g.text(dx, y++, 'Sources · highest wins', 'bd');
    table(g, dx, y, dw, [{ l: 'Layer', w: 13 }, { l: 'What it says', w: 34 }, { l: 'Retrieved', w: dw - 47 }], [
      { v: ['override', { t: '— none', f: 'mu' }, '—'] },
      { v: ['discovered', 'listed · efforts not reported', 'today 21:38 · Claude Code 3.4.1'] },
      { v: ['bundled', 'image ✓ · price 1 / 5 · efforts ?', '2026-09-15 · catalog 2026.09.2'] },
    ]);
    g.region(dx, y, dw, 4, 'DataTable', '#entry-sources');
    y += 5;
    notice(g, dx, y, dw, 'info', 'Listed is not ready', 'Catalog entries describe what is known about a model. Authentication and headless execution come from Environment and are checked again at launch.');
    buttons(g, W - 3, dy + dh - 2, [{ label: 'Add override…', go: 'CatalogOverride', focus: df }, { label: 'Open catalog YAML' }]);
  }
  footer(g, [{ k: 'esc', d: 'Back', go: 'Environment' }, { k: 'f5', d: 'Refresh' }, { k: 'o', d: 'Override', go: 'CatalogOverride' }, { k: 'r', d: 'Rates', go: 'CatalogRates' }, { k: '/', d: 'Filter' }, { k: 'y', d: 'Open YAML' }, { k: 'tab', d: 'Pane', do: 'next' }]);
  return g;
}

export function catalogOverride(sz, focus = 'efforts') {
  const g = catalog(sz, 'none');
  const m = modal(g, 86, 32, 'Override catalog entry', { sel: '#override' });
  let y = m.y;
  g.text(m.x, y++, fit('claude-haiku-4-5 · Claude Code 3.4.x · Anthropic · account personal', m.w), 'bd');
  g.text(m.x, y++, fit('Each field: Inherit (lower layers decide) · Value · Unknown (resolution stops)', m.w), 'mu');
  y++;
  const L = 16, S = 12, V = L + S + 2;
  g.text(m.x, y, 'Field', 'bd'); g.text(m.x + L, y, 'Mode', 'bd'); g.text(m.x + V, y++, 'Value · resolves to', 'bd');
  const row = (label, id, mode, key, draw) => {
    g.text(m.x, y, label, 'mu');
    select(g, m.x + L, y, S, mode, { focus: focus === key });
    g.region(m.x + L, y, S, 1, 'Select', `${id}-mode`);
    draw(m.x + V, m.w - V);
    y++;
  };
  row('Efforts', '#override-efforts', 'Value', 'efforts', (x, w) => { input(g, x, y, w, 'low, medium, high'); g.region(x, y, w, 1, 'Input', '#override-efforts'); });
  row('Default effort', '#override-default', 'Inherit', 'default', (x, w) => { g.text(x, y, fit('? unknown · no lower layer has one', w), 'it'); g.region(x, y, w, 1, 'Select', '#override-default'); });
  row('Image input', '#override-image', 'Inherit', 'image', (x, w) => { g.text(x, y, fit('✓ supported · bundled 2026-09-15', w), 'mu'); g.region(x, y, w, 1, 'Select', '#override-image'); });
  row('Price in', '#override-price-in', 'Unknown', 'price', (x, w) => { g.text(x, y, fit('? unknown · source override', w), 'bd'); g.region(x, y, w, 1, 'Input', '#override-price-in'); });
  row('Price out', '#override-price-out', 'Unknown', 'price-out', (x, w) => { g.text(x, y, fit('? unknown · source override', w), 'bd'); g.region(x, y, w, 1, 'Input', '#override-price-out'); });
  y++;
  // R3-1 · billing kind is declared per account, through the same tri-state override; precedence override › discovered › unknown.
  const ah = 'Account personal · every model of Claude Code · Anthropic ';
  g.text(m.x, y, ah, 'bd'); g.hline(m.x + len(ah), y, m.w - len(ah)); y++;
  row('Billing kind', '#override-billing', 'Value', 'billing', (x, w) => {
    select(g, x, y, 16, 'subscription', { focus: focus === 'billing-value' });
    g.text(x + 17, y, fit('declared by user', w - 17), 'bd');
    g.region(x, y, 16, 1, 'Select', '#override-billing');
  });
  y++;
  g.text(m.x, y++, 'Effect in a run', 'bd');
  for (const [gl, t] of [
    ['✓', 'Efforts low · medium · high are offered in the entry picker (value).'],
    ['?', 'Default effort unknown (inherit): unchosen efforts run at harness default.'],
    ['?', 'Price unknown: no API-equivalent estimate; the bundled $1 / $5 is not used.'],
    ['?', 'Billing: the harness status does not report it (discovered: unknown).'],
    ['✓', 'Billing subscription for every model of this account: never a verified $0.'],
    ['▲', 'Every cost of this account is labelled “subscription · declared by user”.'],
  ]) { g.text(m.x, y, gl, gl === '✓' ? 'ac' : gl === '▲' ? 'bd' : 'it'); g.text(m.x + 2, y++, fit(t, m.w - 2), 'mu'); }
  y++;
  y = para(g, m.x, y, m.w, 'Overrides are your own metadata. They win over discovered and bundled values and survive every refresh, but they never prove account access or the effort a run actually used.', 'mu');
  g.text(m.x, y, 'Saved to', 'mu'); g.text(m.x + L, y++, fit('~/.axbenchmark/catalog/overrides.yaml', m.w - L));
  buttons(g, m.right, m.bottom, [{ label: 'Remove override' }, { label: 'Cancel', go: 'Catalog' }, { label: 'Save', v: 'primary', go: 'Catalog', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Catalog' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Save', go: 'Catalog' }], '');
  return g;
}

// ---------------------------------------------------------------- M04 · exchange rates (R3-2)

export function catalogRates(sz, focus = 'rates') {
  const g = catalog(sz, 'none');
  const m = modal(g, 92, 31, 'Exchange rates · to USD', { sel: '#rates' });
  let y = m.y;
  g.text(m.x, y++, fit('Collected by the catalog refresh (F5) · 2026-10-01 21:38 · 3 collected · 1 yours', m.w), 'bd');
  y = para(g, m.x, y, m.w, 'Used to convert prices in other currencies and to show any display currency. A run freezes the rates it needs at launch; changes here never reach a frozen run.', 'mu');
  y++;
  const rf = focus === 'rates';
  table(g, m.x, y, m.w, [{ l: 'Cur', w: 5 }, { l: 'USD per unit', w: 13 }, { l: 'Layer', w: 12 }, { l: 'Source', w: m.w - 47 }, { l: 'Retrieved', w: 17 }],
    RATES.map((r) => ({ v: [r.cur, r.rate, r.user ? { t: '▲ override', f: 'bd' } : r.layer, r.user ? { t: r.src, f: 'bd' } : r.src, r.at] })), { cursor: rf ? 4 : -1, focused: rf });
  g.region(m.x, y, m.w, RATES.length + 1, 'DataTable', '#rates-table');
  y += RATES.length + 2;
  g.text(m.x, y++, 'COP · your rate', 'bd');
  const L = 12;
  g.text(m.x, y, 'Mode', 'mu'); select(g, m.x + L, y, 12, 'Value', { focus: focus === 'mode' }); g.region(m.x + L, y, 12, 1, 'Select', '#rate-mode');
  input(g, m.x + L + 14, y, 12, '0.000250', { focus: focus === 'value' }); g.region(m.x + L + 14, y, 12, 1, 'Input', '#rate-value');
  g.text(m.x + L + 28, y++, fit('USD per COP (4000.00 COP per USD)', m.w - L - 28), 'mu');
  g.text(m.x, y, 'Collected', 'mu'); g.text(m.x + L, y++, fit('0.000249 · open.er-api.com · 2026-10-01 · kept, used again after Remove', m.w - L), 'mu');
  y++;
  for (const [gl, t] of [
    ['✓', 'Rates are collected only during an explicit refresh, never during a run.'],
    ['◷', 'A failed refresh keeps the last valid rates; offline, this cache is used.'],
    ['▲', 'Your rate wins over the collected one and is labelled “supplied by you” wherever it is used.'],
    ['?', 'A currency without a rate converts to unknown (no_rate_conversion), never to a guess.'],
  ]) { g.text(m.x, y, gl, gl === '✓' ? 'ac' : gl === '?' ? 'it' : 'bd'); y = para(g, m.x + 2, y, m.w - 2, t, 'mu'); }
  y++;
  para(g, m.x, y, m.w, 'The README’s historical exchange rate is never used. Saved to ~/.axbenchmark/catalog/overrides.yaml (rates:).', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Remove my rate' }, { label: 'Add rate…' }, { label: 'Close', go: 'Catalog' }, { label: 'Save', v: 'primary', go: 'Catalog', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Catalog' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'a', d: 'Add rate' }, { k: 'del', d: 'Remove my rate' }, { k: '^s', d: 'Save', go: 'Catalog' }], '');
  return g;
}

// ---------------------------------------------------------------- M04 · model and effort picker (Setup · M07 context)

export function modelPicker(sz, focus = 'model', st = {}) {
  const g = setup(sz, 'none');
  const unknown = !!st.unknown;
  const m = modal(g, 86, 25, 'Add competitor entry', { sel: '#entry-picker' });
  let y = m.y;
  const L = 10;
  g.text(m.x, y, 'Harness', 'mu'); select(g, m.x + L, y, 34, 'Claude Code 3.4.1 · ✓ ready', { focus: focus === 'harness' });
  g.text(m.x + L + 36, y, 'Provider', 'mu'); select(g, m.x + L + 45, y++, m.w - L - 45, 'Anthropic · personal');
  g.region(m.x + L, y - 1, m.w - L, 1, 'Horizontal', '#entry-target');
  y++;
  g.text(m.x, y++, 'Model', 'bd');
  const mf = focus === 'model';
  g.box(m.x, y, m.w, 6, { f: mf ? 'ac' : 'ln', fill: 'B0' });
  const opts = [
    ['claude-opus-5-5', 'efforts low · medium · high', 'discovered'],
    ['claude-sonnet-5-5', 'efforts low · medium · high', 'discovered'],
    ['claude-haiku-4-5', 'effort support unknown', 'bundled'],
    ['claude-fable-5-1', 'efforts low · medium · high · max', 'override'],
  ];
  const sel = unknown ? 2 : 0;
  opts.forEach(([id, e, s], i) => {
    const on = i === sel, yy = y + 1 + i;
    g.fill(m.x + 1, yy, m.w - 2, 1, on ? (mf ? 'BA' : 'BS') : 'B0');
    const f = on && mf ? 'on' : '';
    g.text(m.x + 2, yy, fit(id, 22), on && mf ? 'on bd' : 'bd');
    g.text(m.x + 25, yy, fit(e, 36), f || (e.includes('unknown') ? 'it' : ''));
    g.text(m.x + 62, yy, fit(s, m.w - 64), f || 'mu');
  });
  g.region(m.x, y, m.w, 6, 'OptionList', '#model-options');
  y += 6;
  g.text(m.x, y++, fit('Claude Code’s own default: claude-sonnet-5-5 (from its config) · not preselected', m.w), 'mu');
  g.text(m.x, y++, 'Effort', 'bd');
  const ef = focus === 'effort';
  if (unknown) {
    radios(g, m.x, y++, ['Harness default'], 0, { focus: ef });
    g.region(m.x, y - 1, m.w, 1, 'RadioSet', '#effort');
    y = para(g, m.x, y, m.w, 'Effort support for claude-haiku-4-5 is unknown for Claude Code 3.4.1 here, so no values are offered. AxBenchmark passes no effort argument and records the effort as harness default; the effective effort is shown only if the harness reports it.', 'mu');
  } else {
    radios(g, m.x, y++, ['low', 'medium', 'high'], 1, { focus: ef });
    g.region(m.x, y - 1, m.w, 1, 'RadioSet', '#effort');
    y = para(g, m.x, y, m.w, 'Only efforts known for Claude Code 3.4.1 · Anthropic · personal are offered. medium is the catalog default; it is a requested setting, not proof of the effort used.', 'mu');
  }
  y++;
  g.text(m.x, y, 'Environment', 'mu'); g.text(m.x + 12, y++, fit('clean · from this configuration', m.w - 12));
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Setup' }, { label: 'Add entry', v: 'primary', go: 'Setup', focus: focus === 'add' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '↑↓', d: 'Model' }, { k: '^s', d: 'Add entry', go: 'Setup' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const READINESS_WIDGET_STATES = [
  { widget: 'DataTable#harnesses', label: 'M03 · Harness readiness', states: [
    ['Loading', mini('Harnesses', (g, x, y, w) => loading(g, x, y + 1, w, 'Checking 4 harnesses · 2 of 4…'))],
    ['Empty', mini('Harnesses', (g, x, y, w) => { centered(g, y + 1, 'No supported harness found', 'bd'); centered(g, y + 2, 'Library, ZIP exchange and reports still work.', 'mu'); centered(g, y + 4, 'd Install guides · f5 Recheck', 'ac'); })],
    ['Error', mini('Harnesses', (g, x, y, w) => { const yy = notice(g, x, y, w, 'error', 'Codex check did not finish', 'codex --version timed out after 10 s. Status stays unknown; nothing was assumed.'); button(g, x + 2, yy + 1, 'Recheck', { focus: true }); })],
  ] },
  { widget: 'DataTable#models', label: 'M04 · Catalog entries', states: [
    ['Loading', mini('Models', (g, x, y, w) => loading(g, x, y + 1, w, 'Discovering models for Claude Code 3.4.1…'))],
    ['Empty', mini('Models', (g, x, y, w) => { centered(g, y + 1, 'No catalog entries for xAI · personal', 'bd'); centered(g, y + 2, 'Discovery needs authentication.', 'mu'); centered(g, y + 4, 'F2 Environment · o Add override', 'ac'); })],
    ['Error', mini('Models', (g, x, y, w) => { notice(g, x, y, w, 'error', 'overrides.yaml is not valid YAML', 'Line 7: duplicate key “efforts”. Overrides are ignored until fixed; nothing was rewritten.'); })],
  ] },
];
