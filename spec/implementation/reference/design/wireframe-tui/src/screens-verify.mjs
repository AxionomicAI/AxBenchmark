// M08 · Acceptance verification and evidence.
// TaskChecksScreen (one task's checks and evidence), FinalRegressionScreen, ChecksScreen (why checks did not pass),
// ScreenshotsScreen, and the verification-progress and judge-input dialogs. All data is fictional except the check
// titles, which restate the preserved prompts.
import { Grid, fit, len, header, footer, table, button, buttons, para, kv, notice, modal, progress, loading } from './lib.mjs';
import { step } from './screens.mjs';
import { runConfig } from './screens-execution.mjs';
import { CHECKS, CHECK_DETAILS, byCheck, PI_AT_TASK, PI_FINAL, COMMITS } from './checks-data.mjs';

const OUT = { pass: '✓ passed', fail: '✗ failed', unv: '? unverified', none: '○ not run' };
const ocell = (k) => ({ t: OUT[k], f: k === 'fail' ? 'bd' : k === 'pass' ? '' : k === 'unv' ? 'it' : 'mu' });

function resultBar(g, compact, text) {
  g.fill(0, 1, g.w, 1, 'B1');
  g.text(1, 1, fit(text, g.w - 2));
  g.region(0, 1, g.w, 1, 'Static', '#result-bar');
}

// ---------------------------------------------------------------- one task's checks

export function taskChecks(sz, focus = 'checks', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const id = st.check ?? 'T5_remove', task = id.split('_')[0], d = CHECK_DETAILS[id];
  const fixture = st.fixture ?? 'remove';
  const examples = {
    remove: ['✗ failed · application_failure', 'Remove an added cart line, then reopen.', 'The selected line remains after removal.', 'browser, data, screenshot, keyboard · remove.log'],
    missing_commit: ['✗ failed · application_failure', 'T4 must advance its own repository history.', 'Readable start/end history: same HEAD; no new commit.', 'repository, log · start/end capture · T4_commit.log'],
    unavailable_history: ['? unverified · verifier_error', 'Observe T4 commit advancement at its task boundary.', 'Retained history is unreadable; advancement cannot be established.', 'capture error + repository log · no fabricated failure'],
    data_only: ['✓ passed · data observation', 'Fresh storage initializes sample products with stock.', 'Supported data observer confirms initialization; no T3 UI exists yet.', 'data, browser · initializer bindings + storage observations'],
    missing_browser: ['? unverified · missing_prerequisite', 'Reopen the nonempty cart with the same profile and origin.', 'Browser is not installed; behavior was not observed.', 'readiness reason + verification log'],
  };
  const [outcome, expected, observed, evidence] = examples[fixture];
  header(g, 'AxBenchmark', `R-0928a-4 · ${task} checks · trial 1`);
  resultBar(g, compact, 'UID run_mbp_20260928a · origin mike-mbp-m4 · config pi_default · trial 1 · phase at_task');
  const taskRows = CHECKS.filter(([cid]) => cid.startsWith(task + '_'));
  const height = taskRows.length + 3;
  g.box(0, 2, W, height, { f: focus === 'checks' ? 'ac' : 'ln', title: `Acceptance checks · ${task}`, sub: 'outcomes separate from process exit' });
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 19 }, { l: 'Title', w: W - 36 }, { l: 'Outcome', w: 15 }], taskRows.map(([cid, title]) => ({ v: [cid, title, cid === id && fixture !== 'remove' ? (fixture === 'data_only' ? '✓ passed' : fixture === 'missing_commit' ? '✗ failed' : '? unverified') : OUT[PI_AT_TASK[cid] ?? 'pass']] })), { cursor: taskRows.findIndex(([cid]) => cid === id), focused: focus === 'checks' });
  g.region(1, 3, W - 2, taskRows.length + 1, 'DataTable', '#task-checks');
  const top = height + 2;
  g.box(0, top, W, H - top - 1, { f: focus === 'detail' ? 'ac' : 'ln', title: `${id} · ${outcome}` });
  g.region(0, top, W, H - top - 1, 'VerticalScroll', '#check-detail');
  let y = top + 1;
  for (const [label, value] of [['Expected', expected], ['Observed', observed], ['Target', d.phase === 'H' ? `${task} captured start/end history · never substituted with T7` : `${task} task snapshot ${COMMITS[task]} · disposable copy`], ['Evidence', evidence]]) {
    g.text(2, y++, label, 'bd'); y = para(g, 4, y, W - 6, value, 'mu');
  }
  if (!compact) {
    y++;
    y = para(g, 2, y, W - 4, 'At-task total 27 passed / 30. Final total 27 passed / 30: 19 artifact targets + 11 historical targets. Final T5_persistence passes; T4_lookup regresses. Screenshots and console output alone establish no pass or failure.', 'mu');
  }
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 's', d: 'Shots', go: 'Screenshots' }, { k: 'f', d: 'Final', go: 'FinalRegression' }, { k: 'j', d: 'Judge input', go: 'JudgeHandoff' }]);
  return g;
}

