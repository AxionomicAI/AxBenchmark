// M07 · Run configuration and launch validation.
// SetupScreen edits a revision-scoped configuration (entries, policy, judge, weights, execution);
// ReviewLaunchScreen shows exactly what will be frozen; LaunchRecordScreen shows what was frozen. All data is fictional.
import { Grid, fit, len, header, footer, table, button, buttons, radios, para, kv, notice, modal, select, loading } from './lib.mjs';
import { SHA, s8, mid } from './screens.mjs';
import { runConfig } from './screens-execution.mjs';

const ENTRIES = [
  ['1', 'Claude Code', 'Anthropic', 'claude-opus-5-5', 'medium', 'clean', '✓ ready'],
  ['2', 'Claude Code', 'Anthropic', 'claude-opus-5-5', 'high', 'clean', '✓ ready · queued after #1'],
  ['3', 'Codex', 'OpenAI', 'gpt-6-sol', 'medium', 'clean', '✓ ready'],
  ['4', 'Grok CLI', 'xAI', 'grok-4.7-fast', 'harness default', 'clean', '✓ ready · no effort argument'],
  ['5', 'Pi', 'local · llama.cpp', 'qwen3.5-35b-a3b', 'harness default', 'clean', '✓ endpoint reachable'],
];
const INVALID = {
  '3': ['max', { t: '✗ effort max not supported (M04)', f: 'bd' }],
  '4': [null, { t: '✗ authentication failed (M03)', f: 'bd' }],
};
const entryRows = (invalid) => ENTRIES.map((e) => {
  const bad = invalid && INVALID[e[0]];
  return { v: [e[0], e[1], e[2], e[3], bad && bad[0] ? { t: bad[0], f: 'bd ul' } : e[4], e[5], bad ? bad[1] : e[6]] };
});

const idBar = (g, compact, extra) => {
  g.fill(0, 1, g.w, 1, 'B1');
  g.text(1, 1, fit(compact
    ? `★ r1 · sha256 ${s8(SHA.inv1)}…${SHA.inv1.slice(-8)} · built-in · no planner call`
    : `★ Inventory web app · r1 · sha256 ${mid(SHA.inv1)} · built-in · approved tasks reused, no planner call${extra ?? ''}`, g.w - 2));
  g.region(0, 1, g.w, 1, 'Static', '#identity-bar');
};

// ---------------------------------------------------------------- SetupScreen

