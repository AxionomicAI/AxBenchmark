// M16 · Custom template planning and baseline capture.
// Continues NewTemplate (M01) for the backend example: refactor ~/code/acme-billing from committed HEAD a41f9c2.
// Planner choice, baseline capture and planning, review of the generated draft, editing, regeneration, approval and
// a failed planning run. The draft is never a template until it is approved. All data is fictional.
import { Grid, fit, len, wrap, header, footer, table, tabs, buttons, input, radios, para, kv, notice, modal, progress, scrollbar } from './lib.mjs';
import { SHA, s8, mid, library, newTemplate, step } from './screens.mjs';

const REPO = '~/code/acme-billing';
const BASE = 'a41f9c2';

export const PLAN_TASKS = [
  ['T1', 'Characterize invoice behaviour', 'Map every code path that produces an invoice and add characterization tests for the current HTTP responses before changing anything.', 3, false],
  ['T2', 'Extract an invoice module', 'Create one invoice module and route the existing handlers through it without changing any response.', 2, false],
  ['T3', 'Move tax and discount rules', 'Move tax, rounding and discount rules into the invoice module with unit tests for each rule.', 3, false],
  ['T4', 'Move PDF rendering', 'Move PDF rendering into the invoice module. CSV export stays where it is; it is outside this refactor.', 3, true],
  ['T5', 'Remove duplicated invoice code', 'Delete the invoice code the handlers no longer use and keep the public API unchanged.', 2, false],
  ['T6', 'Unit tests for the module', 'Bring the invoice module to complete unit-test coverage of its public functions.', 3, true],
  ['T7', 'Verify and fix', 'Run the full test suite and the API contract checks, then fix any regression you find. This task is final verification.', 3, false],
];
const CHECKS = PLAN_TASKS.reduce((n, t) => n + t[3], 0);

// ---------------------------------------------------------------- planner choice (over NewTemplate)

