// M02 · Retained results and comparability, and M06 · Weighting, eligibility and rankings.
// ResultsScreen (Results and Rankings tabs) and ResultScreen (one retained result), plus their modals.
// Scores and shortlists are computed by results-data.mjs from raw grades and measurements.
import { Grid, fit, len, wrap, header, footer, table, tabs, button, buttons, input, check, para, kv, notice, toast, modal, scrollbar, select, selects } from './lib.mjs';
import { SHA, s8, mid, step } from './screens.mjs';
import { RESULTS, byId, JUDGES, QCATS, QW, SPEC, dur, usd, checksText, statusText, f1, f2, quality, normalize, gates, combined, shortlists, byCost, validate, basisText, BACKEND_CATS, TRIAL_RUN, TRIAL_CONFIGS, stats, trialGates, BILLING, billingText, STATS, rate, BASIS, genText, inText, outText, filesLocText, locText, secText, FACTORS, NEW_KEYS, planV2, rank8, validatePlan, pooled } from './results-data.mjs';

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const modelEffort = (r) => `${r.model} ${r.effort}`;
const machineCell = (r) => `${r.src === 'imported' ? '↓' : ' '} ${r.machine}`;

// ---------------------------------------------------------------- ResultsScreen chrome

function resultsChrome(g, sz, tab, st = {}) {
  const W = g.w, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', st.title ?? (compact ? 'Results · r1' : 'Results · Inventory web app r1'));
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(st.bar ?? (compact
    ? `★ r1 · sha256 ${s8(SHA.inv1)}…${SHA.inv1.slice(-8)} · 12 results · 8 local · 4 ↓`
    : `★ Inventory web app · r1 · sha256 ${mid(SHA.inv1)} · 12 results · 8 local · 4 imported · same SHA-256 only`), W - 2));
  g.region(0, 1, W, 1, 'Static', '#identity-bar');
  tabs(g, 0, 2, W, ['Results', 'Rankings'], tab, { go: ['Results', 'Rankings'] });
  const wl = st.alt ? '▲ alternative weights' : st.profile ? '▲ profile defaults' : '● original weights';
  g.text(W - 1 - len(wl), 2, wl, st.alt || st.profile ? 'bd' : 'mu');
  if (st.tariff) { const tl = '▲ analysis tariff 0.22 USD/kWh · alternative'; g.text(W - 4 - len(wl) - len(tl), 2, tl, 'bd'); }
  g.region(0, 2, W, 2, 'TabbedContent', '#results-tabs');
}

// ---------------------------------------------------------------- M02 · Results tab

const SEL = byId['R-0924lab-1'];

// Run 2026-10-01-a halted when the first check after T2-data.md changed on disk detected a different SHA-256 (D9).
const HALTED = [
  ['R-1001a-1', 'Claude Code', 'claude-opus-5-5 medium', '17✓ 13○', 2.71, 2472],
  ['R-1001a-2', 'Codex', 'gpt-6-sol medium', '17✓ 13○', 1.64, 2472],
  ['R-1001a-3', 'Grok CLI', 'grok-4.7-fast default', '15✓ 15○', 0.48, 2472],
  ['R-1001a-4', 'Pi', 'qwen3.5-35b-a3b default', '10✓ 20○', null, 2472],
];
const TARIFF = 0.22;
const costCell = (r, st) => {
  if (st.tariff && r.basis === 'energy') return { t: `▲ ${usd(r.kwh * TARIFF)}`, f: 'bd' };
  return r.partial?.cost ? { t: `▲ ${usd(r.cost)}`, f: 'bd' } : usd(r.cost);
};

// R173–R176: the statistics column set of #results. s switches Outcomes ⇄ Statistics; both list every result.
const STAT_SEL = byId['R-0928a-3'];
const byGen = (rs) => [...rs].sort((a, b) => (rate(STATS[a.id].gen) == null) - (rate(STATS[b.id].gen) == null) || (rate(STATS[b.id].gen) ?? 0) - (rate(STATS[a.id].gen) ?? 0) || (a.id < b.id ? -1 : 1));
const genCell = (s) => ({ t: s.gen.state === 'unknown' ? '— unknown' : `${genText(s)} ${s.gen.basis}`, f: s.gen.state === 'known' ? '' : s.gen.state === 'partial' ? 'bd' : 'mu' });
const usageCell = (s, t) => ({ t, f: s.usage === 'known' ? '' : s.usage === 'partial' ? 'bd' : 'mu' });
export const statCells = (r) => { const s = STATS[r.id]; return [genCell(s), usageCell(s, inText(s)), usageCell(s, outText(s)), { t: filesLocText(s), f: s.locState === 'partial' ? 'bd' : '' }]; };

function resultsStatistics(g, sz, focus) {
  const W = g.w, H = g.h, compact = sz.id === 'compact';
  const rows = byGen(RESULTS), cur = rows.indexOf(STAT_SEL), tf = focus === 'results';
  const th = compact ? 12 : 15;
  g.box(0, 5, W, th, { f: tf ? 'ac' : 'ln', title: compact ? 'Results · 12 · statistics' : 'Results · 12 of 12 · statistics columns', sub: 'Gen tok/s high first · unknown last, never 0' });
  if (compact) {
    table(g, 1, 6, W - 3, [{ l: 'Result', w: 12 }, { l: 'Gen tok/s', w: 15 }, { l: 'In tok (cached)', w: 16 }, { l: 'Out tok (reasoning)', w: 20 }, { l: 'Files / LOC', w: 14 }],
      rows.map((r) => ({ v: [r.id, ...statCells(r)], go: 'ResultOrigin' })), { cursor: cur, focused: tf, max: 9 });
    scrollbar(g, W - 2, 7, 9, 0, 7);
  } else {
    table(g, 1, 6, W - 2, [{ l: 'Result', w: 12 }, { l: 'Harness', w: 12 }, { l: 'Model · effort', w: 25 }, { l: 'Gen tok/s', w: 14 }, { l: 'In tok (cached)', w: 16 }, { l: 'Out tok (reasoning)', w: 20 }, { l: 'Files / LOC', w: 19 }],
      rows.map((r) => ({ v: [r.id, r.h, modelEffort(r), ...statCells(r)], go: 'ResultOrigin' })), { cursor: cur, focused: tf });
  }
  g.region(1, 6, W - 2, th - 2, 'DataTable', '#results.-statistics');
  const r = STAT_SEL, s = STATS[r.id], x = rate(s.gen);
  if (compact) {
    const y = 5 + th;
    g.box(0, y, W, H - 1 - y, { title: `${r.id} · ${r.h} · ${r.model}`, f: 'ln' });
    g.region(0, y, W, H - 1 - y, 'Static', '#summary');
    g.text(2, y + 1, fit(`▲ ${x.toFixed(1)} tok/s · ${locText(s.gen.n)} ÷ ${secText(s.gen.d)} s · ${s.gen.req[0]} of ${s.gen.req[1]} requests · proxy`, W - 4), 'bd');
    g.text(2, y + 2, fit(`cached ? not exposed · reasoning ${s.rs}k ⊂ output · ${s.files} files / ${locText(s.loc)} lines`, W - 4));
    g.text(2, y + 3, fit('Statistics weigh 0 in the original analysis · never imply quality', W - 4), 'mu');
    let kx = 2;
    for (const [k, d, go] of [['g', 'Gen tok/s', 'ThroughputDetail'], ['a', 'Files / LOC', 'ArtifactStats'], ['s', 'Outcomes', 'Results']]) {
      g.text(kx, y + 4, k, 'ac bd'); g.text(kx + 2, y + 4, d); g.link(kx, y + 4, len(d) + 2, 1, 'go:' + go); kx += len(d) + 5;
    }
    footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: 's', d: 'Outcomes', go: 'Results' }, { k: 'g', d: 'Gen', go: 'ThroughputDetail' }, { k: 'a', d: 'Files', go: 'ArtifactStats' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }]);
    return g;
  }
  const y0 = 5 + th, bh = H - 2 - y0;
  g.box(0, y0, 60, bh, { title: `Selected · ${r.id} · ${r.h} · statistics`, f: focus === 'summary' ? 'ac' : 'ln' });
  g.region(0, y0, 60, bh, 'VerticalScroll', '#result-summary.pane');
  kv(g, 2, y0 + 1, 13, 56, [
    ['Gen tok/s', `▲ ${x.toFixed(2)} · partial matched subset`, 'bd'],
    ['', `${locText(s.gen.n)} ÷ ${secText(s.gen.d)} s · ${s.gen.req[0]} of ${s.gen.req[1]} requests`],
    ['', 'per-request throughput, not wall clock'],
    ['', `${BASIS[s.gen.basis]} v1 · 3 T5 streams cut`],
    ['Full output', `${locText(s.gen.full)} tok · never ÷ ${secText(s.gen.d)} s`],
    ['In tok', `${(s.inp / 1000).toFixed(2)}M · cached ? · not exposed by Grok CLI`],
    ['Out tok', `${s.out}k · reasoning ${s.rs}k ⊂ output, never added`],
    ['Files / LOC', `${s.files} files · ${locText(s.loc)} physical text lines`],
    ['', 'final snapshot size (baseline included)'],
    ['Policies', 'tok-norm v1 · timing-pair v1 · files-loc v1'],
    ['Evidence', '44 usage receipts · snapshot T7 4e7a1c9'],
  ]);
  g.box(60, y0, 60, bh, { title: 'Ranking effect · original weights', f: 'ln' });
  g.region(60, y0, 60, bh, 'Static', '#statistics-effect');
  let y = para(g, 62, y0 + 1, 56, 'All five statistics weigh 0 in every original analysis. They are shown and exported but never looked up for ranking, so an unknown or partial value excludes nobody.', 'mu');
  y = kv(g, 62, y + 1, 13, 56, [
    ['If weighted', 'R-0928a-3 → metric_partial · Gen tok/s'],
    ['', 'R-0921a-2 → metric_unknown · no usage'],
    ['', 'Pi → metric_basis_incompatible (native)'],
  ]);
  para(g, 62, y + 1, 56, 'More output, files or lines never means better quality. The values describe the whole tested configuration, not the model alone.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Gen tok/s detail', go: 'ThroughputDetail', focus: focus === 'gen' }, { label: 'Files / LOC inventory', go: 'ArtifactStats' }, { label: 'Outcome columns', go: 'Results' }]);
  g.region(0, H - 2, W, 1, 'Horizontal', '.actions');
  footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: '1-2', d: 'Tab' }, { k: 's', d: 'Outcomes', go: 'Results' }, { k: 'f', d: 'Filter' }, { k: 'o', d: 'Open', go: 'ResultOrigin' }, { k: 'g', d: 'Gen tok/s', go: 'ThroughputDetail' }, { k: 'a', d: 'Files / LOC', go: 'ArtifactStats' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'h', d: 'Report', go: 'ReportGenerate' }]);
  return g;
}