export function finalRegression(sz, focus = 'table') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'R-0928a-4 · final regression · trial 1');
  resultBar(g, false, `UID run_mbp_20260928a · pi_default / trial 1 · delivered T7 ${COMMITS.T7} · 19 artifact + 11 task-history observations`);
  const visible = CHECKS.slice(12); // rendered scroll position includes all three final failures
  g.box(0, 2, W, 21, { f: focus === 'table' ? 'ac' : 'ln', title: 'At-task and final outcomes · scroll 13–30 of 30', sub: '30 unique checks' });
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 19 }, { l: 'Title', w: 39 }, { l: 'Final target', w: 17 }, { l: 'At task', w: 13 }, { l: 'Final', w: 13 }, { l: 'Change', w: W - 103 }], visible.map(([id, title]) => {
    const a = PI_AT_TASK[id] ?? 'pass', f = PI_FINAL[id] ?? 'pass';
    return { v: [id, title, CHECK_DETAILS[id].target === 'task_history' ? 'task history' : 'artifact', ocell(a), ocell(f), a === f ? '=' : a === 'fail' ? 'fixed' : 'regressed'] };
  }), { cursor: 3, focused: focus === 'table' });
  g.region(1, 3, W - 2, 19, 'DataTable', '#regression');
  kv(g, 2, 25, 17, W - 4, [['At each task', '27✓ 3✗ / 30 · task_snapshot or task_history as declared'], ['Final regression', '27✓ 3✗ / 30 · 19 delivered-artifact + 11 historical checks'], ['At-task failures', 'T5_remove · T5_persistence · T6_history'], ['Final failures', 'T4_lookup · T5_remove · T6_history']]);
  para(g, 2, 31, W - 4, 'T5 persistence was repaired; T4 lookup regressed. Missing task commits remain failed when readable history proves no advancement. Unavailable history is unverified. Final evidence never substitutes T7 HEAD for an earlier task boundary.', 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'TaskChecks' }, { k: '↑↓', d: 'Scroll' }, { k: 's', d: 'Shots', go: 'Screenshots' }, { k: 'j', d: 'Judge input', go: 'JudgeHandoff' }]);
  return g;
}

