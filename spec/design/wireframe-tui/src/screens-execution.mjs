// M05 · Headless harness execution and isolation.
// RunConfigScreen is the per-configuration detail of the run (the 2×2 overview is RunScreen, M11):
// one process and conversation per task, requested vs effective settings, and the environment that was established.
// The policy and isolation dialogs belong to Setup (M07) and launch. All data is fictional.
import { Grid, fit, len, header, footer, table, button, buttons, input, para, kv, notice, modal, scrollbar } from './lib.mjs';
import { SHA, s8 } from './screens.mjs';
import { setup } from './screens-setup.mjs';

// ---------------------------------------------------------------- data

const TASKS = [
  ['T1', 'Repository and scaffold', '47102', '✓ exit 0'],
  ['T2', 'Inventory data and persistence', '47388', '✓ exit 0'],
  ['T3', 'Inventory management', '47511', '✓ exit 0'],
  ['T4', 'Inventory lookup', '47960', '✓ exit 0'],
  ['T5', 'Shopping cart', '48211', '● running'],
  ['T6', 'Checkout', '—', '○ queued'],
  ['T7', 'Test and fix', '—', '○ queued'],
];

const LOG_T5 = [
  ['21:31:02', 'task', 'T5 started · new process 48211 · new conversation'],
  ['21:31:02', 'input', 'spec/00-project.md + tasks/T5-cart.md · workspace at T4 commit 5b1e9a0'],
  ['21:31:09', 'codex', 'read 14 files'],
  ['21:33:40', 'codex', 'edit src/cart.js (+84 −3)'],
  ['21:35:12', 'codex', 'edit src/inventory.js (+12 −2)'],
  ['21:36:55', 'codex', 'run npm test → 18 passed'],
  ['21:38:20', 'policy', 'allowed · npx serve -l 41021 (inside ports 41020–41029)'],
  ['21:39:02', 'codex', 'open http://localhost:41021 in its own browser context'],
  ['21:40:10', 'codex', 'edit index.html (+22 −1)'],
  ['21:41:47', 'codex', 'run npm test → 21 passed'],
  ['21:42:05', 'codex', 'git commit -m "Add shopping cart" → 8c2d417'],
  ['21:42:06', 'codex', 'reviewing the cart total against the specification…'],
];

const LOG_T4 = [
  ['21:20:15', 'task', 'T4 started · new process 47960 · new conversation'],
  ['21:20:15', 'input', 'spec/00-project.md + tasks/T4-lookup.md · workspace at T3 commit 0d7f3e2'],
  ['21:21:30', 'codex', 'edit src/lookup.js (+61 −0)'],
  ['21:22:40', 'codex', 'run npm install -g serve'],
  ['21:22:40', 'policy', '✗ blocked · global install writes outside the workspace (/usr/local/lib)'],
  ['', '', '  returned to the agent as “permission denied” · no prompt was shown'],
  ['21:22:52', 'codex', 'retry: npx serve -l 41021 (inside the workspace) ✓'],
  ['21:25:31', 'codex', 'run npm test → 15 passed'],
  ['21:26:02', 'codex', 'git commit -m "Add inventory lookup" → 5b1e9a0'],
  ['21:26:03', 'task', 'T4 exit 0 · 1 blocked action recorded · 5:48'],
];

// ---------------------------------------------------------------- RunConfigScreen