export function results(sz, focus = 'results', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  resultsChrome(g, sz, 0, st.halted
    ? { bar: `★ Inventory web app · r1 · sha256 ${mid(SHA.inv1)} · 12 comparable results · 4 interrupted, not comparable` }
    : st.tariff ? { tariff: true } : {});
  const ff = focus === 'filters';
  if (compact) {
    const x = selects(g, 1, 4, W - 2, [{ l: 'Machine', w: 12, v: 'all · 2', focus: ff, sel: '#filter-machine' }, { l: 'Judge', w: 18, v: 'all · 2 groups', sel: '#filter-judge' }]);
    g.text(x, 4, '+3 filters', 'mu'); g.text(x + 11, 4, 'f', 'ac bd');
  } else {
    selects(g, 1, 4, W - 2, [
      { l: 'Machine', w: 15, v: 'all · 2', focus: ff, sel: '#filter-machine' },
      { l: 'Config', w: 22, v: st.halted ? 'Four harnesses · defa…' : 'all · 9', sel: '#filter-config' },
      { l: 'Env', w: 11, v: 'all', sel: '#filter-env' },
      { l: 'Jobs', w: 7, v: 'all', sel: '#filter-jobs' },
      { l: 'Judge', w: 18, v: 'all · 2 groups', sel: '#filter-judge' },
    ]);
  }
  g.region(0, 4, W, 1, 'Horizontal', '#filters');
  if (st.stats) return resultsStatistics(g, sz, focus);
  const rows = st.halted ? byCost(RESULTS.filter((r) => r.run === '2026-09-28-a')) : byCost(RESULTS);
  const cur = st.halted ? rows.length + 2 : rows.indexOf(SEL);
  const tf = focus === 'results';
  const th = compact ? 12 : 15;
  g.box(0, 5, W, th, { f: tf ? 'ac' : 'ln', title: st.halted ? 'Results · Four harnesses · defaults · 8' : 'Results · 12 of 12', sub: st.halted ? 'comparable first · interrupted last' : compact ? 'cost first · s statistics' : 'highest known cost first · unknown last · s statistics' });
  const status = (r) => ({ t: statusText(r), f: r.status === 'complete' ? '' : 'bd' });
  if (compact) {
    table(g, 1, 6, W - 3, [{ l: 'Result', w: 12 }, { l: 'Harness', w: 12 }, { l: 'Model · effort', w: 28 }, { l: 'Jdg', w: 4 }, { l: 'Status', w: 12 }, { l: 'Cost', w: 9, al: 'right' }],
      rows.map((r) => ({ v: [r.id, r.h, modelEffort(r), r.judge, status(r), costCell(r, st)], go: 'ResultOrigin' })), { cursor: cur, focused: tf, max: 9 });
    scrollbar(g, W - 2, 7, 9, 0, 7);
  } else {
    const trs = rows.map((r) => ({ v: [r.id, machineCell(r), r.h, modelEffort(r), r.env, r.judge, status(r), checksText(r.checks), costCell(r, st), dur(r.time)], go: 'ResultOrigin' }));
    if (st.halted) {
      trs.push({ v: [] });
      HALTED.forEach(([id, h, me, ch, c, t]) => trs.push({ v: [id, '  mike-mbp-m4', h, me, 'clean', '—', { t: '✗ interrupted', f: 'bd' }, ch, c == null ? 'unknown' : { t: `▲ ${usd(c)}`, f: 'bd' }, { t: `▲ ${dur(t)}`, f: 'bd' }], go: 'ResultOrigin' }));
    }
    table(g, 1, 6, W - 2, [{ l: 'Result', w: 12 }, { l: 'Machine', w: 17 }, { l: 'Harness', w: 12 }, { l: 'Model · effort', w: 25 }, { l: 'Env', w: 8 }, { l: 'Jdg', w: 4 }, { l: 'Status', w: 15 }, { l: 'Checks', w: 8 }, { l: 'Cost', w: 9, al: 'right' }, { l: 'Time', w: 8, al: 'right' }],
      trs, { cursor: cur, focused: tf });
    if (st.halted) g.text(2, 7 + rows.length, fit('── run 2026-10-01-a · halted 21:44 · template identity invalidated · not comparable ──', W - 4), 'mu');
  }
  g.region(1, 6, W - 2, th - 2, 'DataTable', '#results');

  const r = SEL;
  if (compact) {
    const y = 5 + th;
    g.box(0, y, W, H - 1 - y, { title: `${r.id} · ↓ imported`, f: 'ln' });
    g.region(0, y, W, H - 1 - y, 'Static', '#summary');
    g.text(2, y + 1, fit(`${r.machine} · judge ${r.judge} · ${r.h} 3.4.1 · ${r.model} · ${r.effort}`, W - 4), 'bd');
    g.text(2, y + 2, fit(`✓ 30/30 checks · ${usd(r.cost)} list · ${dur(r.time)} · ${genText(STATS[r.id])} tok/s · ${STATS[r.id].files} files · ${locText(STATS[r.id].loc)} LOC`, W - 4));
    g.text(2, y + 3, fit('Validated, not certified: the hash proves the definition, not the execution.', W - 4), 'mu');
    let x = 2;
    for (const [k, d, go] of [['o', 'Open', 'ResultOrigin'], ['j', 'Review again', 'Rejudge'], ['x', 'Export ZIP', 'ExportResult']]) {
      g.text(x, y + 4, k, 'ac bd'); g.text(x + 2, y + 4, d); g.link(x, y + 4, len(d) + 2, 1, 'go:' + go); x += len(d) + 5;
    }
    footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: 'f', d: 'Filter' }, { k: 'o', d: 'Open', go: 'ResultOrigin' }, { k: 's', d: 'Stats', go: 'ResultsStatistics' }, { k: 'h', d: 'Report', go: 'ReportGenerate' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'e', d: 'Tariff', go: 'TariffAnalysis' }]);
    return g;
  }

  const y0 = 5 + th, bh = H - 2 - y0;
  const resFooter = [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: '1-2', d: 'Tab' }, { k: 'f', d: 'Filter' }, { k: 'o', d: 'Open', go: 'ResultOrigin' }, { k: 's', d: 'Stats', go: 'ResultsStatistics' }, { k: 'i', d: 'Import', go: 'ResultImport' }, { k: 'x', d: 'Export', go: 'ExportResult' }, { k: 'h', d: 'Report', go: 'ReportGenerate' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'e', d: 'Tariff', go: 'TariffAnalysis' }];
  if (st.halted) {
    g.box(0, y0, 60, bh, { title: 'Selected · R-1001a-2 · interrupted', f: 'ln' });
    g.region(0, y0, 60, bh, 'VerticalScroll', '#result-summary.pane');
    kv(g, 2, y0 + 1, 12, 56, [
      ['Status', '✗ interrupted · identity invalidated', 'bd'],
      ['Detected', '21:44:09 · first identity check after T4'],
      ['Approved', [SHA.inv1.slice(0, 32), SHA.inv1.slice(32)]],
      ['Computed', [SHA.changed.slice(0, 32), SHA.changed.slice(32)], 'bd'],
      ['Changed', 'tasks/T2-data.md'],
      ['Halted', 'whole run · explicit-stop cleanup'],
      ['Comparable', '✗ never · not rebound to any revision', 'bd'],
      ['Evidence', 'kept · snapshots T1–T4, logs, checks'],
    ]);
    g.box(60, y0, 60, bh, { title: 'Why these results are excluded', f: 'ln' });
    g.region(60, y0, 60, bh, 'Static', '#retained');
    let y = notice(g, 62, y0 + 1, 56, 'error', 'Template identity invalidated', 'r1’s files changed on disk while run 2026-10-01-a was running, so the whole run stopped at the first detection. Its 4 results are recorded as interrupted, are never compared or ranked, and are never relabelled with another identity.');
    para(g, 62, y + 1, 56, 'Approved revisions are written read-only; a changed file means something outside AxBenchmark edited it. Save the edit as a new revision (e on the template) and run again.', 'mu');
    buttons(g, W - 1, H - 2, [{ label: 'Open result', go: 'ResultOrigin', focus: focus === 'open' }, { label: 'Open evidence', go: 'EvidenceViewer' }, { label: 'Export result ZIP', go: 'ExportResult' }]);
    footer(g, resFooter);
    return g;
  }
  g.box(0, y0, 60, bh, { title: `Selected · ${r.id}`, f: 'ln' });
  g.region(0, y0, 60, bh, 'VerticalScroll', '#result-summary.pane');
  kv(g, 2, y0 + 1, 12, 56, [
    ['Provenance', '↓ imported 2026-09-24 22:10 · result ZIP'],
    ['Integrity', '✓ payload manifest · 412 files'],
    ['Machine', 'lab-linux-4090 · Ubuntu 24.04.1 · x86_64'],
    ['Hardware', 'Ryzen 9 7950X · RTX 4090 24 GB · 64 GB'],
    ['Harness', 'Claude Code 3.4.1'],
    ['Model', 'claude-sonnet-5-5 · effective, reported'],
    ['Effort', 'medium requested · effective unverified'],
    ['Env · jobs', 'clean · 3 configurations at once'],
    ['Judge', `B · ${JUDGES.B.long} · original`],
    ['Weights', 'original · web v1 · ranking 1:1:1'],
    ['Cost basis', fit(basisText(r), 44)],
    ['Billing', `${billingText(r)}${BILLING[r.id][1] === 'status' ? ' · from the harness status' : ''}`],
    ['Statistics', [`${genText(STATS[r.id])} tok/s ${STATS[r.id].gen.basis} · in ${inText(STATS[r.id])}`, `out ${outText(STATS[r.id])} · ${STATS[r.id].files} files · ${locText(STATS[r.id].loc)} LOC`]],
    ['Source id', `${r.id} · kept on re-export`],
  ]);
  g.box(60, y0, 60, bh, { title: 'Retained for this result', f: 'ln' });
  g.region(60, y0, 60, bh, 'Static', '#retained');
  let y = y0 + 1;
  for (const [t, d] of [
    ['Definition and launch', 'template, baseline, configuration, catalog, weights'],
    ['Origin and execution', 'source id, machine, OS, hardware, harness versions'],
    ['Measurements and outcomes', '7 tasks · 30 checks · cost and time with coverage'],
    ['Reviews and evidence', 'judge metadata, raw grades, evidence, logs, snapshots'],
  ]) {
    g.text(62, y, '✓', 'ac'); g.text(64, y++, t, 'bd');
    y = para(g, 64, y, 54, d, 'mu');
  }
  if (st.tariff) {
    const e = byId['R-0919lab-1'];
    const ny = y + 1;
    y = notice(g, 62, ny, 56, 'warning', `Analysis tariff ${TARIFF.toFixed(2)} USD/kWh · alternative`, 'Energy estimates only (1 of 12). Records keep the tariff frozen at launch; nothing is rewritten.');
    g.region(62, ny, 56, y - ny, 'Static', '#analysis-tariff.notice.-warning');
    kv(g, 62, y + 1, 12, 56, [['R-0919lab-1', `${(e.kwh * 1000).toFixed(1)} Wh × ${TARIFF.toFixed(2)} = $${(e.kwh * TARIFF).toFixed(4)}`], ['Frozen', `× ${e.tariff.toFixed(2)} = $${e.cost.toFixed(4)} · unchanged`]]);
  } else notice(g, 62, y + 1, 56, 'warning', 'Validated, not certified', 'The SHA-256 proves the benchmark definition and the payload manifest proves the package is intact. Neither proves how lab-linux-4090 ran it.');
  buttons(g, W - 1, H - 2, st.tariff
    ? [{ label: 'Open result', go: 'ResultOrigin' }, { label: 'Change tariff…', go: 'TariffAnalysis' }, { label: 'Reset to frozen tariff', v: 'primary', go: 'Results', focus: focus === 'reset' }]
    : [{ label: 'Open result', go: 'ResultOrigin', focus: focus === 'open' }, { label: 'Review again…', go: 'Rejudge' }, { label: 'Import results…', go: 'ResultImport' }, { label: 'Export result ZIP', go: 'ExportResult' }, { label: 'HTML report', v: 'primary', go: 'ReportReady' }]);
  g.region(0, H - 2, W, 1, 'Horizontal', '.actions');
  footer(g, resFooter);
  return g;
}