const NOT_PASSED = [
  ['T5_remove', 'failed', 'application_failure', 'Cart line remains after removal'],
  ['T5_persistence', 'failed', 'application_failure', 'Cart lost at task; passes final'],
  ['T6_history', 'failed', 'application_failure', 'Purchase history lost on reopen'],
  ['T4_lookup', 'failed', 'application_failure', 'Current product cannot be found at final'],
  ['T5_persistence', 'unverified', 'missing_prerequisite', 'Missing browser fixture; behavior unobserved'],
  ['T4_commit', 'failed', 'application_failure', 'Readable history proves no task commit'],
  ['T4_commit', 'unverified', 'verifier_error', 'Retained task history unavailable'],
];
export function checkOutcomes(sz, focus = 'table') {
  const g = new Grid(sz.cols, sz.rows), W = g.w;
  header(g, 'AxBenchmark', 'Check outcomes · phase and cause');
  resultBar(g, false, 'Each row retains ResultId · TrialRef · task · phase · observation evidence; fixtures below are separate cases');
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 19 }, { l: 'Outcome', w: 12 }, { l: 'Cause', w: 23 }, { l: 'Reason', w: W - 56 }], NOT_PASSED.map(v => ({ v })), { cursor: 6, focused: focus === 'table' });
  g.region(1, 3, W - 2, 8, 'DataTable', '#not-passed');
  g.box(0, 14, W, 15, { f: focus === 'detail' ? 'ac' : 'ln', title: 'Unverified is distinct from a requirement failure' });
  g.region(0, 14, W, 15, 'Static', '#outcome-detail');
  para(g, 2, 16, W - 4, 'An unavailable observer, missing prerequisite or absent target cannot prove an application failure. A readable before/after repository with no new T4 commit does prove T4_commit failed. A valid T2 data implementation needs no T3 interface. Discovery limits and unsupported storage formats remain visible as limitations.', 'mu');
  buttons(g, W - 3, 26, [{ label: 'Missing commit', go: 'CheckMissingCommit' }, { label: 'History unavailable', go: 'CheckHistoryUnavailable' }, { label: 'T2 data only', go: 'CheckT2WithoutUI' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'Results' }, { k: 'o', d: 'Check', go: 'TaskChecks' }, { k: '/', d: 'Filter' }, { k: 'c', d: 'Cause' }]);
  return g;
}

// ---------------------------------------------------------------- screenshots

export function screenshots(sz, focus = 'list') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'R-0928a-4 · T5_remove · screenshots');
  resultBar(g, false, 'Captured by Playwright for Python after each browser check · 1440×1000 and 390×844 · evidence for inspection, not a pass');
  const lf = focus === 'list';
  g.box(0, 2, W, 8, { f: lf ? 'ac' : 'ln', title: 'T5 screenshots · 8', sub: 'o open in the system viewer' });
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 19 }, { l: 'After step', w: 18 }, { l: 'Viewport', w: 20 }, { l: 'File', w: W - 2 - 67 }, { l: 'Size', w: 10, al: 'right' }], [
    { v: ['T5_remove', '4 · Tab to Remove, Enter', 'desktop 1440×1000', 'verify/T5/T5_remove-desktop.png', '212 KB'] },
    { v: ['T5_remove', '4 · Tab to Remove, Enter', 'mobile 390×844', 'verify/T5/T5_remove-mobile.png', '96 KB'] },
    { v: ['T5_quantity', '3 · quantity set to 3', 'desktop 1440×1000', 'verify/T5/T5_quantity-desktop.png', '208 KB'] },
    { v: ['T5_quantity', '3 · quantity set to 3', 'mobile 390×844', 'verify/T5/T5_quantity-mobile.png', '94 KB'] },
    { v: ['T5_add', '2 · added to the cart', 'desktop · mobile', '2 files', '301 KB'] },
  ], { cursor: 0, focused: lf });
  g.region(1, 3, W - 2, 6, 'DataTable', '#shots');
  // Proportional frames: 1440×1000 and 390×844 at one cell = 7.8×16 px.
  const dh = 24, dw = Math.round(dh * 16 / 7.8 * 1440 / 1000 * 0.92), mw = Math.round(dh * 16 / 7.8 * 390 / 844);
  const frame = (x, w, title, lines) => {
    g.box(x, 11, w, dh, { f: 'ln', title });
    lines.forEach((l, i) => g.text(x + Math.floor((w - len(l)) / 2), 11 + Math.floor(dh / 2) - 2 + i, l, i === 0 ? 'bd' : 'mu'));
  };
  frame(1, dw, 'desktop 1440×1000', ['Screenshot preview', 'terminals cannot show images reliably', 'o opens T5_remove-desktop.png', '', 'shape drawn to scale']);
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
  step(g, m.x, y++, m.w, 'now', 'Running checks · 2 of 2 · T4_commit repository advancement');
  progress(g, m.x + 2, y++, m.w - 2, 50);
  step(g, m.x, y++, m.w, 'todo', 'Screenshots · desktop 1440×1000 · mobile 390×844');
  step(g, m.x, y++, m.w, 'todo', 'Discard the copy · keep snapshot, logs and screenshots');
  g.region(m.x, m.y, m.w, 7, 'Vertical', '#verify-steps');
  y++;
  g.text(m.x, y++, 'So far', 'bd');
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit('T4_lookup Lookup finds a product the user asks for · passed · 1.8 s', m.w - 2));
  y++;
  para(g, m.x, y, m.w, 'A check that cannot run is recorded as unverified with its reason, never as passed. Generated code is never repaired, even when setup exposes a defect.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Hide', v: 'primary', go: 'RunConfig', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Hide · verification continues', go: 'RunConfig' }], '');
  return g;
}