export function plannerPicker(sz, focus = 'model') {
  const g = newTemplate(sz, 'none', { repo: true });
  const m = modal(g, 86, 23, 'Planner', { sel: '#planner' });
  let y = m.y;
  g.text(m.x, y, '✗', 'bd'); g.text(m.x + 2, y, fit('Previous choice', 18), 'mu'); g.text(m.x + 20, y++, fit('Grok CLI · grok-4.7 · high', m.w - 20));
  g.text(m.x + 20, y++, fit('authentication failed (M03) → uses the order below', m.w - 20), 'bd');
  y++;
  g.text(m.x, y++, 'First usable harness in this order', 'bd');
  table(g, m.x, y, m.w, [{ l: '#', w: 3 }, { l: 'Harness', w: 13 }, { l: 'Readiness', w: 22 }, { l: 'Discovered default', w: m.w - 38 }], [
    { v: ['1', 'Claude Code', '✓ ready', 'claude-opus-5-5 · high  ← preselected'], f: 'bd' },
    { v: ['2', 'Codex', '✓ ready', 'gpt-6-sol · medium'] },
    { v: ['3', 'Grok CLI', { t: '✗ auth failed', f: 'bd' }, { t: 'skipped · detected but unusable', f: 'mu' }] },
    { v: ['4', 'Pi', '✓ endpoint reachable', 'qwen3.5-35b-a3b · harness default'] },
  ], { cursor: 0, focused: focus === 'order' });
  g.region(m.x, y, m.w, 5, 'DataTable', '#planner-order');
  y += 6;
  const L = 10;
  g.text(m.x, y, 'Harness', 'mu'); input(g, m.x + L, y++, 34, 'Claude Code 3.4.1 · ✓ ready', { focus: focus === 'harness' });
  g.text(m.x, y, 'Model', 'mu'); input(g, m.x + L, y++, 34, 'claude-opus-5-5', { focus: focus === 'model' });
  g.text(m.x, y, 'Effort', 'mu'); radios(g, m.x + L, y++, ['low', 'medium', 'high'], 2, { focus: focus === 'effort' });
  g.region(m.x + L, y - 3, m.w - L, 3, 'Vertical', '#planner-fields');
  y++;
  para(g, m.x, y, m.w, 'A preselection is a convenience, not a quality recommendation. The planner runs headless once; the competitors never see its conversation.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Back', go: 'NewTemplateRepo' }, { label: 'Start planning ▸', v: 'primary', go: 'PlanningProgress', focus: focus === 'start' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'NewTemplateRepo' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Start planning', go: 'PlanningProgress' }], '');
  return g;
}

// ---------------------------------------------------------------- capture and plan (over Library)

export function planningProgress(sz) {
  const g = library(sz, 'none');
  const m = modal(g, 84, 18, 'Planning · Billing service refactor', { sel: '#planning' });
  let y = m.y;
  step(g, m.x, y++, m.w, 'done', `Read ${REPO} · read-only`);
  step(g, m.x, y++, m.w, 'done', `HEAD → ${BASE} “Add invoice PDF export” · pinned, never resolved again`);
  step(g, m.x, y++, m.w, 'done', 'Snapshot of the committed tree · 214 files · 3 uncommitted changes left out');
  step(g, m.x, y++, m.w, 'done', 'Source repository unchanged · same HEAD, same working tree');
  step(g, m.x, y++, m.w, 'now', 'Planning · Claude Code · claude-opus-5-5 · high · headless · 2:41');
  progress(g, m.x + 2, y++, m.w - 2, 60);
  step(g, m.x, y++, m.w, 'todo', 'Check the draft has a specification, tasks, acceptance checks and services');
  step(g, m.x, y++, m.w, 'todo', 'Open the draft for review · nothing is saved before approval');
  g.region(m.x, m.y, m.w, 8, 'Vertical', '#planning-steps');
  y++;
  para(g, m.x, y, m.w, 'The planner works on a disposable copy of the snapshot. Your repository, its branches and uncommitted work are never touched.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Library' }, { label: 'Hide', v: 'primary', go: 'PlanReview', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Hide · planning continues', go: 'PlanReview' }], '');
  return g;
}

// ---------------------------------------------------------------- PlanReviewScreen

const SERVICES = [
  ['setup', 'uv sync --frozen', 'once per configuration, in its own copy'],
  ['start', 'uv run uvicorn billing.app:app --port $PORT', 'port from the configuration’s range'],
  ['ready', 'GET /health → 200 within 30 s', 'start counts as failed otherwise'],
  ['stop', 'SIGTERM, then SIGKILL after 10 s', 'on task end and on explicit stop'],
  ['test', 'uv run pytest -q', 'used by the acceptance checks'],
];

function planChrome(g, sz, tab) {
  const W = g.w, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', compact ? 'Draft · Billing service refactor' : 'New template · Billing service refactor · review the draft');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, '◆', 'bd');
  g.text(3, 1, fit(compact ? `Draft · not approved · backend · ${BASE} snapshot · 2 edits` : `Draft · not approved · backend · baseline ${BASE} · planner Claude Code · claude-opus-5-5 · high · 2 tasks edited`, W - 4), 'bd');
  g.region(0, 1, W, 1, 'Static', '#draft-bar');
  tabs(g, 0, 2, W, compact ? ['Spec', 'Tasks 7', `Checks ${CHECKS}`, 'Services'] : ['Specification', 'Tasks · 7', `Acceptance checks · ${CHECKS}`, 'Setup · start · stop'], tab, { go: [null, 'PlanReview', null, 'PlanServices'] });
  g.region(0, 2, W, 2, 'TabbedContent', '#draft-tabs');
}
const planFooter = (compact) => (compact
  ? [{ k: 'e', d: 'Edit', go: 'PlanEdit' }, { k: 'r', d: 'Regenerate', go: 'PlanRegenerate' }, { k: 'a', d: 'Approve', go: 'PlanApprove' }, { k: 'esc', d: 'Close' }]
  : [{ k: 'esc', d: 'Close · draft kept', go: 'Library' }, { k: '1-4', d: 'Tab' }, { k: 'e', d: 'Edit', go: 'PlanEdit' }, { k: 'r', d: 'Regenerate…', go: 'PlanRegenerate' }, { k: 'a', d: 'Approve and save', go: 'PlanApprove' }, { k: 'tab', d: 'Focus', do: 'next' }]);

export function planReview(sz, focus = 'tasks') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  planChrome(g, sz, 1);
  const tf = focus === 'tasks';
  const rows = PLAN_TASKS.map(([id, t, , c, ed]) => ({ v: [id, t, String(c), ed ? { t: '~ edited', f: 'bd' } : { t: 'generated', f: 'mu' }], go: 'PlanEdit' }));
  if (compact) {
    g.box(0, 4, W, 10, { f: tf ? 'ac' : 'ln', title: 'Tasks · in run order' });
    table(g, 1, 5, W - 2, [{ l: '#', w: 4 }, { l: 'Task', w: W - 2 - 26 }, { l: 'Chk', w: 5, al: 'right' }, { l: '', w: 17 }], rows.map((r) => ({ ...r, v: [r.v[0], r.v[1], r.v[2], r.v[3]] })), { cursor: 3, focused: tf });
    g.region(1, 5, W - 2, 8, 'DataTable', '#draft-tasks');
    g.box(0, 14, W, H - 15, { title: 'T4 · Move PDF rendering', f: focus === 'detail' ? 'ac' : 'ln' });
    para(g, 2, 15, W - 4, PLAN_TASKS[3][2]);
    g.text(2, 18, fit('~ you added the CSV sentence and check T4.3', W - 4), 'mu');
    footer(g, planFooter(true));
    return g;
  }
  g.box(0, 4, 64, 11, { f: tf ? 'ac' : 'ln', title: 'Tasks · in run order', sub: '7 by default · last one verifies' });
  table(g, 1, 5, 62, [{ l: '#', w: 4 }, { l: 'Task', w: 34 }, { l: 'Checks', w: 8, al: 'right' }, { l: 'State', w: 16 }], rows, { cursor: 3, focused: tf });
  g.region(1, 5, 62, 8, 'DataTable', '#draft-tasks');
  g.text(2, 13, fit('A new session per task; files carry state.', 60), 'mu');
  const df = focus === 'detail';
  g.box(64, 4, 56, 25, { f: df ? 'ac' : 'ln', title: 'T4 · Move PDF rendering' });
  g.region(64, 4, 56, 25, 'VerticalScroll', '#task-detail.pane');
  let y = 5;
  g.text(66, y++, 'Prompt', 'bd');
  y = para(g, 66, y, 52, PLAN_TASKS[3][2]) + 1;
  g.text(66, y, '~', 'bd'); y = para(g, 68, y, 50, 'You added “CSV export stays where it is”. The generated text is kept beside your edit.', 'mu') + 1;
  g.text(66, y++, 'Acceptance checks', 'bd');
  [['T4.1', 'GET /invoices/{id}.pdf: same bytes as before'], ['T4.2', 'No PDF code remains outside billing/invoice/'], ['T4.3', '+ CSV export still returns the same file']].forEach(([id, t]) => { g.text(66, y, id, 'mu'); g.text(72, y++, fit(t, 46)); });
  y++;
  g.text(66, y++, 'Runs on', 'bd');
  y = para(g, 66, y, 52, 'The T3 snapshot of each configuration’s own copy. Checks use pytest and HTTP requests against the started service, outside the workspace.', 'mu');

  g.box(0, 15, 64, 14, { f: focus === 'spec' ? 'ac' : 'ln', title: 'Draft summary' });
  g.region(0, 15, 64, 14, 'Static', '#draft-summary.kv');
  kv(g, 2, 16, 13, 60, [
    ['Prompt', 'Refactor the billing service so every invoice…'],
    ['Type', 'backend · rubric backend v1'],
    ['Baseline', `${REPO} @ ${BASE} · 214 files`],
    ['Excluded', '3 uncommitted changes · never part of it'],
    ['Spec', 'spec/00-project.md · 1.1 KB · generated'],
    ['Tasks', '7 · T7 is final verification and fixes'],
    ['Checks', `${CHECKS} · pytest and HTTP contract checks`],
    ['Services', 'setup · start · ready · stop · test'],
    ['Identity', 'none yet · computed when you approve'],
    ['Planner cost', '$0.62 · reported · not a benchmark cost'],
    ['Status', 'draft · competitors never see a draft'],
  ]);
  para(g, 1, 30, W - 2, 'Generation is not approval. Review, edit or regenerate anything; only “Approve and save” creates the template, and a saved template is reused later without calling the planner again.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Edit task', go: 'PlanEdit', focus: focus === 'edit' }, { label: 'Regenerate…', go: 'PlanRegenerate' }, { label: 'Approve and save ▸', v: 'primary', go: 'PlanApprove' }]);
  footer(g, planFooter(false));
  return g;
}