// ---------------------------------------------------------------- M02 · Results tab · configurations with several trials (D7)

// Shared fixture from results-data.mjs: Orders REST API r3, run 2026-09-27-t, 2 configurations × 3 trials, judge group A.
const BW = BACKEND_CATS.map((c) => c[3]);
const tq = (t) => quality(t.g, BW);
export const trialRows = (opts = {}) => {
  const rows = [];
  TRIAL_CONFIGS.forEach((c) => {
    const cs = stats(c.trials.map((t) => t.cost)), ts = stats(c.trials.map((t) => t.time)), qs = stats(c.trials.map(tq));
    const bad = trialGates(c);
    c.trials.forEach((t, i) => rows.push({ v: [t.id, `${t.trial} of ${TRIAL_RUN.trials}`, i === 0 ? c.h : '', i === 0 ? `${c.model} ${c.effort}` : '', t.checks.f ? { t: '✓ complete', f: '' } : '✓ complete', { t: checksText(t.checks), f: t.checks.f ? 'bd' : '' }, usd(t.cost), dur(t.time), f2(tq(t))], go: opts.go ?? 'ResultOrigin' }));
    rows.push({ v: ['', 'mean', '', '', bad.length ? { t: '✗ trial ineligible', f: 'bd' } : '✓ eligible', '', usd(cs.mean), dur(Math.round(ts.mean)), f2(qs.mean)], f: 'bd' });
    rows.push({ v: ['', 'min–max', '', '', '', '', `${cs.min.toFixed(2)}–${cs.max.toFixed(2)}`, `${dur(ts.min)}–${dur(ts.max)}`, `${f2(qs.min)}–${f2(qs.max)}`], f: 'mu' });
  });
  return rows;
};

export function resultsTrials(sz, focus = 'results') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  resultsChrome(g, sz, 0, { title: 'Results · Orders REST API r3', bar: `◆ Orders REST API · r3 · sha256 ${mid(SHA.orders)} · 6 results · run ${TRIAL_RUN.run} · 2 configurations × 3 trials` });
  selects(g, 1, 4, W - 2, [
    { l: 'Machine', w: 15, v: 'all · 1', focus: focus === 'filters', sel: '#filter-machine' },
    { l: 'Config', w: 22, v: 'all · 2', sel: '#filter-config' },
    { l: 'Env', w: 11, v: 'all', sel: '#filter-env' },
    { l: 'Jobs', w: 7, v: 'all', sel: '#filter-jobs' },
    { l: 'Judge', w: 18, v: 'all · 1 group', sel: '#filter-judge' },
  ]);
  g.region(0, 4, W, 1, 'Horizontal', '#filters');
  const rows = trialRows();
  const tf = focus === 'results';
  const th = rows.length + 3;
  g.box(0, 5, W, th, { f: tf ? 'ac' : 'ln', title: 'Results · 6 trials of 2 configurations', sub: 'every trial, then mean and min–max' });
  table(g, 1, 6, W - 2, [{ l: 'Result', w: 12 }, { l: 'Trial', w: 9 }, { l: 'Harness', w: 12 }, { l: 'Model · effort', w: 25 }, { l: 'Status', w: 19 }, { l: 'Checks', w: 8 }, { l: 'Cost', w: 11, al: 'right' }, { l: 'Time', w: 12, al: 'right' }, { l: 'Q', w: 10, al: 'right' }], rows, { cursor: 8, focused: tf });
  g.region(1, 6, W - 2, th - 2, 'DataTable', '#results');

  const c = TRIAL_CONFIGS[1];
  const cs = stats(c.trials.map((t) => t.cost)), ts = stats(c.trials.map((t) => t.time)), qs = stats(c.trials.map(tq));
  const y0 = 5 + th, bh = H - 2 - y0;
  g.box(0, y0, 60, bh, { title: `Selected · ${c.h} · ${c.model} · mean of 3`, f: focus === 'summary' ? 'ac' : 'ln' });
  g.region(0, y0, 60, bh, 'VerticalScroll', '#result-summary.pane');
  const pg = pooled(c.trials), mean = (k) => c.trials.reduce((a, t) => a + t[k], 0) / c.trials.length;
  const mm = (k) => `${Math.min(...c.trials.map((t) => t[k]))}–${Math.max(...c.trials.map((t) => t[k]))}`;
  kv(g, 2, y0 + 1, 12, 56, [
    ['Mean', `cost ${usd(cs.mean)} · time ${dur(Math.round(ts.mean))} · Q ${f2(qs.mean)}`],
    ['Min–max', `${usd(cs.min)}–${usd(cs.max)} · ${dur(ts.min)}–${dur(ts.max)} · Q ${f2(qs.min)}–${f2(qs.max)}`],
    ['Gen tok/s', `pooled ${pg.x.toFixed(2)} · ${locText(pg.n)} ÷ ${secText(pg.d)} s`],
    ['', `trials ${pg.min.toFixed(1)}–${pg.max.toFixed(1)} · not a mean of the rates`],
    ['In · Out', `mean ${(mean('inp') / 1000).toFixed(2)}M (${(mean('cached') / 1000).toFixed(2)}M) · ${f1(mean('out'))}k (${f1(mean('rs'))}k)`],
    ['Files / LOC', `mean ${f2(mean('files'))} / ${locText(+mean('loc').toFixed(2))} · ${mm('files')} / ${mm('loc').split('–').map((n) => locText(+n)).join('–')}`],
    ['Cost basis', fit(`estimate · ${c.price}`, 44)],
    ['Judging', '3 sessions · judge A · one per trial'],
    ['Rankings', 'use the means, never a single trial'],
    ['Eligible', ['✗ trial ineligible · every trial must be', `eligible: ${trialGates(c)[0]}`], 'bd'],
  ]);
  g.box(60, y0, 60, bh, { title: 'How trials run', f: 'ln' });
  g.region(60, y0, 60, bh, 'Static', '#retained');
  let y = y0 + 1;
  for (const t of ['Trials of one configuration run one after another, each from a fresh copy of the baseline.', 'Each trial is its own result, linked to its configuration and trial index, with its own review.', 'Default 1 trial; set in Setup and frozen at launch.']) {
    g.text(62, y, '●', 'ac'); y = para(g, 64, y, 54, t, 'mu');
  }
  buttons(g, W - 1, H - 2, [{ label: 'Open trial', go: 'ResultOrigin', focus: focus === 'open' }, { label: 'Rankings', go: 'RankingsTrials' }, { label: 'Export result ZIP', go: 'ExportResult' }, { label: 'HTML report', v: 'primary', go: 'ReportReady' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: '1-2', d: 'Tab', go: 'RankingsTrials' }, { k: 'f', d: 'Filter' }, { k: 'o', d: 'Open trial', go: 'ResultOrigin' }, { k: 'j', d: 'Rejudge', go: 'Rejudge' }, { k: 'x', d: 'Export', go: 'ExportResult' }, { k: 'h', d: 'Report', go: 'ReportGenerate' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'e', d: 'Tariff', go: 'TariffAnalysis' }]);
  return g;
}

// ---------------------------------------------------------------- M02 · ResultScreen (one result, three tabs)

const RTABS = ['Launch and origin', 'Outcomes and measurements', 'Reviews and evidence'];
const RTAB_GO = ['ResultOrigin', 'ResultOutcomes', 'ResultReviews'];

function resultChrome(g, sz, r, tab) {
  const W = g.w, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', `Result ${r.id} · trial ${r.trial_index}/${r.trial_count}`);
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(compact
    ? `${r.src === 'imported' ? '↓' : '●'} ${r.machine} · ${r.h} · ${r.model} · r1 ${s8(SHA.inv1)} · ${statusText(r)}`
    : `${r.src === 'imported' ? '↓ Imported' : '● Local'} · ${r.machine} · run ${r.run} · ${r.h} · ${r.model} · ${r.effort === 'default' ? 'harness default' : r.effort} · r1 ${s8(SHA.inv1)} · ${statusText(r)}`, W - 2));
  g.region(0, 1, W, 1, 'Static', '#result-bar');
  tabs(g, 0, 2, W, compact ? ['Origin', 'Outcomes', 'Reviews'] : RTABS, tab, { go: RTAB_GO });
  g.region(0, 2, W, 2, 'TabbedContent', '#result-tabs');
}
const resultFooter = (compact) => (compact
  ? [{ k: 'esc', d: 'Back', go: 'Results' }, { k: '1-3', d: 'Tab' }, { k: 'j', d: 'Rejudge', go: 'Rejudge' }, { k: 'x', d: 'Export', go: 'ExportResult' }, { k: 'l', d: 'Logs', go: 'EvidenceViewer' }]
  : [{ k: 'esc', d: 'Back', go: 'Results' }, { k: '1-3', d: 'Tab' }, { k: 'j', d: 'Review again', go: 'Rejudge' }, { k: 'x', d: 'Export ZIP', go: 'ExportResult' }, { k: 'l', d: 'Logs', go: 'EvidenceViewer' }, { k: 'tab', d: 'Focus', do: 'next' }]);

export function resultOrigin(sz, focus = 'definition') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const r = byId['R-0924lab-1'];
  resultChrome(g, sz, r, 0);
  const bh = 26;
  const df = focus === 'definition', of = focus === 'origin';
  g.box(0, 4, 60, bh, { f: df ? 'ac' : 'ln', title: 'Definition and launch', sub: 'frozen before execution' });
  g.region(0, 4, 60, bh, 'VerticalScroll', '#definition.pane');
  let y = kv(g, 2, 5, 14, 56, [
    ['Template', 'Inventory web app · r1 · ★ built-in'],
    ['SHA-256', [SHA.inv1.slice(0, 32), SHA.inv1.slice(32)]],
    ['Baseline', `empty project · ${s8(SHA.empty)}…${SHA.empty.slice(-4)} · packaged`],
    ['Configuration', `Lab · three harnesses · cfg ${s8(SHA.cfg.split('').reverse().join(''))}`],
    ['Entry', 'Claude Code · Anthropic'],
    ['Model', 'claude-sonnet-5-5 · medium (known effort)'],
    ['Catalog', ['bundled 2026.09.2 + discovered 2026-09-24', 'for Claude Code 3.4.1 · account lab']],
    ['Billing', `${billingText(r)} · harness status, frozen at launch`],
    ['Currency', 'display USD · rate snapshot USD 1'],
    ['Quality wts', 'web v1 · 25 15 20 25 10 5 · original'],
    ['Ranking wts', 'cost 1 · time 1 · quality 1 · original'],
    ['Judge', JUDGES.B.long],
    ['Rubric', 'web v1 · covered by the template SHA-256'],
  ]);
  y++;
  g.text(2, y++, 'Saved as', 'mu');
  g.text(2, y++, fit('configs/r1/lab-three-harnesses.yaml · YAML as frozen', 56));
  y++;
  para(g, 2, y, 56, 'The configuration and original weights were frozen separately from the template. Later edits to either never reach this record.', 'mu');

  g.box(60, 4, 60, bh, { f: of ? 'ac' : 'ln', title: 'Origin and execution' });
  g.region(60, 4, 60, bh, 'VerticalScroll', '#origin.pane');
  kv(g, 62, 5, 14, 56, [
    ['Result id', `${r.id} · source id, kept on re-export`],
    ['Run UID', r.run_uid],
    ['Configuration', r.configuration_id],
    ['Provenance', '↓ imported 2026-09-24 22:10'],
    ['Package', 'inventory-results-lab-4090.zip · payload ✓'],
    ['Machine', 'lab-linux-4090 · id 7c2e…91fa'],
    ['Hardware', ['AMD Ryzen 9 7950X · 16 cores · 64 GB', 'NVIDIA RTX 4090 24 GB · driver 560.35']],
    ['OS', 'Ubuntu 24.04.1 LTS · Linux 6.8.0 · x86_64'],
    ['Harness', 'Claude Code 3.4.1'],
    ['Started', '2026-09-24 08:12:40 +02:00'],
    ['Finished', '2026-09-24 08:48:00 +02:00'],
    ['Model', 'claude-sonnet-5-5 · effective, reported ✓'],
    ['Effort', 'medium requested · effective unverified'],
    ['Environment', 'clean · managed settings · no limitations'],
    ['Concurrency', '3 configurations at once (--jobs 3)'],
    ['Trial', '1 of 1 · fresh baseline · own review'],
    ['Credentials', 'ANTHROPIC_API_KEY · value never stored'],
  ]);
  notice(g, 1, 4 + bh + 1, W - 2, 'warning', 'Imported results are validated, not certified',
    'The SHA-256 match proves lab-linux-4090 used this exact benchmark definition, and the payload manifest proves the files arrived intact. Neither certifies faithful execution or authentic measurements.');
  g.region(1, 4 + bh + 1, W - 2, 3, 'Static', '#provenance-note.notice.-warning');
  buttons(g, W - 1, H - 2, [{ label: 'Open config YAML' }, { label: 'Review again…', go: 'Rejudge' }, { label: 'Export result ZIP', go: 'ExportResult' }]);
  footer(g, resultFooter(false));
  return g;
}

