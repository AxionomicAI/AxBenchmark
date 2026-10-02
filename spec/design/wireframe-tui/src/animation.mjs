// Animated walkthrough: the preloaded inventory benchmark from the shell prompt to the opened HTML report.
// Every terminal frame is drawn by the same screen functions as the wireframes; this file only sequences them,
// adds the in-between states (typing, freezing, run progress, judging, report writing) and writes ../animation.html.
// Run: node src/animation.mjs
import { writeFileSync } from 'node:fs';
import { SIZES, CELL, ACCENT, Grid, fit, len, footer, table, buttons, para, kv, modal, progress, toast, esc } from './lib.mjs';
import { CSS, FONT_LINK } from './theme.mjs';
import { SHA, s8, step, library } from './screens.mjs';
import { setup, reviewLaunch } from './screens-setup.mjs';
import { runOverview, harnessLive } from './screens-run.mjs';
import { runConfig, runIsolation } from './screens-execution.mjs';
import { verifyProgress } from './screens-verify.mjs';
import { judging } from './screens-judging.mjs';
import { results } from './screens-results.mjs';
import { reportGenerate, reportPage, REPORT_CSS } from './screens-report.mjs';
import { RESULTS } from './results-data.mjs';

const SZ = SIZES.wide;
const FILE = '~/.axbenchmark/reports/inventory-web-app-r1-3f9c2e71-2026-10-01.html';

// ---------------------------------------------------------------- frame list

const scenes = [];
const frames = [];
const scene = (title, mod, cap) => scenes.push({ title, mod, cap, at: frames.length });
// g: Grid · d: ms on screen · k: key pressed at the end of the frame (shown as a chip)
const show = (g, d, k) => frames.push({ t: 'g', g, d, k });
const page = (a, d) => frames.push({ t: 'b', a, d });

// ---------------------------------------------------------------- 1 · shell

const PROMPT = [['mike@mike-mbp-m4', 'bd'], [' ~/bench', 'ac'], [' % ', 'mu']];
function shell(typed, out = [], cursor = true) {
  const g = new Grid(SZ.cols, SZ.rows);
  g.text(0, 0, 'Last login: Thu Oct  1 20:52:11 on ttys004', 'mu');
  let x = 0;
  for (const [t, f] of PROMPT) x = g.text(x, 2, t, f);
  x = g.text(x, 2, typed);
  if (cursor) g.text(x, 2, ' ', 'rv');
  out.forEach(([t, f], i) => g.text(0, 3 + i, t, f));
  return g;
}

scene('Start from the console', 'M14 · M15', 'Type axbenchmark in any shell. The Textual app opens full screen on the template library; nothing is installed and no model is called.');
show(shell(''), 900);
const CMD = 'axbenchmark';
for (let i = 1; i <= CMD.length; i++) show(shell(CMD.slice(0, i)), i === CMD.length ? 700 : 85 + (i % 3) * 25, i === CMD.length ? 'enter' : undefined);
show(shell(CMD, [['AxBenchmark 0.1.0 · Textual 3.2 · Python 3.13', 'mu'], ['Checking harness readiness in the background…', 'mu']], false), 550);
show(library(SZ, 'none', { loading: true }), 650);

// ---------------------------------------------------------------- 2 · library

scene('Pick the preloaded benchmark', 'M01 · M09', 'The built-in seven-task Inventory web app r1 is the default selection. Its SHA-256 pins the exact tasks, 30 acceptance checks and rubric; no planner call is needed.');
show(library(SZ, 'templates'), 2600, 'tab');
show(library(SZ, 'detail'), 1900, 'enter');

// ---------------------------------------------------------------- 3 · setup

scene('Configure the run', 'M07 · M04 · M06', 'Five competitor entries across four harnesses, an independent judge and the scoring weights that will be frozen. Tab moves between panes.');
show(setup(SZ, 'entries'), 2600, 'tab');
show(setup(SZ, 'judge'), 1300, 'tab');
show(setup(SZ, 'weights'), 1300, 'tab');
show(setup(SZ, 'execution'), 1300, 'tab');
show(setup(SZ, 'review'), 1100, 'enter');

scene('Review before launch', 'M07', 'What is shown is exactly what will be frozen: template identity, every entry, judge, rubric, both weight sets and the machine record. Nothing runs until Launch.');
show(reviewLaunch(SZ, 'launch'), 3400, '^l');

// ---------------------------------------------------------------- 4 · freeze

const FREEZE = [
  'Recompute the template SHA-256 and compare with approved r1',
  `Freeze the run configuration separately · cfg ${s8(SHA.cfg)} · 5 entries`,
  'Freeze the original weights · quality web v1 · ranking 1:1:1',
  'Freeze the price and rate snapshots · display USD · catalog 2026-10-01',
  `Bind every result of this run to ${s8(SHA.inv1)}`,
  'Start 4 lanes · Claude Code #2 waits behind #1',
];
function freeze(done, pct) {
  const g = reviewLaunch(SZ, 'none');
  const m = modal(g, 86, 20, 'Before launch · freeze inputs', { sel: '#launch-check' });
  let y = kv(g, m.x, m.y, 12, m.w, [['Template', 'Inventory web app · r1 · ★ built-in'], ['Run config', 'Four harnesses · defaults · 5 entries · 4 lanes']]);
  y++;
  FREEZE.forEach((t, i) => {
    step(g, m.x, y++, m.w, i < done ? 'done' : i === done ? 'now' : 'todo', t);
    if (i === 0 && done > 0) g.text(m.x + 2, y++, fit(SHA.inv1, m.w - 2), 'mu');
    if (i === done) progress(g, m.x + 2, y++, m.w - 2, pct);
  });
  y++;
  para(g, m.x, y, m.w, 'Every configuration receives the same frozen task suite and grading profile. Prompts, models and original weights cannot change once the run starts.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', focus: done < FREEZE.length }, { label: 'Launch', v: 'primary', off: true }]);
  footer(g, [{ k: 'esc', d: 'Cancel' }], '');
  return g;
}
scene('Freeze the inputs', 'M01 · M07', 'The template hash is recomputed and must match r1. Configuration, original weights, prices and exchange rates are frozen as separate records, and every result is bound to this identity.');
[[0, 30], [0, 85], [1, 50], [2, 40], [3, 50], [4, 70], [5, 60]].forEach(([d, p]) => show(freeze(d, p), 520));
show(freeze(5, 100), 700);

