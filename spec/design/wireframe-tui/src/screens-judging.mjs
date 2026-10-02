// M12 · Independent quality judging.
// JudgingScreen follows the sequential reviews of a finished run (one fresh headless session per artifact, anonymous
// labels, no measured statistics); ReviewScreen shows one complete raw review; dialogs cover an ungraded response,
// a judge that cannot inspect screenshots, and the two grading profiles. All data is fictional.
import { Grid, fit, len, header, footer, table, buttons, para, kv, notice, modal, progress, scrollbar } from './lib.mjs';
import { SHA, s8 } from './screens.mjs';
import { setup } from './screens-setup.mjs';
import { byId, JUDGES, QCATS, QW, quality, normalize, f2, stats, TRIAL_RUN, TRIAL_CONFIGS, BACKEND_CATS, trialGates } from './results-data.mjs';

const JUDGE = JUDGES.A.long;
const pct = (x) => `${Math.round(x * 100)}%`;
const g1 = (n) => n.toFixed(1);

// Run 2026-10-01-a after execution. Labels are what the judge sees; the mapping stays with AxBenchmark.
const QUEUE = [
  { l: 'Artifact A', cfg: 'Claude Code · claude-opus-5-5 · medium', st: 'graded', g: [4.5, 4, 4, 5, 4, 3.5], s: '3:12', c: '$0.41' },
  { l: 'Artifact B', cfg: 'Pi · qwen3.5-35b-a3b · default', st: 'graded', g: [3.5, 3, 4, 3.5, 3, 3], s: '3:48', c: '$0.44' },
  { l: 'Artifact C', cfg: 'Codex · gpt-6-sol · medium', st: 'now', s: '1:57', c: '$0.22 so far' },
  { l: 'Artifact D', cfg: 'Grok CLI · grok-4.7-fast · default', st: 'queued' },
];

// ---------------------------------------------------------------- JudgingScreen