// R-0928a-3 per task: reasoning (k, ⊂ output) and the generation windows paired by the proxy. T5 lost the end of
// 3 of its 8 request streams, so only their 27,000 matched tokens enter the rate; the full 35,080 stay in output.
export const GROK_RS = [3, 8, 17, 5, 14, 12, 9];
export const GROK_GEN = [
  { n: 9050, d: '77.200', req: [4, 4] }, { n: 21110, d: '180.400', req: [6, 6] }, { n: 44020, d: '376.300', req: [9, 9] }, { n: 12000, d: '102.600', req: [4, 4] },
  { n: 27000, d: '231.000', req: [5, 8], full: 35080 }, { n: 29960, d: '256.100', req: [7, 7] }, { n: 21898, d: '187.200', req: [6, 6] },
];
export const GROK_TASKS = [
  ['T1', 'Repository and scaffold', 0, '6✓', 190, '182k / 9k', 0.05],
  ['T2', 'Inventory data and persistence', 0, '4✓', 400, '401k / 21k', 0.12],
  ['T3', 'Inventory management', 0, '5✓', 665, '702k / 44k', 0.21],
  ['T4', 'Inventory lookup', 0, '2✓', 270, '280k / 12k', 0.08],
  ['T5', 'Shopping cart', 0, '5✓ 1?', 555, '598k / 35k', 0.18],
  ['T6', 'Checkout', 0, '4✓', 500, '540k / 30k', 0.16],
  ['T7', 'Test and fix', 0, '3✓', 510, '410k / 22k', 0.12],
];

export function resultOutcomes(sz, focus = 'tasks') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const r = byId['R-0928a-3'];
  resultChrome(g, sz, r, 1);
  const tf = focus === 'tasks';
  const total = { t: GROK_TASKS.reduce((n, t) => n + t[4], 0), c: GROK_TASKS.reduce((n, t) => n + t[6], 0) };
  if (dur(total.t) !== dur(r.time) || f2(total.c) !== f2(r.cost)) throw new Error('Grok task totals disagree with R-0928a-3');
  const S = STATS[r.id];
  const rows = GROK_TASKS.map(([id, t, ex, ch, s, tok, c], i) => {
    const [inp, out] = tok.split(' / ');
    const gen = GROK_GEN[i], gx = gen.n / Number(gen.d);
    return { v: [id, t, `✓ exit ${ex}`, ch === '1?' ? { t: '1? unverified', f: 'bd' } : ch, dur(s), gen.req[0] < gen.req[1] ? { t: `▲ ${f1(gx)}`, f: 'bd' } : f1(gx), `${inp} (?)`, `${out} (${GROK_RS[i]}k)`, usd(c)], go: 'TaskChecks' };
  });
  rows.push({ v: ['Σ', 'Seven tasks', '✓ 7 of 7', '29✓ 0✗ 1?', dur(total.t), `▲ ${f1(rate(S.gen))}`, inText(S), outText(S), usd(total.c)], f: 'bd' });
  g.box(0, 4, W, 11, { f: tf ? 'ac' : 'ln', title: 'Tasks · process, checks and measurements are separate columns' });
  if (compact) {
    table(g, 1, 5, W - 2, [{ l: '#', w: 4 }, { l: 'Task', w: 23 }, { l: 'Process', w: 11 }, { l: 'Checks', w: 15 }, { l: 'Time', w: 8, al: 'right' }, { l: 'Gen tok/s', w: 10, al: 'right' }, { l: 'Cost', w: 7, al: 'right' }],
      rows.map((x) => ({ ...x, v: [x.v[0], x.v[1], x.v[2], x.v[3], x.v[4], x.v[5], x.v[8]] })), { cursor: 6, focused: tf });
  } else {
    table(g, 1, 5, W - 2, [{ l: '#', w: 4 }, { l: 'Task', w: 29 }, { l: 'Process', w: 10 }, { l: 'Checks', w: 14 }, { l: 'Time', w: 7, al: 'right' }, { l: 'Gen tok/s', w: 10, al: 'right' }, { l: 'In tok (cached)', w: 16, al: 'right' }, { l: 'Out tok (reasoning)', w: 20, al: 'right' }, { l: 'Cost', w: 8, al: 'right' }], rows, { cursor: 6, focused: tf });
  }
  g.region(1, 5, W - 2, 9, 'DataTable', '#task-outcomes');
  if (compact) {
    g.box(0, 15, W, H - 16, { title: 'T5_persistence · ? unverified — not failed', f: focus === 'evidence' ? 'ac' : 'ln' });
    g.region(0, 15, W, H - 16, 'Static', '#check-detail');
    para(g, 2, 16, W - 4, 'The verifier could not start Chromium (Playwright browser not installed on 2026-09-28). The check never ran, so it neither passed nor failed. Excluded from default shortlists until verified.', 'mu');
    g.text(2, 20, fit(`In ${inText(S)} · Out ${outText(S)} · ${S.files} files · ${locText(S.loc)} LOC · m`, W - 4), 'mu');
    footer(g, resultFooter(true));
    return g;
  }
  const ef = focus === 'evidence';
  g.box(0, 15, 60, 16, { f: ef ? 'ac' : 'ln', title: 'T5_persistence · Cart survives reopening' });
  g.region(0, 15, 60, 16, 'VerticalScroll', '#check-detail.pane');
  let y = kv(g, 2, 16, 10, 56, [['Outcome', '? unverified — not failed', 'bd']]);
  y = para(g, 2, y + 1, 56, 'The verifier could not start Chromium: the Playwright browser was not installed on mike-mbp-m4 when this run was verified (2026-09-28). The check never ran, so it neither passed nor failed.');
  y = kv(g, 2, y + 1, 10, 56, [
    ['Evidence', 'checks/T5_persistence.log · exit 127 · 0.4 s'],
    ['Snapshot', 'T5 workspace · commit 4e7a1c9'],
    ['Effect', ['Kept and graded; left out of default', 'shortlists until every required check is', 'verified (M06).']],
  ]);
  g.box(60, 15, 60, 16, { f: focus === 'coverage' ? 'ac' : 'ln', title: 'Measurements · sources and coverage' });
  g.region(60, 15, 60, 16, 'Static', '#coverage.kv');
  kv(g, 62, 16, 15, 56, [
    ['Cost basis', fit(basisText(r), 41)],
    ['Tokens', 'harness-reported · 7 of 7 tasks'],
    ['Cache tokens', '? not exposed by Grok CLI 1.9.2'],
    ['Effect', 'may overstate cost (no cache discount)'],
    ['Gen tok/s', `▲ partial · ${S.gen.req[0]} of ${S.gen.req[1]} requests paired`],
    ['', 'proxy stream window · 3 T5 streams cut'],
    ['Files / LOC', `${S.files} / ${locText(S.loc)} · final snapshot T7`],
    ['', 'size with baseline included · m details'],
    ['Elapsed', 'wall clock per task · 7 of 7'],
    ['CPU', 'psutil · 1 s samples · 100% of the run'],
    ['GPU · power', 'not sampled · insufficient permission'],
    ['Telemetry', 'limits travel with exports and reports'],
  ]);
  para(g, 1, 32, W - 2, 'Process outcome (exit status), acceptance checks (✓ passed · ✗ failed · ? unverified · ○ not run) and quality grades are recorded separately. A zero exit never implies a passed check, and neither implies a grade.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Open check log', go: 'EvidenceViewer', focus: focus === 'log' }, { label: 'Open snapshot', go: 'EvidenceViewer' }, { label: 'Review again…', go: 'Rejudge' }]);
  footer(g, resultFooter(false));
  return g;
}

const EVIDENCE = [
  'All flows completed; cart badge lags one update after removal',
  'Consistent spacing and type; no dark mode',
  'Small modules, clear names; one 140-line render function',
  'Stock, cart totals and order history match the specification',
  'Survives reload and cleared storage; no input length limits',
  'Labels present; focus order skips the cart dialog',
];

export function resultReviews(sz, focus = 'grades') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  const r = byId['R-0924lab-1'];
  resultChrome(g, sz, r, 2);
  const nw = normalize(QW);
  const q = quality(r.g);
  const gf = focus === 'grades';
  g.box(0, 4, W, 10, { f: gf ? 'ac' : 'ln', title: `Raw grades · judge B · ${JUDGES.B.long}`, sub: 'rubric web v1 · 1–5' });
  table(g, 1, 5, W - 2, [{ l: 'Category', w: 24 }, { l: 'Weight', w: 9, al: 'right' }, { l: 'Raw', w: 6, al: 'right' }, { l: 'Weighted', w: 10, al: 'right' }, { l: '', w: 2 }, { l: 'Evidence summary from the review', w: W - 2 - 51 }],
    [...QCATS.map(([, name], i) => ({ v: [name, pct(nw[i]), String(r.g[i]), f2(nw[i] * r.g[i]), '', EVIDENCE[i]] })),
      { v: ['Weighted quality Q', '100.0%', '', f2(q), '', 'computed by AxBenchmark from raw grades; judge totals are ignored'], f: 'bd' }], { cursor: 5, focused: gf });
  g.region(1, 5, W - 2, 8, 'DataTable', '#grades');
  g.box(0, 14, 60, 15, { f: focus === 'review' ? 'ac' : 'ln', title: 'Original review · kept unchanged' });
  g.region(0, 14, 60, 15, 'Static', '#review-meta.kv');
  kv(g, 2, 15, 14, 56, [
    ['Judge', JUDGES.B.long],
    ['Reviewed', '2026-09-24 09:40 on lab-linux-4090'],
    ['Session', 'fresh headless session · 1 artifact'],
    ['Rubric', 'web v1 · from the template'],
    ['Evidence', '7 screenshots · transcript · 2 notes'],
    ['Limitations', 'no phone-size viewport was tested'],
    ['Judging cost', '$0.38 · separate from the run cost'],
    ['Validity', '✓ all six categories graded 1–5'],
  ]);
  g.box(60, 14, 60, 15, { f: focus === 'additional' ? 'ac' : 'ln', title: 'Additional reviews · none' });
  g.region(60, 14, 60, 15, 'Vertical', '#additional-reviews');
  let y = para(g, 62, 15, 56, 'Imported reviews keep their original judge, grades and evidence. To compare this result under judge group A, request a fresh review explicitly; the original stays beside it and its cost is recorded as judging cost.', 'mu');
  button(g, 62, y + 1, 'Review again…', { go: 'Rejudge', focus: focus === 'additional' });
  para(g, 1, 30, W - 2, 'Grades from different judge configurations are never merged. This result ranks in judge group B with its original review.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Open evidence', go: 'EvidenceViewer' }, { label: 'Score breakdown', go: 'ScoreBreakdown' }]);
  footer(g, resultFooter(false));
  return g;
}

