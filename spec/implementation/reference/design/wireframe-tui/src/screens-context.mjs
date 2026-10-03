// M10.3 · Context-window monitoring (R161–R166, CONTEXT-MONITORING.md) and its M11.5 live entry.
// contextPane() is the "Context window" sub-window of HarnessLive; ContextDetail is the screen c opens from it, and
// the retained variant is opened from Measurements. Three provenance fields stay separate on every row: count
// (native, exact, estimated, unknown), classification (native label or a decision-engine label with its confidence)
// and membership (in this request's input, or unknown). Unknown is "?" with its reason, never 0, and shares are of the
// text estimate only: they are never forced to 100% of the native total.
import { Grid, fit, len, header, footer, table, tabs, buttons, para, kv, notice, selects } from './lib.mjs';

// Codex · gpt-6-sol · T5, trial 1, main agent, window w2 (opened by a compaction at 21:38), snapshot r31.
// Counts are text-token estimates (o200k v2): Codex exposes structured roles but not the serialized framing, so
// they are not an exact partition of the native 84,213. The difference is shown, never allocated.
const CODEX = {
  native: { used: 84213, limit: 272000, phase: 'input', src: 'Codex token_count event' },
  snapshot: 'r31', at: '21:42:31', window: 'w2', agent: 'main', session: 's-5c1',
  cats: [
    ['tool_result', 'Tool results', 51.8, '█', 'native', 'native · 1 disagreement'],
    ['assistant_output', 'Assistant output', 9.6, '▓', 'native', 'native'],
    ['user_input', 'User input', 6.1, '▒', 'native', 'native · T5 prompt and spec'],
    ['tool_call', 'Tool calls', 4.0, '░', 'native', 'native'],
    ['tool_definition', 'Tool definitions', 3.2, '▚', 'native', 'native'],
    ['context_summary', 'Context summary', 2.4, '▞', 'native', 'native · compaction 21:38'],
    ['thinking_summary', 'Thinking summary', 1.4, '╍', 'native', 'native · summary only'],
    ['unclassified', 'Unclassified', 1.1, '·', 'decision', '1 low conf. · 2 pending'],
    ['system_input', 'System / developer', null, ' ', 'none', '? not exposed by Codex'],
  ],
};
// Grok CLI exposes neither a context total nor request membership: the current window cannot be broken down. What
// was observed in the stream is history, not context.
const GROK_LIVE = [
  ['Tool results', 24.6], ['Assistant output', 11.2], ['User input', 5.4], ['Tool calls', 3.1], ['Unclassified', 0.9],
];
const EST = CODEX.cats.reduce((n, c) => n + (c[2] ?? 0), 0);
const k1 = (x) => `${x.toFixed(1)}k`;
const pctOf = (x, t) => `${(x / t * 100).toFixed(1)}%`;
const nat = CODEX.native, natK = nat.used / 1000, natPct = nat.used / nat.limit * 100;
if (Math.abs(EST - 79.6) > 1e-9) throw new Error('Context categories must sum to the 79.6k text estimate');

// ---------------------------------------------------------------- HarnessLive sub-window

// st.engine === false: no decision engine is configured, so ambiguous blocks stay unclassified with that reason.
export function contextPane(g, x, y, w, h, who, st = {}) {
  const focused = st.focus;
  if (who === 'grok') {
    g.box(x, y, w, h, { f: focused ? 'ac' : 'ln', title: 'Context window · current input unavailable', sub: 'c history' });
    g.region(x, y, w, h, 'Vertical', '#live-context-window.pane');
    let yy = y + 1;
    g.text(x + 2, yy, 'Native', 'mu'); g.text(x + 10, yy++, fit('? not reported by Grok CLI 1.9.3 · no limit, no %', w - 12), 'bd');
    yy = para(g, x + 2, yy, w - 4, 'Request membership is unknown, so nothing here is claimed to be in the window.', 'mu');
    g.text(x + 2, yy++, fit('Observed in the stream since T5 started · history, not context', w - 4), 'bd');
    table(g, x + 1, yy, w - 2, [{ l: 'Category', w: 20 }, { l: '≈ tok', w: 8, al: 'right' }, { l: '', w: 2 }, { l: 'Label', w: w - 32 }],
      GROK_LIVE.map(([l, t]) => ({ v: [l, k1(t), '', l === 'Unclassified' ? '1 low confidence' : 'native'], f: l === 'Unclassified' ? 'mu' : '' })));
    return;
  }
  const off = st.engine === false;
  g.box(x, y, w, h, { f: focused ? 'ac' : 'ln', title: `Context window · ${CODEX.agent} · ${CODEX.window} · ${CODEX.snapshot} · current input`, sub: off ? 'x configure engine · c detail' : 'c detail' });
  g.region(x, y, w, h, 'Vertical', '#live-context-window.pane');
  let xx = g.text(x + 2, y + 1, 'Native', 'mu') + 2;
  xx = g.text(xx, y + 1, `${k1(natK)} of ${nat.limit / 1000}k · ${natPct.toFixed(0)}%`, 'bd');
  g.text(xx + 2, y + 1, fit(`native · snapshot ${CODEX.snapshot} · ${CODEX.at}`, x + w - xx - 4), 'mu');
  xx = g.text(x + 2, y + 2, 'Labels', 'mu') + 2;
  g.text(xx, y + 2, fit(off ? 'native only · classification off · no engine configured' : 'native · TypeSafe ≥ 0.80 on ambiguous blocks · 2 pending', x + w - xx - 2), off ? 'bd' : '');
  table(g, x + 1, y + 3, w - 2, [{ l: '', w: 2 }, { l: 'Category', w: 19 }, { l: '≈ tok', w: 7, al: 'right' }, { l: 'of est.', w: 8, al: 'right' }, { l: '', w: 2 }, { l: 'Label source', w: w - 40 }],
    CODEX.cats.map(([key, l, t, gl, , note]) => ({
      v: [{ t: gl, f: key === 'unclassified' ? 'mu' : 'ac' }, l, t == null ? '?' : k1(t), t == null ? '—' : pctOf(t, EST), '',
        key === 'unclassified' && off ? 'analysis off · 3 blocks' : note],
      f: t == null || key === 'unclassified' ? 'mu' : '',
    })));
  if (h > 14) g.text(x + 2, y + h - 2, fit(`≈ ${k1(EST)} text estimate · native ${k1(natK)} · difference not allocated`, w - 4), 'mu');
}