export function judging(sz, focus = 'queue', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const ung = !!st.ungraded;
  header(g, 'AxBenchmark', compact ? 'Judging · 2026-10-01-a' : 'Run 2026-10-01-a · independent judging');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, '●', 'ac');
  g.text(3, 1, fit(compact ? `${ung ? '3 of 4 done · 1 ungraded' : 'Reviewing 3 of 4'} · one fresh session each` : `${ung ? 'Judging finished · 3 graded · 1 ungraded' : 'Reviewing artifact 3 of 4'} · judge claude-opus-5-5 · high · rubric web v1 · one fresh session per artifact, in order`, W - 4));
  g.region(0, 1, W, 1, 'Static', '#judging-bar');
  const q = ung ? [QUEUE[0], QUEUE[1], { ...QUEUE[2], st: 'graded', g: [4, 4, 4.5, 4, 4, 3.5], s: '3:31', c: '$0.43' }, { ...QUEUE[3], st: 'ungraded', s: '2:56', c: '$0.39' }] : QUEUE;
  const qf = focus === 'queue';
  const rowOf = (a) => {
    const stc = { graded: '✓ graded', now: '● reviewing', queued: '○ queued', ungraded: '✗ ungraded' }[a.st];
    const grades = a.g ? a.g.map(g1).join(' ') : a.st === 'ungraded' ? '4.0 3.5 4.0 4.0 3.7 —' : '';
    return { v: [a.l, { t: stc, f: a.st === 'now' ? 'ac' : a.st === 'ungraded' ? 'bd' : a.st === 'queued' ? 'mu' : '' }, a.cfg, grades, a.s ?? '—', a.c ?? '—'], go: a.st === 'ungraded' ? 'ReviewUngraded' : a.st === 'graded' ? 'ReviewDetail' : undefined };
  };
  if (compact) {
    g.box(0, 2, W, 7, { f: qf ? 'ac' : 'ln', title: 'Reviews · sequential' });
    table(g, 1, 3, W - 2, [{ l: 'Label', w: 12 }, { l: 'Status', w: 13 }, { l: 'Grades', w: 25 }, { l: 'Time', w: 6 }, { l: 'Cost', w: W - 2 - 56 }],
      q.map(rowOf).map((r) => ({ ...r, v: [r.v[0], r.v[1], r.v[3], r.v[4], r.v[5]] })), { cursor: ung ? 3 : 2, focused: qf });
    g.region(1, 3, W - 2, 5, 'DataTable', '#reviews');
    g.box(0, 9, W, H - 10, { title: 'This session gets · never gets', f: focus === 'inputs' ? 'ac' : 'ln' });
    g.region(0, 9, W, H - 10, 'Static', '#inputs');
    [['✓', 'artifact C · spec, prompts, source · rubric web v1'], ['✓', 'check outcomes · 14 shots from the final regression'], ['✗', 'cost, time, tokens · other reviews · names'], ['✗', 'which configuration made artifact C']].forEach(([gl, t], i) => { g.text(2, 10 + i, gl, gl === '✓' ? 'ac' : 'mu'); g.text(4, 10 + i, fit(t, W - 6), gl === '✓' ? '' : 'mu'); });
    para(g, 2, 15, W - 4, 'The judge inspects only. It never edits or repairs the artifact.', 'mu');
    footer(g, [{ k: 'enter', d: 'Open review', go: 'ReviewDetail' }, { k: 'p', d: 'Profiles', go: 'RubricProfiles' }, { k: 'd', d: 'Detach' }]);
    return g;
  }
  g.box(0, 2, W, 8, { f: qf ? 'ac' : 'ln', title: 'Reviews · one artifact per session, in order', sub: 'grades 1–5 in steps of 0.5' });
  table(g, 1, 3, W - 2, [{ l: 'Label', w: 12 }, { l: 'Status', w: 13 }, { l: 'Configuration · visible to you only', w: 39 }, { l: 'Grades · UX → A11y', w: 29 }, { l: 'Time', w: 6, al: 'right' }, { l: 'Judging cost', w: W - 2 - 99, al: 'right' }],
    q.map(rowOf), { cursor: ung ? 3 : 2, focused: qf });
  g.region(1, 3, W - 2, 5, 'DataTable', '#reviews');
  g.text(2, 8, fit('Judging cost is recorded separately (M10) and never added to a competitor’s cost.', W - 4), 'mu');

  if (ung) {
    let y = notice(g, 1, 11, W - 2, 'error', 'Artifact D · Grok CLI · grok-4.7-fast · ungraded', 'The response was kept but is incomplete: Accessibility has no grade, Robustness 3.7 is not a half step, and Visual quality has no evidence reference. Nothing was filled in; D has no quality score until an explicit new review.');
    g.region(1, 11, W - 2, y - 11, 'Static', '#ungraded.notice.-error');
    buttons(g, W - 1, y + 1, [{ label: 'Open ungraded review', go: 'ReviewUngraded', focus: focus === 'open' }]);
  } else {
    const nf = focus === 'now';
    g.box(0, 10, 60, 21, { f: nf ? 'ac' : 'ln', title: 'Artifact C · session 3 of 4' });
    g.region(0, 10, 60, 21, 'Vertical', '#current.pane');
    let y = kv(g, 2, 11, 11, 56, [
      ['Session', 'new headless Claude Code process · pid 52310'],
      ['History', 'none · no earlier artifact or review'],
      ['Started', '22:14:40 · 1:57 so far'],
    ]);
    y++;
    g.text(2, y++, 'Inspecting screenshots · 9 of 14', 'bd');
    progress(g, 2, y++, 56, 64);
    y++;
    ['read spec/00-project.md and 7 task prompts', 'read src/ · 14 files · no file was changed', 'opened check outcomes · 21✓ at final regression', 'viewing final regression · cart · 390×844'].forEach((t, i, a) => { g.text(2, y, i === a.length - 1 ? '●' : '✓', 'ac'); g.text(4, y++, fit(t, 54), i === a.length - 1 ? 'bd' : ''); });
    y++;
    para(g, 2, y, 56, 'Read-only workspace copy: the judge inspects and assesses, it never repairs the application.', 'mu');

    const inf = focus === 'inputs';
    g.box(60, 10, 60, 21, { f: inf ? 'ac' : 'ln', title: 'Inputs to this session' });
    g.region(60, 10, 60, 21, 'Static', '#inputs');
    y = 11;
    g.text(62, y++, 'Given', 'bd');
    ['Artifact C · delivered snapshot at T7', 'Specification, the 7 task prompts and their source', 'Rubric web v1 and the 1 · 3 · 5 anchors', 'Check outcomes, console errors, 14 screenshots', 'from the final regression · 1440×1000 and 390×844'].forEach((t) => { g.text(62, y, '✓', 'ac'); g.text(64, y++, fit(t, 54)); });
    y++;
    g.text(62, y++, 'Never given', 'bd');
    ['Cost, elapsed time, tokens, pricing', 'Reviews of artifacts A, B and D', 'Harness, model and configuration names', 'The label → result mapping'].forEach((t) => { g.text(62, y, '✗', 'mu'); g.text(64, y++, fit(t, 54), 'mu'); });
    y++;
    para(g, 62, y, 56, 'Per-task screenshots stay in evidence and the report; they are not judge input.', 'mu');
  }
  const ay = ung ? 19 : 31;
  para(g, 1, ay + 1, W - 2, 'Grades are the judge’s raw output. Weighted quality and combined scores are computed by AxBenchmark (M06), so changing weights never needs another session. A good review cannot turn a failed check or a failed process into a success.', 'mu');
  footer(g, [{ k: 'enter', d: 'Open review', go: 'ReviewDetail' }, { k: 'p', d: 'Grading profiles', go: 'RubricProfiles' }, { k: 'd', d: 'Detach · judging continues' }, { k: 's', d: 'Stop judging' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- JudgingScreen · 3 trials per configuration (D7)

export function judgingTrials(sz, focus = 'queue') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const R = TRIAL_RUN;
  header(g, 'AxBenchmark', `Run ${R.run} · ${R.template} · independent judging`);
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, '✓', 'ac');
  g.text(3, 1, fit(`Judging finished · 6 sessions · 2 configurations × ${R.trials} trials · judge claude-opus-5-5 · high · backend v1 · one per trial`, W - 4));
  g.region(0, 1, W, 1, 'Static', '#judging-bar');
  const L = 'ABCDEF';
  const all = TRIAL_CONFIGS.flatMap((c, ci) => c.trials.map((t, ti) => ({ c, t, l: `Artifact ${L[ci * 3 + ti]}` })));
  // the judge saw the artifacts in a shuffled order; the label never says which trial or configuration it is
  const qf = focus === 'queue';
  g.box(0, 2, W, 10, { f: qf ? 'ac' : 'ln', title: 'Reviews · one session per trial, in order', sub: 'grades 1–5 in steps of 0.5' });
  table(g, 1, 3, W - 2, [{ l: 'Label', w: 12 }, { l: 'Status', w: 11 }, { l: 'Configuration · trial · visible to you only', w: 48 }, { l: 'Grades · DX → Ops', w: 29 }, { l: 'Q', w: 6, al: 'right' }, { l: 'Time', w: W - 2 - 106, al: 'right' }],
    all.map(({ c, t, l }, i) => ({ v: [l, '✓ graded', `${c.h} · ${c.model} · trial ${t.trial} of ${c.trials.length}`, t.g.map((n) => n.toFixed(1)).join(' '), f2(quality(t.g)), ['3:02', '3:17', '2:58', '3:21', '3:09', '3:14'][i]] })), { cursor: 4, focused: qf });
  g.region(1, 3, W - 2, 7, 'DataTable', '#reviews');
  g.text(2, 10, fit('Each trial is its own artifact and fresh session; the judge never sees two trials together or compares them.', W - 4), 'mu');

  const sf = focus === 'summary';
  g.box(0, 12, W, 9, { f: sf ? 'ac' : 'ln', title: 'Quality per configuration · computed by AxBenchmark (M06)', sub: 'rankings use the mean' });
  g.region(0, 12, W, 9, 'DataTable', '#trial-quality');
  const rows = TRIAL_CONFIGS.flatMap((c) => {
    const q = stats(c.trials.map((t) => quality(t.g))), gates = trialGates(c);
    const per = BACKEND_CATS.map((_, i) => stats(c.trials.map((t) => t.g[i])));
    return [
      { v: [c.h, 'mean', ...per.map((p) => p.mean.toFixed(2)), { t: f2(q.mean), f: 'bd' }, gates.length ? { t: '✗ trial 2 not eligible', f: 'bd' } : '✓ every trial eligible'], f: 'bd' },
      { v: [c.model, 'min–max', ...per.map((p) => (p.min === p.max ? p.min.toFixed(1) : `${p.min.toFixed(1)}–${p.max.toFixed(1)}`)), `${f2(q.min)}–${f2(q.max)}`, gates.length ? 'check T4.2 failed · spec 3.5' : ''], f: 'mu' },
    ];
  });
  table(g, 1, 13, W - 2, [{ l: 'Configuration', w: 20 }, { l: '', w: 9 }, ...BACKEND_CATS.map(([, , s]) => ({ l: s, w: 8, al: 'right' })), { l: 'Q', w: 11, al: 'right' }, { l: 'Eligibility', w: W - 2 - 88 }], rows, { cursor: 0, focused: sf });
  g.text(2, 18, fit('Q per trial uses the backend profile weights; the mean of the three is what ranks, and the range stays visible.', W - 4), 'mu');
  g.text(2, 19, fit('A configuration ranks only when every trial is eligible: Claude Code is listed with trial 2’s reason, not ranked.', W - 4), 'mu');

  const nf = focus === 'inputs';
  g.box(0, 21, W, H - 22, { f: nf ? 'ac' : 'ln', title: 'Inputs to each session · the same for every trial' });
  g.region(0, 21, W, H - 22, 'Static', '#inputs');
  let y = 22;
  [['✓', 'One trial’s delivered snapshot at T7, the specification, the 7 task prompts and the rubric backend v1'], ['✓', 'Check outcomes and console errors of that trial’s final regression · this backend template has no screenshots'], ['✗', 'Cost, time, tokens · other trials or their reviews · harness, model and trial names · the label mapping']].forEach(([gl, t]) => { g.text(2, y, gl, gl === '✓' ? 'ac' : 'mu'); g.text(4, y++, fit(t, W - 6), gl === '✓' ? '' : 'mu'); });
  y++;
  para(g, 2, y, W - 4, 'Six sessions cost six times one review; judging cost is recorded per trial (M10), apart from competitor cost. A failed or ungraded trial keeps its configuration out of quality and combined rankings until every trial is graded.', 'mu');
  footer(g, [{ k: 'enter', d: 'Open review', go: 'ReviewDetail' }, { k: 'p', d: 'Grading profiles', go: 'RubricProfiles' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- ReviewScreen · one complete review

// Screenshots are those of the final regression on the delivered artifact (D12): name · viewport.
const EVID = [
  ['shot cart-1440 · cart-390 · T5.2', 'Flows work; badge lags after a removal'],
  ['shot inventory-1440 · checkout-390', 'Consistent type; tight mobile header'],
  ['src/cart.js:12–96 · src/store.js', 'Small modules; one 140-line function'],
  ['check T6.1–T6.3 · spec §Checkout', 'Stock, totals, order history match'],
  ['check T7.1 reload · storage cleared', 'Survives reload; no input length limits'],
  ['shot cart-390 · keyboard check T5.4', 'Labels ok; focus skips the cart dialog'],
];
const ANCHOR = (v) => '■'.repeat(Math.floor(v)) + (v % 1 ? '▪' : '') + '□'.repeat(5 - Math.ceil(v));

export function reviewDetail(sz, focus = 'grades') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const r = byId['R-0928a-1'];
  header(g, 'AxBenchmark', `Review · result ${r.id}`);
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(`● Local · run ${r.run} · ${r.h} · ${r.model} · ${r.effort} · judge A · claude-opus-5-5 · high · reviewed as “Artifact A” · ✓ valid`, W - 2));
  g.region(0, 1, W, 1, 'Static', '#review-bar');
  const nw = normalize(QW), q = quality(r.g);
  const gf = focus === 'grades';
  g.box(0, 2, W, 11, { f: gf ? 'ac' : 'ln', title: 'Raw grades · rubric web v1', sub: '1 missing or largely broken · 3 usable with material gaps · 5 excellent for the scope' });
  table(g, 1, 3, W - 2, [{ l: 'Category', w: 22 }, { l: 'Grade', w: 6, al: 'right' }, { l: '', w: 7 }, { l: 'Weight', w: 7, al: 'right' }, { l: 'Evidence references', w: 36 }, { l: 'Why', w: W - 2 - 78 }],
    [...QCATS.map(([, name], i) => ({ v: [name, g1(r.g[i]), ANCHOR(r.g[i]), pct(nw[i]), EVID[i][0], EVID[i][1]] })),
      { v: ['Weighted quality Q', f2(q), '', '100%', 'computed by AxBenchmark (M06)', 'not a judge output'], f: 'bd' }], { cursor: 1, focused: gf });
  g.region(1, 3, W - 2, 8, 'DataTable', '#grades');
  g.text(2, 11, fit('Each category needs a grade in 0.5 steps and an evidence reference, or the whole review stays ungraded.', W - 4), 'mu');

  const cf = focus === 'comments';
  g.box(0, 13, 80, 18, { f: cf ? 'ac' : 'ln', title: 'Comments · required', sub: 'scroll' });
  g.region(0, 13, 80, 18, 'VerticalScroll', '#comments.pane');
  let y = 14;
  const sec = (title, text) => { g.text(2, y++, title, 'bd'); y = para(g, 2, y, 74, text) + 1; };
  sec('Code quality', 'Clear module split between store, cart and views. cart.js renders the whole list on every change (one 140-line function), which the reviewer flags as the main maintainability risk.');
  sec('Usability', 'Every flow from T3 to T6 completes by mouse and keyboard. After removing an item the cart badge shows the old count until the next action.');
  sec('Specification adherence', 'Stock decreases at checkout, totals and order history match. Lookup matches name prefixes only; the prompts leave matching open, so this is not counted against it.');
  scrollbar(g, 78, 14, 16, 0, 11);

  const mf = focus === 'meta';
  g.box(80, 13, 40, 18, { f: mf ? 'ac' : 'ln', title: 'Review record' });
  g.region(80, 13, 40, 18, 'Static', '#review-meta.kv');
  y = kv(g, 82, 14, 11, 36, [
    ['Judge', 'group A · claude-opus-5-5'],
    ['Effort', 'high'],
    ['Session', 'fresh · 1 artifact only'],
    ['Reviewed', '2026-09-28 21:16 · 3:10'],
    ['Cost', '$0.38 · judging, separate'],
    ['Evidence', '14 final-regression shots'],
    ['Raw file', 'reviews/R-0928a-1.a.json'],
  ]);
  y++;
  g.text(82, y++, 'Limitations', 'bd');
  para(g, 82, y, 36, 'Could not test with a screen reader; accessibility judged from markup and keyboard traces.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Open evidence' }, { label: 'Score breakdown', go: 'ScoreBreakdown' }, { label: 'Raw response', focus: focus === 'raw' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultReviews' }, { k: 'e', d: 'Evidence' }, { k: 'b', d: 'Breakdown', go: 'ScoreBreakdown' }, { k: 'r', d: 'Raw response' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- ungraded response (over JudgingScreen)

export function reviewUngraded(sz, focus = 'close') {
  const g = judging(sz, 'none', { ungraded: true });
  const m = modal(g, 86, 24, 'Artifact D · review not graded', { sel: '#ungraded-review' });
  let y = m.y;
  table(g, m.x, y, m.w, [{ l: 'Category', w: 23 }, { l: 'Returned', w: 10, al: 'right' }, { l: 'Evidence', w: 10 }, { l: 'Validation', w: m.w - 43 }], [
    { v: ['User experience', '4.0', '3 refs', '✓'] },
    { v: ['Visual quality', '3.5', { t: 'none', f: 'bd' }, { t: '✗ no evidence reference', f: 'bd' }] },
    { v: ['Code quality', '4.0', '2 refs', '✓'] },
    { v: ['Business rules / spec', '4.0', '4 refs', '✓'] },
    { v: ['Robustness', { t: '3.7', f: 'bd ul' }, '1 ref', { t: '✗ not a 0.5 step', f: 'bd' }] },
    { v: ['Accessibility', { t: '—', f: 'bd' }, '—', { t: '✗ missing grade', f: 'bd' }] },
  ], { cursor: 4, focused: focus === 'table' });
  g.region(m.x, y, m.w, 7, 'DataTable', '#validation');
  y += 8;
  y = kv(g, m.x, y, 15, m.w, [
    ['Comments', 'code ✓ · usability ✓ · specification ✗ missing'],
    ['Limitations', '“2 mobile screenshots failed to load” · kept with the review'],
    ['Raw response', 'reviews/run-2026-10-01-a/artifact-D.json · preserved'],
  ]);
  y++;
  g.text(m.x, y++, 'What happens now', 'bd');
  ['No average, zero or guess fills the gaps; the result has no quality score.', 'It stays out of quality and combined rankings and is listed with this reason.', 'Its checks (20✓ 1?) and process outcomes are unchanged.', 'A new review needs an explicit request; this one is kept beside it.'].forEach((t) => { g.text(m.x, y, '·', 'mu'); g.text(m.x + 2, y++, fit(t, m.w - 2)); });
  buttons(g, m.right, m.bottom, [{ label: 'Open raw response', focus: focus === 'raw' }, { label: 'Close', v: 'primary', go: 'JudgingDone', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'JudgingDone' }, { k: 'r', d: 'Raw response' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- judge without screenshot inspection (over Setup)

export function judgeCapability(sz, focus = 'choose') {
  const g = setup(sz, 'none');
  const m = modal(g, 84, 20, 'Judge cannot review this template', { sel: '#judge-capability' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'Pi · qwen3.5-35b-a3b cannot be shown to inspect screenshots', null);
  y++;
  y = kv(g, m.x, y, 14, m.w, [
    ['Template', 'Inventory web app r1 · frontend · web profile'],
    ['Needs', 'screenshot inspection for UX, visual and accessibility'],
    ['Catalog', 'image input: ? unknown for this endpoint (M04)'],
    ['Readiness', '✓ endpoint reachable · ✓ headless probe (M03)'],
  ]);
  g.region(m.x, m.y + 2, m.w, 4, 'Static', '#capability.kv');
  y++;
  y = para(g, m.x, y, m.w, 'A model name never establishes screenshot support, and unknown is not yes. Launch stays blocked until you choose a judge whose image input is known, or confirm support with a catalog override that is recorded with the run.', 'mu');
  y++;
  para(g, m.x, y, m.w, 'Nothing is substituted for you.', 'bd');
  buttons(g, m.right, m.bottom, [{ label: 'Override catalog…', go: 'CatalogOverride' }, { label: 'Choose another judge', v: 'primary', go: 'JudgePicker', focus: focus === 'choose' }]);
  footer(g, [{ k: 'esc', d: 'Back to Setup', go: 'Setup' }, { k: 'j', d: 'Judge', go: 'JudgePicker' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- grading profiles

export function rubricProfiles(sz) {
  const g = judging(sz, 'none');
  const m = modal(g, 86, 24, 'Grading profiles · one per comparison', { sel: '#profiles' });
  let y = m.y;
  table(g, m.x, y, m.w, [{ l: 'Web · frontend and fullstack', w: 31 }, { l: 'Default', w: 8, al: 'right' }, { l: '  Backend', w: m.w - 47 }, { l: 'Default', w: 8, al: 'right' }], [
    ['UX', 25, 'Developer experience'], ['Visual quality', 15, 'API / interface design'], ['Code quality', 20, 'Code quality'],
    ['Business rules / specification', 25, 'Business rules / specification'], ['Robustness', 10, 'Robustness'], ['Accessibility', 5, 'Operability / documentation'],
  ].map(([a, w, b]) => ({ v: [a, `${w}%`, `  ${b}`, `${w}%`] })), { cursor: 0, focused: false });
  g.region(m.x, y, m.w, 7, 'DataTable', '#profile-table');
  y += 8;
  y = kv(g, m.x, y, 14, m.w, [
    ['This run', '● web v1 · from the template · same for all 4 artifacts'],
    ['Grades', '1 to 5 in steps of 0.5'],
    ['Anchors', '1 missing or largely broken · 3 usable with material gaps'],
    ['', '5 excellent for the defined scope · halves use the same scale'],
    ['Weights', 'defaults above · editable as quality weights (M06)'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'A failing competitor gets the same rubric and no extra repair chance. Reweighting reuses the raw grades and never opens another judge session.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Quality weights…', go: 'WeightsEditor' }, { label: 'Close', v: 'primary', go: 'Judging', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Judging' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

import { loading } from './lib.mjs';
const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const JUDGING_WIDGET_STATES = [
  { widget: 'DataTable#reviews', label: 'M12 · Review queue', states: [
    ['Loading', mini('Reviews', (g, x, y, w) => loading(g, x, y + 1, w, 'Preparing anonymous labels for 4 artifacts…'))],
    ['Empty', mini('Reviews', (g, x, y, w) => { centered(g, y + 1, 'Nothing to review yet', 'bd'); centered(g, y + 2, 'Judging starts when every configuration ends.', 'mu'); })],
    ['Error', mini('Reviews', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Judge session could not start', 'Claude Code exited 1 before reviewing artifact C. Recorded as not judged; no grade was invented.'); })],
  ] },
];
