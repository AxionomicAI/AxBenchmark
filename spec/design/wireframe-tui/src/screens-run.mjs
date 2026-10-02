// M11 · Run scheduling and persistent lifecycle.
// RunScreen is the run overview: one lane per harness (2×2), the active configuration of each lane and its queue,
// task progress, and an event log. RunConfigScreen (M05) is the per-configuration detail opened from a lane.
// Detaching, reconnecting and stopping are separate actions. All data is fictional.
import { Grid, fit, len, header, footer, table, buttons, para, kv, notice, toast, modal, progress, radios } from './lib.mjs';
import { SHA, s8, step } from './screens.mjs';

// ---------------------------------------------------------------- data

const T = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const NAMES = { T1: 'Repository and scaffold', T2: 'Inventory data and persistence', T3: 'Inventory management', T4: 'Inventory lookup', T5: 'Shopping cart', T6: 'Checkout', T7: 'Test and fix' };

// Lane: harness, active configuration and its queue. tasks: one glyph per task (✓ done · ✗ failed · ● running · ○ not started · – not run).
const L = (harness, d) => ({ harness, ...d });

const RUNS = {
  // Default scheduling, one configuration per harness, 4 at once. Matches RunConfig, RunIsolation and LaunchRecord.
  live: {
    id: '2026-10-01-a', bar: '● 3 of 4 running · 1 complete · one configuration per harness, up to 4 at once (jobs 4) · tasks sequential',
    lanes: [
      L('Claude Code', { cfg: 'claude-opus-5-5 · medium', state: 'done', tasks: '✓✓✓✓✓✓✓', now: 'complete 21:35:37 · final regression 21✓', elapsed: '36:50', cost: '$4.61 · API-equivalent estimate', go: 'RunConfig' }),
      L('Codex', { cfg: 'gpt-6-sol · medium', state: 'run', tasks: '✓✓✓✓●○○', now: 'T5 Shopping cart · 10:58 in this task', elapsed: '41:12', cost: '$1.92 · reported · T1–T4', go: 'RunConfig' }),
      L('Grok CLI', { cfg: 'grok-4.7-fast · harness default', state: 'run', tasks: '✓✓✓●○○○', now: 'T4 Inventory lookup · 0:22 in this task', elapsed: '24:57', cost: '$0.41 · estimate · T1–T3', go: 'RunConfig' }),
      L('Pi', { cfg: 'qwen3.5-35b-a3b · harness default', state: 'run', tasks: '✓✓●○○○○', now: 'T3 Inventory management · 14:05 in this task', elapsed: '39:31', cost: '$0.00 · local endpoint, no charge', go: 'RunConfig' }),
    ],
    events: [
      ['20:58:47', 'run', 'frozen · template 3f9c2e71… · configuration and original weights · 4 configurations start together'],
      ['21:35:37', 'claude', 'T7 exit 0 · 7 of 7 tasks · final regression started on a disposable copy'],
      ['21:35:59', 'verify', 'Claude Code final regression 21✓ · evidence saved · waiting for judging after the run'],
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
      L('Pi', { cfg: '#5 qwen3.5-35b-a3b · harness default', state: 'run', tasks: '✓●○○○○○', now: 'T2 Inventory data and persistence · 11:15', elapsed: '18:52', cost: '$0.00 · local endpoint, no charge' }),
    ],
    events: [
      ['09:12:05', 'run', 'frozen · 5 entries · 4 lanes · #2 queued behind #1 (same harness)'],
      ['09:12:06', 'run', 'started #1 Claude Code · #3 Codex · #4 Grok CLI · #5 Pi'],
      ['09:21:40', 'grok', 'T1 exit 0 · checks 2✓ · T2 started in a new process'],
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
  // Ordinary failure, timeout, authentication failure and a harness-internal retry, all recorded as they happened.
  fail: {
    id: '2026-09-30-b', bar: '● 2 of 4 running · 1 halted · 1 complete · failures are recorded as they happened · nothing is rerun',
    lanes: [
      L('Claude Code', { cfg: 'claude-opus-5-5 · medium', state: 'halt', tasks: '✓✓✗–––', now: '✗ halted at T3 · authentication failed (401)', elapsed: '22:46', cost: '$1.52 · estimate · T3 partial', note: 'T4–T7 not run · the other configurations continue' }),
      L('Codex', { cfg: 'gpt-6-sol · medium', state: 'run', tasks: '✓✓✓✗●○○', now: 'T5 Shopping cart · from the T4 workspace', elapsed: '3:41:09', cost: '$5.88 · reported · T1–T4', note: 'T4 ✗ timeout 3:00:00 · no rerun · T5 continues' }),
      L('Grok CLI', { cfg: 'grok-4.7-fast · harness default', state: 'run', tasks: '✓✓✓✓✓●○', now: 'T6 Checkout · 7:02 in this task', elapsed: '46:20', cost: '$0.66 · estimate · T1–T5', note: 'T2: 2 harness-internal retries · recorded' }),
      L('Pi', { cfg: 'qwen3.5-35b-a3b · harness default', state: 'done', tasks: '✓✓✓✓✓✗✓', now: 'complete · T6 exit 1 · T7 used the T6 workspace', elapsed: '1:34:02', cost: '$0.00 · local endpoint, no charge' }),
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
  ]);
  if (d.note) g.text(ix, yy, fit(d.note, iw), 'mu');
  if (d.go) g.link(x, y, w, 1, 'go:' + d.go);
}

// ---------------------------------------------------------------- RunScreen

export function runOverview(sz, focus = 'lane1', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const run = RUNS[st.run ?? 'live'];
  header(g, 'AxBenchmark', compact ? `Run ${run.id}` : `Run ${run.id} · Inventory web app r1`);
  g.fill(0, 1, W, 1, 'B1');
  if (st.reattached) {
    g.text(1, 1, '●', 'ac');
    g.text(3, 1, fit(compact ? 'Reattached · nothing was restarted · 3 of 4 running' : 'Reattached 21:52:08 · detached 21:44:30–21:52:08 · the run kept going and nothing was restarted · 3 of 4 running', W - 4));
  } else g.text(1, 1, fit(compact ? run.bar.replace(' · one configuration per harness, up to 4 at once (jobs 4)', ' · jobs 4').replace(' · sequential (jobs 1) · one configuration at a time, entry order', ' · jobs 1').replace(' · tasks sequential', '') : run.bar, W - 2), run.id === '2026-09-30-b' ? 'bd' : '');
  g.region(0, 1, W, 1, 'Static', '#run-bar');

  if (compact) {
    const tf = focus.startsWith('lane');
    g.box(0, 2, W, 8, { f: tf ? 'ac' : 'ln', title: 'Configurations · one lane per harness' });
    table(g, 1, 3, W - 2, [{ l: 'Harness', w: 12 }, { l: 'Tasks', w: 10 }, { l: 'Now', w: W - 2 - 30 }, { l: 'Elapsed', w: 8, al: 'right' }],
      run.lanes.map((d) => ({ v: [d.harness, d.tasks, { t: `${STATE[d.state][0]} ${d.now}`, f: d.state === 'halt' ? 'bd' : d.state === 'wait' ? 'mu' : '' }, d.elapsed], go: 'RunConfig' })), { cursor: 1, focused: tf });
    g.region(1, 3, W - 2, 5, 'DataTable', '#lanes');
    g.text(1, 10, fit(st.run === 'queued' ? 'Queued: #2 Claude Code · high · after #1' : 'Frozen · prompts, models and weights cannot change', W - 2), 'mu');
    const ef = focus === 'events';
    g.box(0, 11, W, H - 12, { f: ef ? 'ac' : 'ln', title: 'Events', sub: 'follows new lines' });
    g.region(0, 11, W, H - 12, 'RichLog', '#events');
    run.events.slice(-(H - 14)).forEach(([t, s, m], i) => { g.text(2, 12 + i, fit(t, 9), 'mu'); g.text(11, 12 + i, fit(s, 7), 'mu'); g.text(18, 12 + i, fit(m, W - 20), m.startsWith('✗') ? 'bd' : ''); });
    if (st.reattached) toast(g, '✓ Reattached', 'Observing 2026-10-01-a. No task was restarted.', 40);
    footer(g, [{ k: 'enter', d: 'Open', go: 'RunConfig' }, { k: 's', d: 'Stop', go: 'StopConfirm' }, { k: 'd', d: 'Detach', go: 'RunDetach' }, { k: 'e', d: 'Edit', off: true, go: 'ActiveLocked' }]);
    return g;
  }

  g.text(1, 2, '■', 'ac');
  g.text(3, 2, fit(`Frozen at launch · template ${s8(SHA.inv1)}… · configuration ${s8(SHA.cfg)}… · original weights · none of them can change while running`, W - 4), 'mu');
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
  footer(g, [{ k: 'enter', d: 'Open configuration', go: 'RunConfig' }, { k: 's', d: 'Stop configuration', go: 'StopConfirm' }, { k: 'S', d: 'Stop run', go: 'StopConfirm' }, { k: 'd', d: 'Detach', go: 'RunDetach' }, { k: 'e', d: 'Edit', off: true, go: 'ActiveLocked' }, { k: 'tab', d: 'Lane', do: 'next' }]);
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
    ['Command line', 'axbenchmark --attach 2026-10-01-a'],
    ['Status only', 'axbenchmark status 2026-10-01-a'],
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
  g.text(m.x, y++, 'Cleaned up before the stop is reported', 'bd');
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
  para(g, m.x, y, m.w, 'Stopping is never retried or resumed automatically. Detaching is a different action and stops nothing.', 'mu');
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
  para(g, m.x, y, m.w, 'Measurements up to the stop are kept as partial. The other three configurations are not affected.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Hide', v: 'primary', go: 'RunOverview', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Hide · cleanup continues', go: 'RunOverview' }], '');
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
  para(g, m.x, y, m.w, 'If a template file changes on disk during the run, its results lose their claim to r1 and are never given another identity.', 'mu');
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