// ---------------------------------------------------------------- ContextDetail

const BAR = (g, x, y, w, cats, total) => {
  let cx = x;
  cats.filter((c) => c[2] != null).forEach((c, i, a) => {
    const n = i === a.length - 1 ? x + w - cx : Math.round(c[2] / total * w);
    g.text(cx, y, c[3].repeat(Math.max(0, n)), c[0] === 'unclassified' ? 'mu' : 'ac');
    cx += n;
  });
};

const SEGMENTS = [
  ['seg-0388', '1.9k', 'tool_result', 'assistant_output 0.86', 'tool_result', 'native wins · disagreement kept'],
  ['seg-0412', '2.3k', '—', 'tool_result 0.93 · assistant 0.05', 'tool_result', 'accepted ≥ 0.80'],
  ['seg-0415', '0.6k', '—', 'tool_result 0.62 · assistant 0.31', 'unclassified', 'low confidence < 0.80'],
  ['seg-0420', '0.3k', '—', '● pending', 'unclassified', 'classification_pending'],
  ['seg-0421', '0.2k', '—', '● pending', 'unclassified', 'classification_pending'],
];

// Category rows for a variant: [key, label, ≈k tokens | null, glyph, source, note]. A label moved by an analysis
// state changes only which category holds the tokens; the estimate total and native reading never change.
const recat = (moves, notes = {}) => CODEX.cats.map((c) => [c[0], c[1], c[2] == null ? null : +(c[2] + (moves[c[0]] ?? 0)).toFixed(1), c[3], c[4], notes[c[0]] ?? c[5]]);
const LIVE_SEGMENTS = SEGMENTS;

// R-0924lab-1 · imported from lab-linux-4090 · Claude Code · claude-sonnet-5-5 · T5 · final snapshot r22.
const IMPORTED_CATS = [
  ['tool_result', 'Tool results', 34.9, '█', 'native', 'native'],
  ['assistant_output', 'Assistant output', 8.2, '▓', 'native', 'native'],
  ['user_input', 'User input', 5.9, '▒', 'native', 'native · T5 prompt and spec'],
  ['tool_definition', 'Tool definitions', 4.1, '▚', 'native', 'native'],
  ['tool_call', 'Tool calls', 3.6, '░', 'native', 'native'],
  ['thinking', 'Thinking', 2.3, '╍', 'native', 'native · exposed thinking'],
  ['unclassified', 'Unclassified', 0.4, '·', 'decision', '1 low confidence'],
  ['system_input', 'System / developer', null, ' ', 'none', '? not exposed by Claude Code'],
];