// ---------------------------------------------------------------- M02 · modals over ResultsScreen

export function rejudge(sz, focus = 'judge') {
  const g = results(sz, 'none');
  const r = SEL;
  const m = modal(g, 84, 22, 'Review again', { sel: '#rejudge' });
  let y = m.y;
  g.text(m.x, y++, fit(`${r.id} · ${r.h} · ${r.model} · ${r.effort} · ↓ ${r.machine}`, m.w), 'bd');
  y++;
  g.text(m.x, y++, 'Original review · kept unchanged', 'bd');
  y = kv(g, m.x, y, 12, m.w, [['Judge', `B · ${JUDGES.B.long} · 2026-09-24`], ['Grades', `UX ${r.g[0]} · Visual ${r.g[1]} · Code ${r.g[2]} · Spec ${r.g[3]} · Robust ${r.g[4]} · A11y ${r.g[5]} · Q ${f2(quality(r.g))}`, 'mu']]);
  y++;
  g.text(m.x, y++, 'New review', 'bd');
  g.text(m.x, y, 'Judge', 'mu'); select(g, m.x + 12, y, m.w - 12, `${JUDGES.A.long} · group A`, { focus: focus === 'judge' });
  g.region(m.x + 12, y++, m.w - 12, 1, 'Select', '#rejudge-judge');
  y = kv(g, m.x, y, 12, m.w, [
    ['Rubric', 'web v1 · from the template, same for every review'],
    ['Session', 'one fresh headless session for this artifact'],
    ['Estimate', 'about $0.40 · recorded as judging cost, not run cost'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'The new grades are added beside the original, and the result then also ranks in judge group A. Group B keeps the original review.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }, { label: 'Review again', v: 'primary', focus: focus === 'confirm' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Review again' }], '');
  return g;
}

export function resultImport(sz, focus = 'add') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 24, 'Import results · validated', { sel: '#import-results' });
  let y = m.y;
  g.text(m.x, y++, fit('~/Downloads/inventory-results-lab-4090-0930.zip · 38.2 MB', m.w), 'bd');
  y++;
  step(g, m.x, y++, m.w, 'done', 'Paths, size and format valid · result-payload manifest · 1,236 files');
  step(g, m.x, y++, m.w, 'done', 'Template inventory-web-app r1 · SHA-256 matches library r1');
  g.text(m.x + 2, y++, SHA.inv1, 'mu');
  step(g, m.x, y++, m.w, 'done', 'Run 2026-09-30-lab from lab-linux-4090 · judge B · original weights 1:1:1');
  g.region(m.x, m.y + 2, m.w, 4, 'Vertical', '#import-steps');
  y++;
  const tf = focus === 'table';
  table(g, m.x, y, m.w, [{ l: 'Result', w: 14 }, { l: 'Configuration', w: 40 }, { l: 'Judge', w: 7 }, { l: 'Action', w: m.w - 61 }], [
    { v: ['R-0930lab-1', 'Claude Code · claude-opus-5-5 · high', 'B', '+ add'] },
    { v: ['R-0930lab-2', 'Pi · qwen3.5-35b-a3b · harness default', 'B', '+ add'] },
    { v: ['R-0924lab-2', 'Pi · qwen3.5-35b-a3b · harness default', 'B', { t: '= identical · skip', f: 'mu' }] },
  ], { cursor: 0, focused: tf });
  g.region(m.x, y, m.w, 4, 'DataTable', '#import-preview');
  y += 5;
  y = notice(g, m.x, y, m.w, 'warning', 'Validated, not certified', 'These checks prove the definition and the package integrity, not how the other machine ran the benchmark. Results are labelled imported; nothing is executed.');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }, { label: 'Add 2 results', v: 'primary', go: 'Results', focus: focus === 'add' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Add results', go: 'Results' }], '');
  return g;
}