export function runConfig(sz, focus = 'tasks', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const rej = !!st.rejected, blk = !!st.blocked;
  header(g, 'AxBenchmark', rej ? (compact ? 'Run 2026-10-01-b · Claude Code' : 'Run 2026-10-01-b · Claude Code · claude-fable-5-1 · high') : (compact ? 'Run 2026-10-01-a · Codex' : 'Run 2026-10-01-a · Codex · gpt-6-sol · medium'));
  g.fill(0, 1, W, 1, 'B1');
  if (rej) { g.text(1, 1, '✗', 'bd'); g.text(3, 1, fit(compact ? 'Stopped at T1 · model rejected · 2 others continue' : 'Stopped at T1 · model rejected · no other model was substituted · the other 2 configurations continue', W - 4), 'bd'); }
  else {
    g.text(1, 1, '●', 'ac');
    g.text(3, 1, fit(compact ? `T5 Shopping cart · 41:12 · config 2 of 4${blk ? ' · 1 blocked' : ''}` : `Running T5 Shopping cart · 41:12 elapsed · configuration 2 of 4${blk ? ' · T4 had 1 blocked action' : ''} · keeps running if you detach`, W - 4));
  }
  g.region(0, 1, W, 1, 'Static', '#run-bar');

  const tasks = rej ? TASKS.map(([id, t], i) => [id, t, i === 0 ? '51020' : '—', i === 0 ? '✗ exit 1' : '○ not run']) : TASKS.map((r) => (blk && r[0] === 'T4' ? [r[0], r[1], r[2], '✓ 0 · 1 blocked'] : r));
  const tf = focus === 'tasks';
  const lw = compact ? W : 50;
  g.box(0, 2, lw, 10, { f: tf ? 'ac' : 'ln', title: 'Tasks · one process each' });
  const cur = rej ? 0 : blk ? 3 : 4;
  table(g, 1, 3, lw - 2, [{ l: '#', w: 4 }, { l: 'Task', w: lw - 2 - 34 }, { l: 'PID', w: 8 }, { l: 'Outcome', w: 22 }].map((c) => (compact ? c : c.l === 'Task' ? { ...c, w: 22 } : c.l === 'PID' ? { ...c, w: 7 } : c.l === 'Outcome' ? { ...c, w: 15 } : c)),
    tasks.map(([id, t, pid, o]) => ({ v: [id, t, pid, { t: o, f: o.startsWith('✗') || o.includes('blocked') ? 'bd' : o.startsWith('●') ? 'ac' : o.startsWith('○') ? 'mu' : '' }] })), { cursor: cur, focused: tf });
  g.region(1, 3, lw - 2, 8, 'DataTable', '#run-tasks');

  const inv = rej ? [
    ['Harness', 'Claude Code 3.4.1', '✓ Claude Code 3.4.1', 'process'],
    ['Provider', 'Anthropic', '✓ Anthropic', 'harness log'],
    ['Model', 'claude-fable-5-1', { t: '✗ none · rejected', f: 'bd' }, 'exit 1'],
    ['Effort', 'high', { t: '— never started', f: 'mu' }, '—'],
    ['Policy', 'clean', '✓ clean', 'managed config'],
    ['Permissions', 'preconfigured', '✓ no prompts', 'headless rules'],
  ] : [
    ['Harness', 'Codex 0.98.0', '✓ Codex 0.98.0', 'process'],
    ['Provider', 'OpenAI', '✓ OpenAI', 'harness log'],
    ['Model', 'gpt-6-sol', '✓ gpt-6-sol', 'harness report'],
    ['Effort', 'medium', { t: '? unverified', f: 'it' }, 'not exposed'],
    ['Policy', 'clean', '✓ clean', 'managed config'],
    ['Permissions', 'preconfigured', '✓ no prompts', 'headless rules'],
  ];

  if (compact) {
    g.box(0, 12, W, 5, { title: 'Invocation · requested → effective', f: focus === 'invocation' ? 'ac' : 'ln' });
    g.region(0, 12, W, 5, 'Static', '#invocation-summary');
    g.text(2, 13, fit(rej ? 'Model claude-fable-5-1 → ✗ rejected · nothing substituted' : 'Model gpt-6-sol → ✓ gpt-6-sol (harness report)', W - 4), rej ? 'bd' : '');
    g.text(2, 14, fit(rej ? 'Effort high → never started' : 'Effort medium → ? unverified (not exposed)', W - 4));
    g.text(2, 15, fit(`clean · ports ${rej ? '41100–41109' : '41020–41029'} · own browser context · own baseline copy`, W - 4), 'mu');
    const ly = 17, lh = H - 1 - ly;
    g.box(0, ly, W, lh, { title: rej ? 'Log · T1 · pid 51020' : blk ? 'Log · T4 · 1 blocked action' : 'Log · T5 · pid 48211', f: focus === 'log' ? 'ac' : 'ln' });
    const lines = rej ? [['21:05:03', 'claude', 'exit 1 · model “claude-fable-5-1” not found for this account']] : blk ? LOG_T4.slice(3, 6) : LOG_T5.slice(-4);
    lines.slice(0, lh - 2).forEach(([t, s, m], i) => { g.text(2, ly + 1 + i, fit(t, 9), 'mu'); g.text(11, ly + 1 + i, fit(s, 7), s === 'policy' ? 'bd' : 'mu'); g.text(18, ly + 1 + i, fit(m, W - 20), m.includes('✗') ? 'bd' : ''); });
    g.region(0, ly, W, lh, 'RichLog', '#log');
    footer(g, [{ k: 'esc', d: 'Run', go: 'RunOverview' }, { k: '/', d: 'Search' }, { k: 'i', d: 'Isolation', go: 'RunIsolation' }, { k: 's', d: 'Stop' }, { k: 'd', d: 'Detach' }]);
    return g;
  }

  kv(g, 1, 12, 14, lw - 2, [
    ['Conversation', 'new for every task · never resumed'],
    ['Task input', 'shared spec + this task’s prompt'],
    ['Carried state', 'workspace files only'],
    ['Checks', 'run outside the workspace (M08)'],
  ]);
  g.region(1, 12, lw - 2, 4, 'Static', '#task-contract.kv');
  const rx = lw, rw = W - lw;
  const vf = focus === 'invocation';
  g.box(rx, 2, rw, 9, { f: vf ? 'ac' : 'ln', title: 'Invocation · requested vs effective' });
  table(g, rx + 1, 3, rw - 2, [{ l: 'Setting', w: 13 }, { l: 'Requested', w: 18 }, { l: 'Effective', w: 21 }, { l: 'Evidence', w: rw - 2 - 52 }], inv.map((v) => ({ v })), { cursor: rej ? 2 : 3, focused: vf });
  g.region(rx + 1, 3, rw - 2, 7, 'DataTable', '#invocation');
  g.box(rx, 11, rw, 10, { f: focus === 'environment' ? 'ac' : 'ln', title: 'Established environment' });
  g.region(rx, 11, rw, 10, 'Static', '#established.kv');
  const slug = rej ? 'claude-fable-high' : 'codex-medium';
  kv(g, rx + 2, 12, 13, rw - 4, [
    ['Baseline', `packaged empty baseline ${s8(SHA.empty)}… · own copy`],
    ['Workspace', `~/.axbenchmark/runs/2026-10-01-${rej ? 'b' : 'a'}/${slug}/ws`],
    ['Ports', `${rej ? '41100–41109' : '41020–41029'} · this configuration only`],
    ['Browser', `own Playwright context · ${slug}`],
    ['Test data', 'own copy, seeded from the baseline'],
    ['Settings', 'managed config dir · personal config not loaded'],
    ['Limitations', 'none recorded'],
    ['Fingerprint', 'not needed in clean mode'],
  ]);

  const ly = 21, lh = H - 2 - ly;
  const lf = focus === 'log';
  g.box(0, ly, W, lh, { f: lf ? 'ac' : 'ln', title: rej ? 'Log · T1 · pid 51020' : blk ? 'Log · T4 · pid 47960 · 1 blocked action' : 'Log · T5 · pid 48211', sub: rej ? 'complete' : 'follows new lines' });
  g.region(0, ly, W, lh, 'RichLog', '#log');
  input(g, 2, ly + 1, 40, blk ? 'blocked' : '', { ph: '/ Search the log', focus: focus === 'search' });
  g.region(2, ly + 1, 40, 1, 'Input', '#log-search');
  if (blk) g.text(44, ly + 1, '1 match · n next', 'mu');
  let y = ly + 2;
  if (rej) {
    y = notice(g, 2, y, W - 6, 'error', 'Model not available · claude-fable-5-1',
      'Claude Code exited 1: model not found for this account. The catalog entry came from your override, and overrides never prove access. No other model was substituted; this configuration stopped and cleaned up, and the other 2 configurations continue.');
    y++;
  }
  const lines = rej ? [
    ['21:05:00', 'task', 'T1 started · new process 51020 · new conversation'],
    ['21:05:03', 'claude', 'exit 1 · error: model “claude-fable-5-1” not found for this account'],
    ['21:05:03', 'run', 'configuration stopped · process tree ended · no services were running'],
  ] : blk ? LOG_T4 : (st.log ?? LOG_T5);
  const vis = ly + lh - 1 - y;
  lines.slice(-vis).forEach(([t, s, m], i) => {
    const hit = m.includes('✗ blocked');
    if (hit) g.fill(1, y + i, W - 3, 1, 'BT');
    g.text(2, y + i, fit(t, 10), 'mu', hit ? { b: 'BT' } : {});
    g.text(12, y + i, fit(s, 8), s === 'policy' || s === 'task' ? 'bd' : 'mu', hit ? { b: 'BT' } : {});
    g.text(20, y + i, fit(m, W - 23), hit ? 'bd' : '', hit ? { b: 'BT' } : {});
  });
  if (!rej) scrollbar(g, W - 2, ly + 2, lh - 3, lh - 6, 3);
  footer(g, [{ k: 'esc', d: 'Run overview', go: 'RunOverview' }, { k: '/', d: 'Search' }, { k: 'i', d: 'Isolation', go: 'RunIsolation' }, { k: 'v', d: 'Live view', go: 'HarnessLive', off: rej }, { k: 's', d: 'Stop configuration', off: rej }, { k: 'd', d: 'Detach' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- policy, blocked clean mode and isolation dialogs

export function envPolicy(sz, focus = 'clean') {
  const g = setup(sz, 'none');
  const m = modal(g, 86, 27, 'Environment policy', { sel: '#env-policy' });
  let y = m.y;
  g.text(m.x, y++, fit('Four harnesses · defaults · 4 entries · Inventory web app r1', m.w), 'bd');
  y++;
  const cf = focus === 'clean', uf = focus === 'current';
  g.text(m.x, y, fit('● Clean · default', 30), 'bd', cf ? { b: 'BT' } : {});
  y = para(g, m.x + 2, y + 1, m.w - 2, 'Keeps authentication and provider access. Personal instructions, memories, plugins, hooks and MCP servers are disabled through each harness’s supported controls. Native tools stay on.', 'mu');
  y++;
  g.text(m.x, y, fit('○ Current', 30), uf ? 'bd' : 'mu', uf ? { b: 'BT' } : {});
  y = para(g, m.x + 2, y + 1, m.w - 2, 'Uses your existing harness setup; benchmark model and effort still take precedence. A sanitized fingerprint of the relevant settings is recorded, never credentials.', 'mu');
  g.region(m.x, m.y + 2, m.w, y - m.y - 2, 'RadioSet', '#policy');
  y++;
  g.text(m.x, y++, 'What clean mode disables on this machine', 'bd');
  table(g, m.x, y, m.w, [{ l: 'Harness', w: 14 }, { l: 'Instr', w: 8 }, { l: 'Memory', w: 8 }, { l: 'Plugins', w: 9 }, { l: 'Hooks', w: 7 }, { l: 'MCP', w: 6 }, { l: 'Result', w: m.w - 52 }], [
    { v: ['Claude Code', '✓', '✓', '✓', '✓', '✓', '✓ clean'] },
    { v: ['Codex', '✓', '✓', { t: '○', f: 'mu' }, '✓', '✓', '✓ clean'] },
    { v: ['Grok CLI', '✓', '✓', { t: '○', f: 'mu' }, { t: '○', f: 'mu' }, '✓', '✓ clean'] },
    { v: ['Pi', '✓', '✓', '✓', { t: '○', f: 'mu' }, { t: '○', f: 'mu' }, '✓ clean'] },
  ], { cursor: focus === 'matrix' ? 0 : -1, focused: focus === 'matrix' });
  g.region(m.x, y, m.w, 5, 'DataTable', '#clean-matrix');
  y += 5;
  g.text(m.x, y++, fit('✓ disabled · ○ the harness has none · ✗ cannot be disabled', m.w), 'mu');
  y++;
  para(g, m.x, y, m.w, 'Managed settings and any isolation limits are recorded with every result. No native capability is blocked to even out the comparison.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Setup' }, { label: 'Save policy', v: 'primary', go: 'Setup', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Save', go: 'Setup' }], '');
  return g;
}

export function cleanBlocked(sz, focus = 'choice') {
  const g = setup(sz, 'none');
  const compact = sz.id === 'compact';
  const m = modal(g, compact ? 78 : 84, 19, 'Before launch · clean mode', { sel: '#clean-blocked' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'Clean mode cannot be established for Grok CLI 1.9.2', null);
  y++;
  y = kv(g, m.x, y, 11, m.w, [
    ['Cause', 'no supported control disables user MCP servers'],
    ['Found', '~/.grok/settings.json · 2 MCP servers configured'],
    ['Isolated', 'instructions ✓ · memory ✓ · plugins and hooks: none'],
  ]);
  g.region(m.x, m.y + 2, m.w, 3, 'Static', '#clean-cause.kv');
  y++;
  y = para(g, m.x, y, m.w, 'AxBenchmark never falls back to current mode silently and never labels partial isolation as clean. Choose how to continue:', 'mu');
  y++;
  const cf = focus === 'choice';
  g.text(m.x, y++, fit('● Remove Grok CLI from this launch', m.w), cf ? 'bd' : '', cf ? { b: 'BT' } : {});
  g.text(m.x, y++, fit('○ Use Current for Grok CLI only · recorded as current, with a fingerprint', m.w), 'mu');
  g.text(m.x, y++, fit('○ Cancel the launch', m.w), 'mu');
  g.region(m.x, y - 3, m.w, 3, 'RadioSet', '#clean-choice');
  buttons(g, m.right, m.bottom, [{ label: 'Back', go: 'Setup' }, { label: 'Continue', v: 'primary', go: 'LaunchCheck', focus: focus === 'continue' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'enter', d: 'Continue', go: 'LaunchCheck' }], '');
  return g;
}

export function runIsolation(sz) {
  const g = runConfig(sz, 'none');
  const m = modal(g, 86, 21, 'Isolation · run 2026-10-01-a', { sel: '#isolation' });
  let y = m.y;
  g.text(m.x, y++, fit('4 configurations · one per harness · up to 4 at once · 3 running, 1 complete', m.w), 'bd');
  y++;
  const base = `${s8(SHA.empty)} ✓`;
  table(g, m.x, y, m.w, [{ l: 'Harness', w: 13 }, { l: 'Workspace', w: 20 }, { l: 'Ports', w: 13 }, { l: 'Browser', w: 12 }, { l: 'Test data', w: 11 }, { l: 'Baseline', w: m.w - 69 }], [
    { v: ['Claude Code', '…/claude-code/ws', '41000–41009', 'ctx-claude', 'own copy', base] },
    { v: ['Codex', '…/codex-medium/ws', '41020–41029', 'ctx-codex', 'own copy', base] },
    { v: ['Grok CLI', '…/grok-fast/ws', '41040–41049', 'ctx-grok', 'own copy', base] },
    { v: ['Pi', '…/pi-qwen/ws', '41060–41069', 'ctx-pi', 'own copy', base] },
  ], { cursor: 1, focused: true });
  g.region(m.x, y, m.w, 5, 'DataTable', '#isolation-table');
  y += 6;
  y = para(g, m.x, y, m.w, 'Every configuration starts from its own copy of the same packaged baseline. Ports, test data and browser contexts are never shared, also between two configurations of one harness and in sequential runs.', 'mu');
  y++;
  kv(g, m.x, y, 14, m.w, [['Permissions', 'preconfigured before launch · no prompt can appear'], ['Blocked', '1 action so far · Codex T4 · returned as an explicit outcome']]);
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close' }, { k: 'enter', d: 'Open configuration' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

const MINI = { w: 56, h: 8 };
import { Grid as G2, loading } from './lib.mjs';
const mini = (title, body) => { const g = new G2(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const EXECUTION_WIDGET_STATES = [
  { widget: 'RichLog#log', label: 'M05 · Task log', states: [
    ['Loading', mini('Log · T5', (g, x, y, w) => loading(g, x, y + 1, w, 'Attaching to process 48211…'))],
    ['Empty', mini('Log · T6', (g, x, y, w) => { centered(g, y + 1, 'T6 has not started', 'bd'); centered(g, y + 2, 'It runs after T5 in a new process.', 'mu'); })],
    ['Error', mini('Log · T5', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Log stream interrupted', 'The process is still running; the log file is intact. Reattaching from the last line…'); })],
  ] },
];