const VARIANTS = {
  live: {
    cats: CODEX.cats, native: [84213, 272000], src: 'Codex token_count event · r31 · input phase', snap: `snapshot ${CODEX.snapshot} · ${CODEX.at}`,
    analysis: ['Analysis a-7f3e · live · labels only', [
      ['Engine', 'TypeSafe · typesafe-context v3'], ['Model', 'ts-choice-1.2-2026-08 ✓ pinned'], ['Destination', 'api.typesafe.ai · remote'],
      ['Pack', 'context-labels/1 · 11 labels'], ['Accept', 'native confidence ≥ 0.80'], ['Blocks', '11 accepted · 1 low · 2 pending'],
      ['', 'of 14 ambiguous blocks'], ['Budget', '37 of 1,000 attempts · 64 KiB'], ['Observer', '$0.004 · own account, never'],
      ['', 'competitor cost, tokens or tok/s'], ['Cutoff', 'entry 1,284 · grows until close']], 'Labels never change counts or membership.'],
    buttons: (focus) => [{ label: 'Reclassify…', focus: focus === 'reclassify' }],
    segTitle: 'Segments that needed a label · 5 of 14 shown', segments: LIVE_SEGMENTS,
  },
  deferred: {
    cats: recat({ tool_result: -3.0, assistant_output: -1.2, unclassified: 4.2 }, { tool_result: 'native', unclassified: '14 blocks deferred' }),
    native: [84213, 272000], src: 'Codex token_count event · r31 · input phase', snap: `snapshot ${CODEX.snapshot} · ${CODEX.at}`,
    analysis: ['Analysis a-80c1 · deferred · local', [
      ['Engine', 'Ollama · ollama-clef v2 · local'], ['Model', 'clef:12b-q8_0 · digest 4b9e…d01'], ['Policy', 'deferred until no competitor is'],
      ['', 'measured in any run (default)'], ['Waiting', '◷ 5 measured windows active'], ['', 'this run 4 · run 2026-10-02-b 1'],
      ['Blocks', '0 decided · 14 queued'], ['Capture', '✓ continues · counts current'], ['Budget', '0 of 1,000 attempts used'],
      ['Overlap', 'live_local_overlap off']], 'Starts only when the lease is granted; competitors are never paused for it.'],
    buttons: () => [{ label: 'Cancel analysis' }],
    segTitle: 'Segments that need a label · 5 of 14 shown · all deferred',
    segments: LIVE_SEGMENTS.map(([id, t, nl, , , ]) => [id, t, nl, '◷ deferred · local lease', nl === '—' ? 'unclassified' : nl, nl === '—' ? 'classification_pending' : 'native label · no question']),
  },
  failed: {
    cats: recat({ tool_result: -1.6, assistant_output: -0.7, unclassified: 2.3 }, { unclassified: '8 blocks · engine stopped' }),
    native: [84213, 272000], src: 'Codex token_count event · r31 · input phase', snap: `snapshot ${CODEX.snapshot} · ${CODEX.at}`,
    analysis: ['Analysis a-7f3e · partial · stopped', [
      ['Engine', 'TypeSafe · typesafe-context v3'], ['Blocks', '6 accepted · 8 unclassified'], ['Attempts', '19 of 1,000 · 2× 429, backoff'],
      ['Stopped', '✗ 401 credential rejected'], ['', 'no other provider is tried'], ['Status', 'partial · folded from the ledger'],
      ['Capture', '✓ complete · counts unaffected'], ['Competitor', 'unaffected · never told'], ['Observer', '$0.002 · own account']], 'Fix the credential in Decision engines, then Reclassify… creates a new analysis; a-7f3e stays as it is.'],
    buttons: (focus) => [{ label: 'Decision engines', go: 'DecisionEngines' }, { label: 'Reclassify…', focus: focus === 'reclassify' }],
    segTitle: 'Segments that needed a label · 5 of 14 shown · analysis stopped',
    segments: [
      ['seg-0388', '1.9k', 'tool_result', 'assistant_output 0.86', 'tool_result', 'native wins · disagreement kept'],
      ['seg-0412', '2.3k', '—', 'tool_result 0.93 · assistant 0.05', 'tool_result', 'accepted ≥ 0.80'],
      ['seg-0415', '0.6k', '—', '✗ 429 rate limited · retried 2 of 3', 'unclassified', 'observer_unavailable'],
      ['seg-0420', '0.3k', '—', '✗ 401 credential rejected', 'unclassified', 'observer_unavailable'],
      ['seg-0421', '0.2k', '—', '— not sent after 401', 'unclassified', 'observer_unavailable'],
    ],
  },
  imported: {
    cats: IMPORTED_CATS, native: [61840, 200000], src: 'Claude Code usage event · r22 · input phase', snap: 'snapshot r22 · final · 2026-09-24',
    analysis: ['Analysis a-21c0 · complete · imported', [
      ['Made on', 'lab-linux-4090 · 2026-09-24'], ['Engine', 'typesafe-context v2 · snapshot'], ['Model', 'ts-choice-1.1-2026-07 ✓ pinned'],
      ['Blocks', '8 accepted · 1 low of 9'], ['Cutoff', 'entry 2,031 · ledger 5d02e8a1…'], ['Observer', '$0.003 · lab account'],
      ['Here', 'no decision engine configured'], ['Resume', 'never on import'], ['Reclassify', '✗ engine_not_configured', 'bd']], 'Reading this saved analysis needs no engine and makes no model calls.'],
    buttons: (focus) => [{ label: 'Reclassify…', off: true }, { label: 'Configure decision engine', v: 'primary', go: 'DecisionEnginesEmpty', focus: focus === 'configure' }],
    segTitle: 'Segments that needed a label · lab analysis a-21c0 · 4 of 9 shown',
    segments: [
      ['seg-0207', '1.4k', 'tool_result', 'tool_result 0.97', 'tool_result', 'agrees with the native label'],
      ['seg-0233', '0.9k', '—', 'assistant_output 0.91', 'assistant_output', 'accepted ≥ 0.80'],
      ['seg-0240', '0.4k', '—', 'protocol 0.55 · tool_result 0.40', 'unclassified', 'low confidence < 0.80'],
      ['seg-0251', '0.7k', '—', 'user_input 0.88', 'user_input', 'accepted ≥ 0.80'],
    ],
  },
};
const variantOf = (st) => (st.imported ? 'imported' : st.analysis ?? 'live');
for (const [k, v] of Object.entries(VARIANTS)) {
  const sum = v.cats.reduce((n, c) => n + (c[2] ?? 0), 0);
  if (Math.abs(sum - (k === 'imported' ? 59.4 : EST)) > 1e-6) throw new Error(`Context categories of ${k} do not sum`);
}