export function planServices(sz, focus = 'services') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  planChrome(g, sz, 3);
  const sf = focus === 'services';
  g.box(0, 4, W, 9, { f: sf ? 'ac' : 'ln', title: 'Setup, start and stop · protocol/services.yaml', sub: 'generated' });
  table(g, 1, 5, W - 2, [{ l: 'Step', w: 8 }, { l: 'Command or rule', w: 50 }, { l: 'When', w: W - 2 - 58 }], SERVICES.map((v) => ({ v })), { cursor: 1, focused: sf });
  g.region(1, 5, W - 2, 6, 'DataTable', '#services');
  g.box(0, 13, 60, 16, { f: focus === 'deps' ? 'ac' : 'ln', title: 'Declared dependencies · deps.yaml' });
  g.region(0, 13, 60, 16, 'Static', '#deps.kv');
  let y = kv(g, 2, 14, 12, 56, [
    ['Runtime', 'Python 3.12 · uv 0.5'],
    ['Packages', 'from uv.lock in the baseline'],
    ['Services', 'none external · SQLite file'],
    ['Network', 'not needed after setup'],
  ]);
  para(g, 2, y + 1, 56, 'Declared, never installed during import. Installed folders (.venv) are excluded from the template and from ZIPs.', 'mu');
  g.box(60, 13, 60, 16, { f: focus === 'protocol' ? 'ac' : 'ln', title: 'Execution protocol · v1' });
  g.region(60, 13, 60, 16, 'Static', '#protocol.kv');
  kv(g, 62, 14, 13, 56, [
    ['Order', 'T1 → T7, one commit per task'],
    ['Sessions', 'new process and conversation per task'],
    ['Timeout', '3:00:00 per task · one trial'],
    ['Checks', 'outside the workspace, on a copy'],
    ['Ports', 'from each configuration’s range'],
  ]);
  para(g, 1, 30, W - 2, 'Setup, start and stop instructions are part of the template and its SHA-256. Editing them later creates a new revision.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Edit', go: 'PlanEdit' }, { label: 'Approve and save ▸', v: 'primary', go: 'PlanApprove', focus: focus === 'approve' }]);
  footer(g, planFooter(false));
  return g;
}