// ---------------------------------------------------------------- what the judge receives

export function judgeHandoff(sz) {
  const g = taskChecks(sz, 'none');
  const m = modal(g, 86, 27, 'Judge input · R-0928a-4', { sel: '#judge-input' });
  let y = m.y;
  g.text(m.x, y++, fit('Prepared by verification for judge A · Claude Code · claude-opus-5-5 · high', m.w), 'bd');
  y++;
  g.text(m.x, y++, 'Given to the judge', 'bd');
  for (const t of [
    `Delivered artifact · T7 snapshot ${COMMITS.T7}`,
    'Specification, the seven task prompts and rubric web v1',
    'Check outcomes · per task and final regression · 27✓ 3✗ each',
    '14 screenshots from the final regression · desktop + mobile per task area',
    'Keyboard traces from the final regression',
    'Browser console errors · 2',
  ]) { g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit(t, m.w - 2)); }
  y++;
  g.text(m.x, y++, 'Kept apart · measured statistics travel separately (M10)', 'bd');
  for (const t of ['Cost, token counts, Gen tok/s, Files / LOC and pricing', 'Elapsed time per task', 'CPU and GPU samples', 'Per-task screenshots · kept in evidence, results and the report']) { g.text(m.x, y, '✗', 'mu'); g.text(m.x + 2, y++, fit(t, m.w - 2), 'mu'); }
  y++;
  para(g, m.x, y, m.w, 'The judge never changes a check outcome: grades and outcomes are stored separately and shown side by side.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open folder' }, { label: 'Close', v: 'primary', go: 'TaskChecks', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'TaskChecks' }], '');
  return g;
}

// ---------------------------------------------------------------- evidence viewer (l, Open log / snapshot / evidence)

const EV_LOG = [
  ['18:41:02', 'verify', 'T5_persistence Cart survives reopening'],
  ['18:41:02', 'verify', `disposable copy of T5 snapshot 4e7a1c9 → /tmp/axb-verify-7f3a/ws`],
  ['18:41:02', 'verify', 'tooling outside the copy · Playwright for Python 1.52'],
  ['18:41:02', 'browser', 'launch chromium (headless) …'],
  ['18:41:03', 'browser', '✗ Executable doesn’t exist at ~/Library/Caches/ms-playwright/chromium-1161/'],
  ['18:41:03', 'browser', '  chrome-mac/Chromium.app/Contents/MacOS/Chromium'],
  ['18:41:03', 'browser', '  the browser was not installed on this machine at verification time'],
  ['18:41:03', 'verify', 'exit 127 after 0.4 s · no step ran'],
  ['18:41:03', 'verify', 'outcome ? unverified · cause: missing prerequisite (browser)'],
  ['18:41:03', 'verify', 'never recorded as passed or failed · no repair attempted'],
  ['18:41:03', 'verify', 'copy discarded · T5 snapshot 4e7a1c9 unchanged'],
];

const EV_FILES = [
  ['checks/T5_persistence.log', 'check log', '1.2 KB'],
  ['checks/final-regression.log', 'check log', '18 KB'],
  ['logs/T5.log', 'task log', '412 KB'],
  ['snapshots/T5 @ 4e7a1c9', 'snapshot', '38 files'],
  ['screenshots/T5_persistence-desktop.png', 'image', '—'],
  ['review/judge-A.json', 'review', '6.1 KB'],
  ['measurements/cost.json', 'measure', '3.4 KB'],
  ['record.yaml', 'record', '9.8 KB'],
];