// ---------------------------------------------------------------- 5 · run (time-lapse)

const NAMES = { T1: 'Repository and scaffold', T2: 'Inventory data and persistence', T3: 'Inventory management', T4: 'Inventory lookup', T5: 'Shopping cart', T6: 'Checkout', T7: 'Test and fix' };
const now = (tasks, t) => { const i = [...tasks].indexOf('●'); return `T${i + 1} ${NAMES[`T${i + 1}`]} · ${t} in this task`; };
const lane = (harness, cfg, tasks, nowText, elapsed, cost, o = {}) => ({
  harness, cfg, tasks, elapsed, cost,
  state: tasks.includes('●') ? 'run' : /^[✓✗]{7}$/.test(tasks) ? 'done' : 'wait',
  now: tasks.includes('●') && !nowText.startsWith('T') ? now(tasks, nowText) : nowText,
  ...o,
});
const Q2 = '#2 claude-opus-5-5 · high · starts when #1 ends';
const C1 = '#1 claude-opus-5-5 · medium', C2 = '#2 claude-opus-5-5 · high', CX = '#3 gpt-6-sol · medium', GK = '#4 grok-4.7-fast · harness default', PI = '#5 qwen3.5-35b-a3b · harness default';
const LOCAL = 'unknown · local endpoint, parallel run'; // D4: shared energy is never divided