// ---------------------------------------------------------------- edit one task

export function planEdit(sz, focus = 'text') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Edit draft · T4 Move PDF rendering');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit('◆ Draft · edits are saved in the draft as you type · nothing is approved yet', W - 2), 'bd');
  g.region(0, 1, W, 1, 'Static', '#draft-bar');
  g.text(1, 2, 'Title', 'mu'); input(g, 8, 2, 50, 'Move PDF rendering', { focus: focus === 'title' });
  g.region(8, 2, 50, 1, 'Input', '#task-title');
  const tf = focus === 'text';
  g.box(0, 3, 60, 14, { f: tf ? 'ac' : 'ln', title: 'Prompt · tasks/T4.md', fill: 'B0' });
  g.region(0, 3, 60, 14, 'TextArea', '#task-text  language="markdown"');
  const lines = wrap(PLAN_TASKS[3][2], 54);
  lines.forEach((l, i) => g.text(3, 4 + i, l, l.includes('CSV') ? 'bd' : '', { b: 'B0' }));
  if (tf) { const last = lines.length - 1; g.text(3 + len(lines[last]), 4 + last, ' ', 'rv'); }
  g.box(60, 3, 60, 14, { f: focus === 'diff' ? 'ac' : 'ln', title: 'Changes from the generated text' });
  g.region(60, 3, 60, 14, 'Static', '#task-diff');
  let y = 4;
  wrap('Move PDF rendering into the invoice module.', 54).forEach((l) => g.text(62, y++, '= ' + l, 'mu'));
  wrap('CSV export stays where it is; it is outside this refactor.', 54).forEach((l) => g.text(62, y++, '+ ' + l, 'bd'));
  y++;
  para(g, 62, y, 56, 'The generated version is kept so you can compare or reset. Edits only ever change the draft.', 'mu');
  const cf = focus === 'checks';
  g.box(0, 17, W, 10, { f: cf ? 'ac' : 'ln', title: 'Acceptance checks for T4', sub: 'a Add · del Remove' });
  table(g, 1, 18, W - 2, [{ l: 'Id', w: 7 }, { l: 'What it observes', w: 62 }, { l: 'Kind', w: 12 }, { l: 'State', w: W - 2 - 81 }], [
    { v: ['T4.1', 'GET /invoices/{id}.pdf returns the same bytes as before', 'http', 'generated'] },
    { v: ['T4.2', 'No PDF rendering code remains outside billing/invoice/', 'source', 'generated'] },
    { v: ['T4.3', 'CSV export endpoint still returns the same file', 'http', { t: '+ added by you', f: 'bd' }] },
  ], { cursor: 2, focused: cf });
  g.region(1, 18, W - 2, 4, 'DataTable', '#task-checks');
  para(g, 2, 23, W - 4, 'Checks must restate what the prompt asks. A check that adds an obligation the prompt does not state is flagged before approval.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Reset to generated' }, { label: 'Regenerate T4…', go: 'PlanRegenerate' }, { label: 'Done', v: 'primary', go: 'PlanReview', focus: focus === 'done' }]);
  footer(g, [{ k: 'esc', d: 'Done', go: 'PlanReview' }, { k: '^z', d: 'Undo' }, { k: 'a', d: 'Add check' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- regenerate

export function planRegenerate(sz, focus = 'scope') {
  const g = planReview(sz, 'none');
  const m = modal(g, 84, 21, 'Regenerate', { sel: '#regenerate' });
  let y = m.y;
  g.text(m.x, y++, 'What to regenerate', 'bd');
  const sf = focus === 'scope';
  [['● T4 Move PDF rendering and its checks', true], ['○ All tasks, checks and services', false], ['○ The specification only', false]].forEach(([t, on]) => g.text(m.x, y++, fit(t, m.w), on ? (sf ? 'bd' : '') : 'mu', on && sf ? { b: 'BT' } : {}));
  g.region(m.x, y - 3, m.w, 3, 'RadioSet', '#regen-scope');
  y++;
  g.text(m.x, y++, 'Guidance for the planner · optional', 'bd');
  input(g, m.x, y++, m.w, 'Keep CSV export out of scope', { focus: focus === 'guidance' });
  g.region(m.x, y - 1, m.w, 1, 'Input', '#regen-guidance');
  y++;
  y = kv(g, m.x, y, 12, m.w, [
    ['Planner', 'Claude Code · claude-opus-5-5 · high · same as before'],
    ['Your edits', 'T6 stays as you edited it · T4 edits are replaced'],
    ['Result', 'a new draft of T4 to review · not approved'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Regenerating only changes the draft. An approved template is never regenerated; change it by creating a new revision.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'PlanReview' }, { label: 'Regenerate T4', v: 'primary', go: 'PlanReview', focus: focus === 'go' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'PlanReview' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- approve and save

export function planApprove(sz, focus = 'approve') {
  const g = planReview(sz, 'none');
  const m = modal(g, 86, 22, 'Approve and save · Billing service refactor r1', { sel: '#approve-draft' });
  let y = m.y;
  y = kv(g, m.x, y, 12, m.w, [
    ['Type', 'backend · rubric backend v1'],
    ['Baseline', `${REPO} @ ${BASE} · 214 files packaged in the template`],
    ['Tasks', '7 · T4 and T6 edited by you · T7 final verification'],
    ['Checks', `${CHECKS} · no unchecked obligations found`],
    ['Services', 'setup · start · ready · stop · test'],
  ]);
  y++;
  g.text(m.x, y++, 'SHA-256 of the approved content', 'bd');
  g.text(m.x, y++, SHA.billing, 'ac');
  y++;
  ['Every run, ZIP and import uses the packaged baseline; HEAD and branches are never looked up again.', 'Choosing this template later reuses these tasks; the planner is not called.', 'Run configurations are saved separately and never change this hash.'].forEach((t) => { g.text(m.x, y, '·', 'mu'); y = para(g, m.x + 2, y, m.w - 2, t); });
  y++;
  para(g, m.x, y, m.w, `${REPO} is unchanged, including its 3 uncommitted changes.`, 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Back to draft', go: 'PlanReview' }, { label: 'Approve r1', v: 'primary', go: 'TemplateTasks', focus: focus === 'approve' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'PlanReview' }, { k: 'enter', d: 'Approve', go: 'TemplateTasks' }], '');
  return g;
}

// ---------------------------------------------------------------- planning failed

export function planningFailed(sz, focus = 'retry') {
  const g = library(sz, 'none');
  const m = modal(g, 84, 21, 'Planning failed · nothing was saved', { sel: '#planning-failed' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'Claude Code exited 1 after 2:10 · rate limit (429) · no draft produced', null);
  y++;
  step(g, m.x, y++, m.w, 'done', `Baseline snapshot of ${BASE} · kept for a retry`);
  step(g, m.x, y++, m.w, 'fail', 'Planning · stopped · partial output kept in planning/attempt-1.log');
  step(g, m.x, y++, m.w, 'todo', 'Draft review · not available');
  g.region(m.x, m.y + 2, m.w, 3, 'Vertical', '#planning-steps');
  y++;
  y = para(g, m.x, y, m.w, 'A failed plan never becomes a draft, and nothing stands in for it: no partial tasks, no earlier template, and never your live working tree in place of the snapshot.', 'mu');
  y++;
  g.text(m.x, y++, 'Choose how to continue', 'bd');
  const cf = focus === 'retry';
  [['● Retry with the same planner', true], ['○ Choose another planner', false], ['○ Discard the snapshot and close', false]].forEach(([t, on]) => g.text(m.x, y++, fit(t, m.w), on ? (cf ? 'bd' : '') : 'mu', on && cf ? { b: 'BT' } : {}));
  g.region(m.x, y - 3, m.w, 3, 'RadioSet', '#planning-next');
  buttons(g, m.right, m.bottom, [{ label: 'Open log' }, { label: 'Continue', v: 'primary', go: 'PlanningProgress', focus: focus === 'go' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}
