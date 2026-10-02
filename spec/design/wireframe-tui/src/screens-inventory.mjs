// M09 · Default seven-task inventory benchmark.
// The frozen contract, the preserved prompts (read verbatim from benchmark/tasks/ at build time), check coverage,
// and why a look-alike is not the default. The inventory website is what competitors build, not part of AxBenchmark.
import { readFileSync } from 'node:fs';
import { Grid, fit, len, wrap, header, footer, table, buttons, para, kv, notice, modal, tree, scrollbar } from './lib.mjs';
import { SHA, s8, mid, library } from './screens.mjs';
import { CHECKS, CHECK_DETAILS } from './checks-data.mjs';

const TASK_DIR = new URL('../../../../benchmark/tasks/', import.meta.url);
const FILES = ['00-project.md', 'T1-scaffold.md', 'T2-data.md', 'T3-management.md', 'T4-lookup.md', 'T5-cart.md', 'T6-checkout.md', 'T7-qa.md'];
const PROMPTS = FILES.map((f) => [f, readFileSync(new URL(f, TASK_DIR), 'utf8')]);
const TASK_NAMES = { T1: 'Repository and scaffold', T2: 'Inventory data and persistence', T3: 'Inventory management', T4: 'Inventory lookup', T5: 'Shopping cart', T6: 'Checkout', T7: 'Test and fix' };
const REQ = { T1: 'R021', T2: 'R022', T3: 'R023', T4: 'R024', T5: 'R025', T6: 'R026', T7: 'R027' };
const OPEN = 'product attributes · how lookup matches · currency · stock conflicts · deleting a product that is in a cart · checkout validation · the structure of an order record';

const short = (h) => `${s8(h)}…${h.slice(-8)}`;

// ---------------------------------------------------------------- frozen contract

export function inventoryAbout(sz, focus = 'configure') {
  const g = library(sz, 'none');
  const m = modal(g, 86, 28, 'Default benchmark · frozen contract', { sel: '#inventory-about' });
  let y = m.y;
  g.text(m.x, y++, fit(`★ Inventory web app · r1 · built-in · sha256 ${short(SHA.inv1)}`, m.w), 'bd');
  y++;
  const rows = [
    ['Starting project', 'an empty folder for each competitor · Git starts in T1'],
    ['Artifact', 'HTML5 and vanilla JavaScript · no frameworks or libraries'],
    ['Opens with', 'index.html, directly in a browser'],
    ['Persistence', 'localStorage · inventory, cart and order history'],
    ['Work', 'shared specification + T1–T7 in order · one commit per task'],
    ['Sessions', 'each task starts a new session · files are the only state'],
    ['Checks', 'acceptance checks v1 · 30 · bundled with the template'],
    ['Rubric', 'web v1 · UX 25 Visual 15 Code 20 Spec 25 Robust 10 A11y 5'],
    ['Planning', 'none · approved tasks, no LLM planner call'],
  ];
  table(g, m.x, y, m.w, [{ l: 'Element', w: 18 }, { l: 'Contract', w: m.w - 18 }], rows.map((v) => ({ v })), { cursor: focus === 'contract' ? 0 : -1, focused: focus === 'contract' });
  g.region(m.x, y, m.w, rows.length + 1, 'DataTable', '#contract');
  y += rows.length + 2;
  g.text(m.x, y++, 'Left open by the prompts, so never checked', 'bd');
  y = para(g, m.x, y, m.w, OPEN, 'mu');
  y++;
  para(g, m.x, y, m.w, 'The inventory website is what competitors build; it is not part of AxBenchmark. Editing tasks, checks, baseline or rubric creates a new revision; r1 stays as it is.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Show prompts', go: 'InventoryPrompts', focus: focus === 'prompts' }, { label: 'Show checks', go: 'InventoryChecks' }, { label: 'Configure run ▸', v: 'primary', go: 'Setup', focus: focus === 'configure' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'p', d: 'Prompts', go: 'InventoryPrompts' }, { k: 'c', d: 'Checks', go: 'InventoryChecks' }, { k: 'enter', d: 'Configure run', go: 'Setup' }], '');
  return g;
}

// ---------------------------------------------------------------- preserved prompts