const events = [];
const K = [
  { ev: [['20:58:47', 'run', `frozen · template ${s8(SHA.inv1)}… · configuration and original weights · 5 entries · 4 lanes`], ['20:58:48', 'run', 'started #1 Claude Code · #3 Codex · #4 Grok CLI · #5 Pi · #2 waits behind #1']],
    lanes: [lane('Claude Code', C1, '●○○○○○○', '0:05', '0:05', '? usage pending · estimate unavailable', { queue: Q2 }), lane('Codex', CX, '●○○○○○○', '0:05', '0:05', '— · reported after each task'), lane('Grok CLI', GK, '●○○○○○○', '0:05', '0:05', '$0.00 · estimate'), lane('Pi', PI, '●○○○○○○', '0:05', '0:05', LOCAL)] },
  { ev: [['21:04:49', 'claude', 'T1 exit 0 · checks 6✓ · T2 started in a new process'], ['21:06:20', 'grok', 'T1 exit 0 · checks 6✓ · T2 started in a new process']],
    lanes: [lane('Claude Code', C1, '✓●○○○○○', '2:41', '8:43', '$0.62 · API-equivalent estimate', { queue: Q2 }), lane('Codex', CX, '●○○○○○○', '8:42', '8:42', '— · reported after each task'), lane('Grok CLI', GK, '✓●○○○○○', '1:10', '8:43', '$0.09 · estimate · T1'), lane('Pi', PI, '●○○○○○○', '8:43', '8:43', LOCAL)] },
  { ev: [['21:09:55', 'codex', 'T1 exit 0 · checks 6✓ · T2 started in a new process'], ['21:11:12', 'pi', 'T1 exit 0 · checks 6✓ · T2 uses the T1 workspace commit 41d0e2a'], ['21:13:08', 'claude', 'T2 exit 0 · checks 4✓ · T3 started in a new process'], ['21:15:22', 'grok', 'T2 exit 0 · checks 4✓ · T3 started in a new process']],
    lanes: [lane('Claude Code', C1, '✓✓●○○○○', '3:02', '17:23', '$1.31 · API-equivalent estimate', { queue: Q2 }), lane('Codex', CX, '✓●○○○○○', '6:15', '17:20', '$0.41 · reported · T1'), lane('Grok CLI', GK, '✓✓●○○○○', '0:48', '17:21', '$0.21 · estimate · T1–T2'), lane('Pi', PI, '✓●○○○○○', '4:58', '17:23', LOCAL)] },
  { ev: [['21:19:40', 'claude', 'T3 exit 0 · checks 5✓ · T4 started in a new process'], ['21:20:15', 'codex', 'T3 exit 0 · checks 5✓ · T4 started in a new process'], ['21:21:58', 'pi', 'T2 exit 0 · checks 4✓ · T3 started in a new process'], ['21:22:40', 'codex', '✗ policy blocked npm install -g serve · returned to the agent as permission denied'], ['21:24:30', 'claude', 'T4 exit 0 · checks 2✓ · T5 started in a new process'], ['21:26:03', 'codex', 'T4 exit 0 · verification started on a disposable copy']],
    lanes: [lane('Claude Code', C1, '✓✓✓✓●○○', '1:40', '27:23', '$2.37 · API-equivalent estimate', { queue: Q2 }), lane('Codex', CX, '✓✓✓●○○○', 'T4 exit 0 · verifying 2 checks on a disposable copy', '27:16', '$1.38 · reported · T1–T3'), lane('Grok CLI', GK, '✓✓✓●○○○', '3:30', '27:02', '$0.38 · estimate · T1–T3'), lane('Pi', PI, '✓✓●○○○○', '4:12', '27:21', LOCAL)] },
  { ev: [['21:28:51', 'verify', 'Codex T4 checks 2✓ · desktop and mobile screenshots saved'], ['21:31:02', 'codex', 'T5 started · new process 48211 · workspace at T4 commit 5b1e9a0'], ['21:36:04', 'grok', 'T4 exit 0 · checks 2✓ · T5 started in a new process'], ['21:37:58', 'claude', 'T5 exit 0 · checks 6✓ · T6 started in a new process'], ['21:40:02', 'pi', 'T3 harness retried 1 request (HTTP 429) · recorded as a harness-internal retry']],
    lanes: [lane('Claude Code', C1, '✓✓✓✓✓●○', '4:15', '43:20', '$3.52 · API-equivalent estimate', { queue: Q2 }), lane('Codex', CX, '✓✓✓✓●○○', '10:58', '41:12', '$1.92 · reported · T1–T4'), lane('Grok CLI', GK, '✓✓✓✓●○○', '6:02', '41:50', '$0.55 · estimate · T1–T4'), lane('Pi', PI, '✓✓●○○○○', '20:12', '42:58', LOCAL)] },
  { ev: [['21:46:31', 'codex', 'T5 exit 0 · checks 6✓ · T6 started in a new process'], ['21:48:20', 'grok', 'T5 exit 0 · checks 6✓ · T6 started in a new process'], ['21:49:01', 'claude', '#1 T7 exit 0 · 7 of 7 tasks · final regression started on a disposable copy'], ['21:50:12', 'verify', 'Claude Code #1 final regression 30✓ · evidence saved · waits for judging']],
    lanes: [lane('Claude Code', C1, '✓✓✓✓✓✓✓', 'complete 21:50:12 · final regression 30✓', '49:30', '$4.61 · API-equivalent estimate', { queue: '#2 claude-opus-5-5 · high · starts now', }), lane('Codex', CX, '✓✓✓✓✓●○', '3:20', '50:05', '$2.61 · reported · T1–T5'), lane('Grok CLI', GK, '✓✓✓✓✓●○', '1:44', '50:02', '$0.71 · estimate · T1–T5'), lane('Pi', PI, '✓✓✓●○○○', '5:01', '51:40', LOCAL)] },
  { ev: [['21:50:13', 'run', '#2 Claude Code · high starts in lane 1 from its own baseline copy']],
    lanes: [lane('Claude Code', C2, '●○○○○○○', '0:01', '0:01', '? usage pending · estimate unavailable', { note: '#1 complete · 7 of 7 tasks · final regression 30✓ · $4.61' }), lane('Codex', CX, '✓✓✓✓✓●○', '3:21', '50:06', '$2.61 · reported · T1–T5'), lane('Grok CLI', GK, '✓✓✓✓✓●○', '1:45', '50:03', '$0.71 · estimate · T1–T5'), lane('Pi', PI, '✓✓✓●○○○', '5:02', '51:41', LOCAL)] },
  { ev: [['21:55:10', 'codex', 'T6 exit 0 · checks 4✓ · T7 started in a new process'], ['21:57:02', 'pi', 'T4 exit 0 · checks 2✓ · T5 started in a new process'], ['22:01:47', 'grok', '✗ T6_history failed at final regression · 29✓ 1✗ · recorded as is, nothing repaired'], ['22:04:18', 'claude', '#2 T2 exit 0 · checks 4✓ · T3 started in a new process']],
    lanes: [lane('Claude Code', C2, '✓✓●○○○○', '1:42', '15:20', '$1.41 · API-equivalent estimate', { note: '#1 complete · 7 of 7 tasks · final regression 30✓ · $4.61' }), lane('Codex', CX, '✓✓✓✓✓✓●', '10:50', '1:04:40', '$3.05 · reported · T1–T6'), lane('Grok CLI', GK, '✓✓✓✓✓✓✓', 'complete 22:01:47 · final regression 29✓ 1✗', '58:31', '$0.92 · estimate'), lane('Pi', PI, '✓✓✓✓●○○', '8:58', '1:06:10', LOCAL)] },
  { ev: [['22:11:20', 'codex', 'T7 exit 0 · final regression 30✓ · evidence saved'], ['22:12:44', 'pi', 'T5 exit 0 · checks 4✓ 2✗ · T6 starts from the T5 workspace as it is'], ['22:17:50', 'pi', 'T6 exit 0 · checks 3✓ 1✗ · T7 started in a new process'], ['22:19:02', 'claude', '#2 T4 exit 0 · checks 2✓ · T5 started in a new process']],
    lanes: [lane('Claude Code', C2, '✓✓✓✓●○○', '1:28', '29:50', '$2.66 · API-equivalent estimate', { note: '#1 complete · 7 of 7 tasks · final regression 30✓ · $4.61' }), lane('Codex', CX, '✓✓✓✓✓✓✓', 'complete 22:11:20 · final regression 30✓', '1:12:33', '$3.40 · reported'), lane('Grok CLI', GK, '✓✓✓✓✓✓✓', 'complete 22:01:47 · final regression 29✓ 1✗', '58:31', '$0.92 · estimate'), lane('Pi', PI, '✓✓✓✓✓✓●', '2:40', '1:20:40', LOCAL)] },
  { ev: [['22:27:31', 'pi', '✗ final regression 27✓ 3✗ · T4_lookup, T5_remove, T6_history failed · recorded as is'], ['22:29:15', 'claude', '#2 T6 exit 0 · checks 4✓ · T7 started in a new process']],
    lanes: [lane('Claude Code', C2, '✓✓✓✓✓✓●', '4:58', '43:20', '$4.12 · API-equivalent estimate', { note: '#1 complete · 7 of 7 tasks · final regression 30✓ · $4.61' }), lane('Codex', CX, '✓✓✓✓✓✓✓', 'complete 22:11:20 · final regression 30✓', '1:12:33', '$3.40 · reported'), lane('Grok CLI', GK, '✓✓✓✓✓✓✓', 'complete 22:01:47 · final regression 29✓ 1✗', '58:31', '$0.92 · estimate'), lane('Pi', PI, '✓✓✓✓✓✓✓', 'complete 22:27:31 · final regression 27✓ 3✗', '1:28:44', LOCAL)] },
  { ev: [['22:39:40', 'claude', '#2 T7 exit 0 · final regression 30✓ · evidence saved'], ['22:39:41', 'run', 'all 5 configurations ended · 1:40:54 clock time · judging starts next']],
    lanes: [lane('Claude Code', C2, '✓✓✓✓✓✓✓', 'complete 22:39:40 · final regression 30✓', '48:53', '$5.38 · API-equivalent estimate', { note: '#1 complete · 7 of 7 tasks · final regression 30✓ · $4.61' }), lane('Codex', CX, '✓✓✓✓✓✓✓', 'complete 22:11:20 · final regression 30✓', '1:12:33', '$3.40 · reported'), lane('Grok CLI', GK, '✓✓✓✓✓✓✓', 'complete 22:01:47 · final regression 29✓ 1✗', '58:31', '$0.92 · estimate'), lane('Pi', PI, '✓✓✓✓✓✓✓', 'complete 22:27:31 · final regression 27✓ 3✗', '1:28:44', LOCAL)], end: true },
];
const TAIL = ' · one configuration per harness, up to 4 at once (jobs 4) · tasks sequential';
// Live line of a running lane: output tok/s and context of the current task process (the M11 live view in brief).
// Codex at K[4] matches the HarnessLive frame exactly: 46.3 tok/s, 84.2k of 272k.
function liveLine(harness, ki) {
  const j = (ki * 5) % 7 - 3;
  if (harness === 'Codex') return ki === 4 ? '46.3 tok/s · context 84.2k of 272k · 31%' : `${(44 + j * 1.3).toFixed(1)} tok/s · context ${30 + ki * 3 + j}%`;
  if (harness === 'Grok CLI') return `${110 + j * 4} tok/s · context ? not reported`;
  if (harness === 'Pi') return `${(29.4 + j * 0.6).toFixed(1)} tok/s · context ${(14 + ki * 1.2).toFixed(1)}k of 32k`;
  return `${(38 + j * 1.1).toFixed(1)} tok/s · context ${40 + ki * 4 + j}%`;
}
// again: redraw the same moment (returning from a detail screen) without logging its events twice
function runFrame(k, focus = 'lane0', again = false) {
  if (!again) events.push(...k.ev);
  const running = k.lanes.filter((l) => l.state === 'run').length;
  const queued = k.lanes[0].queue && k.lanes[0].queue.startsWith('#2') ? 1 : 0;
  const complete = 5 - running - queued;
  const bar = k.end ? '✓ 5 of 5 configurations ended · 1:40:54 clock time · judging starts next' : `● ${running} of 5 running · ${queued ? '1 queued · ' : ''}${complete} complete${TAIL}`;
  const ki = K.indexOf(k);
  const lanes = k.lanes.map((l) => (l.state === 'run' && !l.live ? { ...l, live: liveLine(l.harness, ki) } : l));
  const g = runOverview(SZ, focus, { data: { id: '2026-10-01-a', bar, lanes, events: [...events] } });
  if (k.end) toast(g, '✓ Run 2026-10-01-a complete', '5 of 5 configurations ended. Judging starts: one fresh session per artifact.', 50);
  return g;
}