export function evidenceViewer(sz, focus = 'text') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', compact ? 'R-0928a-3 · evidence' : 'Result R-0928a-3 · evidence');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(compact
    ? 'R-0928a-3 · Grok CLI · checks/T5_persistence.log · read-only'
    : '● Local · mike-mbp-m4 · run 2026-09-28-a · Grok CLI · grok-4.7-fast · read-only · ~/.axbenchmark/results/R-0928a-3/', W - 2));
  g.region(0, 1, W, 1, 'Static', '#evidence-bar');
  const lw = compact ? 0 : 44;
  if (!compact) {
    const ff = focus === 'files';
    g.box(0, 2, lw, 12, { f: ff ? 'ac' : 'ln', title: 'Evidence files · 8' });
    table(g, 1, 3, lw - 2, [{ l: 'File', w: 23 }, { l: 'Kind', w: 10 }, { l: 'Size', w: 9, al: 'right' }], EV_FILES.map((v) => ({ v })), { cursor: 0, focused: ff });
    g.region(1, 3, lw - 2, 9, 'DataTable', '#evidence-files');
    g.box(0, 14, lw, H - 16, { f: 'ln', title: 'File' });
    g.region(0, 14, lw, H - 16, 'Static', '#evidence-meta.kv');
    let y = kv(g, 2, 15, 9, lw - 4, [
      ['Path', 'checks/T5_persistence.log'],
      ['Task', 'T5 Shopping cart · check T5_persistence'],
      ['Size', '1.2 KB · 11 lines · text'],
      ['SHA-256', '5c1e09d2…a77b40e3'],
      ['Payload', '✓ listed in the manifest'],
      ['Written', '2026-09-28 18:41:03'],
    ]);
    para(g, 2, y + 1, lw - 4, 'Read-only evidence retained with the result. Opening a file never changes its outcomes or grades. Long files are paged.', 'mu');
  }
  const tf = focus === 'text', x = lw, w = W - lw, th = H - 4;
  g.box(x, 2, w, th, { f: tf ? 'ac' : 'ln', title: 'checks/T5_persistence.log', sub: 'lines 1–11 of 11 · end' });
  g.region(x, 2, w, th, 'TextArea', '#evidence-text  read_only=True');
  EV_LOG.forEach(([t, src, m], i) => {
    const yy = 3 + i, bad = m.startsWith('✗') || m.includes('unverified');
    if (compact) {
      g.text(x + 2, yy, fit(t.slice(3), 6), 'mu');
      g.text(x + 8, yy, fit(m, w - 10), bad ? 'bd' : '');
    } else {
      g.text(x + 2, yy, fit(String(i + 1), 3, 'right'), 'ln');
      g.text(x + 6, yy, fit(t, 9), 'mu');
      g.text(x + 15, yy, fit(src, 8), 'mu');
      g.text(x + 23, yy, fit(m, w - 25), bad ? 'bd' : '');
    }
  });
  if (!compact) notice(g, x + 2, 3 + EV_LOG.length + 1, w - 4, 'info', 'Opened from Outcomes · T5_persistence · ? unverified', 'Snapshots open as a read-only file list at their commit; images and other binary files open in the system viewer (o).');
  if (compact) {
    footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: 'e', d: 'Files' }, { k: 'o', d: 'Open' }, { k: 'f', d: 'Reveal' }, { k: 'end', d: 'End' }]);
    return g;
  }
  const bx = buttons(g, W - 1, H - 2, [{ label: 'Open externally', focus: focus === 'open' }, { label: 'Reveal in folder' }, { label: 'Back to outcomes', v: 'primary', go: 'ResultOutcomes' }]);
  g.region(bx, H - 2, 17, 1, 'Button', '#open-external');
  g.region(bx + 19, H - 2, 18, 1, 'Button', '#reveal');
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOutcomes' }, { k: '↑↓', d: 'Scroll' }, { k: 'enter', d: 'Show file' }, { k: 'o', d: 'Open externally' }, { k: 'f', d: 'Reveal in folder' }, { k: 'end', d: 'End' }, { k: 'tab', d: 'Pane', do: 'next' }]);
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
