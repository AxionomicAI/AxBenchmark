// M15 · Terminal user interface.
// Most M15 views are drawn on the module pages (Library M01, Environment M03, Setup M07, Run M11, Results M02/M06).
// This file adds what is TUI-wide: the keys-and-views help and the list/detail run layout for small terminals.
// All data is fictional.
import { Grid, fit, len, header, footer, table, buttons, input, para, kv, modal } from './lib.mjs';
import { library } from './screens.mjs';

// ---------------------------------------------------------------- keys, views and mouse (? from any screen)

export function helpKeys(sz, focus = 'views') {
  const g = library(sz, 'none');
  const m = modal(g, 86, 33, 'Keys and views', { sel: '#help' });
  let y = m.y;
  const vf = focus === 'views';
  table(g, m.x, y, m.w, [{ l: 'View', w: 14 }, { l: 'Key', w: 6 }, { l: 'What it is for', w: m.w - 20 }], [
    { v: ['Library', 'F1', 'templates, revisions, saved configurations, ZIPs, results'], go: 'Library' },
    { v: ['Environment', 'F2', 'harnesses, models, runtimes, browser, collectors, recheck'], go: 'Environment' },
    { v: ['Setup', 'F3', 'entries, policy, judge, weights, execution · launch'], go: 'Setup' },
    { v: ['Run', 'F4', 'live lanes, logs, stop, detach · dimmed without a run'], go: 'RunOverview' },
    { v: ['Results', 'F6', 'filters, evidence, rankings, weights, ZIP and HTML export'], go: 'Results' },
  ], { cursor: 0, focused: vf });
  g.region(m.x, y, m.w, 6, 'DataTable', '#views');
  y += 6;
  g.text(m.x, y++, fit('F5 stays Recheck in Environment and Refresh in the catalog.', m.w), 'mu');
  y++;
  g.text(m.x, y++, 'Everywhere', 'bd');
  y = kv(g, m.x, y, 18, m.w, [
    ['ctrl+p', 'command palette · every binding is also a command'],
    ['tab · shift+tab', 'next and previous focus · focused pane has a $primary border'],
    ['esc', 'back, or close a dialog without changes'],
    ['?', 'this help · the footer always shows the current screen’s keys'],
    ['q', 'quit · with an active run this only detaches'],
  ]);
  y++;
  g.text(m.x, y++, 'Mouse', 'bd');
  y = kv(g, m.x, y, 18, m.w, [
    ['click', 'rows, tabs, buttons and footer keys · double-click opens'],
    ['wheel', 'scrolls tables, logs and long text'],
  ]);
  y++;
  g.text(m.x, y++, 'Terminal size', 'bd');
  y = kv(g, m.x, y, 18, m.w, [
    ['100×30 or larger', 'full layouts · four live run panels in a 2×2 grid'],
    ['80×24 to 100×30', 'compact: secondary panes hide · run becomes list and detail'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'One terminal, one app: no tmux. Runs are owned by a background process, so resizing, closing or reconnecting never affects them.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', go: 'Library', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'enter', d: 'Go to view' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- run as list and detail (80×24)

const LANES = [
  ['Claude Code', '✓', '7/7', 'complete'],
  ['Codex', '●', '4/7', 'T5 · 10:58'],
  ['Grok CLI', '●', '3/7', 'T4 · 0:22'],
  ['Pi', '●', '2/7', 'T3 · 14:05'],
];
const LOG = [
  ['21:20:15', 'task', 'T4 started · new process 47960'],
  ['21:22:40', 'policy', '✗ blocked · global install outside the workspace'],
  ['21:26:02', 'codex', 'git commit → 5b1e9a0'],
  ['21:31:02', 'task', 'T5 started · new process 48211'],
  ['21:36:55', 'codex', 'run npm test → 18 passed'],
  ['21:38:20', 'policy', 'allowed · npx serve -l 41021'],
  ['21:41:47', 'codex', 'run npm test → 21 passed'],
];

export function runListDetail(sz, focus = 'list') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Run 2026-10-01-a');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit('run_mbp_20261001a · mike-mbp-m4 · selected codex_medium / trial 1', W - 2));
  g.region(0, 1, W, 1, 'Static', '#run-bar');
  const lf = focus === 'list', LW = 26;
  g.box(0, 2, LW, H - 3, { f: lf ? 'ac' : 'ln', title: 'Configurations' });
  table(g, 1, 3, LW - 2, [{ l: 'Harness', w: 12 }, { l: '', w: 2 }, { l: 'Tasks', w: 10 }],
    LANES.map(([h, s, t]) => ({ v: [h, { t: s, f: s === '●' ? 'ac' : '' }, t], go: 'RunConfig' })), { cursor: 1, focused: lf });
  g.region(1, 3, LW - 2, 5, 'ListView', '#lane-list');
  let y = 9;
  LANES.forEach(([h, , , now]) => { g.text(2, y, fit(h.split(' ')[0], 7), 'mu'); g.text(9, y++, fit(now, LW - 11)); });
  para(g, 2, y + 1, LW - 4, 'Select a configuration and trial. Historical logs keep that trial.', 'mu');

  const x = LW, w = W - LW;
  const df = focus === 'tasks';
  g.box(x, 2, w, 6, { f: df ? 'ac' : 'ln', title: 'Codex · gpt-6-sol · medium' });
  g.region(x, 2, w, 6, 'Vertical', '#lane-detail.pane');
  ['T1 ✓', 'T2 ✓', 'T3 ✓', 'T4 ✓', 'T5 ●', 'T6 ○', 'T7 ○'].forEach((t, i) => { g.text(x + 2 + i * 7, 3, t.slice(0, 2), t.endsWith('●') ? 'bd' : 'mu'); g.text(x + 5 + i * 7, 3, t.slice(-1), t.endsWith('○') ? 'mu' : 'ac'); });
  kv(g, x + 2, 4, 9, w - 4, [['Now', 'T5 Shopping cart · 10:58 in task'], ['Elapsed', '41:12 · $1.92 reported'], ['Checks', 'T1–T4 17✓ · T4 1 blocked action']]);
  const sf = focus === 'search', gf = focus === 'log';
  g.box(x, 8, w, H - 9, { f: sf || gf ? 'ac' : 'ln', title: 'Log · T4–T5', sub: '2 matches · n next' });
  g.region(x, 8, w, H - 9, 'RichLog', '#log');
  input(g, x + 2, 9, w - 4, 'policy', { focus: sf });
  g.region(x + 2, 9, w - 4, 1, 'Input', '#log-search');
  LOG.forEach(([t, s, msg], i) => {
    const hit = s === 'policy', yy = 10 + i;
    if (hit) g.fill(x + 1, yy, w - 2, 1, 'BT');
    const o = hit ? { b: 'BT' } : {};
    g.text(x + 2, yy, t, 'mu', o); g.text(x + 11, yy, fit(s, 7), hit ? 'bd' : 'mu', o); g.text(x + 18, yy, fit(msg, w - 20), msg.startsWith('✗') ? 'bd' : '', o);
  });
  footer(g, [{ k: '↑↓', d: 'Config' }, { k: 'enter', d: 'Tasks', go: 'RunConfig' }, { k: 'v', d: 'Live', go: 'HarnessLive' }, { k: '/', d: 'Search' }, { k: 's', d: 'Stop', go: 'StopConfirm' }, { k: 'd', d: 'Detach', go: 'RunDetach' }]);
  return g;
}

// ---------------------------------------------------------------- PromptScreen · one value, typed (shared M15 widget)
// PromptScreen(ModalScreen[str | None]) asks for a single value over the screen that needs it: a preset name, an export
// path. A typed error keeps the dialog open and shows in #prompt-error; esc returns None and changes nothing.
// o: { title, label, value, hint?, error?, ok, back, focus }
export function promptScreen(g, o) {
  const m = modal(g, 76, 12, o.title, { sel: '#prompt' });
  let y = para(g, m.x, m.y, m.w, o.label);
  g.region(m.x, m.y, m.w, y - m.y, 'Static', '#prompt-label');
  y++;
  input(g, m.x, y, m.w, o.value, { focus: o.focus === 'input', f: o.error ? 'bd' : '' });
  g.region(m.x, y++, m.w, 1, 'Input', '#prompt-input');
  if (o.error) { g.text(m.x, y, '✗', 'bd'); g.text(m.x + 2, y, fit(o.error, m.w - 2), 'bd'); g.region(m.x, y, m.w, 1, 'Static', '#prompt-error'); }
  else if (o.hint) { g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y, fit(o.hint, m.w - 2), 'mu'); }
  const x0 = buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: o.back, focus: o.focus === 'cancel' }, { label: o.ok, v: 'primary', go: o.error ? undefined : o.back, focus: o.focus === 'ok' }]);
  g.region(x0, m.bottom, 8, 1, 'Button', '#cancel');
  g.region(x0 + 10, m.bottom, len(o.ok) + 2, 1, 'Button', '#ok');
  footer(g, [{ k: 'esc', d: 'Cancel', go: o.back }, { k: 'enter', d: o.ok, go: o.error ? undefined : o.back }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}