function chrome(g, sz, mode) {
  const W = g.w, compact = sz.id === 'compact';
  const H1 = {
    retained: compact ? 'Context · R-0928a-3 · T5' : 'Context · R-0928a-3 · Grok CLI · grok-4.7-fast · T5 · retained',
    imported: compact ? 'Context · R-0924lab-1 · T5' : 'Context · R-0924lab-1 · Claude Code · claude-sonnet-5-5 · T5 · ↓ imported',
    reset: compact ? 'Context · Codex · T6 · live' : 'Context · Codex · gpt-6-sol · T6 Checkout · trial 1 · live',
  }[mode] ?? (compact ? 'Context · Codex · T5 · live' : 'Context · Codex · gpt-6-sol · T5 Shopping cart · trial 1 · live');
  header(g, 'AxBenchmark', H1);
  g.fill(0, 1, W, 1, 'B1');
  const bar = {
    retained: '■ retained · run 2026-09-28-a · R-0928a-3 · trial 1/1 · sealed · reading makes no model calls',
    imported: '↓ imported 2026-09-24 from lab-linux-4090 · run 2026-09-24-lab · trial 1/1 · sealed · never resumes inference',
  }[mode] ?? `● live · UID run_mbp_20261001a · trial 1 · invocation inv-${mode === 'reset' ? 6 : 5} · read-only, never sends input${compact ? '' : ' · updates per snapshot'}`;
  g.text(1, 1, fit(bar, W - 2), mode === 'retained' || mode === 'imported' ? '' : 'mu');
  g.region(0, 1, W, 1, 'Static', '#context-scope');
}