scene('Run · one lane per harness', 'M11 · M05 · M10', 'Four lanes run at once and tasks run in order, each in a new process with its own workspace. Cost and elapsed time accumulate per configuration. Time-lapse 20:58 → 22:40.');
show(runFrame(K[0]), 1700);
show(runFrame(K[1]), 1250);
show(runFrame(K[2]), 1250);
show(runFrame(K[3], 'lane1'), 1600, 'enter');

scene('Verification after every task', 'M08', 'When a task process ends, its acceptance checks run on a disposable copy with tooling kept outside the workspace. A check that cannot run is unverified, never passed, and nothing is repaired.');
show(verifyProgress(SZ), 3200, 'esc');
show(runFrame(K[3], 'lane1', true), 1200);

// Enter on a lane opens that configuration (RunConfigScreen, M05): its tasks, requested vs effective settings,
// the environment it got and the live log of the current task process. Esc returns to the overview; nothing stops.
const LOG = [
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
const cfg = (focus, n = LOG.length) => {
  const g = runConfig(SZ, focus, { log: LOG.slice(0, n) });
  g.text(3, 1, fit('Running T5 Shopping cart · 41:12 elapsed · entry #3 of 5 · keeps running if you detach', g.w - 4));
  return g;
};
function isolation() {
  const g = runIsolation(SZ);
  // The dialog is 86 wide and centred above the footer; its first line summarises the run, so match this run.
  g.text(20, 11, fit('5 entries · 4 lanes · one per harness · up to 4 at once · 4 running, 1 queued', 80), 'bd');
  return g;
}

scene('Inside one configuration', 'M05 · M11', 'Enter on a lane opens that configuration: one process per task, requested vs effective model and effort, the isolated environment it got, and the live log of the running task. Esc goes back; the run never pauses.');
show(runFrame(K[4], 'lane0'), 1500, 'tab');
show(runFrame(K[4], 'lane1', true), 1000, 'enter');
[7, 8, 9, 10, 11].forEach((n) => show(cfg('tasks', n), n === 7 ? 1600 : 650));
show(cfg('tasks'), 1200, 'tab');
show(cfg('invocation'), 2600, 'tab');
show(cfg('environment'), 2600, 'tab');
show(cfg('log'), 1700, 'i');
show(isolation(), 3200, 'esc');
show(cfg('log'), 900, 'esc');
show(runFrame(K[4], 'lane1', true), 1100);

// v on a lane: the live view of that configuration's current task process (HarnessLive, M11).
scene('Live view inside the harness', 'M11 · M10', 'v on a lane watches the running task: a one-line header with task, model and effort, output tok/s and context use, the code being written as a live diff, and the thinking beside it. Read-only: watching never sends input.');
show(runFrame(K[4], 'lane1', true), 900, 'v');
[[0, 41.2, 83.6], [1, 52.8, 83.8], [2, 58.6, 83.9], [3, 49.5, 84.0], [4, 46.3, 84.2]].forEach(([adds, rate, ctx], i) => show(harnessLive(SZ, 'code', { adds, rate, ctx }), i === 0 ? 2200 : 900));
show(harnessLive(SZ, 'code', { adds: 5, rate: 44.9, ctx: 84.6 }), 1800, 't');
show(harnessLive(SZ, 'code', { adds: 5, rate: 43.1, ctx: 84.6, thinking: false }), 1600, 't');
show(harnessLive(SZ, 'activity', { adds: 5, rate: 42.0, ctx: 84.7 }), 1800, 'esc');
show(runFrame(K[4], 'lane1', true), 1000);

scene('Queued entry takes over the lane', 'M11', 'Entries of the same harness never overlap: Claude Code #2 starts from its own baseline copy the moment #1 finishes. Failures are recorded as they happened and nothing is rerun.');
show(runFrame(K[5], 'lane0'), 1600);
show(runFrame(K[6], 'lane0'), 1600);
show(runFrame(K[7]), 1300);
show(runFrame(K[8]), 1300);
show(runFrame(K[9]), 1300);
show(runFrame(K[10]), 2600);

// ---------------------------------------------------------------- 6 · judging

const ART = [
  { l: 'Artifact A', cfg: 'Claude Code · claude-opus-5-5 · medium', g: [4.5, 4, 4, 5, 4, 3.5], s: '3:12', c: '$0.41', at: '22:39:45', reg: '30✓', files: 14 },
  { l: 'Artifact B', cfg: 'Pi · qwen3.5-35b-a3b · default', g: [3.5, 3, 4, 3.5, 3, 3], s: '3:48', c: '$0.44', at: '22:42:57', reg: '27✓ 3✗', files: 11 },
  { l: 'Artifact C', cfg: 'Codex · gpt-6-sol · medium', g: [4, 4, 4.5, 4, 4, 3.5], s: '3:31', c: '$0.43', at: '22:46:45', reg: '30✓', files: 14 },
  { l: 'Artifact D', cfg: 'Grok CLI · grok-4.7-fast · default', g: [4, 3.5, 3.5, 3.5, 3.5, 3], s: '2:56', c: '$0.39', at: '22:50:16', reg: '29✓ 1✗', files: 12 },
  { l: 'Artifact E', cfg: 'Claude Code · claude-opus-5-5 · high', g: [5, 4.5, 4.5, 5, 4.5, 4], s: '3:40', c: '$0.47', at: '22:53:12', reg: '30✓', files: 16 },
];
const WORK = (a) => ['read spec/00-project.md and 7 task prompts', `read src/ · ${a.files} files · no file was changed`, `opened check outcomes · ${a.reg} at final regression`, 'viewing T5-cart-mobile-390x844.png', 'writing grades with evidence for 6 categories'];
// phase: 0 just started · 1 inspecting · 2 graded
function judgeFrame(i, phase, done = false) {
  const g = judging(SZ, 'queue');
  const W = g.w, cur = ART[i];
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, done ? '✓' : '●', 'ac');
  g.text(3, 1, fit(done ? 'Judging finished · 5 graded · 0 ungraded · judging cost $2.14 recorded separately, never added to a competitor (M10)' : `Reviewing artifact ${i + 1} of 5 · judge claude-opus-5-5 · high · rubric web v1 · one fresh session per artifact, in order`, W - 4));
  g.box(0, 2, W, 8, { f: 'ac', title: 'Reviews · one artifact per session, in order', sub: 'grades 1–5 in steps of 0.5' });
  g.fill(1, 3, W - 2, 6, 'B0');
  const rows = ART.map((a, j) => {
    const st = j < i || (j === i && phase === 2) ? 'graded' : j === i ? 'now' : 'queued';
    return { v: [a.l, { t: { graded: '✓ graded', now: '● reviewing', queued: '○ queued' }[st], f: st === 'now' ? 'ac' : st === 'queued' ? 'mu' : '' }, a.cfg, st === 'graded' ? a.g.map((n) => n.toFixed(1)).join(' ') : '', st === 'queued' ? '—' : st === 'now' ? ['0:20', '1:57'][phase] : a.s, st === 'queued' ? '—' : st === 'now' ? ['$0.04 so far', '$0.22 so far'][phase] : a.c] };
  });
  table(g, 1, 3, W - 2, [{ l: 'Label', w: 12 }, { l: 'Status', w: 13 }, { l: 'Configuration · visible to you only', w: 39 }, { l: 'Grades · UX → A11y', w: 29 }, { l: 'Time', w: 6, al: 'right' }, { l: 'Judging cost', w: W - 2 - 99, al: 'right' }], rows, { cursor: i, focused: true });
  // current session pane
  g.box(0, 10, 60, 21, { f: 'ln', title: done ? 'All 5 sessions ended' : `${cur.l} · session ${i + 1} of 5` });
  g.fill(1, 11, 58, 19, 'B0');
  if (done) {
    let y = kv(g, 2, 11, 11, 56, [['Graded', '5 of 5 · every category has a grade and evidence'], ['Ungraded', 'none'], ['Ended', '22:56:52 · 17:07 for all five sessions']]);
    y++;
    ART.forEach((a) => { g.text(2, y, '✓', 'ac'); g.text(4, y++, fit(`${a.l} · ${a.g.map((n) => n.toFixed(1)).join(' ')} · ${a.s}`, 54)); });
    y++;
    para(g, 2, y, 56, 'Labels are mapped back to configurations by AxBenchmark only after every session has ended.', 'mu');
  } else {
    let y = kv(g, 2, 11, 11, 56, [['Session', `new headless Claude Code process · pid ${52101 + i * 73}`], ['History', 'none · no earlier artifact or review'], ['Started', `${cur.at} · ${phase === 2 ? cur.s : ['0:20', '1:57'][phase]}`]]);
    y++;
    const shots = [2, 9, 14][phase];
    g.text(2, y++, `Inspecting screenshots · ${shots} of 14`, 'bd');
    progress(g, 2, y++, 56, Math.round(shots / 14 * 100));
    y++;
    const lines = WORK(cur), n = [1, 3, 5][phase];
    lines.slice(0, Math.min(n + 1, lines.length)).forEach((t, j) => {
      const live = j === n && phase < 2;
      g.text(2, y, live ? '●' : '✓', 'ac'); g.text(4, y++, fit(t, 54), live ? 'bd' : '');
    });
    y++;
    para(g, 2, y, 56, 'Read-only workspace copy: the judge inspects and assesses, it never repairs the application.', 'mu');
  }
  g.text(64, 12, fit(done ? 'Each artifact · delivered snapshot at T7' : `${cur.l} · delivered snapshot at T7`, 54));
  g.text(64, 19, fit('Reviews of the other artifacts', 54), 'mu');
  return g;
}
scene('Independent judging', 'M12', 'Each delivered artifact gets one fresh judge session with an anonymous label. The judge sees the spec, checks and the final regression’s screenshots, never cost, time, names or other reviews.');
ART.forEach((_, i) => {
  show(judgeFrame(i, 0), i === 0 ? 1500 : 700);
  show(judgeFrame(i, 1), i === 0 ? 1700 : 800);
  show(judgeFrame(i, 2), i === 0 ? 1000 : 600);
});
show(judgeFrame(4, 2, true), 2600, 'F6');