export function resultImportConflict(sz, focus = 'close') {
  const g = results(sz, 'none');
  const compact = sz.id === 'compact';
  const m = modal(g, compact ? 78 : 86, compact ? 18 : 16, 'Results not imported', { sel: '#import-results' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'Result id conflict — nothing was added', null);
  y++;
  g.text(m.x, y++, fit('R-0924lab-1 already exists with different content.', m.w));
  const pair = (label, value, f) => {
    if (compact) { g.text(m.x, y++, label, 'mu'); g.text(m.x, y++, value, f); } else { g.text(m.x, y, label, 'mu'); g.text(m.x + 10, y++, value, f); }
  };
  pair('Existing', SHA.orders.split('').reverse().join(''), '');
  pair('Incoming', SHA.recipe.split('').reverse().join(''), 'bd');
  g.text(m.x, y, 'Differs', 'mu'); g.text(m.x + 10, y++, fit('measurements/cost.json · reviews/judge-B.json', m.w - 10));
  g.region(m.x, m.y + 2, m.w, y - m.y - 2, 'Static', '#conflict-digests');
  y++;
  para(g, m.x, y, m.w, 'The original result is unchanged. Identical re-imports are skipped; a different payload never overwrites one. If this is a new run, ask the sender to export it under its own result id.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Show differences', focus: focus === 'diff' }, { label: 'Close', v: 'primary', go: 'Results', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

export function exportResult(sz, focus = 'results') {
  const g = results(sz, 'none');
  const m = modal(g, 84, 27, 'Export result ZIP', { sel: '#export-results' });
  let y = m.y;
  g.text(m.x, y++, fit(`Run 2026-09-28-a · mike-mbp-m4 · template r1 ${s8(SHA.inv1)}`, m.w), 'bd');
  y++;
  const rf = focus === 'results';
  RESULTS.filter((r) => r.run === '2026-09-28-a').forEach((r, i) => {
    check(g, m.x, y, fit(`${r.id}  ${r.h} · ${r.model} · ${r.effort}`, 50), true, { focus: rf && i === 0 });
    g.text(m.x + 54, y++, fit(statusText(r), m.w - 54), 'mu');
  });
  g.region(m.x, y - 4, m.w, 4, 'SelectionList', '#export-selection');
  y++;
  g.text(m.x, y, 'Save as', 'mu'); input(g, m.x + 9, y, m.w - 9, '~/Desktop/inventory-r1-results-2026-09-28-a.zip', { focus: focus === 'path' });
  g.region(m.x + 9, y++, m.w - 9, 1, 'Input', '#export-results-path');
  y++;
  g.text(m.x, y++, 'Package contents', 'bd');
  const items = [
    ['✓', 'Exact template r1 with its SHA-256 and packaged baseline'],
    ['✓', 'Selected run records, resolved configuration and original weights'],
    ['✓', 'Machine label, OS and hardware, harness versions, timestamps'],
    ['✓', 'Outcomes, measurements with coverage, judge metadata and raw grades'],
    ['✓', 'Task snapshots, logs and evidence · result-payload integrity manifest'],
    ['✗', 'Excluded: credentials and keys, unrelated machine files, other runs'],
  ];
  items.forEach(([gl, t]) => { g.text(m.x, y, gl, gl === '✓' ? 'ac' : 'mu'); g.text(m.x + 2, y++, fit(t, m.w - 2), gl === '✓' ? '' : 'mu'); });
  g.region(m.x, y - 6, m.w, 6, 'Static', '#export-results-contents');
  y++;
  para(g, m.x, y, m.w, 'Source result ids and provenance travel with the package and survive later re-exports.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }, { label: 'Export ZIP', v: 'primary', focus: focus === 'export' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'space', d: 'Toggle' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Export' }], '');
  return g;
}

export function reportReady(sz, focus = 'close') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 17, 'HTML report', { sel: '#report' });
  let y = m.y;
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, 'Report written', 'bd');
  g.text(m.x + 2, y++, fit('~/.axbenchmark/reports/inventory-web-app-r1-3f9c2e71-2026-10-01.html', m.w - 2));
  g.text(m.x + 2, y++, fit('1.9 MB · standalone · 12 results · 2 judge groups · original weights', m.w - 2), 'mu');
  g.region(m.x, m.y, m.w, 3, 'Static', '#report-path');
  y++;
  g.text(m.x, y, '▲', 'bd'); g.text(m.x + 2, y++, 'Could not open it automatically', 'bd');
  y = para(g, m.x + 2, y, m.w - 2, 'No application is set to open .html files (open exited 1). The file is complete; open it from the path above.', 'mu');
  y++;
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit('No model calls were made · the report uses retained results only', m.w - 2), 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Copy path', focus: focus === 'copy' }, { label: 'Open folder' }, { label: 'Close', v: 'primary', go: 'Results', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Results' }, { k: 'c', d: 'Copy path' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- M06 · Rankings tab

const GROUP_A = RESULTS.filter((r) => r.judge === 'A');

export function rankings(sz, focus = 'combined', st = {}) {
  if (st.factors) return rankingsFactors(sz, focus);
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const rw = st.alt ? [2, 1, 1] : [1, 1, 1];
  resultsChrome(g, sz, 1, st);
  const res = combined(GROUP_A, rw);
  const [wc, wt, wq] = res.w;
  const gf = focus === 'group';
  if (compact) {
    g.text(1, 4, 'Group', 'mu'); select(g, 7, 4, 24, `A · ${JUDGES.A.short}`, { focus: gf });
    g.text(33, 4, fit(`weights ${rw.join(':')} · ${st.alt ? 'alternative' : st.profile ? 'profile defaults' : 'original'}`, W - 34), st.alt || st.profile ? 'bd' : 'mu');
  } else {
    g.text(1, 4, 'Judge group', 'mu'); select(g, 13, 4, 44, `A · ${JUDGES.A.long}`, { focus: gf });
    g.region(13, 4, 44, 1, 'Select', '#judge-group');
    g.text(59, 4, 'Weights', 'mu');
    g.text(67, 4, fit(st.alt ? `alternative · quality web v1 · ranking ${rw.join(':')}` : st.profile ? 'profile defaults · web v1 · ranking 1:1:1' : 'original · quality web v1 · ranking 1:1:1', 44), st.alt || st.profile ? 'bd' : '');
    g.text(W - 7, 4, 'w', 'ac bd'); g.text(W - 5, 4, 'Edit'); g.link(W - 7, 4, 6, 1, 'go:WeightsEditor');
  }
  const cf = focus === 'combined';
  const ch = res.rows.length + 3;
  g.box(0, 5, W, ch, { f: cf ? 'ac' : 'ln', title: `Combined · cost ${pct(wc)} · time ${pct(wt)} · quality ${pct(wq)}${compact ? '' : ' · 5 statistics 0%'}`, sub: `${res.rows.length} of ${GROUP_A.length} qualify` });
  const rows = res.rows.map((x, i) => ({ v: compact
    ? [String(i + 1), modelEffort(x.r), f1(x.score), f1(x.c), f1(x.t), f1(x.qq), f2(x.q)]
    : [String(i + 1), x.r.id, x.r.h, modelEffort(x.r), { t: f1(x.score), f: 'bd' }, f1(x.c), f1(x.t), f1(x.qq), f2(x.q), usd(x.r.cost), dur(x.r.time)], go: 'ScoreBreakdown' }));
  if (compact) table(g, 1, 6, W - 2, [{ l: '#', w: 3 }, { l: 'Model · effort', w: 25 }, { l: 'Score', w: 8, al: 'right' }, { l: 'Cost pts', w: 10, al: 'right' }, { l: 'Time pts', w: 10, al: 'right' }, { l: 'Qual pts', w: 11, al: 'right' }, { l: 'Q', w: 11, al: 'right' }], rows, { cursor: 0, focused: cf });
  else table(g, 1, 6, W - 2, [{ l: '#', w: 4 }, { l: 'Result', w: 12 }, { l: 'Harness', w: 13 }, { l: 'Model · effort', w: 25 }, { l: 'Score', w: 8, al: 'right' }, { l: 'Cost pts', w: 10, al: 'right' }, { l: 'Time pts', w: 10, al: 'right' }, { l: 'Quality pts', w: 13, al: 'right' }, { l: 'Q', w: 7, al: 'right' }, { l: 'Cost', w: 8, al: 'right' }, { l: 'Time', w: 8, al: 'right' }], rows, { cursor: 0, focused: cf });
  g.region(1, 6, W - 2, ch - 2, 'DataTable', '#combined');

  const sl = shortlists(GROUP_A);
  if (compact) {
    let y = 5 + ch;
    const line = (label, items) => { g.text(1, y, fit(label, 13), 'bd'); g.text(14, y++, fit(items, W - 15), 'mu'); };
    line('Lowest cost', sl.cost.map((r, i) => `${i + 1} ${r.model} ${usd(r.cost)}`).join(' · '));
    line('Shortest', sl.time.map((r, i) => `${i + 1} ${r.model} ${dur(r.time)}`).join(' · '));
    line('Quality', sl.quality.map((x, i) => `${i + 1} ${x.r.model} ${f2(x.q)}`).join(' · '));
    g.region(1, 5 + ch, W - 2, 3, 'Static', '#shortlists');
    y++;
    g.text(1, y++, fit(`Excluded from combined · ${GROUP_A.length - res.rows.length}`, W - 2), 'bd');
    GROUP_A.filter((r) => !res.rows.find((x) => x.r === r)).forEach((r) => { g.text(1, y, fit(r.id, 12)); g.text(13, y++, fit(res.why(r).join(' · '), W - 14), 'mu'); });
    g.region(1, 5 + ch + 4, W - 2, y - 5 - ch - 4, 'Static', '#excluded');
    footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: 'g', d: 'Group' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'b', d: 'Breakdown', go: 'ScoreBreakdown' }]);
    return g;
  }

  let y = 5 + ch;
  const boxes = [
    ['Lowest cost', sl.cost.map((r) => [modelEffort(r), usd(r.cost)])],
    ['Shortest time', sl.time.map((r) => [modelEffort(r), dur(r.time)])],
    ['Highest quality', sl.quality.map((x) => [modelEffort(x.r), f2(x.q)])],
  ];
  boxes.forEach(([t, items], i) => {
    const x = i * 40;
    g.box(x, y, 40, 8, { f: focus === 'shortlists' && i === 0 ? 'ac' : 'ln', title: t, sub: items.length < 5 ? `${items.length} qualify` : 'top 5' });
    table(g, x + 1, y + 1, 38, [{ l: '#', w: 3 }, { l: 'Model · effort', w: 25 }, { l: '', w: 10, al: 'right' }], items.map(([a, b], j) => ({ v: [String(j + 1), a, b] })));
  });
  g.region(0, y, W, 8, 'Horizontal', '#shortlists');
  y += 8;
  const af = focus === 'all';
  g.box(0, y, W, GROUP_A.length + 3, { f: af ? 'ac' : 'ln', title: `All entries · judge group A · ${GROUP_A.length}`, sub: 'failed and excluded stay listed' });
  table(g, 1, y + 1, W - 2, [{ l: 'Result', w: 12 }, { l: 'Model · effort', w: 24 }, { l: 'Status', w: 12 }, { l: 'Checks', w: 9 }, { l: 'Spec', w: 5, al: 'right' }, { l: 'Q', w: 6, al: 'right' }, { l: 'Cost', w: 9, al: 'right' }, { l: 'Time', w: 8, al: 'right' }, { l: '', w: 2 }, { l: 'Combined ranking', w: W - 2 - 87 }],
    byCost(GROUP_A).map((r) => {
      const why = res.why(r);
      return { v: [r.id, modelEffort(r), { t: statusText(r), f: r.status === 'complete' ? '' : 'bd' }, checksText(r.checks), r.g ? String(r.g[SPEC]) : '—', r.g ? f2(quality(r.g)) : '—', usd(r.cost), dur(r.time), '', why.length ? { t: '✗ ' + why.join(' · '), f: 'mu' } : '✓ ranked'] };
    }), { cursor: 0, focused: af });
  g.region(1, y + 1, W - 2, GROUP_A.length + 1, 'DataTable', '#all-entries');
  y += GROUP_A.length + 3;
  const minR = res.rows.find((x) => x.r.time === res.minT).r;
  y = para(g, 1, y, W - 2, st.profile
    ? 'R-0925b-1 and R-0925b-2 froze ranking 2:1:1 (Claude effort sweep); the other 6 froze 1:1:1, so the profile’s default weights rank the group. Quality uses the same web v1 category weights for every entry. w: any result’s original weights, or custom.'
    : wc > 0 && res.minC === 0
    ? `Minimums from the ${res.rows.length} combined-eligible entries: verified cost $0.00, so each verified $0 entry earns the full ${f1(100 * wc)} cost points and positive costs earn 0. Time minimum ${dur(res.minT)} (${minR.id}). Unknown cost is never treated as 0.`
    : `Minimums from the ${res.rows.length} combined-eligible entries: cost ${usd(res.minC)} · time ${dur(res.minT)}. Gen tok/s, In tok, Out tok, Files and LOC weigh 0: never looked up, so an unknown or partial value excludes nobody; s shows their raw columns.`, 'mu');
  if (st.alt) notice(g, 1, y, W - 2, 'warning', 'Alternative weights · nothing original was changed', null);
  else if (st.profile) {
    notice(g, 1, y, W - 2, 'warning', 'Profile defaults: original weights differ across results', null);
    g.region(1, y, W - 2, 1, 'Static', '#weights-label.-profile');
  }
  else g.text(1, y, fit('Judge group B (4 imported, gpt-6-astra) ranks separately · g switches. Full precision; exact ties break by result id.', W - 2), 'mu');
  buttons(g, W - 1, H - 2, st.alt
    ? [{ label: 'Reset to original', v: 'primary', go: 'Rankings', focus: focus === 'reset' }, { label: 'Save preset…', go: 'PromptSavePreset' }, { label: 'Export configuration', go: 'PromptExportConfig' }, { label: 'HTML report', go: 'ReportReady' }]
    : st.profile
    ? [{ label: 'Score breakdown', go: 'ScoreBreakdown' }, { label: 'Use a result’s original weights…', go: 'WeightsEditor', focus: focus === 'originals' }, { label: 'HTML report', v: 'primary', go: 'ReportReady' }]
    : [{ label: 'Score breakdown', go: 'ScoreBreakdown', focus: focus === 'breakdown' }, { label: 'Edit weights…', go: 'WeightsEditor' }, { label: 'HTML report', v: 'primary', go: 'ReportReady' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: '1-2', d: 'Tab', go: 'Results' }, { k: 'g', d: 'Group' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'b', d: 'Breakdown', go: 'ScoreBreakdown' }, { k: 's', d: 'Stats' }, { k: 'r', d: 'Reset', go: 'Rankings', off: !st.alt }, { k: 'h', d: 'Report', go: 'ReportGenerate' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- M06 · Rankings with statistics enabled (R175, R176)

// Alternative plan: time 1 · quality 1 · Gen tok/s 1 (higher) · cost and the other four statistics 0. The timing basis
// is chosen before eligibility; references come from the one eligible population.
export const FACTOR_PLAN = planV2([0, 1, 1], { generation_rate: 1 }, { generation_rate: 'higher' });
const short = (w) => (w.startsWith('metric_') ? w.split(' · ')[0] : w);

function rankingsFactors(sz, focus) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  resultsChrome(g, sz, 1, { alt: true });
  const res = rank8(GROUP_A, FACTOR_PLAN);
  g.text(1, 4, 'Judge group', 'mu'); select(g, 13, 4, 26, `A · ${JUDGES.A.short}`, { focus: focus === 'group' });
  g.region(13, 4, 26, 1, 'Select', '#judge-group');
  g.text(41, 4, 'Timing basis', 'mu'); select(g, 54, 4, 26, 'proxy stream window v1', { focus: focus === 'basis' });
  g.region(54, 4, 26, 1, 'Select', '#timing-basis');
  g.text(82, 4, fit('alternative · 8 factors', 30), 'bd');
  g.text(W - 7, 4, 'w', 'ac bd'); g.text(W - 5, 4, 'Edit'); g.link(W - 7, 4, 6, 1, 'go:WeightsEditor');
  const cf = focus === 'combined', ch = res.rows.length + 3;
  g.box(0, 5, W, ch, { f: cf ? 'ac' : 'ln', title: `Combined · time ${pct(res.w.time)} · quality ${pct(res.w.quality)} · Gen tok/s ${pct(res.w.generation_rate)} higher · cost and 4 statistics 0%`, sub: `${res.rows.length} of ${GROUP_A.length} qualify` });
  table(g, 1, 6, W - 2, [{ l: '#', w: 4 }, { l: 'Result', w: 12 }, { l: 'Model · effort', w: 25 }, { l: 'Score', w: 8, al: 'right' }, { l: 'Time pts', w: 10, al: 'right' }, { l: 'Quality pts', w: 13, al: 'right' }, { l: 'Gen pts', w: 9, al: 'right' }, { l: 'Q', w: 6, al: 'right' }, { l: 'Time', w: 8, al: 'right' }, { l: 'Gen tok/s', w: 12, al: 'right' }, { l: 'Cost', w: 11, al: 'right' }],
    res.rows.map((x, i) => ({ v: [String(i + 1), x.r.id, modelEffort(x.r), { t: f1(x.score), f: 'bd' }, f1(x.parts.time), f1(x.parts.quality), f1(x.parts.generation_rate), f2(x.q), dur(x.r.time), f2(x.x.generation_rate), usd(x.r.cost)], go: 'ScoreBreakdownFactors' })), { cursor: 0, focused: cf });
  g.region(1, 6, W - 2, ch - 2, 'DataTable', '#combined');
  let y = 5 + ch;
  const sl = shortlists(GROUP_A);
  [['Lowest cost', sl.cost.map((r) => [modelEffort(r), usd(r.cost)])], ['Shortest time', sl.time.map((r) => [modelEffort(r), dur(r.time)])], ['Highest quality', sl.quality.map((x) => [modelEffort(x.r), f2(x.q)])]].forEach(([t, items], i) => {
    g.box(i * 40, y, 40, 8, { f: 'ln', title: t, sub: 'unchanged by Gen tok/s' });
    table(g, i * 40 + 1, y + 1, 38, [{ l: '#', w: 3 }, { l: 'Model · effort', w: 25 }, { l: '', w: 10, al: 'right' }], items.map(([a, b], j) => ({ v: [String(j + 1), a, b] })));
  });
  g.region(0, y, W, 8, 'Horizontal', '#shortlists');
  y += 8;
  const af = focus === 'all';
  g.box(0, y, W, GROUP_A.length + 4, { f: af ? 'ac' : 'ln', title: `All entries · judge group A · ${GROUP_A.length} · statistics columns`, sub: 'excluded stay listed with typed reasons' });
  table(g, 1, y + 1, W - 2, [{ l: 'Result', w: 12 }, { l: 'Model · effort', w: 24 }, { l: 'Gen tok/s', w: 14 }, { l: 'In tok\n(cached)', w: 14 }, { l: 'Out tok\n(reasoning)', w: 12 }, { l: 'Files /\nLOC', w: 11 }, { l: '', w: 2 }, { l: 'Combined ranking', w: W - 2 - 89 }],
    byCost(GROUP_A).map((r) => {
      const why = res.why(r);
      const ordered = [...why.filter((w) => w.startsWith('metric_')), ...why.filter((w) => !w.startsWith('metric_'))];
      return { v: [r.id, modelEffort(r), ...statCells(r), '', why.length ? { t: '✗ ' + ordered.map(short).join(' · '), f: 'mu' } : '✓ ranked'] };
    }), { cursor: af ? 6 : -1, focused: af });
  g.region(1, y + 1, W - 2, GROUP_A.length + 2, 'DataTable', '#all-entries.-statistics');
  y += GROUP_A.length + 4;
  const top = res.rows.find((x) => x.x.generation_rate === res.ref.generation_rate).r, fast = res.rows.find((x) => x.r.time === res.ref.time).r;
  y = para(g, 1, y, W - 2, `References from the same ${res.rows.length} eligible entries: Gen tok/s max ${f2(res.ref.generation_rate)} (${top.id}) · time min ${dur(res.ref.time)} (${fast.id}). Cost weighs 0, so unknown costs exclude nobody here. The proxy basis was chosen before eligibility: native-decode rows stay listed, never converted.`, 'mu');
  notice(g, 1, y, W - 2, 'warning', 'Alternative weights · 8 factors · nothing original was changed', null);
  buttons(g, W - 1, H - 2, [{ label: 'Reset to original', v: 'primary', go: 'Rankings', focus: focus === 'reset' }, { label: 'Score breakdown', go: 'ScoreBreakdownFactors' }, { label: 'Edit weights…', go: 'WeightsFactors' }, { label: 'HTML report', go: 'ReportReady' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'TemplateResults' }, { k: '1-2', d: 'Tab', go: 'Results' }, { k: 'g', d: 'Group' }, { k: 'w', d: 'Weights', go: 'WeightsFactors' }, { k: 'b', d: 'Breakdown', go: 'ScoreBreakdownFactors' }, { k: 's', d: 'Outcomes', go: 'Rankings' }, { k: 'r', d: 'Reset', go: 'Rankings' }, { k: 'h', d: 'Report', go: 'ReportGenerate' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- M06 · Rankings with trials (means, per-trial ranges)

export function rankingsTrials(sz, focus = 'combined') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  resultsChrome(g, sz, 1, { title: 'Results · Orders REST API r3', bar: `◆ Orders REST API · r3 · sha256 ${mid(SHA.orders)} · 6 results · run ${TRIAL_RUN.run} · 2 configurations × 3 trials` });
  g.text(1, 4, 'Judge group', 'mu'); select(g, 13, 4, 44, `A · ${JUDGES.A.long}`, { focus: focus === 'group' });
  g.region(13, 4, 44, 1, 'Select', '#judge-group');
  g.text(59, 4, 'Weights', 'mu'); g.text(67, 4, fit('original · backend v1 · ranking 1:1:1', 44));
  const S2 = TRIAL_CONFIGS.map((c) => ({ c, cs: stats(c.trials.map((t) => t.cost)), ts: stats(c.trials.map((t) => t.time)), qs: stats(c.trials.map(tq)), bad: trialGates(c) }));
  const ok = S2.filter((x) => !x.bad.length);
  const minC = Math.min(...ok.map((x) => x.cs.mean)), minT = Math.min(...ok.map((x) => x.ts.mean));
  const third = 100 / 3;
  const scored = ok.map((x) => ({ ...x, score: third * minC / x.cs.mean + third * minT / x.ts.mean + third * x.qs.mean / 5 }));
  const cf = focus === 'combined';
  g.box(0, 5, W, scored.length + 3, { f: cf ? 'ac' : 'ln', title: 'Combined · cost 33.3% · time 33.3% · quality 33.3% · means of 3 trials', sub: `${scored.length} of ${S2.length} qualify` });
  const cols = [{ l: '#', w: 4 }, { l: 'Configuration', w: 30 }, { l: 'Trials', w: 7 }, { l: 'Score', w: 8, al: 'right' }, { l: 'Cost', w: 8, al: 'right' }, { l: 'range', w: 12, al: 'right' }, { l: 'Time', w: 8, al: 'right' }, { l: 'range', w: 14, al: 'right' }, { l: 'Q', w: 7, al: 'right' }, { l: 'range', w: 11, al: 'right' }, { l: '', w: 9 }];
  table(g, 1, 6, W - 2, cols, scored.map((x, i) => ({ v: [String(i + 1), `${x.c.h} · ${x.c.model} ${x.c.effort}`, '3 of 3', { t: f1(x.score), f: 'bd' }, usd(x.cs.mean), `${x.cs.min.toFixed(2)}–${x.cs.max.toFixed(2)}`, dur(Math.round(x.ts.mean)), `${dur(x.ts.min)}–${dur(x.ts.max)}`, f2(x.qs.mean), `${f2(x.qs.min)}–${f2(x.qs.max)}`, ''] })), { cursor: 0, focused: cf });
  g.region(1, 6, W - 2, scored.length + 1, 'DataTable', '#combined');
  let y = 5 + scored.length + 3;
  const af = focus === 'all';
  g.box(0, y, W, S2.length + 3, { f: af ? 'ac' : 'ln', title: `All configurations · judge group A · ${S2.length}`, sub: 'excluded stay listed with their reason' });
  table(g, 1, y + 1, W - 2, [{ l: 'Configuration', w: 39 }, { l: 'Trials', w: 7 }, { l: 'Cost', w: 8, al: 'right' }, { l: 'Time', w: 8, al: 'right' }, { l: 'Q', w: 6, al: 'right' }, { l: '', w: 2 }, { l: 'Combined ranking', w: W - 2 - 70 }],
    S2.map((x) => ({ v: [`${x.c.h} · ${x.c.model} ${x.c.effort}`, '3 of 3', usd(x.cs.mean), dur(Math.round(x.ts.mean)), f2(x.qs.mean), '', x.bad.length ? { t: `✗ trial ineligible · ${x.bad[0]}${x.bad.length > 1 ? ` +${x.bad.length - 1}` : ''}`, f: 'mu' } : '✓ ranked'] })), { cursor: af ? 1 : -1, focused: af });
  g.region(1, y + 1, W - 2, S2.length + 1, 'DataTable', '#all-entries');
  y += S2.length + 4;
  y = para(g, 1, y, W - 2, 'Each configuration ranks by the mean of its trials; the ranges show the spread and never change the order. A configuration qualifies only when every trial does, so one failed check in one trial excludes it. Minimums come from the qualifying means.', 'mu');
  buttons(g, W - 1, H - 2, [{ label: 'Score breakdown', go: 'ScoreBreakdown' }, { label: 'Edit weights…', go: 'WeightsEditor' }, { label: 'HTML report', v: 'primary', go: 'ReportReady' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultsTrials' }, { k: '1-2', d: 'Tab', go: 'ResultsTrials' }, { k: 'g', d: 'Group' }, { k: 'w', d: 'Weights', go: 'WeightsEditor' }, { k: 'b', d: 'Breakdown', go: 'ScoreBreakdown' }, { k: 'h', d: 'Report', go: 'ReportGenerate' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- M06 · modals

export function scoreBreakdown(sz, st = {}) {
  const g = st.factors ? rankingsFactors(sz, 'none') : rankings(sz, 'none');
  const res = st.factors ? rank8(GROUP_A, FACTOR_PLAN) : rank8(GROUP_A, planV2());
  const idx = res.rows.findIndex((x) => x.r.id === 'R-0928a-1');
  const x = res.rows[idx], r = x.r, S = STATS[r.id];
  const m = modal(g, 92, st.factors ? 31 : 30, st.factors ? 'Score breakdown · alternative · 8 factors' : 'Score breakdown', { sel: '#breakdown' });
  let y = m.y;
  g.text(m.x, y++, fit(`${r.id} · ${r.h} · ${r.model} · ${r.effort} · judge A`, m.w), 'bd');
  y++;
  g.text(m.x, y++, fit(st.factors
    ? `✓ completed · ✓ ${r.checks.p}/30 checks · ✓ grades valid · ✓ business ${r.g[SPEC]} ≥ 4 · ✓ Gen tok/s complete, proxy`
    : `✓ completed   ✓ ${r.checks.p}/30 checks verified   ✓ grades valid   ✓ business ${r.g[SPEC]} ≥ 4`, m.w));
  g.region(m.x, y - 1, m.w, 1, 'Static', '#eligibility');
  y++;
  const nw = normalize(QW);
  table(g, m.x, y, m.w, [{ l: 'Quality · web v1', w: 26 }, { l: 'Raw', w: 6, al: 'right' }, { l: 'Weight', w: 9, al: 'right' }, { l: 'Normalized', w: 12, al: 'right' }, { l: 'Contribution', w: m.w - 53, al: 'right' }],
    [...QCATS.map(([, n, , w], i) => ({ v: [n, String(r.g[i]), String(w), pct(nw[i]), f2(nw[i] * r.g[i])] })), { v: ['Q = Σ weight × grade', '', '100', '100.0%', f2(x.q)], f: 'bd' }]);
  g.region(m.x, y, m.w, 8, 'DataTable', '#quality-breakdown');
  y += 9;
  const w = res.w, off = (k) => w[k] === 0;
  const rowsB = st.factors
    ? [
      { v: ['Cost', pct(0), usd(r.cost), '—', '', 'weight 0 · skipped', '0.0'], f: 'mu' },
      { v: ['Time', pct(w.time), dur(r.time), `min ${dur(res.ref.time)}`, '', `${f1(100 * w.time)} × min / time`, f1(x.parts.time)] },
      { v: ['Quality', pct(w.quality), f2(x.q), '—', '', `${f1(100 * w.quality)} × Q / 5`, f1(x.parts.quality)] },
      { v: ['Gen tok/s · higher', pct(w.generation_rate), f2(x.x.generation_rate), `max ${f2(res.ref.generation_rate)}`, '', `${f1(100 * w.generation_rate)} × x / max`, f1(x.parts.generation_rate)] },
      { v: ['In · Out · Files · LOC', pct(0), 'raw only', '—', '', 'weight 0 · skipped', '0.0'], f: 'mu' },
    ]
    : [
      { v: ['Cost', pct(w.cost), usd(r.cost), `min ${usd(res.ref.cost)}`, '', `${f1(100 * w.cost)} × min / cost`, f1(x.parts.cost)] },
      { v: ['Time', pct(w.time), dur(r.time), `min ${dur(res.ref.time)}`, '', `${f1(100 * w.time)} × min / time`, f1(x.parts.time)] },
      { v: ['Quality', pct(w.quality), f2(x.q), '—', '', `${f1(100 * w.quality)} × Q / 5`, f1(x.parts.quality)] },
      { v: [`5 statistics · ${genText(S)} tok/s…`, pct(0), 'raw only', '—', '', 'weight 0 · skipped', '0.0'], f: 'mu' },
    ];
  table(g, m.x, y, m.w, [{ l: st.factors ? 'Combined · alternative' : 'Combined · 1:1:1', w: 23 }, { l: 'Weight', w: 8, al: 'right' }, { l: 'Measured', w: 11, al: 'right' }, { l: 'Reference', w: 12, al: 'right' }, { l: '', w: 1 }, { l: 'Formula', w: 21 }, { l: 'Points', w: m.w - 76, al: 'right' }],
    [...rowsB, { v: ['Score', '100.0%', '', '', '', `rank ${idx + 1} of ${res.rows.length}`, f1(x.score)], f: 'bd' }]);
  g.region(m.x, y, m.w, rowsB.length + 2, 'DataTable', '#combined-breakdown');
  y += rowsB.length + 3;
  para(g, m.x, y, m.w, st.factors
    ? 'References come from the 3 entries eligible for this plan. Direction is your preference and never changes a grade. Values are exact; rounding is display only.'
    : 'AxBenchmark computes every total from retained raw grades and measurements; judge-calculated totals are never used. Values are rounded only for display.', 'mu');
  const back = st.factors ? 'RankingsFactors' : 'Rankings';
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', go: back, focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: back }, { k: '←→', d: 'Previous / next entry' }], '');
  if (off('quality')) throw new Error('unreachable');
  return g;
}

// Weight rows, quality weights and plan per editor state. Directions: fixed for cost, time and quality; a statistic
// stays "—" until chosen and cannot carry weight without one.
const EDITOR = {
  default: { title: 'Weights', preset: 'Original · frozen at launch', qv: QW, plan: planV2([2, 1, 1]) },
  invalid: { title: 'Weights · fix 3 values', preset: 'Unsaved changes', qv: [0, 0, 0, 0, 0, 0], plan: planV2([1, -1, 1], { loc: 1 }) },
  factors: { title: 'Weights · 8 factors', preset: 'Unsaved changes', qv: QW, plan: FACTOR_PLAN },
};
const NOTE = { cost: 'min / cost', time: 'min / time', quality: 'Q / 5', generation_rate: 'per request', input_tokens: 'mean of trials', output_tokens: 'mean of trials', file_count: 'final snapshot', loc: 'physical lines' };

export function weightsEditor(sz, focus = 'ranking', st = {}) {
  const E = EDITOR[st.invalid ? 'invalid' : st.factors ? 'factors' : 'default'];
  const g = st.factors ? rankingsFactors(sz, 'none') : rankings(sz, 'none');
  const m = modal(g, 112, 30, E.title, { sel: '#weights' });
  let y = m.y;
  g.text(m.x, y, 'Preset', 'mu'); select(g, m.x + 8, y, 36, E.preset, { focus: focus === 'preset' });
  g.region(m.x + 8, y, 36, 1, 'Select', '#preset');
  g.text(m.x + 46, y++, fit('schema 2 · applies to results and HTML report', m.w - 46), 'mu');
  y++;
  const qv = E.qv, wts = E.plan.weights, dirs = E.plan.directions;
  const qerr = validate(Object.fromEntries(QCATS.map(([k], i) => [k, qv[i]])), QCATS.map((c) => c[0]));
  const keys = FACTORS.map((f) => f[0]);
  const bad = Object.fromEntries(keys.map((k) => [k, !Number.isFinite(wts[k]) || wts[k] < 0 ? 'neg' : NEW_KEYS.includes(k) && wts[k] > 0 && !dirs[k] ? 'dir' : null]));
  const rerr = keys.some((k) => bad[k]) ? 'x' : validatePlan(E.plan);
  const L = m.x, R = m.x + 44;
  g.text(L, y, 'Quality categories · web v1', 'bd'); g.text(R, y++, 'Ranking components · eight, normalized together', 'bd');
  g.text(L, y, fit('decide the overall grade Q', 40), 'mu'); g.text(R, y++, fit('decide the combined score · Q comes from the left', 62), 'mu');
  y++;
  const qn = qerr ? null : normalize(qv);
  const tot = keys.reduce((n, k) => n + wts[k], 0);
  const rn = rerr ? null : Object.fromEntries(keys.map((k) => [k, wts[k] / tot]));
  const y0 = y;
  QCATS.forEach(([, n], i) => {
    g.text(L, y0 + i, fit(n, 22), 'mu');
    input(g, L + 22, y0 + i, 7, String(qv[i]), { focus: focus === 'quality' && i === 0 });
    g.text(L + 30, y0 + i, fit(qn ? pct(qn[i]) : '—', 8, 'right'), qn ? '' : 'mu');
  });
  g.text(R + 14, y0 - 1, fit('Weight', 8), 'mu'); g.text(R + 23, y0 - 1, fit('Direction', 14), 'mu'); g.text(R + 38, y0 - 1, fit('Share', 7, 'right'), 'mu'); g.text(R + 47, y0 - 1, 'Factor', 'mu');
  FACTORS.forEach(([k, n, fixed], i) => {
    const ry = y0 + i + (i >= 3 ? 1 : 0);
    const isOn = wts[k] > 0;
    g.text(R, ry, fit(n, 13), isOn || i < 3 ? '' : 'mu');
    input(g, R + 14, ry, 7, String(wts[k]), { focus: (focus === 'ranking' && i === 0) || (focus === 'weight' && k === 'generation_rate'), f: bad[k] === 'neg' ? 'bd ul' : '' });
    if (fixed) g.text(R + 23, ry, fit(`${fixed} · fixed`, 14), 'mu');
    else select(g, R + 23, ry, 13, dirs[k] ?? '—', { focus: focus === 'direction' && k === 'generation_rate', f: bad[k] === 'dir' ? 'bd ul' : dirs[k] ? '' : 'mu' });
    g.text(R + 38, ry, fit(rn ? pct(rn[k]) : bad[k] ? '✗' : '—', 7, 'right'), rn ? (isOn ? '' : 'mu') : 'bd');
    g.text(R + 47, ry, fit(NOTE[k], 15), 'mu');
  });
  g.text(R, y0 + 3, fit('Statistics · each needs a direction before it can carry weight', 62), 'mu');
  g.region(L + 22, y0, 16, 6, 'Input', '.weight');
  g.region(R + 14, y0, 37, 9, 'Input', '.weight · Select.direction');
  const qy = y0 + 6;
  g.hline(L, qy, 40);
  g.text(L, qy + 1, fit('Total', 22), 'mu'); g.text(L + 23, qy + 1, fit(String(qv.reduce((a, b) => a + b, 0)), 6)); g.text(L + 30, qy + 1, fit(qn ? '100.0%' : '—', 8, 'right'), 'bd');
  if (qerr) para(g, L, qy + 3, 40, `✗ ${qerr}.`, 'bd');
  const ry = y0 + 9;
  g.hline(R, ry, 62);
  g.text(R, ry + 1, fit('Total', 14), 'mu'); g.text(R + 15, ry + 1, fit(String(tot), 6)); g.text(R + 38, ry + 1, fit(rn ? '100.0%' : '—', 7, 'right'), 'bd');
  g.text(R, ry + 2, fit('Timing basis', 14), 'mu'); select(g, R + 14, ry + 2, 26, 'proxy stream window v1', { focus: focus === 'basis', f: wts.generation_rate > 0 ? '' : 'mu' });
  g.text(R + 42, ry + 2, fit(wts.generation_rate > 0 ? 'sets the cohort' : 'used when Gen > 0', 20), 'mu');
  g.region(R + 14, ry + 2, 26, 1, 'Select', '#timing-basis');
  let ey = ry + 4;
  if (rerr) {
    if (bad.time === 'neg') ey = para(g, R, ey, 62, '✗ Time must be 0 or more. Negative and non-finite values are rejected.', 'bd');
    if (bad.loc === 'dir') ey = para(g, R, ey, 62, '✗ LOC needs higher or lower before it can carry weight. No direction is guessed from its name.', 'bd');
  } else ey = para(g, R, ey, 62, st.factors
    ? 'higher: you prefer faster generation. Direction states your priority; it never changes a grade.'
    : 'All eight are divided by their total. Zero removes a component and it is never looked up; raw values stay visible.', 'mu');
  g.region(L, y0 - 3, 40, 12, 'Vertical', '#quality-weights');
  g.region(R, y0 - 3, 62, 16, 'Vertical', '#ranking-weights');
  y = Math.max(ey, qy + 5) + 1;
  para(g, m.x, y, m.w, 'Applying creates a labelled alternative analysis. Every result keeps its original weights and raw grades; Reset returns to them. Restore defaults loads web v1, cost, time and quality 1 and every statistic 0. More output, files or lines never means better quality.', 'mu');
  const ok = !qerr && !rerr;
  const to = st.factors ? 'RankingsFactors' : 'RankingsAlternative';
  buttons(g, m.right, m.bottom, [{ label: 'Restore defaults' }, { label: 'Save preset…', off: !ok }, { label: 'Cancel', go: st.factors ? 'RankingsFactors' : 'Rankings' }, { label: 'Apply as alternative', v: 'primary', off: !ok, go: ok ? to : undefined, focus: focus === 'apply' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Rankings' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Apply', go: ok ? to : undefined, off: !ok }, { k: '^r', d: 'Restore defaults' }], '');
  return g;
}

// ---------------------------------------------------------------- widget states

const MINI = { w: 56, h: 8 };
const mini = (title, body) => { const g = new Grid(MINI.w, MINI.h); g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' }); body(g, 2, 1, MINI.w - 4); return g; };
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);
import { loading } from './lib.mjs';

export const RESULT_WIDGET_STATES = [
  { widget: 'DataTable#results', label: 'M02 · Results for the template', states: [
    ['Loading', mini('Results', (g, x, y, w) => loading(g, x, y + 1, w, 'Reading retained results…'))],
    ['Empty', mini('Results · 0 of 12', (g, x, y, w) => { centered(g, y + 1, 'No results match these filters', 'bd'); centered(g, y + 2, 'machine lab-linux-4090 · env current', 'mu'); centered(g, y + 4, 'esc Clear filters', 'ac'); })],
    ['Error', mini('Results', (g, x, y, w) => { notice(g, x, y, w, 'error', 'R-0921a-2 could not be read', 'results/R-0921a-2/record.yaml is truncated. Other results are listed; nothing was repaired.'); })],
  ] },
  { widget: 'DataTable#combined', label: 'M06 · Combined ranking', states: [
    ['Loading', mini('Combined', (g, x, y, w) => loading(g, x, y + 1, w, 'Computing scores…'))],
    ['Empty', mini('Combined · 0 of 4 qualify', (g, x, y, w) => { centered(g, y + 1, 'No entry qualifies for this ranking', 'bd'); para(g, x + 1, y + 2, w - 2, 'Group B with machine lab-linux-4090: 2 failed checks, 1 business grade 3 < 4, 1 cost unknown.', 'mu'); })],
    ['Error', mini('Combined', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Ranking cannot be computed', 'Ranking weights total 0. Edit the weights (w) or reset to the original analysis (r).'); })],
  ] },
];