export function inventoryPrompts(sz, focus = 'text') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Inventory web app r1 · preserved prompts');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(`★ Built-in · read-only · packaged unchanged from benchmark/tasks/ · covered by sha256 ${mid(SHA.inv1)}`, W - 2));
  g.region(0, 1, W, 1, 'Static', '#prompts-bar');
  const nf = focus === 'files';
  g.box(0, 2, 30, H - 3, { f: nf ? 'ac' : 'ln', title: 'Files · in run order' });
  tree(g, 2, 3, 26, [
    { t: 'spec/', depth: 0, kids: true, open: true, f: 'bd' },
    { t: '00-project.md', depth: 1, last: true, sel: true },
    { t: 'tasks/', depth: 0, kids: true, open: true, f: 'bd' },
    ...FILES.slice(1).map((f, i) => ({ t: f, depth: 1, last: i === 6 })),
  ], { focused: nf });
  g.region(2, 3, 26, 10, 'Tree', '#prompt-files');
  para(g, 2, 15, 26, 'The project text is prepended to every task. Each task runs in a new session.', 'mu');
  const tf = focus === 'text';
  const x = 30, w = W - 30;
  g.box(x, 2, w, H - 3, { f: tf ? 'ac' : 'ln', title: 'Markdown · verbatim' });
  g.region(x, 2, w, H - 3, 'MarkdownViewer', '#prompt-text');
  let y = 3;
  const tw = w - 5;
  PROMPTS.forEach(([file, text], fi) => {
    const blocks = text.trim().split(/\n\s*\n/);
    blocks.forEach((b, bi) => {
      if (b.startsWith('# ')) {
        g.text(x + 2, y, fit(b.slice(2), tw - len(file) - 2), 'bd ul');
        g.text(x + 2 + tw - len(file), y++, file, 'mu');
      } else {
        for (const l of wrap(b.replace(/\n/g, ' '), tw)) g.text(x + 2, y++, l);
        if (fi === 0 && bi < blocks.length - 1) y++;
      }
    });
    y++;
  });
  if (y > H - 2) throw new Error(`Prompts overflow the frame by ${y - (H - 2)} rows`);
  scrollbar(g, x + w - 2, 3, H - 5, 0, H - 5);
  footer(g, [{ k: 'esc', d: 'Back', go: 'InventoryAbout' }, { k: '↑↓', d: 'Scroll' }, { k: 'c', d: 'Checks', go: 'InventoryChecks' }, { k: 'y', d: 'Copy file' }, { k: 'tab', d: 'Pane', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- check coverage

export function inventoryChecks(sz, focus = 'checks', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Inventory r1 · 30 unique checks');
  g.text(1, 1, fit('At-task 30 · final 30 = 19 delivered artifact + 11 task history · T1–T7: 6 / 4 / 5 / 2 / 6 / 4 / 3', W - 2), 'bd');
  g.region(0, 1, W, 1, 'Static', '#checks-bar');
  const selected = st.check ?? 'T2_samples', start = st.start ?? 0, visible = CHECKS.slice(start, start + 18);
  g.box(0, 2, W, 21, { f: focus === 'checks' ? 'ac' : 'ln', title: 'Versioned catalog · scroll for all 30', sub: `${start + 1}–${start + visible.length} of 30` });
  table(g, 1, 3, W - 2, [{ l: 'Check', w: 19 }, { l: 'Requirement', w: 12 }, { l: 'What it observes', w: 46 }, { l: 'Kind', w: 9 }, { l: 'Final target', w: W - 88 }], visible.map(([id, title, kind]) => ({ v: [id, CHECK_DETAILS[id].requirement, title, kind, CHECK_DETAILS[id].target === 'task_history' ? 'task history' : 'delivered artifact'] })), { cursor: visible.findIndex(([id]) => id === selected), focused: focus === 'checks' });
  g.region(1, 3, W - 2, 19, 'DataTable', '#coverage');
  g.box(0, 23, W, 12, { f: focus === 'detail' ? 'ac' : 'ln', title: `${selected} · observation and phases` });
  g.region(0, 23, W, 12, 'VerticalScroll', '#check-observation');
  const d = CHECK_DETAILS[selected];
  let y = kv(g, 2, 24, 16, W - 4, [
    ['Requirement', `${d.requirement} · ${selected.split('_')[0]} prompt · ${CHECKS.find(([id]) => id === selected)[1]}`],
    ['At task', d.phase === 'H' ? 'task_history · captured start/end snapshots and invocation evidence' : 'task_snapshot · defining task only; no later UI obligation'],
    ['Final', d.target === 'task_history' ? 'task_history · same original boundary, not T7 HEAD' : 'delivered_artifact · delivered T7 snapshot'],
    ['Evidence', `${d.evidence} · checks/${d.strategy}.py · frozen discovery rules`],
  ]);
  y = para(g, 2, y + 1, W - 4, d.observation, 'mu');
  g.text(2, 33, fit('Unobservable → unverified, never application failure. T2 needs data initialization, not the T3 inventory UI.', W - 4), 'bd');
  para(g, 2, 36, W - 4, 'Left open: ' + OPEN, 'mu');
  footer(g, [{ k: 'esc', d: 'Back', go: 'InventoryAbout' }, { k: '↑↓', d: 'Select / scroll' }, { k: 'p', d: 'Prompts', go: 'InventoryPrompts' }, { k: 'o', d: 'Suite file' }, { k: 'tab', d: 'Pane', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- look-alikes are not the default

export function inventoryVariant(sz) {
  const g = library(sz, 'none');
  const m = modal(g, 86, 22, 'Not the default benchmark', { sel: '#variant' });
  let y = m.y;
  g.text(m.x, y++, fit('Inventory web app · 6 tasks is a separate template', m.w), 'bd');
  y++;
  table(g, m.x, y, m.w, [{ l: '', w: 12 }, { l: '★ Inventory web app · r1', w: 32 }, { l: '◆ Inventory web app · 6 tasks', w: m.w - 44 }], [
    { v: ['Source', 'built-in', 'custom duplicate'] },
    { v: ['Tasks', '7 · T1–T7', '6 · T7 Test and fix removed'] },
    { v: ['SHA-256', short(SHA.inv1), short(SHA.inv6)] },
    { v: ['Default', '★ yes', { t: 'no · a different template', f: 'bd' }] },
    { v: ['Results', '12 · compared with each other', '2 · compared only with each other'] },
  ]);
  g.region(m.x, y, m.w, 6, 'DataTable', '#variant-compare');
  y += 7;
  y = notice(g, m.x, y, m.w, 'warning', 'A similar name is not the same benchmark', 'Its 2 results are compared only with each other. They never join r1 comparisons, and r1 results never join theirs.');
  y++;
  para(g, m.x, y, m.w, 'Names and task counts never confer identity; only the SHA-256 of the packaged content does.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open 6-task template', go: 'TemplateTasks' }, { label: 'Close', v: 'primary', go: 'Library', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }], '');
  return g;
}

// ---------------------------------------------------------------- a newer built-in revision (D16)

export function inventoryUpgrade(sz, focus = 'close') {
  const g = library(sz, 'none', { upgrade: true });
  const m = modal(g, 86, 27, 'Built-in Inventory web app r3 · what changed', { sel: '#default-changes-dialog' });
  let y = m.y;
  g.text(m.x, y++, fit('Shipped with AxBenchmark 1.4 · all built-in revisions stay available', m.w), 'bd');
  y++;
  g.text(m.x, y++, 'Changes from r1', 'bd');
  for (const [k, t, f] of [
    ['= same', 'spec and the seven prompts, verbatim · baseline · rubric web v1', 'mu'],
    ['~ check', 'T2_samples improves data discovery (no UI required)', ''],
    ['~ check', 'T7_browser_qa improves retained action evidence discovery', ''],
    ['~ protocol', 'execution protocol v1 → v1.1 · service readiness retries', ''],
  ]) { g.text(m.x, y, k, f || ''); g.text(m.x + 12, y++, fit(t, m.w - 12), f); }
  y++;
  g.text(m.x, y++, 'Identity', 'bd');
  g.text(m.x, y, 'r1', 'mu'); g.text(m.x + 4, y++, SHA.inv1, 'mu');
  g.text(m.x, y, 'r3', 'bd'); g.text(m.x + 4, y++, SHA.inv3, 'bd');
  y++;
  y = notice(g, m.x, y, m.w, 'warning', 'Results from r1 and r3 can’t be compared', 'Different SHA-256, so they rank separately. Your 12 r1 results, its 3 configurations and the default stay as they are until you choose otherwise.');
  y++;
  para(g, m.x, y, m.w, 'Make r3 the default asks for confirmation; it changes only which revision the Library selects first. r1 stays runnable.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open r3', go: 'TemplateTasks' }, { label: 'Make r3 the default…' }, { label: 'Close', v: 'primary', go: 'LibraryUpgrade', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'LibraryUpgrade' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}