// st: { tab: 0 current input | 1 observed history, retained: true (Measurements entry, R-0928a-3, no engine),
//       analysis: 'deferred' | 'failed', imported: true (R-0924lab-1 with its saved analysis), reset: true (T6 history) }
export function contextDetail(sz, focus = 'categories', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const retained = !!st.retained, tab = retained ? 1 : st.tab ?? 0;
  const mode = retained ? 'retained' : st.imported ? 'imported' : st.reset ? 'reset' : 'live';
  chrome(g, sz, mode);
  if (compact) {
    g.text(1, 2, fit(`main · ${CODEX.window} · snapshot ${CODEX.snapshot} · analysis a-7f3e live`, W - 12), 'mu');
    g.text(W - 10, 2, 'w', 'ac bd'); g.text(W - 8, 2, 'Scope');
    tabs(g, 0, 3, W, ['Current input', 'History', 'Segments'], 0, { focused: false, go: ['ContextDetail', 'ContextDetailHistory', null] });
    let x = g.text(1, 5, 'Native', 'mu') + 1;
    x = g.text(x, 5, `${nat.used.toLocaleString('en-US')} of ${nat.limit.toLocaleString('en-US')} · ${natPct.toFixed(1)}%`, 'bd');
    g.text(x + 2, 5, fit('native, same model, request, phase', W - x - 3), 'mu');
    BAR(g, 1, 6, W - 2, CODEX.cats, EST);
    const cf = focus === 'categories';
    table(g, 1, 7, W - 2, [{ l: '', w: 2 }, { l: 'Category', w: 19 }, { l: '≈ tok', w: 7, al: 'right' }, { l: 'of est.', w: 8, al: 'right' }, { l: '', w: 2 }, { l: 'Label · membership', w: W - 40 }],
      CODEX.cats.map(([key, l, t, gl, , note]) => ({ v: [{ t: gl, f: key === 'unclassified' ? 'mu' : 'ac' }, l, t == null ? '?' : k1(t), t == null ? '—' : pctOf(t, EST), '', t == null ? note : `${note.split(' · ')[0]} · included`], f: t == null || key === 'unclassified' ? 'mu' : '' })), { cursor: cf ? 7 : -1, focused: cf });
    g.region(1, 7, W - 2, 10, 'DataTable', '#context-categories');
    g.text(1, 18, fit(`≈ ${k1(EST)} text estimate (o200k v2, framing unavailable) ≠ native ${k1(natK)}`, W - 2), 'mu');
    g.text(1, 19, fit('Difference 4.6k is not allocated to any category.', W - 2), 'mu');
    g.text(1, 21, fit('TypeSafe · typesafe-context v3 · 11 accepted · 1 low · 2 pending of 14', W - 2));
    footer(g, [{ k: 'esc', d: 'Live', go: 'HarnessLive' }, { k: '1-3', d: 'Tab' }, { k: 'w', d: 'Scope' }, { k: 'r', d: 'Reclassify' }, { k: 'enter', d: 'Segments' }]);
    return g;
  }

  // scope selectors: the exact target every number below belongs to
  const v = VARIANTS[variantOf(st)];
  selects(g, 1, 2, W - 2, retained
    ? [{ l: 'Task', w: 8, v: 'T5' }, { l: 'Session', w: 10, v: 's-91a' }, { l: 'Agent', w: 10, v: 'main' }, { l: 'Window', w: 16, v: 'w1 · only' }, { l: 'Analysis', w: 26, v: 'none · native only', focus: focus === 'analysis', sel: '#analysis-select' }]
    : st.imported
    ? [{ l: 'Task', w: 8, v: 'T5' }, { l: 'Agent', w: 8, v: 'main' }, { l: 'Window', w: 13, v: 'w1 · only' }, { l: 'Snapshot', w: 15, v: 'r22 · final' }, { l: 'Analysis', w: 30, v: 'a-21c0 · complete · lab', focus: focus === 'analysis', sel: '#analysis-select' }]
    : st.reset
    ? [{ l: 'Task', w: 8, v: 'T6' }, { l: 'Agent', w: 8, v: 'main', focus: focus === 'agent', sel: '#agent-select' }, { l: 'Window', w: 16, v: 'w5 · current' }, { l: 'Snapshot', w: 16, v: 'r26 · latest' }, { l: 'Analysis', w: 19, v: 'a-7f3e · live', sel: '#analysis-select' }]
    : [{ l: 'Session', w: 9, v: CODEX.session }, { l: 'Agent', w: 8, v: 'main', focus: focus === 'agent', sel: '#agent-select' }, { l: 'Window', w: 16, v: 'w2 · current' }, { l: 'Snapshot', w: 16, v: `${CODEX.snapshot} · latest` }, { l: 'Analysis', w: 19, v: st.analysis === 'deferred' ? 'a-80c1 · deferred' : st.analysis === 'failed' ? 'a-7f3e · partial' : 'a-7f3e · live', sel: '#analysis-select' }]);
  g.region(0, 2, W, 1, 'Horizontal', '#context-target');
  tabs(g, 0, 3, W, ['Current input', 'Observed history', 'Segments'], tab, { go: retained || st.imported ? [null, null, null] : ['ContextDetail', 'ContextDetailHistory', 'ContextDetail'] });
  g.region(0, 3, W, 2, 'TabbedContent', '#context-tabs');

  if (retained) return retainedBody(g, focus);
  if (tab === 1) return historyBody(g, focus, st.reset ? RESET : MAIN);

  // current input
  const cf = focus === 'categories';
  const est = v.cats.reduce((n, c) => n + (c[2] ?? 0), 0), [used, limit] = v.native;
  g.box(0, 5, 72, 19, { f: cf ? 'ac' : 'ln', title: `Current input · ${v.snap}`, sub: 'what this request had in its window' });
  g.region(0, 5, 72, 19, 'Vertical', '#current-input.pane');
  kv(g, 2, 6, 11, 68, [
    ['Native', [`${used.toLocaleString('en-US')} of ${limit.toLocaleString('en-US')} · ${(used / limit * 100).toFixed(1)}% · native_reported`, v.src], 'bd'],
    ['Membership', 'native request membership · every row below is included'],
  ]);
  BAR(g, 2, 10, 68, v.cats, est);
  table(g, 1, 11, 70, [{ l: '', w: 2 }, { l: 'Category', w: 19 }, { l: '≈ Tokens', w: 10, al: 'right' }, { l: 'of est.', w: 8, al: 'right' }, { l: '', w: 2 }, { l: 'Label source', w: 29 }],
    v.cats.map(([key, l, t, gl, , note]) => ({ v: [{ t: gl, f: key === 'unclassified' ? 'mu' : 'ac' }, l, t == null ? '?' : `${Math.round(t * 1000).toLocaleString('en-US')}`, t == null ? '—' : pctOf(t, est), '', note], f: t == null || key === 'unclassified' ? 'mu' : '' })), { cursor: cf ? 0 : -1, focused: cf });
  g.region(1, 11, 70, 10, 'DataTable', '#context-categories');
  g.text(2, 22, fit(`≈ ${Math.round(est * 1000).toLocaleString('en-US')} text estimate · o200k v2, no framing · ${(used - Math.round(est * 1000)).toLocaleString('en-US')} not allocated`, 68), 'mu');

  const af = focus === 'analysis';
  const [atitle, arows, anote] = v.analysis;
  g.box(72, 5, 48, 19, { f: af ? 'ac' : 'ln', title: atitle });
  g.region(72, 5, 48, 19, 'Vertical', '#context-analysis.pane');
  const y = kv(g, 74, 6, 12, 44, arows);
  para(g, 74, y + 1, 44, anote, 'mu');
  buttons(g, 118, 22, v.buttons(focus));

  const sf = focus === 'segments';
  g.box(0, 24, W, 13, { f: sf ? 'ac' : 'ln', title: v.segTitle, sub: 'enter opens the inert source text' });
  table(g, 1, 25, W - 2, [{ l: 'Segment', w: 10 }, { l: '≈ tok', w: 7, al: 'right' }, { l: '', w: 2 }, { l: 'Native label', w: 14 }, { l: 'Decision engine · native confidence', w: 36 }, { l: 'Effective', w: 17 }, { l: 'Reason', w: W - 2 - 86 }],
    v.segments.map(([id, t, nl, d, e, why]) => ({ v: [id, t, '', nl, /^[●◷]/.test(d) ? { t: d, f: 'ac' } : d.startsWith('✗') ? { t: d, f: 'bd' } : d, e, why], f: e === 'unclassified' ? 'mu' : '' })), { cursor: sf ? 2 : -1, focused: sf });
  g.region(1, 25, W - 2, 6, 'DataTable', '#context-segments');
  para(g, 2, 32, W - 4, 'Native labels win; a disagreeing prediction is kept beside them. Below 0.80, pending, deferred or failed answers stay unclassified with their reason, never moved to the nearest category. Source text is shown inert; hidden instructions and reasoning are never reconstructed.', 'mu');
  footer(g, st.imported
    ? [{ k: 'esc', d: 'Result', go: 'ResultOrigin' }, { k: '1-3', d: 'Tab' }, { k: 'n', d: 'Agent' }, { k: 'x', d: 'Configure engine', go: 'DecisionEnginesEmpty' }, { k: 'r', d: 'Reclassify…', off: true }, { k: 'enter', d: 'Segment text', go: 'EvidenceViewer' }, { k: 'tab', d: 'Focus', do: 'next' }]
    : [{ k: 'esc', d: 'Live view', go: 'HarnessLive' }, { k: '1-3', d: 'Tab', go: 'ContextDetailHistory' }, { k: 'w', d: 'Window' }, { k: 'n', d: 'Agent' }, { k: '[ ]', d: 'Snapshot' }, { k: 'r', d: 'Reclassify…' }, { k: 'enter', d: 'Segment text', go: 'EvidenceViewer' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- ContextDetail · observed history

const SNAPS = [
  ['r1', '21:31:04', 'w1', 14.2, ''], ['r6', '21:32:40', 'w1', 58.9, ''], ['r12', '21:34:18', 'w1', 121.4, ''], ['r18', '21:36:02', 'w1', 196.0, ''],
  ['r24', '21:37:58', 'w1', 251.3, '92% · highest'], [null, '21:38:12', 'w1 → w2', null, 'compaction · auto, 92%'],
  ['r25', '21:38:20', 'w2', 31.6, 'summary 2.4k for w1'], ['r28', '21:40:02', 'w2', 55.0, ''], ['r30', '21:41:40', 'w2', 73.8, ''], ['r31', '21:42:31', 'w2', 84.2, 'latest'],
];

// A history description: snapshot rows, native used per request (null = capture gap), window boundaries, scopes.
const MAIN = {
  title: 'Snapshots and transitions · main agent · T5', sub: '31 requests · 10 shown', snaps: SNAPS, cursor: 9,
  notes: ['w1 keeps its 24 snapshots; compaction deletes nothing.', 'Native used per request, read from Codex token_count events.'],
  used: [14.2, 22, 30.5, 39, 47.8, 58.9, 70, 80.2, 91.6, 100.8, 111, 121.4, 134, 146.5, 158, 171.2, 183, 196, 205.4, 216, 228, 236.7, 244, 251.3, 31.6, 39.8, 47.1, 55, 63.9, 73.8, 84.2],
  splits: [24], labels: [[0, 'r1'], [11, 'r12'], [22, 'r24'], [24, 'r25'], [30, 'r31']], chartSub: 'w1 │ w2',
  scopes: [
    ['Current input', '84.2k · request r31 · window w2', 'bd'], ['Observed stream', '≈ 402k text since T5 started · history'],
    ['Billed input', '612.4k cumulative (cached 498.0k)'], ['', 'repeated input in each request counts again'],
    ['Output', '18.9k (reasoning 7.2k) · not in r31 unless'], ['', 'native evidence puts it back in an input'],
  ],
  windows: [['main', 'w1', '251.3k peak', 'compacted 21:38'], ['main', 'w2', '84.2k / 272k', 'current'], ['sub · tests', 'w3', '12.4k / 272k', 'ended 21:40:55'], ['sub · lint', 'w4', '?', 'not exposed']],
  para: 'A subagent has its own window even inside one process; n switches agent and the whole screen follows that target. Switching discards responses for the previous selection. Billed usage and the observed stream describe traffic, not what fits in a window, and never produce a percentage of the 272k limit.',
};
const RESET = {
  title: 'Snapshots and transitions · main agent · T6', sub: '26 requests · 11 shown', cursor: 10,
  snaps: [
    ['r1', '21:46:10', 'w3', 12.8, ''], ['r12', '21:49:40', 'w3', 118.4, 'highest of w3'], [null, '21:49:52', 'w3 → w4', null, 'native reset'],
    ['r13', '21:50:01', 'w4', 9.6, 'nothing carried over'], ['r15', '21:50:44', 'w4', 38.1, ''], ['gap', '21:51:02', 'w4', null, 'capture gap · 7 s'],
    ['r18', '21:51:20', 'w4', 61.0, 'r16–r17 not captured'], ['r19', '21:51:48', 'w4', 70.2, ''], [null, '21:52:05', 'w4 → w5', null, 'history dropped · 18 msgs'],
    ['r20', '21:52:09', 'w5', 44.6, '25.6k left the window'], ['r26', '21:54:30', 'w5', 63.3, 'latest'],
  ],
  notes: ['Earlier windows keep every snapshot; nothing is deleted.', 'r16 and r17 have no snapshot and are never interpolated.'],
  used: [12.8, 22.4, 31.9, 41.0, 50.6, 60.2, 70.1, 79.8, 89.5, 99.0, 108.8, 118.4, 9.6, 24.0, 38.1, null, null, 61.0, 70.2, 44.6, 47.9, 51.2, 54.8, 58.9, 61.0, 63.3],
  splits: [12, 19], labels: [[0, 'r1'], [12, 'r13'], [19, 'r20'], [25, 'r26']], chartSub: 'w3 │ w4 │ w5',
  scopes: [
    ['Current input', '63.3k · request r26 · window w5', 'bd'], ['Dropped', '25.6k left at w4 → w5 · kept in history'],
    ['Capture gap', '21:51:02–09 · 3 entries · typed, not 0'], ['Billed input', '1.04M cumulative over T6 (cached 0.81M)'],
    ['Never', 'w3 + w4 + w5 added into one window'],
  ],
  windows: [['main', 'w3', '118.4k peak', 'reset 21:49:52'], ['main', 'w4', '70.2k peak', 'history dropped'], ['main', 'w5', '63.3k / 272k', 'current'], ['sub · tests', 'w6', '?', 'not started']],
  para: 'A native reset starts a new window with nothing carried over; dropped history (the harness truncating old messages) also starts a new window and records what left. The spool-full gap is a typed capture gap with its range: r16 and r17 are missing, not zero, and the chart leaves their columns empty.',
};

function historyBody(g, focus, h) {
  const W = g.w;
  const hf = focus === 'history';
  g.box(0, 5, 64, 16, { f: hf ? 'ac' : 'ln', title: h.title, sub: h.sub });
  table(g, 1, 6, 62, [{ l: 'Req.', w: 6 }, { l: 'Time', w: 10 }, { l: 'Window', w: 9 }, { l: 'Native used', w: 12, al: 'right' }, { l: '', w: 2 }, { l: 'Note', w: 23 }],
    h.snaps.map(([r, t, w, u, n]) => (r == null
      ? { v: ['—', t, w, '', '', n], f: 'bd' }
      : r === 'gap' ? { v: ['⚠', t, w, '?', '', n], f: 'bd' }
      : { v: [r, t, w, `${u.toFixed(1)}k`, '', n] })), { cursor: hf ? h.cursor : -1, focused: hf });
  g.region(1, 6, 62, 12, 'DataTable', '#context-history');
  g.text(2, 18, fit(h.notes[0], 60), 'mu');
  g.text(2, 19, fit(h.notes[1], 60), 'mu');

  // native used per request: one column per request, 10 rows tall; the limit is the top rule, │ marks a new window
  g.box(64, 5, 56, 16, { f: focus === 'chart' ? 'ac' : 'ln', title: 'Native used per request · limit 272k', sub: h.chartSub });
  g.region(64, 5, 56, 16, 'Static', '#context-chart');
  const top = 7, rows = 10, colX = (i) => 68 + i + 2 * h.splits.filter((sp) => i >= sp).length;
  g.hline(66, top - 1, 52, 'ln', '╌'); g.text(66, top - 1, '272k', 'mu');
  h.used.forEach((u, i) => {
    const last = h.splits.filter((sp) => i >= sp).length === h.splits.length;
    if (u == null) { g.text(colX(i), top + rows - 1, '⚠', 'bd'); return; }
    const hgt = Math.max(1, Math.round(u / 272 * rows));
    for (let j = 0; j < hgt; j++) g.text(colX(i), top + rows - 1 - j, '█', last ? 'ac' : 'mu');
  });
  h.splits.forEach((sp) => { for (let j = 0; j < rows; j++) g.text(colX(sp) - 1, top + j, '│', 'bd'); });
  h.labels.forEach(([i, t]) => g.text(colX(i), top + rows, t, 'mu'));
  g.text(66, top + rows + 1, fit('One bar per request’s own input; bars are never added.', 52), 'mu');

  g.box(0, 21, 64, 9, { title: 'Scopes · never summed', f: 'ln' });
  g.region(0, 21, 64, 9, 'Static', '#context-scopes.kv');
  kv(g, 2, 22, 17, 60, h.scopes);
  const af = focus === 'agents';
  g.box(64, 21, 56, 9, { f: af ? 'ac' : 'ln', title: 'Agents and windows · never pooled' });
  table(g, 65, 22, 54, [{ l: 'Agent', w: 12 }, { l: 'Window', w: 8 }, { l: 'Native', w: 14, al: 'right' }, { l: '', w: 2 }, { l: 'State', w: 18 }],
    h.windows.map(([a, w, n, st]) => ({ v: [a, w, n, '', st], f: n === '?' ? 'mu' : '' })), { cursor: af ? 2 : -1, focused: af });
  g.region(65, 22, 54, 5, 'DataTable', '#context-windows');
  para(g, 1, 31, W - 2, h.para, 'mu');
  footer(g, [{ k: 'esc', d: 'Live view', go: 'HarnessLive' }, { k: '1-3', d: 'Tab', go: 'ContextDetail' }, { k: 'w', d: 'Window' }, { k: 'n', d: 'Agent' }, { k: 'enter', d: 'Open snapshot', go: 'ContextDetail' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- ContextDetail · retained, no decision engine

const GROK_HISTORY = [
  ['Tool results', 41.2, 'native'], ['Assistant output', 21.1, 'native'], ['Tool calls', 6.8, 'native'], ['User input', 5.4, 'native · T5 prompt'],
  ['Unclassified', 2.3, '8 ambiguous · analysis off'], ['Thinking', null, '? not exposed · reasoning 14k'], ['System / developer', null, '? not exposed by Grok CLI'],
];

function retainedBody(g, focus) {
  const W = g.w;
  let y = notice(g, 1, 5, 70, 'warning', 'Current input unavailable · membership unknown', 'Grok CLI 1.9.2 reported no context total and no request membership. Nothing here is claimed to have been in the window; the table is the observed stream of T5.');
  g.region(1, 5, 70, y - 5, 'Static', '#current-unavailable.notice.-warning');
  const hf = focus === 'categories';
  g.box(0, 9, 72, 13, { f: hf ? 'ac' : 'ln', title: 'Observed history · T5 · captured stream', sub: 'history, not context' });
  table(g, 1, 10, 70, [{ l: 'Category', w: 20 }, { l: '≈ Tokens', w: 10, al: 'right' }, { l: '', w: 2 }, { l: 'Count', w: 10 }, { l: 'Label source', w: 28 }],
    GROK_HISTORY.map(([l, t, s]) => ({ v: [l, t == null ? '?' : `${(t * 1000).toLocaleString('en-US')}`, '', t == null ? 'unknown' : 'estimated', s], f: t == null || l === 'Unclassified' ? 'mu' : '' })), { cursor: hf ? 4 : -1, focused: hf });
  g.region(1, 10, 70, 8, 'DataTable', '#context-history');
  g.text(2, 19, fit('o200k v2 estimates of captured text · no shares, no %', 68), 'mu');
  g.text(2, 20, fit('Capture complete · closure receipt sealed with the result · 0 gaps', 68), 'mu');

  const af = focus === 'analysis';
  g.box(72, 5, 48, 17, { f: af ? 'ac' : 'ln', title: 'Analysis · none · native only' });
  g.region(72, 5, 48, 17, 'Vertical', '#context-analysis.pane');
  y = notice(g, 74, 6, 44, 'info', 'Classification off for this result', 'No decision engine was configured at launch, so no analysis exists. Native labels and counts are complete without one.');
  y = kv(g, 74, y + 1, 12, 44, [
    ['Reclassify', '✗ engine_not_configured', 'bd'],
    ['', 'no engine on this machine'],
    ['Saved', 'other analyses stay readable'],
    ['Offline', 'no model calls to read or export'],
  ]);
  buttons(g, 118, 20, [{ label: 'Reclassify…', off: true }, { label: 'Configure decision engine', v: 'primary', go: 'Setup', focus: focus === 'configure' }]);
  g.region(72, 20, 48, 1, 'Horizontal', '.actions');

  g.box(0, 22, W, 9, { title: 'Billed usage · T5 · a separate scope', f: 'ln' });
  g.region(0, 22, W, 9, 'Static', '#context-scopes.kv');
  kv(g, 2, 23, 15, W - 4, [
    ['Billed input', '598k cumulative over the task’s requests · cache split not exposed by Grok CLI 1.9.2'],
    ['Output', '35k (reasoning 14k native counter) · output usage, not context'],
    ['Gen tok/s', '▲ 116.9 for T5, a different measurement (M10 statistics) · never a context reading'],
    ['Never', 'billed or streamed totals divided by a model’s catalog limit'],
  ]);
  para(g, 1, 32, W - 2, 'Configure decision engine opens the setup route; it never starts analysis by itself. A later explicit reclassification would create a new analysis beside the sealed result, with its destination and budget shown first.', 'mu');
  footer(g, [{ k: 'esc', d: 'Measurements', go: 'Measurements' }, { k: '1-3', d: 'Tab' }, { k: 'n', d: 'Agent' }, { k: 'x', d: 'Configure engine', go: 'Setup' }, { k: 'r', d: 'Reclassify…', off: true }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

export { CODEX as CONTEXT_FIXTURE };