export function setup(sz, focus = 'entries', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const inv = !!st.invalid;
  header(g, 'AxBenchmark', compact ? 'Setup · r1' : 'Setup · Inventory web app r1');
  idBar(g, compact);
  g.text(1, 2, compact ? 'Config' : 'Configuration', 'mu');
  const cx = compact ? 8 : 15;
  select(g, cx, 2, compact ? 30 : 36, 'Four harnesses · defaults', { focus: focus === 'config' });
  g.region(cx, 2, compact ? 30 : 36, 1, 'Select', '#configuration');
  const dirty = compact ? '● edited · ^s save' : '● edited · 5 entries, saved file has 4 · ^s Save';
  g.text(W - 1 - len(dirty), 2, dirty, 'bd');

  const ef = focus === 'entries';
  g.box(0, 3, W, 8, { f: ef ? 'ac' : 'ln', title: 'Competitor entries · 5', sub: compact ? 'a add · p policy' : 'a Add · e Edit · p Policy · del Remove' });
  if (compact) {
    table(g, 1, 4, W - 2, [{ l: '#', w: 3 }, { l: 'Harness', w: 12 }, { l: 'Model', w: 17 }, { l: 'Effort', w: 16 }, { l: 'Env', w: 7 }, { l: 'Ready', w: W - 2 - 55 }],
      entryRows(inv).map((r) => ({ v: [r.v[0], r.v[1], r.v[3], r.v[4], r.v[5], typeof r.v[6] === 'string' ? r.v[6].replace('queued after', 'after').replace(' argument', ' arg').replace('endpoint reachable', 'endpoint') : r.v[6]] })), { cursor: inv ? 3 : 1, focused: ef });
  } else {
    table(g, 1, 4, W - 2, [{ l: '#', w: 3 }, { l: 'Harness', w: 13 }, { l: 'Provider', w: 19 }, { l: 'Model', w: 18 }, { l: 'Effort', w: 17 }, { l: 'Env', w: 8 }, { l: 'Readiness', w: W - 2 - 78 }],
      entryRows(inv), { cursor: inv ? 3 : 1, focused: ef });
  }
  g.region(1, 4, W - 2, 6, 'DataTable', '#entries');

  if (compact) {
    let y = 11;
    const line = (k, v, key, go, f = '') => {
      g.text(1, y, fit(k, 9), 'mu'); g.text(10, y, fit(v, W - 15), f);
      if (key) { g.text(W - 3, y, key, 'ac bd'); if (go) g.link(W - 3, y, 1, 1, 'go:' + go); }
      y++;
    };
    line('Judge', 'Claude Code · claude-opus-5-5 · high · saved judge', 'j', 'JudgePicker');
    line('Rubric', 'web v1 · from the template · same for every entry');
    line('Weights', 'quality web v1 · ranking equal thirds · resolved at launch', 'w', 'WeightsEditor');
    line('Run', 'one per harness, up to 4 · Claude Code #2 waits for #1');
    g.region(1, 11, W - 2, 4, 'Static', '#setup-summary.kv');
    y++;
    if (inv) notice(g, 1, y, W - 2, 'error', '3 issues block launch', 'Codex effort, Grok CLI authentication, ranking preset. Press v to list them.');
    else notice(g, 1, y, W - 2, 'warning', 'CPU and GPU power unavailable', 'Optional metrics (permission). The run is unaffected.');
    buttons(g, W - 1, H - 2, [{ label: 'Save' }, { label: 'Review and launch ▸', v: 'primary', off: inv, go: inv ? undefined : 'ReviewLaunch', focus: focus === 'review' }]);
    footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateConfigs' }, { k: 'a', d: 'Add', go: 'ModelPicker' }, { k: 'j', d: 'Judge', go: 'JudgePicker' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'enter', d: 'Review', go: inv ? undefined : 'ReviewLaunch', off: inv }]);
    return g;
  }

  const jf = focus === 'judge';
  g.box(0, 11, 60, 12, { f: jf ? 'ac' : 'ln', title: 'Judge · independent of the entries' });
  g.region(0, 11, 60, 12, 'Vertical', '#judge-pane.pane');
  let y = kv(g, 2, 12, 12, 56, [
    ['Judge', 'Claude Code · claude-opus-5-5 · high'],
    ['Chosen by', '1 · saved judge of this configuration'],
    ['Readiness', '✓ ready · effort high known supported'],
    ['Rubric', 'web v1 · from the template'],
    ['Profile', 'one grading profile for every entry'],
  ]);
  y = para(g, 2, y + 1, 56, 'Preselection is a convenience, never a statement about model quality.', 'mu');
  button(g, 2, 21, 'Change judge…', { go: 'JudgePicker', focus: jf });

  const wf = focus === 'weights';
  g.box(60, 11, 60, 12, { f: wf ? 'ac' : 'ln', title: 'Scoring weights · resolved at launch' });
  g.region(60, 11, 60, 12, 'Vertical', '#weights-pane.pane');
  g.text(62, 12, 'Quality', 'mu'); select(g, 71, 12, 30, 'web v1 defaults');
  g.text(62, 13, fit('UX 25 Visual 15 Code 20 Spec 25 Robust 10 A11y 5', 56));
  g.text(62, 15, 'Ranking', 'mu'); select(g, 71, 15, 30, inv ? 'Team preset · missing' : 'Equal thirds', { f: inv ? 'bd' : '' });
  g.text(62, 16, fit(inv ? '✗ preset file was deleted · choose another or edit' : 'cost 33.3% · time 33.3% · quality 33.3%', 56), inv ? 'bd' : '');
  para(g, 62, 18, 56, 'The preset is copied into the launch as its original weights; later preset edits never change this run.', 'mu');
  button(g, 62, 21, 'Edit weights…', { go: 'WeightsEditor', focus: wf });

  const xf = focus === 'execution';
  g.box(0, 23, W, 7, { f: xf ? 'ac' : 'ln', title: 'Execution' });
  g.region(0, 23, W, 7, 'Vertical', '#execution-pane.pane');
  g.text(2, 24, fit('Concurrency', 15), 'mu');
  g.text(17, 24, '● One configuration per harness, up to 4 at once', xf ? 'bd' : '', xf ? { b: 'BT' } : {});
  g.text(17, 25, '○ Sequential (same as --jobs 1)', 'mu');
  g.region(17, 24, 50, 2, 'RadioSet', '#concurrency');
  kv(g, 2, 26, 15, W - 4, [
    ['Same harness', 'entries of one harness run one after another · Claude Code #2 starts after #1'],
    ['Tasks', 'sequential within each configuration · T1 → T7'],
    ['Timeouts', 'execution protocol v1 defaults (M11)'],
  ]);

  if (inv) {
    y = notice(g, 1, 31, W - 2, 'error', '3 issues block launch — nothing is substituted', null);
    [['Entry 3 · Codex', 'effort max is not supported for gpt-6-sol on Codex 0.98.0 · choose low, medium or high', 'e'],
      ['Entry 4 · Grok CLI', 'authentication failed (401) · fix in Environment or remove the entry', 'F2'],
      ['Ranking weights', 'preset “Team preset” no longer exists · weights cannot stay unresolved', 'w']].forEach(([a, b, k]) => {
      g.text(3, y, fit(a, 19), 'bd'); g.text(22, y, fit(b, W - 30)); g.text(W - 6, y, k, 'ac bd'); y++;
    });
    g.region(1, 31, W - 2, 4, 'Static', '#validation.notice.-error');
  } else {
    notice(g, 1, 31, W - 2, 'warning', 'CPU and GPU power unavailable on mike-mbp-m4', 'Optional metrics (powermetrics needs root). The run is unaffected and the results say why the metric is missing.');
    g.region(1, 31, W - 2, 3, 'Static', '#limitations.notice.-warning');
  }
  buttons(g, W - 1, H - 2, [{ label: 'Save configuration' }, { label: 'Save as…' }, { label: 'Review and launch ▸', v: 'primary', off: inv, go: inv ? undefined : 'ReviewLaunch', focus: focus === 'review' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateConfigs' }, { k: 'a', d: 'Add entry', go: 'ModelPicker' }, { k: 'p', d: 'Policy', go: 'EnvPolicy' }, { k: 'j', d: 'Judge', go: 'JudgePicker' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: '^s', d: 'Save' }, { k: 'enter', d: 'Review', go: inv ? undefined : 'ReviewLaunch', off: inv }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- judge picker

export function judgePicker(sz, focus = 'model', st = {}) {
  const g = setup(sz, 'none');
  const fb = !!st.fallback;
  const m = modal(g, 86, 25, 'Judge', { sel: '#judge' });
  let y = m.y;
  g.text(m.x, y++, 'Preselection · first valid candidate wins', 'bd');
  const branch = (n, mark, label, value, note, on) => {
    g.text(m.x, y, `${n}`, 'mu'); g.text(m.x + 2, y, mark, mark === '✓' ? 'ac' : mark === '✗' ? 'bd' : 'mu');
    g.text(m.x + 4, y, fit(label, 26), on ? 'bd' : 'mu');
    g.text(m.x + 30, y, fit(value, m.w - 30), on ? 'bd' : mark === '✗' ? '' : 'mu'); y++;
    if (note) { g.text(m.x + 30, y, fit(note, m.w - 30), mark === '✗' ? 'bd' : 'mu'); y++; }
  };
  if (fb) {
    branch(1, '✗', 'Saved judge', 'Grok CLI · grok-4.7 · high', 'authentication failed (M03) → skipped', false);
    branch(2, '○', 'Planner configuration', 'not used · built-in template, no planning', null, false);
    branch(3, '✓', 'First usable entry', 'Claude Code · claude-opus-5-5 · medium', '← preselected', true);
  } else {
    branch(1, '✓', 'Saved judge', 'Claude Code · claude-opus-5-5 · high', '← preselected', true);
    branch(2, '○', 'Planner configuration', 'not used · built-in template, no planning', null, false);
    branch(3, '○', 'First usable entry', 'Claude Code · claude-opus-5-5 · medium', null, false);
  }
  g.region(m.x, m.y + 1, m.w, y - m.y - 1, 'Static', '#preselection');
  y++;
  g.text(m.x, y++, 'Judge', 'bd');
  const L = 10;
  g.text(m.x, y, 'Harness', 'mu'); select(g, m.x + L, y++, 34, 'Claude Code 3.4.1 · ✓ ready', { focus: focus === 'harness' });
  g.text(m.x, y, 'Model', 'mu'); select(g, m.x + L, y++, 34, 'claude-opus-5-5', { focus: focus === 'model' });
  g.text(m.x, y, 'Effort', 'mu'); radios(g, m.x + L, y++, ['low', 'medium', 'high'], fb ? 1 : 2, { focus: focus === 'effort' });
  g.region(m.x + L, y - 3, m.w - L, 3, 'Vertical', '#judge-fields');
  y++;
  y = kv(g, m.x, y, L, m.w, [['Rubric', 'web v1 · from the template · same for every entry'], ['Checked', '✓ ready in Environment · effort known supported in the catalog']]);
  y++;
  if (fb) notice(g, m.x, y, m.w, 'warning', 'Preselected by fallback', 'The saved judge is unusable, so the first usable entry was chosen. Confirm it before launch; nothing is assumed to work.');
  else para(g, m.x, y, m.w, 'The judge is chosen separately from the competitors. A default is a convenience, not a recommendation about model quality.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Setup' }, { label: 'Use this judge', v: 'primary', go: 'Setup', focus: focus === 'use' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Use judge', go: 'Setup' }], '');
  return g;
}

// ---------------------------------------------------------------- review before launch

export function reviewLaunch(sz, focus = 'launch') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', 'Review before launch');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, '●', 'ac'); g.text(3, 1, fit(compact ? 'This is what will be frozen · nothing runs yet' : 'Everything below is exactly what will be frozen and run · nothing starts until Launch', W - 4));
  g.region(0, 1, W, 1, 'Static', '#review-bar');
  if (compact) {
    let y = 2;
    const line = (k, v, f = '') => { g.text(1, y, fit(k, 10), 'mu'); g.text(11, y++, fit(v, W - 12), f); };
    line('Template', `Inventory web app r1 · ${s8(SHA.inv1)}…${SHA.inv1.slice(-8)}`, 'bd');
    line('Tasks', '7 approved · reused · no planner call');
    y++;
    g.box(0, y, W, 8, { title: 'Competitors · 5', f: focus === 'entries' ? 'ac' : 'ln' });
    table(g, 1, y + 1, W - 2, [{ l: '#', w: 3 }, { l: 'Harness', w: 12 }, { l: 'Model', w: 17 }, { l: 'Effort', w: 16 }, { l: 'Note', w: W - 2 - 48 }],
      ENTRIES.map((e) => ({ v: [e[0], e[1], e[3], e[4], e[0] === '2' ? 'after #1' : e[0] === '4' ? 'no effort arg' : e[0] === '5' ? 'local endpoint' : 'clean'] })));
    y += 8;
    line('Judge', 'Claude Code · claude-opus-5-5 · high · rubric web v1');
    line('Weights', 'quality 25 15 20 25 10 5 · ranking 1:1:1');
    line('Run', 'up to 4 at once · clean for all 5');
    line('Recorded', 'mike-mbp-m4 · catalog 2026.09.2 · credentials redacted', 'mu');
    buttons(g, W - 1, H - 2, [{ label: 'Back', go: 'Setup' }, { label: 'Launch ▸', v: 'primary', go: 'LaunchCheck', focus: focus === 'launch' }]);
    footer(g, [{ k: 'esc', d: 'Back', go: 'Setup' }, { k: 'c', d: 'Copy CLI' }, { k: '^l', d: 'Launch', go: 'LaunchCheck' }]);
    return g;
  }
  let y = 2;
  const sec = (t) => { g.text(1, y, t, 'bd'); g.hline(len(t) + 2, y, W - len(t) - 3); y++; };
  sec('Template');
  y = kv(g, 1, y, 14, W - 2, [
    ['Revision', 'Inventory web app · r1 · ★ built-in · Frontend · 7 approved tasks reused · no planner call'],
    ['SHA-256', SHA.inv1],
    ['Baseline', `empty project · ${s8(SHA.empty)}… · one copy per entry`],
  ]);
  g.region(1, 3, W - 2, 3, 'Static', '#review-template.kv');
  y++;
  sec('Competitors · 5');
  const ef = focus === 'entries';
  table(g, 1, y, W - 2, [{ l: '#', w: 3 }, { l: 'Harness', w: 13 }, { l: 'Provider', w: 19 }, { l: 'Model', w: 18 }, { l: 'Effort requested', w: 18 }, { l: 'Env', w: 7 }, { l: 'Readiness and limitations', w: W - 2 - 78 }],
    ENTRIES.map((e) => ({ v: [e[0], e[1], e[2], e[3], e[4], e[5], e[0] === '2' ? '✓ starts after #1 (same harness)' : e[0] === '4' ? '✓ effort unknown → no argument' : e[0] === '5' ? '✓ local endpoint · no metered price' : '✓ ready · no isolation limits'] })), { cursor: ef ? 0 : -1, focused: ef });
  g.region(1, y, W - 2, 6, 'DataTable', '#review-entries');
  y += 7;
  sec('Judge, rubric and weights');
  y = kv(g, 1, y, 14, W - 2, [
    ['Judge', 'Claude Code · claude-opus-5-5 · high · saved judge · ✓ ready'],
    ['Rubric', 'web v1 from the template · one grading profile for all 5 entries'],
    ['Quality', 'preset web v1 defaults → UX 25 · Visual 15 · Code 20 · Spec 25 · Robust 10 · A11y 5'],
    ['Ranking', 'preset Equal thirds → cost 1 · time 1 · quality 1 (33.3% each) · frozen as original weights'],
  ]);
  y++;
  sec('Execution and environment');
  y = kv(g, 1, y, 14, W - 2, [
    ['Concurrency', 'one configuration per harness, up to 4 at once · Claude Code #2 after #1 · tasks sequential'],
    ['Policy', 'clean for all 5 entries · managed settings · no isolation limitations'],
    ['Timeouts', 'execution protocol v1 defaults (M11)'],
    ['Optional', '▲ CPU and GPU power unavailable (permission) · run unaffected'],
  ]);
  y++;
  sec('Recorded with every result');
  kv(g, 1, y, 14, W - 2, [
    ['Machine', 'mike-mbp-m4 · macOS 26.0 · Apple M4 Pro · 48 GB'],
    ['Catalog', 'catalog 2026.09.2 · discovered 21:38 for each harness version'],
    ['Credentials', 'never recorded · keys appear as “set” in exports, logs and reports'],
  ]);
  buttons(g, W - 1, H - 2, [{ label: 'Back to setup', go: 'Setup' }, { label: 'Copy as CLI command' }, { label: 'Launch ▸', v: 'primary', go: 'LaunchCheck', focus: focus === 'launch' }]);
  footer(g, [{ k: 'esc', d: 'Back to setup', go: 'Setup' }, { k: 'c', d: 'Copy CLI command' }, { k: '^l', d: 'Launch', go: 'LaunchCheck' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- launch record (what was frozen)

export function launchRecord(sz) {
  const g = runConfig(sz, 'none');
  const m = modal(g, 86, 28, 'Launch record · run 2026-10-01-a', { sel: '#launch-record' });
  let y = m.y;
  g.text(m.x, y++, fit('Frozen at 20:58:47 before the first task · read-only', m.w), 'bd');
  y++;
  const rec = (title, digest, lines) => {
    g.text(m.x, y, '■', 'ac'); g.text(m.x + 2, y, fit(title, 30), 'bd'); g.text(m.x + 32, y++, fit(digest, m.w - 32), 'mu');
    lines.forEach((l) => g.text(m.x + 2, y++, fit(l, m.w - 2), 'mu'));
  };
  rec('Template identity', `sha256 ${s8(SHA.inv1)}…${SHA.inv1.slice(-8)}`, ['recomputed and matched r1 · every result binds to it']);
  rec('Resolved configuration', `cfg ${s8(SHA.cfg)}…`, ['4 entries · policy clean · judge Claude Code · claude-opus-5-5 · high']);
  rec('Original weights', `wts ${s8(SHA.billing)}…`, ['quality web v1 25 15 20 25 10 5 · ranking 1:1:1']);
  rec('Machine and catalog', 'captured', ['mike-mbp-m4 · macOS 26.0 · catalog 2026.09.2 + discovered 20:57']);
  y++;
  g.text(m.x, y++, 'configuration.resolved.yaml · excerpt', 'bd');
  g.box(m.x, y, m.w, 7, { fill: 'B0', f: 'ln' });
  ['entries:', '  - harness: codex          # 0.98.0', '    model: gpt-6-sol', '    effort: medium', '    credentials: OPENAI_API_KEY (set · value redacted)'].forEach((l, i) => g.text(m.x + 2, y + 1 + i, fit(l, m.w - 4), '', { b: 'B0' }));
  g.region(m.x, y, m.w, 7, 'TextArea', '#resolved-yaml  read_only=True');
  y += 8;
  para(g, m.x, y, m.w, 'Later edits to the configuration or presets affect future runs only. If template inputs change during the run, its claim to r1 is invalidated, never relabelled.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Copy path' }, { label: 'Close', v: 'primary', go: 'RunConfig', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'RunConfig' }, { k: 'c', d: 'Copy path' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const SETUP_WIDGET_STATES = [
  { widget: 'DataTable#entries', label: 'M07 · Competitor entries', states: [
    ['Loading', mini('Competitor entries', (g, x, y, w) => loading(g, x, y + 1, w, 'Resolving 5 entries against readiness…'))],
    ['Empty', mini('Competitor entries · 0', (g, x, y, w) => { centered(g, y + 1, 'No entries yet', 'bd'); centered(g, y + 2, 'Add at least one harness, model and effort.', 'mu'); centered(g, y + 4, 'a Add entry', 'ac'); })],
    ['Error', mini('Competitor entries', (g, x, y, w) => { notice(g, x, y, w, 'error', 'four-harnesses.yaml pins another SHA-256', 'The file pins 9c41d0b5 (r2), not r1. Open it from r2, or save a copy for r1.'); })],
  ] },
];
