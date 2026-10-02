// M08 · Acceptance verification and evidence.
// TaskChecksScreen (one task's checks and evidence), FinalRegressionScreen, ChecksScreen (why checks did not pass),
// ScreenshotsScreen, and the verification-progress and judge-input dialogs. All data is fictional except the check
// titles, which restate the preserved prompts.
import { Grid, fit, len, header, footer, table, button, buttons, para, kv, notice, modal, progress, loading } from './lib.mjs';
import { step } from './screens.mjs';
import { runConfig } from './screens-execution.mjs';
import { CHECKS, byCheck, PI_AT_TASK, PI_FINAL, COMMITS } from './checks-data.mjs';

const OUT = { pass: '✓ passed', fail: '✗ failed', unv: '? unverified', none: '○ not run' };
const ocell = (k) => ({ t: OUT[k], f: k === 'fail' ? 'bd' : k === 'pass' ? '' : k === 'unv' ? 'it' : 'mu' });

function resultBar(g, compact, text) {
  g.fill(0, 1, g.w, 1, 'B1');
  g.text(1, 1, fit(text, g.w - 2));
  g.region(0, 1, g.w, 1, 'Static', '#result-bar');
}

// ---------------------------------------------------------------- one task's checks

export function taskChecks(sz, focus = 'checks') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', compact ? 'R-0928a-4 · T5 checks' : 'Result R-0928a-4 · T5 Shopping cart · checks');
  resultBar(g, compact, compact
    ? `Pi · qwen3.5-35b-a3b · exit 0 · 2✓ 2✗ · snapshot ${COMMITS.T5}`
    : `● Local · mike-mbp-m4 · Pi · qwen3.5-35b-a3b · process ✓ exit 0 · checks 2✓ 2✗ · T5 snapshot, commit ${COMMITS.T5}`);
  const t5 = CHECKS.filter((c) => c[0].startsWith('T5'));
  const rows = t5.map(([id, t, k]) => ({ v: [id, t, k, ocell(PI_AT_TASK[id] ?? 'pass')] }));
  const cf = focus === 'checks';
  const lw = compact ? W : 72;
  g.box(0, 2, lw, 7, { f: cf ? 'ac' : 'ln', title: 'Acceptance checks · T5', sub: 'frozen in r1' });
  table(g, 1, 3, lw - 2, [{ l: 'Check', w: 6 }, { l: 'Title', w: lw - 2 - 27 }, { l: 'Kind', w: 9 }, { l: 'Outcome', w: 12 }], rows, { cursor: 2, focused: cf });
  g.region(1, 3, lw - 2, 5, 'DataTable', '#task-checks');

  if (compact) {
    g.box(0, 9, W, H - 10, { title: 'T5.3 · ✗ failed · application', f: focus === 'detail' ? 'ac' : 'ln' });
    g.region(0, 9, W, H - 10, 'VerticalScroll', '#check-detail');
    let y = para(g, 2, 10, W - 4, 'Expected: after an item is removed, the total no longer includes it. Observed: the row disappeared but the total stayed at 64.00.');
    y++;
    for (const [ok, s] of [['✓', '1 open index.html directly (file://)'], ['✓', '2 add “Desk lamp”, then “Notebook” twice'], ['✓', '3 Tab to Remove on Desk lamp, Enter'], ['✗', '4 total excludes Desk lamp · still 64.00']]) {
      g.text(2, y, ok, ok === '✓' ? 'ac' : 'bd'); g.text(4, y++, fit(s, W - 6), ok === '✗' ? 'bd' : '');
    }
    y++;
    g.text(2, y++, fit('Console: TypeError: cart.items.find is not a function', W - 4), 'mu');
    g.text(2, y++, fit('Screenshots 1440×1000 + 390×844 · checked on a disposable copy', W - 4), 'mu');
    footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 's', d: 'Shots', go: 'Screenshots' }, { k: 'f', d: 'Final', go: 'FinalRegression' }, { k: 'j', d: 'Judge input', go: 'JudgeHandoff' }]);
    return g;
  }

  g.box(0, 9, lw, 9, { f: focus === 'verification' ? 'ac' : 'ln', title: 'How T5 was verified' });
  g.region(0, 9, lw, 9, 'Static', '#verification-facts.kv');
  kv(g, 2, 10, 13, lw - 4, [
    ['Snapshot', `T5 workspace · commit ${COMMITS.T5} · preserved as evidence`],
    ['Checked on', 'a disposable copy, deleted after the checks'],
    ['Tooling', 'outside the workspace · Playwright for Python 1.52'],
    ['Browser', 'Chromium 140 · index.html opened directly'],
    ['Repairs', 'none · generated code is never changed'],
    ['Process', '✓ exit 0 · recorded separately (M05)'],
    ['Grades', 'judge A · kept separate; cannot change outcomes'],
  ]);
  g.box(0, 18, lw, 8, { f: focus === 'final' ? 'ac' : 'ln', title: 'Same checks on the delivered artifact', sub: 'f Final regression' });
  g.region(0, 18, lw, 8, 'Static', '#final-summary');
  table(g, 1, 19, lw - 2, [{ l: 'Check', w: 6 }, { l: 'At T5', w: 15 }, { l: 'Final (T7)', w: 15 }, { l: '', w: lw - 2 - 36 }],
    t5.map(([id]) => {
      const a = PI_AT_TASK[id] ?? 'pass', f = PI_FINAL[id] ?? 'pass';
      return { v: [id, ocell(a), ocell(f), a === f ? '' : a === 'fail' ? 'fixed during T7' : 'regressed'] };
    }));
  g.link(0, 18, lw, 8, 'go:FinalRegression');

  const dx = lw + 2, dw = W - lw - 4, df = focus === 'detail';
  g.box(lw, 2, W - lw, H - 4, { f: df ? 'ac' : 'ln', title: 'T5.3 · Removing an item updates the total' });
  g.region(lw, 2, W - lw, H - 4, 'VerticalScroll', '#check-detail.pane');
  let y = 3;
  g.text(dx, y, '✗', 'bd'); g.text(dx + 2, y++, 'Failed · application behavior', 'bd');
  y++;
  y = kv(g, dx, y, 10, dw, [['Expected', ['After an item is removed, the', 'total no longer includes it.']], ['Observed', ['The row disappeared but the', 'total stayed at 64.00.']]]);
  y++;
  g.text(dx, y++, 'Steps · keyboard only', 'bd');
  for (const [ok, s] of [['✓', 'Open index.html directly (file://)'], ['✓', 'Add “Desk lamp” to the cart'], ['✓', 'Add “Notebook” twice'], ['✓', 'Tab to Remove on Desk lamp, press Enter'], ['✗', 'Total excludes Desk lamp · still 64.00']]) {
    g.text(dx, y, ok, ok === '✓' ? 'ac' : 'bd'); g.text(dx + 2, y++, fit(s, dw - 2), ok === '✗' ? 'bd' : '');
  }
  y++;
  y = kv(g, dx, y, 12, dw, [
    ['Console', ['1 error · TypeError: cart.items', '.find is not a function', 'cart.js:88']],
    ['Screenshots', ['desktop 1440×1000', 'mobile 390×844 · after last step']],
    ['Log', 'verify/T5/T5.3.log · 2.1 s'],
  ]);
  y++;
  para(g, dx, y, dw, 'Screenshots help inspection; they never establish a pass. The failure stays even if the judge grades the app well.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Screenshots', go: 'Screenshots', focus: focus === 'shots' }, { label: 'Final regression', go: 'FinalRegression' }, { label: 'Judge input', go: 'JudgeHandoff' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: '←→', d: 'Task' }, { k: 's', d: 'Screenshots', go: 'Screenshots' }, { k: 'f', d: 'Final regression', go: 'FinalRegression' }, { k: 'j', d: 'Judge input', go: 'JudgeHandoff' }, { k: 'l', d: 'Log' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- final regression

export function finalRegression(sz, focus = 'table') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Result R-0928a-4 · final regression');
  resultBar(g, false, `Delivered artifact = T7 snapshot ${COMMITS.T7} · all 21 checks run again on a disposable copy · task evidence kept`);
  const tf = focus === 'table';
  g.box(0, 2, W, 24, { f: tf ? 'ac' : 'ln', title: 'Acceptance checks · at their task and on the delivered artifact', sub: '21 checks' });
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 7 }, { l: 'Title', w: 54 }, { l: 'Kind', w: 9 }, { l: 'At its task', w: 13 }, { l: 'Final artifact', w: 15 }, { l: 'Change', w: W - 2 - 98 }],
    CHECKS.map(([id, t, k]) => {
      const a = PI_AT_TASK[id] ?? 'pass', f = PI_FINAL[id] ?? 'pass';
      return { v: [id, t, k, ocell(a), ocell(f), a === f ? { t: '=', f: 'mu' } : { t: a === 'fail' ? '✗ → ✓ fixed in T7' : '✓ → ✗ regressed', f: 'bd' }] };
    }), { cursor: 12, focused: tf });
  g.region(1, 3, W - 2, 22, 'DataTable', '#regression');
  const n = (o) => ({ p: CHECKS.filter(([id]) => !(id in o)).length, f: Object.keys(o).length });
  const a = n(PI_AT_TASK), f = n(PI_FINAL);
  let y = kv(g, 1, 27, 16, W - 2, [
    ['At each task', `${a.p}✓ ${a.f}✗ · each check ran on its own task’s snapshot`],
    ['Final artifact', `${f.p}✓ ${f.f}✗ · every check ran on the T7 snapshot`],
    ['Changes', 'T4.2 passed at T4 and fails on the delivered site · T5.4 failed at T5 and was fixed during T7'],
  ]);
  g.region(1, 27, W - 2, 3, 'Static', '#regression-summary.kv');
  notice(g, 1, y + 1, W - 2, 'info', 'Both columns are evidence', 'An earlier pass never stands in for the final behavior, and a final pass never erases what happened at the task. Snapshots, logs and screenshots stay attached to the task they describe.');
  buttons(g, W - 1, H - 2, [{ label: 'Open check', go: 'TaskChecks', focus: focus === 'open' }, { label: 'Not passed only', go: 'CheckOutcomes' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'TaskChecks' }, { k: 'enter', d: 'Open check', go: 'TaskChecks' }, { k: 'n', d: 'Not passed only', go: 'CheckOutcomes' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- why checks did not pass

const CAUSES = [
  ['✗', 'Application failure', 'the check ran and observed a requirement fail'],
  ['?', 'Missing prerequisite', 'a tool the check needs is absent on this machine'],
  ['?', 'Verifier error', 'the check itself broke; nothing was observed'],
  ['○', 'Not run', 'the process ended before the task produced work'],
];
const NOT_PASSED = [
  ['R-0928a-4', 'T4.2', 'fail', 'application', 'final artifact: lookup still shows a product’s old name'],
  ['R-0928a-4', 'T5.3', 'fail', 'application', 'total unchanged after an item was removed'],
  ['R-0928a-4', 'T6.2', 'fail', 'application', 'order history is empty after a reload'],
  ['R-0928a-3', 'T7.1', 'unv', 'prerequisite', 'Chromium for Playwright not installed on mike-mbp-m4'],
  ['R-0925b-2', 'T5.1–T5.4', 'none', 'not run', 'process failed at T5 (timeout); snapshot kept as evidence'],
  ['R-0925b-2', 'T6.1–T7.1', 'none', 'not run', 'T6 and T7 never started'],
  ['R-0919lab-1', 'T6.1', 'fail', 'application', 'stock unchanged after purchase · imported evidence'],
  ['10-01-a · Grok', 'T3.2', 'unv', 'verifier error', 'checks/T3.2 crashed: KeyError in the fixture loader'],
];

export function checkOutcomes(sz, focus = 'table') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Checks not passed · Inventory web app r1');
  resultBar(g, false, '12 results and 1 live run · checks that did not pass · four causes, never merged with each other or with exit status');
  CAUSES.forEach(([gl, t, d], i) => {
    const x = i * 30;
    g.box(x, 2, 30, 5, { f: 'ln' });
    g.text(x + 2, 3, gl, gl === '✗' ? 'bd' : gl === '○' ? 'mu' : 'it'); g.text(x + 4, 3, fit(t, 24), 'bd');
    para(g, x + 2, 4, 26, d, 'mu');
  });
  g.region(0, 2, W, 5, 'Horizontal', '#cause-legend');
  const tf = focus === 'table';
  g.box(0, 7, W, NOT_PASSED.length + 3, { f: tf ? 'ac' : 'ln', title: 'Not passed', sub: 'o open · / filter' });
  table(g, 1, 8, W - 2, [{ l: 'Result', w: 15 }, { l: 'Check', w: 11 }, { l: 'Outcome', w: 14 }, { l: 'Cause', w: 16 }, { l: 'Reason', w: W - 2 - 56 }],
    NOT_PASSED.map(([r, c, o, cause, why]) => ({ v: [r, c, ocell(o), cause, why], go: r === 'R-0928a-4' ? 'TaskChecks' : r === 'R-0928a-3' ? 'ResultOutcomes' : undefined })), { cursor: 7, focused: tf });
  g.region(1, 8, W - 2, NOT_PASSED.length + 1, 'DataTable', '#not-passed');
  const y0 = 7 + NOT_PASSED.length + 3;
  g.box(0, y0, W, H - 2 - y0, { f: focus === 'detail' ? 'ac' : 'ln', title: 'T3.2 · ? unverified · verifier error · live run 2026-10-01-a, Grok CLI' });
  g.region(0, y0, W, H - 2 - y0, 'Static', '#outcome-detail');
  let y = para(g, 2, y0 + 1, W - 4, 'The check script raised KeyError while loading its fixture, before it touched the site. Nothing about the application was observed, so the outcome is unverified, not failed and not passed. The error, the check log and the T3 snapshot stay with the task.');
  y = kv(g, 2, y + 1, 16, W - 4, [
    ['Different from', 'a missing prerequisite (tool absent, see Environment) and an application failure (check ran, requirement failed)'],
    ['Evidence', 'verify/T3/T3.2.log · traceback · T3 snapshot c04e7aa'],
    ['Effect', 'the result cannot enter default shortlists while a required check is unverified (M06)'],
  ]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'Results' }, { k: 'o', d: 'Open check', go: 'TaskChecks' }, { k: '/', d: 'Filter' }, { k: 'c', d: 'Cause' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- screenshots

export function screenshots(sz, focus = 'list') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'R-0928a-4 · T5.3 · screenshots');
  resultBar(g, false, 'Captured by Playwright for Python after each browser check · 1440×1000 and 390×844 · evidence for inspection, not a pass');
  const lf = focus === 'list';
  g.box(0, 2, W, 8, { f: lf ? 'ac' : 'ln', title: 'T5 screenshots · 8', sub: 'o open in the system viewer' });
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 7 }, { l: 'After step', w: 30 }, { l: 'Viewport', w: 20 }, { l: 'File', w: W - 2 - 67 }, { l: 'Size', w: 10, al: 'right' }], [
    { v: ['T5.3', '4 · Tab to Remove, Enter', 'desktop 1440×1000', 'verify/T5/T5.3-desktop.png', '212 KB'] },
    { v: ['T5.3', '4 · Tab to Remove, Enter', 'mobile 390×844', 'verify/T5/T5.3-mobile.png', '96 KB'] },
    { v: ['T5.2', '3 · quantity set to 3', 'desktop 1440×1000', 'verify/T5/T5.2-desktop.png', '208 KB'] },
    { v: ['T5.2', '3 · quantity set to 3', 'mobile 390×844', 'verify/T5/T5.2-mobile.png', '94 KB'] },
    { v: ['T5.1', '2 · added to the cart', 'desktop · mobile', '2 files', '301 KB'] },
  ], { cursor: 0, focused: lf });
  g.region(1, 3, W - 2, 6, 'DataTable', '#shots');
  // Proportional frames: 1440×1000 and 390×844 at one cell = 7.8×16 px.
  const dh = 24, dw = Math.round(dh * 16 / 7.8 * 1440 / 1000 * 0.92), mw = Math.round(dh * 16 / 7.8 * 390 / 844);
  const frame = (x, w, title, lines) => {
    g.box(x, 11, w, dh, { f: 'ln', title });
    lines.forEach((l, i) => g.text(x + Math.floor((w - len(l)) / 2), 11 + Math.floor(dh / 2) - 2 + i, l, i === 0 ? 'bd' : 'mu'));
  };
  frame(1, dw, 'desktop 1440×1000', ['Screenshot preview', 'terminals cannot show images reliably', 'o opens T5.3-desktop.png', '', 'shape drawn to scale']);
  frame(dw + 4, mw, 'mobile 390×844', ['Preview', 'o opens', 'mobile.png']);
  g.region(1, 11, dw + mw + 3, dh, 'Horizontal', '#shot-frames');
  para(g, dw + mw + 7, 12, W - dw - mw - 8, 'Images show what the browser rendered after the step. They support inspection and judging; the check outcome comes from the executable assertion alone.', 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'TaskChecks' }, { k: 'o', d: 'Open image' }, { k: 'f', d: 'Open folder' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- verification in progress (over the run)

export function verifyProgress(sz) {
  const g = runConfig(sz, 'none');
  const m = modal(g, 84, 22, 'Verifying T4 · Codex · gpt-6-sol · medium', { sel: '#verify-progress' });
  let y = m.y;
  step(g, m.x, y++, m.w, 'done', 'T4 snapshot preserved · commit 5b1e9a0');
  step(g, m.x, y++, m.w, 'done', 'Disposable copy created · verification tools stay outside it');
  step(g, m.x, y++, m.w, 'done', 'index.html opened directly in Chromium · Playwright for Python 1.52');
  step(g, m.x, y++, m.w, 'now', 'Running checks · 2 of 2 · T4.2 Lookup reflects the current inventory');
  progress(g, m.x + 2, y++, m.w - 2, 50);
  step(g, m.x, y++, m.w, 'todo', 'Screenshots · desktop 1440×1000 · mobile 390×844');
  step(g, m.x, y++, m.w, 'todo', 'Discard the copy · keep snapshot, logs and screenshots');
  g.region(m.x, m.y, m.w, 7, 'Vertical', '#verify-steps');
  y++;
  g.text(m.x, y++, 'So far', 'bd');
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit('T4.1 Lookup finds a product the user asks for · passed · 1.8 s', m.w - 2));
  y++;
  para(g, m.x, y, m.w, 'A check that cannot run is recorded as unverified with its reason, never as passed. Generated code is never repaired, even when setup exposes a defect.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Hide', v: 'primary', go: 'RunConfig', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Hide · verification continues', go: 'RunConfig' }], '');
  return g;
}

// ---------------------------------------------------------------- what the judge receives

export function judgeHandoff(sz) {
  const g = taskChecks(sz, 'none');
  const m = modal(g, 86, 25, 'Judge input · R-0928a-4', { sel: '#judge-input' });
  let y = m.y;
  g.text(m.x, y++, fit('Prepared by verification for judge A · Claude Code · claude-opus-5-5 · high', m.w), 'bd');
  y++;
  g.text(m.x, y++, 'Given to the judge', 'bd');
  for (const t of [
    `Delivered artifact · T7 snapshot ${COMMITS.T7}`,
    'Specification, the seven task prompts and rubric web v1',
    'Check outcomes · per task and final regression · 18✓ 3✗ each',
    '14 screenshots (one desktop and one mobile per task) · keyboard traces',
    'Browser console errors · 2',
  ]) { g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit(t, m.w - 2)); }
  y++;
  g.text(m.x, y++, 'Kept apart · measured statistics travel separately (M10)', 'bd');
  for (const t of ['Cost, token counts and pricing basis', 'Elapsed time per task', 'CPU and GPU samples']) { g.text(m.x, y, '✗', 'mu'); g.text(m.x + 2, y++, fit(t, m.w - 2), 'mu'); }
  y++;
  para(g, m.x, y, m.w, 'The judge never changes a check outcome: grades and outcomes are stored separately and shown side by side.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open folder' }, { label: 'Close', v: 'primary', go: 'TaskChecks', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'TaskChecks' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const VERIFY_WIDGET_STATES = [
  { widget: 'DataTable#task-checks', label: 'M08 · Task checks', states: [
    ['Loading', mini('Acceptance checks · T6', (g, x, y, w) => loading(g, x, y + 1, w, 'Verifying T6 on a disposable copy…'))],
    ['Empty', mini('Acceptance checks · T6', (g, x, y, w) => { centered(g, y + 1, 'T6 has not been verified yet', 'bd'); centered(g, y + 2, 'Checks run after the task process ends.', 'mu'); })],
    ['Error', mini('Acceptance checks · T6', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Verification could not start', 'The T6 snapshot is missing from the run folder. Checks stay unverified; nothing was guessed.'); })],
  ] },
];