// ---------------------------------------------------------------- 7 · results and report

scene('Retained results', 'M02 · M06', 'Every retained result for this exact SHA-256, local and imported, side by side: process outcome, checks, judge group, cost and time. From here, h builds the report.');
show(results(SZ, 'results'), 3200, 'h');

scene('Generate the HTML report', 'M13', 'Choose which weights are shown first and what goes in. Built from retained results only: no planner, competitor or judge is called.');
show(reportGenerate(SZ, 'weights'), 2800, 'tab');
show(reportGenerate(SZ, 'contents'), 1600, 'tab');
show(reportGenerate(SZ, 'path'), 1300, '^s');

const SHOTS = RESULTS.length * 7 * 2;
const WRITE = [
  'Read 12 retained results · 0 excluded for another SHA-256',
  'Scores per judge group with the M06 contract · original weights kept',
  'Escaped prompts, logs, reviews and imported labels as plain text',
  `Embedding review screenshots · {n} of ${SHOTS}`,
  'Write one file · inline CSS, JavaScript and data',
  'Open it in the default browser · the path is shown either way',
];
function writing(done, shots = 0) {
  const g = results(SZ, 'none');
  const m = modal(g, 84, 21, 'Generating HTML report', { sel: '#report-progress' });
  let y = m.y;
  WRITE.forEach((t, i) => {
    step(g, m.x, y++, m.w, i < done ? 'done' : i === done ? 'now' : 'todo', t.replace('{n}', i < done ? SHOTS : shots));
    if (i === 3 && i === done) progress(g, m.x + 2, y++, m.w - 2, Math.round(shots / SHOTS * 100));
  });
  y++;
  para(g, m.x, y, m.w, 'Original measurements, grades and weights are only read. Competitor text is never executed or rendered as HTML, even when it contains markup or scripts.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Cancel' }], '');
  return g;
}
function ready() {
  const g = results(SZ, 'none');
  const m = modal(g, 86, 15, 'HTML report', { sel: '#report' });
  let y = m.y;
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, 'Report written', 'bd');
  g.text(m.x + 2, y++, fit(FILE, m.w - 2));
  g.text(m.x + 2, y++, fit('1.9 MB · standalone · 12 results · 2 judge groups · original weights', m.w - 2), 'mu');
  y++;
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, 'Opened in the default browser', 'bd');
  g.text(m.x + 2, y++, fit('No server and no network: the file works offline and can be mailed or archived as is.', m.w - 2), 'mu');
  y++;
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit('No model calls were made · the report uses retained results only', m.w - 2), 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Copy path' }, { label: 'Open folder' }, { label: 'Close', v: 'primary', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close' }, { k: 'c', d: 'Copy path' }, { k: 'tab', d: 'Next' }], '');
  return g;
}
scene('Write one standalone file', 'M13', 'Scores are recomputed per judge group, every piece of competitor text is escaped, and screenshots are embedded so the file stands alone.');
show(writing(0), 450); show(writing(1), 450); show(writing(2), 450);
[24, 66, 104, 141].forEach((n) => show(writing(3, n), 380));
show(writing(4), 550); show(writing(5), 650);
show(ready(), 2300);

// ---------------------------------------------------------------- 8 · the report (anchors are sections of .rp-page)

scene('The HTML report', 'M13', 'One offline file: full SHA-256, filters, both weight sets, the top-five charts, the log-cost scatter, the combined ranking, both tables and task evidence.');
page(0, 3200); page(1, 3000); page(2, 3600); page(3, 4200); page(4, 3600); page(5, 3400); page(6, 3600); page(0, 2600);

// ---------------------------------------------------------------- encode

const rowIndex = new Map(), rows = [];
const enc = frames.map((f) => {
  if (f.t === 'b') return { b: f.a, d: f.d };
  const r = f.g.html({}).split('\n').map((h) => {
    if (!rowIndex.has(h)) { rowIndex.set(h, rows.length); rows.push(h); }
    return rowIndex.get(h);
  });
  return f.k ? { r, d: f.d, k: f.k } : { r, d: f.d };
});
const sceneOf = frames.map((_, i) => scenes.findLastIndex((s) => s.at <= i));
enc.forEach((f, i) => { f.s = sceneOf[i]; });
const total = frames.reduce((n, f) => n + f.d, 0);

const report = reportPage().replace('Generated 2026-10-01 22:31', 'Generated 2026-10-01 22:58');
const W = SZ.cols * CELL.w, H = SZ.rows * CELL.h;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AxBenchmark run walkthrough</title>
<meta name="description" content="Animated wireframe walkthrough: the preloaded inventory benchmark from the shell prompt to the generated HTML report.">
${FONT_LINK}
<style>${CSS}${REPORT_CSS}
:root{color-scheme:dark}
html,body{background:var(--chrome);color:var(--fg)}
body{margin:0;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;-webkit-font-smoothing:antialiased}
.wrap{max-width:${Math.ceil(W) + 48}px;margin:0 auto;padding:20px 16px 40px;display:flex;flex-direction:column;gap:14px}
.top{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 16px}
.top h1{margin:0;font-size:16px;line-height:22px}
.top p{margin:0;font-size:12px;color:var(--mu)}
.fitbox{position:relative;width:100%;overflow:hidden}
.stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;overflow:hidden;background:var(--bg);outline:1px solid var(--ln)}
.stage .term{position:absolute;inset:0;width:${SZ.cols}ch;height:${H}px;outline:0;transition:opacity .45s ease,transform .45s ease}
.bw{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--paper);opacity:0;transform:translateY(24px) scale(.98);transition:opacity .5s ease,transform .5s ease;pointer-events:none}
.stage.browser .bw{opacity:1;transform:none}
.stage.browser .term{opacity:0;transform:scale(.97)}
.bw-bar{display:flex;align-items:center;gap:12px;height:34px;padding:0 12px;background:var(--pn);font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;font-size:12px;color:var(--mu);flex-shrink:0}
.bw-dots{letter-spacing:3px;color:var(--ln)}
.bw-url{flex:1;min-width:0;padding:4px 10px;background:var(--sf);color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bw-view{position:relative;flex:1;overflow:hidden}
.bw-in{position:absolute;left:0;top:0;width:1280px;transform-origin:0 0;transition:transform 1.3s cubic-bezier(.45,.05,.25,1)}
.bw-in .rp{border:0}
.bw-in .rp-chrome{display:none}
.key{position:absolute;right:16px;bottom:30px;padding:6px 14px;border-radius:6px;background:var(--fg);color:var(--bg);font-size:20px;line-height:28px;font-weight:700;box-shadow:0 6px 24px rgba(0,0,0,.35);opacity:0;transform:translateY(6px);transition:opacity .15s ease,transform .15s ease;pointer-events:none}
.key.on{opacity:1;transform:none}
.capt{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;align-items:baseline;min-height:62px;font-size:13px;line-height:20px}
.capt .n{font-size:12px;color:var(--mu);font-variant-numeric:tabular-nums}
.capt b{font-size:15px}
.capt .m{color:var(--ac);font-size:12px;margin-left:10px;font-weight:400}
.capt p{grid-column:2;margin:0;color:var(--ink2);max-width:76ch}
.bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.btn{font:inherit;font-size:12px;min-height:32px;min-width:32px;padding:4px 12px;border:1px solid var(--ln);background:var(--paper);color:var(--fg);cursor:pointer}
.btn:hover{border-color:var(--ac)}
.btn:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.btn.pri{background:var(--ac);border-color:var(--ac);color:var(--on);font-weight:700;min-width:84px}
.sp{flex:1}
.lbl{font-size:12px;color:var(--mu);display:flex;gap:6px;align-items:center}
.lbl select{font:inherit;font-size:12px;min-height:32px;background:var(--paper);color:var(--fg);border:1px solid var(--ln);padding:2px 6px}
.time{font-size:12px;color:var(--mu);font-variant-numeric:tabular-nums}
.track{position:relative;display:flex;gap:2px;height:30px;cursor:pointer}
.seg{position:relative;flex:var(--w) 1 0;background:var(--sf);overflow:hidden;border:0;padding:0;cursor:pointer}
.seg:hover{background:var(--pn)}
.seg:focus-visible{outline:2px solid var(--ac);outline-offset:1px}
.seg i{position:absolute;left:0;top:0;bottom:0;width:0;background:color-mix(in srgb,var(--ac) 70%,transparent)}
.seg.done i{width:100%}
.seg span{position:absolute;left:6px;right:4px;top:0;line-height:30px;font-size:11px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;pointer-events:none}
.help{font-size:12px;color:var(--mu);margin:0}
.help kbd{font:inherit;color:var(--fg);font-weight:700}
@media (max-width:640px){.seg span{display:none}.capt{grid-template-columns:1fr}.capt p{grid-column:1}}
@media (prefers-reduced-motion:reduce){.bw,.bw-in,.stage .term,.key{transition:none}}
</style>
</head>
<body class="t-dark" style="--ac: ${ACCENT}">
<div class="wrap">
<div class="top"><h1>AxBenchmark · from the console to the HTML report</h1><p>Wireframe animation · ${SZ.label} cells · preloaded inventory benchmark r1 · fictional data</p></div>
<div class="fitbox" id="fit">
<div class="stage" id="stage">
<div class="term" id="term"></div>
<div class="bw" aria-hidden="true"><div class="bw-bar"><span class="bw-dots">●●●</span><span class="bw-url">file://${esc(FILE.replace('~', '/Users/mike'))}</span><span>offline</span></div>
<div class="bw-view" id="view"><div class="bw-in ax" id="bin">${report}</div></div></div>
<div class="key" id="key"></div>
</div>
</div>
<div class="capt" aria-live="polite"><span class="n" id="cn"></span><b id="ct"></b><p id="cc"></p></div>
<div class="track" id="track" role="group" aria-label="Chapters"></div>
<div class="bar">
<button class="btn pri" id="play" type="button">Pause</button>
<button class="btn" id="prev" type="button" aria-label="Previous chapter">◀◀</button>
<button class="btn" id="next" type="button" aria-label="Next chapter">▶▶</button>
<button class="btn" id="restart" type="button">Restart</button>
<span class="time" id="time"></span>
<span class="sp"></span>
<label class="lbl">Speed <select id="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
<label class="lbl">Theme <select id="theme"><option value="dark">dark</option><option value="light">light</option></select></label>
</div>
<p class="help"><kbd>space</kbd> play or pause · <kbd>←</kbd> <kbd>→</kbd> previous or next chapter · <kbd>,</kbd> <kbd>.</kbd> step one frame while paused</p>
</div>
<script>
const R = ${JSON.stringify(rows)};
const F = ${JSON.stringify(enc)};
const S = ${JSON.stringify(scenes)};
const TOTAL = ${total};
(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), term = $('term'), fitEl = $('fit'), key = $('key'), bin = $('bin'), view = $('view');
  const playBtn = $('play'), speedSel = $('speed'), themeSel = $('theme'), track = $('track'), time = $('time');
  const starts = []; let acc = 0; F.forEach((f) => { starts.push(acc); acc += f.d; });
  const sceneStart = S.map((s) => starts[s.at]);
  const sceneEnd = S.map((s, i) => (i + 1 < S.length ? sceneStart[i + 1] : TOTAL));
  let i = 0, playing = true, speed = 1, timer = 0, keyTimer = 0, lastRows = null, frameStart = 0;

  const segs = S.map((s, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'seg'; b.style.setProperty('--w', String(sceneEnd[n] - sceneStart[n]));
    b.title = (n + 1) + ' · ' + s.title; b.setAttribute('aria-label', 'Chapter ' + (n + 1) + ': ' + s.title);
    b.innerHTML = '<i></i><span></span>'; b.querySelector('span').textContent = s.title;
    b.onclick = () => go(s.at);
    track.appendChild(b); return b;
  });

  const fit = () => {
    const k = Math.min(1, fitEl.clientWidth / ${W});
    stage.style.transform = 'scale(' + k + ')';
    fitEl.style.height = Math.ceil(${H} * k) + 'px';
  };
  const scaleIn = () => view.clientWidth / 1280;
  const anchorY = (a) => {
    const kids = bin.querySelectorAll('.rp-page > *');
    const el = kids[Math.min(a, kids.length - 1)];
    const max = Math.max(0, bin.scrollHeight - view.clientHeight / scaleIn());
    return a === 0 ? 0 : Math.min(max, el.offsetTop + bin.querySelector('.rp-page').offsetTop - 16);
  };
  const fmt = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function paint(animate) {
    const f = F[i];
    if (f.b === undefined) {
      if (f.r !== lastRows) { term.innerHTML = f.r.map((x) => R[x]).join(''); lastRows = f.r; }
      stage.classList.remove('browser');
    } else {
      stage.classList.add('browser');
      bin.style.transitionDuration = animate ? '' : '0s';
      bin.style.transform = 'scale(' + scaleIn() + ') translateY(' + (-anchorY(f.b)) + 'px)';
    }
    const s = S[f.s];
    $('cn').textContent = String(f.s + 1).padStart(2, '0') + ' / ' + String(S.length).padStart(2, '0');
    $('ct').innerHTML = ''; $('ct').append(s.title); const m = document.createElement('span'); m.className = 'm'; m.textContent = s.mod; $('ct').append(m);
    $('cc').textContent = s.cap;
    segs.forEach((b, n) => { b.classList.toggle('done', n < f.s); if (n !== f.s) b.querySelector('i').style.cssText = ''; });
    progressTo(starts[i], 0);
    if (playing) progressTo(starts[i] + f.d, f.d / speed);
    time.textContent = fmt(starts[i]) + ' / ' + fmt(TOTAL);
    key.classList.remove('on'); clearTimeout(keyTimer);
    if (f.k) {
      key.textContent = f.k;
      const at = Math.max(0, f.d - 650) / speed;
      if (playing) keyTimer = setTimeout(() => key.classList.add('on'), at); else key.classList.add('on');
    }
  }
  function progressTo(t, dur) {
    const n = F[i].s, b = segs[n].querySelector('i');
    const pct = Math.max(0, Math.min(1, (t - sceneStart[n]) / (sceneEnd[n] - sceneStart[n]))) * 100;
    b.style.transition = dur ? 'width ' + dur + 'ms linear' : 'none';
    if (!dur) void b.offsetWidth;
    b.style.width = pct + '%';
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    timer = setTimeout(() => {
      if (i < F.length - 1) { i++; paint(true); schedule(); }
      else { setPlaying(false); }
    }, F[i].d / speed);
  }
  function setPlaying(p) {
    playing = p; playBtn.textContent = p ? 'Pause' : (i >= F.length - 1 ? 'Replay' : 'Play');
    if (p && i >= F.length - 1) i = 0;
    paint(true); schedule();
  }
  function go(n) { i = Math.max(0, Math.min(F.length - 1, n)); paint(false); schedule(); }
  const sceneIdx = () => F[i].s;

  playBtn.onclick = () => setPlaying(!playing);
  $('restart').onclick = () => { i = 0; setPlaying(true); };
  $('prev').onclick = () => { const n = sceneIdx(); go(S[i > S[n].at + 2 ? n : Math.max(0, n - 1)].at); };
  $('next').onclick = () => { const n = sceneIdx(); if (n + 1 < S.length) go(S[n + 1].at); };
  speedSel.onchange = () => { speed = +speedSel.value; paint(false); schedule(); };
  const get = (k, d) => { try { return localStorage.getItem('axbenchmark-anim-' + k) || d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem('axbenchmark-anim-' + k, v); } catch {} };
  const applyTheme = () => { document.body.className = 't-' + themeSel.value; document.documentElement.style.colorScheme = themeSel.value; };
  themeSel.value = get('theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  themeSel.onchange = () => { set('theme', themeSel.value); applyTheme(); };
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('select') || (e.key === ' ' && e.target.closest?.('button'))) return;
    if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'ArrowRight') $('next').click();
    else if (e.key === 'ArrowLeft') $('prev').click();
    else if (e.key === '.' && !playing) go(i + 1);
    else if (e.key === ',' && !playing) go(i - 1);
  });
  addEventListener('resize', () => { fit(); paint(false); });
  applyTheme(); fit();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) playing = false;
  document.fonts?.ready.then(() => paint(false));
  setPlaying(playing);
})();
</script>
</body>
</html>
`;

writeFileSync(new URL('../animation.html', import.meta.url), html);
console.log(`Built animation.html · ${scenes.length} chapters · ${frames.length} frames · ${rows.length} unique rows · ${(total / 1000).toFixed(1)} s · ${(html.length / 1024).toFixed(0)} KB`);
