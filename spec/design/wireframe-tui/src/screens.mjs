// M01 · Template library and immutable identity — screens, modals and states. All example data is fictional
// except the inventory task titles and prompt text, which are quoted from benchmark/tasks/.
// Each screen function draws one terminal frame for a size ({cols, rows}) and a focus key.
import { Grid, sha, fit, len, wrap, header, footer, table, tabs, button, buttons, input, radios, check, progress, loading, scrollbar, para, kv, notice, toast, modal, tree } from './lib.mjs';

// ---------------------------------------------------------------- data

export const SHA = {
  inv1: '3f9c2e71' + sha('axbenchmark/template/inventory-web-app/r1').slice(8),
  inv2: '9c41d0b5' + sha('axbenchmark/template/inventory-web-app/r2').slice(8),
  inv3: 'b7d2a6f0' + sha('axbenchmark/template/inventory-web-app/r3-builtin').slice(8),
  inv6: '8b04d6aa' + sha('axbenchmark/template/inventory-web-app-6/r1').slice(8),
  orders: sha('axbenchmark/template/orders-rest-api/r3'),
  billing: sha('axbenchmark/template/billing-refactor/r1'),
  kanban: 'e0b6f2d9' + sha('axbenchmark/template/kanban-board/r1').slice(8),
  kanbanComputed: sha('axbenchmark/template/kanban-board/r1/tampered'),
  recipe: sha('axbenchmark/template/recipe-planner/r2'),
  changed: sha('axbenchmark/template/inventory-web-app/r1/edited-T2'),
  cfg: sha('axbenchmark/config/four-harnesses-defaults'),
  empty: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
};
export const s8 = (h) => h.slice(0, 8);
export const mid = (h) => `${h.slice(0, 16)}…${h.slice(-8)}`;

export const TEMPLATES = [
  { m: '★', name: 'Inventory web app', type: 'Frontend', src: 'Built-in', tasks: 7, rev: 'r1', sha: SHA.inv1, cfg: 3, res: 12 },
  { m: '◆', name: 'Inventory web app · 6 tasks', type: 'Frontend', src: 'Custom', tasks: 6, rev: 'r1', sha: SHA.inv6, cfg: 1, res: 2 },
  { m: '◆', name: 'Orders REST API', type: 'Backend', src: 'Custom', tasks: 7, rev: 'r3', sha: SHA.orders, cfg: 2, res: 6 },
  { m: '◆', name: 'Billing service refactor', type: 'Backend', src: 'Custom', tasks: 7, rev: 'r1', sha: SHA.billing, cfg: 1, res: 0 },
  { m: '↓', name: 'Kanban board', type: 'Fullstack', src: 'Imported', tasks: 7, rev: 'r1', sha: SHA.kanban, cfg: 0, res: 3 },
  { m: '↓', name: 'Recipe planner PWA', type: 'Frontend', src: 'Imported', tasks: 5, rev: 'r2', sha: SHA.recipe, cfg: 1, res: 4 },
];

// Task titles and prompts from benchmark/tasks/ (first sentence shown in the table).
const TASKS = [
  ['T1', 'Repository and scaffold', 'Set up the project: create a git repository and a basic structure for the inventory website with a README.', 2],
  ['T2', 'Inventory data and persistence', 'Add the inventory data layer: products with their stock, persisted in localStorage, with sample data on first run.', 4],
  ['T3', 'Inventory management', 'Let the user view the inventory and add, edit and delete products.', 5],
  ['T4', 'Inventory lookup', 'Add inventory lookup so the user can quickly find products.', 2],
  ['T5', 'Shopping cart', 'Add a shopping cart: the user can add products from the inventory, change quantities, remove them and see the total.', 4],
  ['T6', 'Checkout', 'Add checkout: completing a purchase updates the stock and keeps an order history.', 3],
  ['T7', 'Test and fix', 'Test the website thoroughly as a user would, in a real browser (you may install and use any tools you need).', 1],
];
const TASKS_R2 = [TASKS[0], TASKS[1], TASKS[2], ['T4', ...TASKS[4].slice(1)], ['T5', ...TASKS[3].slice(1)], ['T6', 'Checkout', TASKS[5][2], 4], TASKS[6]];

const MANIFEST = [
  ['metadata.json', 'metadata · type, order', '318 B'],
  ['spec/00-project.md', 'specification', '412 B'],
  ['tasks/T1-scaffold.md', 'task 1 prompt', '182 B'],
  ['tasks/T2-data.md', 'task 2 prompt', '190 B'],
  ['tasks/T3-management.md', 'task 3 prompt', '140 B'],
  ['tasks/T4-lookup.md', 'task 4 prompt', '120 B'],
  ['tasks/T5-cart.md', 'task 5 prompt', '200 B'],
  ['tasks/T6-checkout.md', 'task 6 prompt', '150 B'],
  ['tasks/T7-qa.md', 'task 7 prompt', '196 B'],
  ['checks/acceptance.v1.json', 'acceptance checks · 21', '6.2 KB'],
  ['protocol/execution.v1.yaml', 'execution protocol', '1.4 KB'],
  ['protocol/services.yaml', 'setup · start · stop', '388 B'],
  ['rubric/web.v1.yaml', 'grading rubric · web', '2.1 KB'],
  ['baseline/', 'baseline · empty', '0 B'],
  ['deps.yaml', 'dependency declaration', '142 B'],
].map(([p, r, s]) => [p, r, p === 'baseline/' ? SHA.empty : sha('file:' + p), s]);

export const NOW = '2026-10-01 21:40';

// ---------------------------------------------------------------- shared pieces

export const envBar = (g, st = {}) => {
  g.fill(0, 1, g.w, 1, 'B1');
  const c = g.w < 100;
  if (st.noHarness) {
    g.text(1, 1, '✗', 'bd');
    g.text(3, 1, c ? 'No supported harness — runs disabled' : 'No supported harness found — planning and runs are disabled. Library, ZIP exchange and saved results still work.', 'bd');
    const r = 'F2 Environment';
    g.text(g.w - 1 - len(r), 1, 'F2', 'ac bd'); g.text(g.w - 1 - len(r) + 3, 1, 'Environment', 'mu');
    g.link(g.w - 1 - len(r), 1, len(r), 1, 'go:EnvironmentNoHarness');
  } else {
    g.text(1, 1, '●', 'ac');
    const ready = c ? '4 harnesses ready' : '4 harnesses ready · Claude Code · Codex · Grok CLI · Pi';
    g.text(3, 1, ready, '');
    g.link(1, 1, len(ready) + 2, 1, 'go:Environment');
    const r = c ? '◆ 1 active run   ^r Reconnect' : '◆ 1 active run · 2026-10-01-a · 3/4 running   ^r Reconnect';
    const x = g.w - 1 - len(r);
    g.text(x, 1, r.replace(/\^r Reconnect$/, ''), 'mu');
    g.text(g.w - 1 - len('^r Reconnect'), 1, '^r', 'ac bd'); g.text(g.w - 1 - len('Reconnect'), 1, 'Reconnect', '');
    g.link(g.w - 1 - len('^r Reconnect'), 1, len('^r Reconnect'), 1, 'go:RunReattached');
  }
  g.region(0, 1, g.w, 1, 'Static', '#env-bar');
};

const libCols = (w) => {
  const rest = [['', 2], ['Type', 10], ['Source', 9], ['Tasks', 6, 'right'], ['Rev', 4], ['SHA-256', 9], ['Cfg', 4, 'right'], ['Res', 4, 'right']];
  const used = rest.reduce((n, c) => n + c[1], 0);
  const cols = rest.map(([l, w2, al]) => ({ l, w: w2, al }));
  cols.splice(1, 0, { l: 'Name', w: w - used });
  return cols;
};
const libRow = (t) => ({ v: [t.m, t.name, t.type, t.src, String(t.tasks), t.rev, s8(t.sha), String(t.cfg), String(t.res)], go: 'TemplateTasks' });

// ---------------------------------------------------------------- 1 · Library

// Unfinished planning drafts (D10, W10): kept under ~/.axbenchmark/drafts/, no SHA-256 until approved.
export const DRAFTS = [
  { name: 'Household expense tracker', type: 'Frontend', state: 'planning', upd: 'today 21:38', go: 'PlanningProgress' },
  { name: 'Team wiki search API', type: 'Backend', state: 'ready for review', upd: '09-30 19:12', go: 'PlanReview' },
  { name: 'Photo gallery uploader', type: 'Fullstack', state: 'failed', upd: '09-29 17:05', go: 'PlanningFailed' },
];
const draftCols = (w) => [{ l: '', w: 2 }, { l: 'Draft · no SHA-256 yet', w: w - 44 }, { l: 'Type', w: 10 }, { l: 'State', w: 20 }, { l: 'Updated', w: 12 }];
const draftState = (d) => ({ planning: { t: '● planning', f: 'ac' }, 'ready for review': { t: '✓ ready for review', f: '' }, failed: { t: '✗ failed', f: 'bd' } }[d.state]);
const draftRow = (d) => ({ v: ['◇', d.name, d.type, draftState(d), d.upd], go: d.go });

export function library(sz, focus = 'templates', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  header(g, 'AxBenchmark', 'Template library');
  envBar(g, st);
  const top = 2, lw = compact ? W : 72, lh = compact ? H - 1 - top - 5 : H - 1 - top;
  const lf = focus === 'templates' || focus === 'filter' || focus === 'drafts' || focus === 'notice';
  const shown = st.error ? TEMPLATES.filter((t) => t.src === 'Built-in') : TEMPLATES;
  const count = st.loading ? '…' : st.error ? '1 of 6' : st.filter ? '0 of 6' : '6';
  const drafts = !st.loading && !st.filter;
  g.box(0, top, lw, lh, { f: lf ? 'ac' : 'ln', title: `Library · ${count} templates${drafts ? ' · 3 drafts' : ''}`, sub: 'default first' });
  g.region(0, top, lw, lh, 'Vertical', '#library-pane.pane');
  const cx = 2, cw = lw - 4;
  input(g, cx, top + 1, cw, st.filter ?? '', { ph: '/ Filter by name, type or source', focus: focus === 'filter' });
  g.region(cx, top + 1, cw, 1, 'Input', '#filter');
  let ty = top + 2;
  const cols = libCols(cw);
  if (st.upgrade) {
    let y = notice(g, cx, ty + 1, cw, 'info', 'Built-in Inventory web app r3 is available',
      'Results from r1 and r3 can’t be compared. Your default stays r1 because it has 12 results; all built-in revisions stay available.');
    const bx = button(g, cx + 2, y, 'What changed', { go: 'InventoryUpgrade', focus: focus === 'notice' });
    g.region(cx + 2, y, bx - cx - 2, 1, 'Button', '#default-changes');
    const bx2 = button(g, bx + 2, y, 'Make r3 the default…');
    g.region(bx + 2, y, bx2 - bx - 2, 1, 'Button', '#make-default');
    button(g, bx2 + 2, y, 'Dismiss');
    g.region(cx, ty + 1, cw, y - ty, 'Vertical', '#default-notice.notice');
    ty = y + 2;
  }
  if (st.error) {
    let y = notice(g, cx, ty + 1, cw, 'error', 'Library index could not be read',
      `~/.axbenchmark/library/index.yaml — PermissionError: [Errno 13] Permission denied. Built-in templates stay available; custom and imported templates are hidden until the index is readable. Nothing was modified.`);
    button(g, cx + 2, y + 1, 'Retry', { focus: focus === 'retry' });
    g.region(cx, ty + 1, cw, y - ty + 1, 'Vertical', '#templates-error.notice.-error');
    ty = y + 3;
  }
  if (st.loading || st.filter) {
    table(g, cx, ty, cw, cols, []);
    const mid = top + Math.floor(lh / 2) - 1;
    if (st.loading) { loading(g, cx, mid, cw, 'Reading library…'); g.region(cx, mid, cw, 3, 'LoadingIndicator', '#templates-loading'); }
    else {
      const a = `No templates match “${st.filter}”`, b = 'esc clear filter · n create a template';
      g.text(cx + Math.floor((cw - len(a)) / 2), mid, a, 'bd');
      g.text(cx + Math.floor((cw - len(b)) / 2), mid + 1, b, 'mu');
      g.region(cx, mid, cw, 2, 'Static', '#templates-empty.empty');
    }
  } else {
    const cur = st.sel === 'draft' ? -1 : st.sel === 'lookalike' ? 1 : 0;
    const end = table(g, cx, ty, cw, cols, shown.map(libRow), { cursor: cur, focused: focus === 'templates' });
    g.region(cx, ty, cw, end - ty, 'DataTable', '#templates');
    const dy = compact ? end : end + 1;
    const dend = table(g, cx, dy, cw, draftCols(cw), DRAFTS.map(draftRow), { cursor: st.sel === 'draft' ? 1 : -1, focused: focus === 'drafts' });
    g.region(cx, dy, cw, dend - dy, 'DataTable', '#drafts');
  }
  g.text(cx, top + lh - 2, fit('★ default  ◆ custom  ↓ imported  ◇ draft  Cfg configs  Res results', cw), 'mu');

  const sel = st.sel === 'lookalike' ? TEMPLATES[1] : TEMPLATES[0];
  const draft = st.sel === 'draft' ? DRAFTS[1] : null;
  if (compact) {
    const y = top + lh;
    g.box(0, y, W, 5, { title: 'Selected', f: 'ln' });
    g.region(0, y, W, 5, 'Static', '#summary');
    if (st.loading) g.text(2, y + 2, 'Reading library…', 'mu');
    else if (st.filter) g.text(2, y + 2, 'No template selected', 'mu');
    else {
      g.text(2, y + 1, fit(`${sel.name} · ${sel.rev} · ${sel.type} · ${sel.tasks} tasks · ★ built-in default`, W - 4), 'bd');
      g.text(2, y + 2, 'sha256 ', 'mu'); g.text(9, y + 2, sel.sha);
      g.text(2, y + 3, fit(`${sel.cfg} saved configurations · ${sel.res} results (8 local, 4 imported)`, W - 18), 'mu');
      g.text(W - 16, y + 3, 'o', 'ac bd'); g.text(W - 14, y + 3, 'Open details', '');
      g.link(W - 16, y + 3, 14, 1, 'go:TemplateTasks');
    }
  } else {
    const df = focus === 'detail';
    const x = lw, w = W - lw;
    g.box(x, top, w, lh, { f: df || focus === 'why' ? 'ac' : 'ln', title: st.loading || st.filter ? 'Details' : draft ? draft.name : sel.name });
    g.region(x, top, w, lh, 'VerticalScroll', '#detail-pane.pane');
    const dx = x + 2, dw = w - 4;
    const by = top + lh - 2;
    if (st.loading) { g.text(dx, top + 2, 'Waiting for the library…', 'mu'); }
    else if (st.filter) { g.text(dx, top + 2, 'No template selected.', 'mu'); g.text(dx, top + 3, 'Clear the filter to see the library.', 'mu'); }
    else if (draft) {
      let y = top + 1;
      g.text(dx, y++, draft.name, 'bd');
      g.text(dx, y++, '◇ Draft · Backend · not a template yet', 'mu');
      y = para(g, dx, y + 1, dw, 'Add full-text search to the team wiki API: index pages and comments, rank the results, and keep the existing endpoints unchanged.');
      y = kv(g, dx, y + 1, 11, dw, [
        ['State', '✓ ready for review'],
        ['Planned', '7 tasks · 19 checks'],
        ['Planner', 'Claude Code · opus-5-5 · high'],
        ['Baseline', 'repository · commit c91e0d4'],
        ['Updated', '2026-09-30 19:12'],
        ['Saved in', '~/.axbenchmark/drafts/'],
        ['Identity', 'none · SHA-256 at approval'],
      ]);
      g.region(dx, top + 1, dw, y - top - 1, 'Static', '#draft-fields.kv');
      para(g, dx, y + 1, dw, 'Drafts survive closing the app and the engine. Enter reopens it where you left it. No configuration or result can refer to a draft.', 'mu');
      const bx = button(g, dx, by, 'Reopen ▸', { v: 'primary', go: 'PlanReview', focus: df });
      button(g, bx + 2, by, 'Discard draft…', { go: 'DraftDiscard' });
      g.region(dx, by, dw, 1, 'Horizontal', '.actions');
    } else if (st.sel === 'lookalike') {
      let y = top + 1;
      g.text(dx, y++, sel.name, 'bd');
      g.text(dx, y++, '◆ Custom · duplicate of r1 · Frontend', 'mu');
      y = para(g, dx, y + 1, dw, 'Six of the seven default tasks; T7 Test and fix was removed. A separate template with its own SHA-256 and results.');
      y = kv(g, dx, y + 1, 12, dw, [
        ['Tasks', '6 · scaffold → checkout'],
        ['Revision', 'r1 · approved 2026-09-20'],
        ['SHA-256', [sel.sha.slice(0, 32), sel.sha.slice(32)]],
        ['Baseline', 'Empty project'],
        ['Configs', '1 saved for r1'],
        ['Results', '2 · never compared with r1'],
      ]);
      g.region(dx, top + 1, dw, y - top - 1, 'Static', '#detail-fields.kv');
      para(g, dx, y + 1, dw, 'Not the default benchmark, whatever the name. About (a) is only for the built-in inventory template.', 'mu');
      button(g, dx, by - 2, 'Why not the default?', { go: 'InventoryVariant', focus: focus === 'why' });
      g.region(dx, by - 2, 22, 1, 'Button', '#why-not-default');
      const bx = button(g, dx, by, '▶ Configure run', { v: 'primary', focus: df, go: 'Setup' });
      const bx2 = button(g, bx + 2, by, 'Open', { go: 'TemplateTasks' });
      button(g, bx2 + 2, by, 'Export', { go: 'ExportTemplate' });
      g.region(dx, by, dw, 1, 'Horizontal', '.actions');
    } else {
      let y = top + 1;
      g.text(dx, y++, sel.name, 'bd');
      g.text(dx, y, '★ Built-in · default · Frontend', 'mu');
      g.text(dx + dw - 7, y, 'a', 'ac bd'); g.text(dx + dw - 5, y, 'About'); g.link(dx + dw - 7, y++, 7, 1, 'go:InventoryAbout');
      y = para(g, dx, y + 1, dw, 'Inventory website in HTML5 and vanilla JavaScript with localStorage persistence, opened directly from index.html. Seven tasks from scaffold to browser QA.');
      y = kv(g, dx, y + 1, 12, dw, [
        ['Tasks', '7 · scaffold → browser QA'],
        ['Revision', st.upgrade ? 'r1 of 3 · default · r3 built-in new' : 'r1 of 2 · approved 2026-09-12'],
        ['SHA-256', [sel.sha.slice(0, 32), sel.sha.slice(32)]],
        ['Baseline', 'Empty project'],
        ['Checks', '21 acceptance checks · v1'],
        ['Rubric', 'Web profile v1 · 6 categories'],
        ['Configs', '3 saved for r1'],
        ['Results', '12 · 8 local · 4 imported'],
      ]);
      g.region(dx, top + 1, dw, y - top - 1, 'Static', '#detail-fields.kv');
      y += 1;
      g.text(dx, y++, 'Saved configurations', 'bd');
      const cfgs = [['Four harnesses · defaults', '4 entries'], ['Claude effort sweep', '3 entries'], ['Local models · Pi', '2 entries']];
      cfgs.forEach(([n, e], i) => {
        g.text(dx, y, i === 0 ? '▸ ' : '  ', 'ac');
        g.text(dx + 2, y, fit(n, dw - 12), i === 0 ? '' : 'mu');
        g.text(dx + dw - 9, y++, fit(e, 9, 'right'), 'mu');
      });
      g.region(dx, y - 3, dw, 3, 'ListView', '#saved-configs');
      y += 1;
      g.text(dx, y++, 'Latest result', 'bd');
      g.text(dx, y++, fit('2026-09-28-a · mike-mbp-m4 · 4/4 complete', dw), 'mu');
      const bx = button(g, dx, by, '▶ Configure run', { v: 'primary', focus: df, off: st.noHarness, go: st.noHarness ? undefined : 'Setup' });
      const bx2 = button(g, bx + 2, by, 'Open', { go: 'TemplateTasks' });
      button(g, bx2 + 2, by, 'Export', { go: 'ExportTemplate' });
      g.region(dx, by, dw, 1, 'Horizontal', '.actions');
      if (st.noHarness) notice(g, dx, by - 4, dw, 'warning', 'Runs need a harness', 'Install Claude Code, Codex, Grok CLI or Pi, then recheck in Environment.');
    }
  }
  const builtin = !st.sel && !st.loading && !st.filter;
  if (st.sel === 'draft') {
    footer(g, [{ k: 'enter', d: 'Reopen', go: 'PlanReview' }, { k: 'delete', d: 'Discard draft', go: 'DraftDiscard' }, { k: 'a', d: 'About', off: true }, { k: 'n', d: 'New', go: 'NewTemplate' }, { k: 'i', d: 'Import', go: 'ImportTemplate' }, { k: '/', d: 'Filter' }, { k: 'tab', d: 'Pane', do: 'next' }, { k: 'q', d: 'Quit' }]);
  } else {
    footer(g, compact
      ? [{ k: 'enter', d: 'Configure', go: 'Setup', off: st.noHarness }, { k: 'a', d: 'About', go: builtin ? 'InventoryAbout' : undefined, off: !builtin }, { k: 'o', d: 'Open', go: 'TemplateTasks' }, { k: 'n', d: 'New', go: 'NewTemplate', off: st.noHarness }, { k: 'e', d: 'Revise', go: 'Revise' }, { k: 'i', d: 'Import', go: 'ImportTemplate' }]
      : [{ k: 'enter', d: 'Configure', go: 'Setup', off: st.noHarness }, { k: 'a', d: 'About', go: builtin ? 'InventoryAbout' : undefined, off: !builtin }, { k: 'o', d: 'Open', go: 'TemplateTasks' }, { k: 'n', d: 'New', go: 'NewTemplate', off: st.noHarness }, { k: 'd', d: 'Duplicate', go: 'Revise' }, { k: 'e', d: 'Revise', go: 'Revise' }, { k: 'i', d: 'Import', go: 'ImportTemplate' }, { k: 'x', d: 'Export', go: 'ExportTemplate' }, { k: '/', d: 'Filter' }, { k: 'q', d: 'Quit' }]);
  }
  return g;
}

// ConfirmScreen (shared M15 widget) over the library: discard one planning draft.
export function draftDiscard(sz, focus = 'cancel') {
  const g = library(sz, 'none', { sel: 'draft' });
  const m = modal(g, 72, 14, 'Discard draft?', { sel: '#confirm' });
  let y = m.y;
  g.text(m.x, y++, fit('Team wiki search API · ready for review · updated 2026-09-30 19:12', m.w), 'bd');
  y++;
  y = para(g, m.x, y, m.w, 'Deletes ~/.axbenchmark/drafts/team-wiki-search-api/ with its 7 planned tasks and planner output. This cannot be undone.');
  y++;
  para(g, m.x, y, m.w, 'Nothing else changes: the repository, templates, configurations and results never refer to a draft.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'LibraryDrafts', focus: focus === 'cancel' }, { label: 'Discard draft', v: 'error', go: 'LibraryDrafts', focus: focus === 'discard' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'LibraryDrafts' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'enter', d: 'Choose' }], '');
  return g;
}

// ---------------------------------------------------------------- 2 · Template revision (tabs)

const TABS = ['Tasks', 'Identity', 'Configurations', 'Results'];
const TAB_GO = ['TemplateTasks', 'TemplateIdentity', 'TemplateConfigs', 'TemplateResults'];

export function template(sz, focus = 'tasks', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  const r2 = st.rev === 'r2', tab = st.tab ?? 0;
  const digest = r2 ? SHA.inv2 : SHA.inv1;
  header(g, 'AxBenchmark', `Inventory web app · ${r2 ? 'r2' : 'r1'}`);
  g.fill(0, 1, W, 1, 'B1');
  const idText = compact
    ? `${r2 ? '◆ r2 custom' : '★ r1 built-in'} · 7 tasks · sha256 ${s8(digest)}…${digest.slice(-8)} · ✓ verified`
    : `${r2 ? '◆ Custom revision of r1' : '★ Built-in'} · Frontend · 7 tasks · ${r2 ? 'r2' : 'r1'} · sha256 ${mid(digest)} · approved ${r2 ? '2026-10-01' : '2026-09-12'} · ✓ identity verified`;
  g.text(1, 1, fit(idText, W - 2 - (compact ? 13 : 0)));
  if (compact) { g.text(W - 12, 1, 'r', 'ac bd'); g.text(W - 10, 1, 'Revisions', ''); }
  g.region(0, 1, W, 1, 'Static', '#identity-bar');

  const top = 2, bottom = H - 2;
  let cx = 1, cw = W - 2;
  if (!compact) {
    const tf = focus === 'revisions';
    g.box(0, top, 30, bottom - top + 1, { f: tf ? 'ac' : 'ln', title: 'Revisions' });
    g.region(0, top, 30, bottom - top + 1, 'Vertical', '#revisions-pane.pane');
    const ty = tree(g, 2, top + 1, 26, [
      { t: 'Inventory web app', depth: 0, kids: true, open: true, f: 'bd' },
      { t: `${fit('r1 ★ built-in', 15)}${s8(SHA.inv1)}`, depth: 1, sel: !r2, go: 'TemplateTasks' },
      { t: `${fit('r2 custom', 15)}${s8(SHA.inv2)}`, depth: 1, last: true, sel: r2, go: 'RevisionSaved' },
      { t: 'Duplicates', depth: 0, kids: true, open: true, f: 'bd' },
      { t: `${fit('6 tasks · r1', 15)}${s8(SHA.inv6)}`, depth: 1, last: true, f: 'mu' },
    ], { focused: tf });
    g.region(2, top + 1, 26, 5, 'Tree', '#revisions');
    let y = kv(g, 2, ty + 1, 9, 26, r2
      ? [['Status', 'approved'], ['Parent', 'r1 · 3f9c2e71'], ['Created', '2026-10-01'], ['Configs', '0 · copy from r1'], ['Results', 'none yet'], ['Name', 'editable (n)']]
      : [['Status', 'approved'], ['Parent', '— (built-in)'], ['Created', '2026-09-12'], ['Configs', '3 saved'], ['Results', '12'], ['Name', 'fixed · built-in']]);
    g.region(2, ty + 1, 26, y - ty - 2, 'Static', '#revision-facts.kv');
    if (r2) { g.link(11, y - 1, 17, 1, 'do:rename'); g.region(11, y - 1, 17, 1, 'Button', '#rename'); }
    para(g, 2, y + 1, 26, 'Lineage is for navigation only. Identity always comes from content.', 'mu');
    cx = 31; cw = W - 32;
  }
  tabs(g, cx - 1, top, cw + 2, TABS, tab, { go: TAB_GO, focused: false });
  g.region(cx - 1, top, cw + 2, 2, 'TabbedContent', '#tabs');
  const y0 = top + 2;

  if (tab === 0) {
    const tf = focus === 'tasks';
    g.box(cx, y0, cw, 10, { f: tf ? 'ac' : 'ln', title: 'Ordered tasks', sub: `${r2 ? 22 : 21} checks` });
    const cols = compact
      ? [{ l: '#', w: 4 }, { l: 'Task', w: 26 }, { l: 'Prompt', w: cw - 2 - 4 - 26 - 8 }, { l: 'Checks', w: 8, al: 'right' }]
      : [{ l: '#', w: 4 }, { l: 'Task', w: 32 }, { l: 'Prompt', w: cw - 2 - 4 - 32 - 8 }, { l: 'Checks', w: 8, al: 'right' }];
    const rows = (r2 ? TASKS_R2 : TASKS).map(([id, t, p, c]) => ({ v: [id, t, p, String(c)] }));
    table(g, cx + 1, y0 + 1, cw - 2, cols, rows, { cursor: 1, focused: tf });
    g.region(cx + 1, y0 + 1, cw - 2, 8, 'DataTable', '#tasks');
    const my = y0 + 10, mh = bottom - my;
    const pf = focus === 'prompt';
    g.box(cx, my, cw, mh, { f: pf ? 'ac' : 'ln', title: 'T2 · tasks/T2-data.md' });
    g.region(cx, my, cw, mh, 'MarkdownViewer', '#task-prompt');
    const mx = cx + 2, mw = cw - 5;
    const lines = [
      ['# Task 2: Inventory data and persistence', 'bd ul'],
      ['', ''],
      ...wrap(TASKS[1][2] + ' Commit your work.', mw).map((l) => [l, '']),
      ['', ''],
      ['Prepended to every task: spec/00-project.md · Project: Inventory website', 'mu'],
      ['', ''],
      ['## Acceptance checks (4)', 'bd'],
      ['· T2.1  Sample products appear on first load', ''],
      ['· T2.2  Products and stock survive a page reload', ''],
      ['· T2.3  Cleared storage restores the sample data on next load', ''],
      ['· T2.4  No console errors while the inventory loads', ''],
      ['', ''],
      ['Checks run on a disposable copy of the T2 snapshot; the agent never sees them.', 'mu'],
    ];
    const vis = mh - 2;
    lines.slice(0, vis).forEach(([l, f], i) => g.text(mx, my + 1 + i, fit(l, mw), f));
    if (lines.length > vis) scrollbar(g, cx + cw - 2, my + 1, vis, 0, Math.max(1, Math.round(vis * vis / lines.length)));
    g.text(cx, bottom, fit(compact ? `■ Frozen in ${r2 ? 'r2' : 'r1'} · any edit creates a new revision (e Revise)` : `■ Frozen in ${r2 ? 'r2' : 'r1'} — editing tasks, checks, baseline or rubric creates a new revision (e)`, cw), 'mu');
  }

  if (tab === 1) {
    let y = y0;
    g.text(cx, y++, 'Template SHA-256', 'mu');
    g.text(cx, y++, digest, 'bd');
    g.text(cx, y++, fit(compact ? 'Manifest axbenchmark-manifest/1 · canonical JSON · 15 entries' : 'Manifest axbenchmark-manifest/1 · canonical JSON · sorted relative paths · LF · 15 entries', cw), 'mu');
    g.text(cx, y, '✓', 'ac'); g.text(cx + 2, y++, fit(`Recomputed ${NOW} on this machine — matches the approved digest`, cw - 2));
    g.region(cx, y0, cw, 4, 'Static', '#identity-summary');
    y++;
    const tf = focus === 'manifest';
    const visible = compact ? bottom - y - 2 : 15;
    g.box(cx, y, cw, visible + 3, { f: tf ? 'ac' : 'ln', title: 'Covered by the hash', sub: '15 entries' });
    const cols = compact
      ? [{ l: 'Path', w: 27 }, { l: 'Role', w: 22 }, { l: 'Content SHA-256', w: 19 }, { l: 'Size', w: cw - 2 - 27 - 22 - 19, al: 'right' }]
      : [{ l: 'Path', w: 30 }, { l: 'Role', w: 26 }, { l: 'Content SHA-256', w: 20 }, { l: 'Size', w: cw - 2 - 30 - 26 - 20, al: 'right' }];
    table(g, cx + 1, y + 1, cw - 2 - (compact ? 1 : 0), compact ? [...cols.slice(0, 3), { ...cols[3], w: cols[3].w - 1 }] : cols,
      MANIFEST.map(([p, r, d, s]) => ({ v: [p, r, d.slice(0, 16) + '…', s] })), { cursor: 3, focused: tf, max: visible });
    if (compact) scrollbar(g, cx + cw - 2, y + 2, visible, 0, Math.round(visible * visible / 15));
    g.region(cx + 1, y + 1, cw - 2, visible + 1, 'DataTable', '#manifest');
    y += visible + 4;
    if (!compact) {
      g.text(cx, y++, 'Not part of the identity — recorded with each run and shown as comparison differences', 'bd');
      const half = Math.floor(cw / 2);
      [['harness, provider, model, effort', 'judge configuration'],
        ['clean or current environment mode', 'pricing and exchange rates'],
        ['concurrency (--jobs)', 'quality and ranking weights'],
        ['machine, OS, hardware, executable paths', 'display name, ZIP order, timestamps']].forEach(([a, b]) => {
        g.text(cx, y, '· ' + a, 'mu'); g.text(cx + half, y++, '· ' + b, 'mu');
      });
      g.region(cx, y - 5, cw, 5, 'Static', '#not-covered');
      g.text(cx, y + 1, fit('Rubric definitions are covered; the adjustable weights applied to them are not.', cw), 'mu');
      const bx = button(g, cx, bottom - 1, 'Copy SHA-256', { focus: focus === 'copy' });
      const bx2 = button(g, bx + 2, bottom - 1, 'Verify again');
      button(g, bx2 + 2, bottom - 1, 'Export ZIP', { go: 'ExportTemplate' });
      g.region(cx, bottom - 1, cw, 1, 'Horizontal', '.actions');
    }
  }

  if (tab === 2) {
    let y = y0;
    const tf = focus === 'configs';
    g.box(cx, y, cw, 6, { f: tf ? 'ac' : 'ln', title: 'Saved for r1 · 3f9c2e71', sub: '3 configurations' });
    table(g, cx + 1, y + 1, cw - 2, [{ l: 'Configuration', w: 28 }, { l: 'Entries', w: 9, al: 'right' }, { l: 'Judge', w: 29 }, { l: 'Weights', w: 9 }, { l: 'Updated', w: cw - 2 - 75 }], [
      { v: ['Four harnesses · defaults', '4', 'Claude Code · opus-5.5 · high', 'default', '2026-09-28'] },
      { v: ['Claude effort sweep', '3', 'Codex · gpt-6-astra · high', 'custom', '2026-09-25'] },
      { v: ['Local models · Pi', '2', 'Claude Code · opus-5.5 · high', 'default', '2026-09-21'] },
    ], { cursor: 0, focused: tf });
    g.region(cx + 1, y + 1, cw - 2, 4, 'DataTable', '#configs');
    y += 7;
    g.text(cx, y++, 'Entries · Four harnesses · defaults', 'bd');
    const ef = focus === 'entries';
    g.box(cx, y, cw, 7, { f: ef ? 'ac' : 'ln' });
    table(g, cx + 1, y + 1, cw - 2, [{ l: 'Harness', w: 14 }, { l: 'Provider', w: 20 }, { l: 'Model', w: 22 }, { l: 'Effort', w: 17 }, { l: 'Environment', w: cw - 2 - 73 }], [
      { v: ['Claude Code', 'Anthropic', 'claude-opus-5-5', 'medium', 'clean'] },
      { v: ['Codex', 'OpenAI', 'gpt-6-sol', 'medium', 'clean'] },
      { v: ['Grok CLI', 'xAI', 'grok-4.7-fast', 'harness default', 'clean'] },
      { v: ['Pi', 'local · llama.cpp', 'qwen3.5-35b-a3b', 'harness default', 'clean'] },
    ], { cursor: 0, focused: ef });
    g.region(cx + 1, y + 1, cw - 2, 5, 'DataTable', '#config-entries');
    y += 8;
    y = kv(g, cx, y, 17, cw, [
      ['Concurrency', 'one configuration per harness · up to 4 at once'],
      ['Judge', 'Claude Code · claude-opus-5-5 · high'],
      ['Quality weights', 'web v1 defaults · UX 25 · Visual 15 · Code 20 · Spec 25 · Robust 10 · A11y 5'],
      ['Ranking weights', 'cost 1 · time 1 · quality 1 (normalized 33.3% each)'],
    ]);
    g.region(cx, y - 4, cw, 4, 'Static', '#config-summary.kv');
    y = notice(g, cx, y + 1, cw, 'info', 'Configurations are saved per revision',
      'Editing one never changes the template or earlier results. Imported templates use harnesses available on this machine; origin paths, credentials and hardware are never required.');
    g.text(cx, y + 1, 'Selection defaults are conveniences, not recommendations about model quality.', 'mu');
    buttons(g, cx + cw, bottom - 1, [{ label: 'New configuration', go: 'Setup' }, { label: 'Edit', go: 'Setup' }, { label: 'Duplicate' }, { label: '▶ Configure run', v: 'primary', go: 'Setup', focus: focus === 'run' }]);
  }

  if (tab === 3) {
    let y = y0;
    g.text(cx, y++, fit('12 results for r1 · 8 local · 4 imported · 2 judge groups · all bound to 3f9c2e71', cw), 'bd');
    const tf = focus === 'results';
    g.box(cx, y, cw, 9, { f: tf ? 'ac' : 'ln', title: 'Runs' });
    table(g, cx + 1, y + 1, cw - 2, [{ l: 'Run', w: 15 }, { l: 'Machine', w: 15 }, { l: 'Source', w: 10 }, { l: 'Cfg', w: 4, al: 'right' }, { l: 'Judge', w: 19 }, { l: 'Completed', w: 12 }, { l: 'Status', w: cw - 2 - 75 }], [
      { v: ['2026-10-01-a', 'mike-mbp-m4', 'Local', '4', '—', '—', { t: '● 3/4 live', f: 'ac' }] },
      { v: ['2026-09-28-a', 'mike-mbp-m4', 'Local', '4', 'opus-5.5 · high', '09-28 18:02', '✓ judged'] },
      { v: ['2026-09-25-b', 'mike-mbp-m4', 'Local', '2', 'opus-5.5 · high', '09-25 22:41', { t: '▲ 1 failed', f: 'bd' }] },
      { v: ['2026-09-24-lab', 'lab-linux-4090', 'Imported', '3', 'gpt-6-astra · high', '09-24 09:15', '✓ judged'] },
      { v: ['2026-09-21-a', 'mike-mbp-m4', 'Local', '2', 'opus-5.5 · high', '09-21 16:30', '✓ judged'] },
      { v: ['2026-09-19-lab', 'lab-linux-4090', 'Imported', '1', 'gpt-6-astra · high', '09-19 11:02', '✓ judged'] },
    ], { cursor: 1, focused: tf });
    g.region(cx + 1, y + 1, cw - 2, 7, 'DataTable', '#results');
    y += 10;
    g.text(cx, y++, 'Judge groups — grades from different judges are never merged', 'bd');
    g.text(cx, y++, '● Claude Code · claude-opus-5-5 · high      8 results · local', 'mu');
    g.text(cx, y++, '● Codex · gpt-6-astra · high                4 results · imported, original reviews kept', 'mu');
    g.region(cx, y - 3, cw, 3, 'Static', '#judge-groups');
    y += 1;
    const ny = y;
    y = notice(g, cx, y, cw, 'info', 'Only results bound to r1 are listed',
      'Results of r2, of a newer built-in revision or of a look-alike template stay with their own SHA-256 and are never compared with r1. Several trials of one configuration are listed together with their mean on the Results screen.');
    g.region(cx, ny, cw, y - ny, 'Static', '#scope-note.notice');
    buttons(g, cx + cw, bottom - 1, [{ label: 'Open result', go: 'Results', focus: focus === 'open' }, { label: 'Import results', go: 'ResultImport' }, { label: 'Export result ZIP', go: 'ExportResult' }]);
  }

  if (st.toast) toast(g, '✓ Revision r2 approved', `sha256 ${s8(SHA.inv2)}… · r1 and its 12 results are unchanged.`);

  footer(g, compact
    ? [{ k: 'esc', d: 'Back', go: 'Library' }, { k: 'e', d: 'Revise', go: 'Revise' }, { k: 'x', d: 'Export', go: 'ExportTemplate' }, { k: 'enter', d: 'Configure', go: 'Setup' }, { k: 'r', d: 'Revisions' }]
    : [{ k: 'esc', d: 'Back', go: 'Library' }, { k: '1-4', d: 'Tab' }, { k: 'e', d: 'Revise', go: 'Revise' }, { k: 'd', d: 'Duplicate', go: 'Revise' }, { k: 'n', d: 'Rename', off: !r2 }, { k: 'x', d: 'Export', go: 'ExportTemplate' }, { k: 'enter', d: 'Configure', go: 'Setup' }, { k: 'c', d: 'Copy SHA' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- 3 · Create a template (ModalScreen over the library)

const EXPENSE = 'Build a small expense tracker for a two-person household: record expenses with category, amount, date and payer, show who owes whom, and export a monthly CSV summary. It must be usable on a phone.';
const BILLING = 'Refactor the billing service so every invoice is produced by one module with unit tests. Keep the public HTTP API and its responses unchanged.';

export function newTemplate(sz, focus = 'prompt', st = {}) {
  const g = library(sz, 'none');
  const repo = st.repo;
  const mh = repo ? 23 : 20, mw = sz.id === 'compact' ? 78 : 76;
  const m = modal(g, mw, mh, 'New benchmark template', { sel: '#new-template' });
  let y = m.y;
  g.text(m.x, y, 'Project prompt', 'bd'); g.text(m.x + 15, y++, fit('· describes the project, not the tasks', m.w - 15), 'mu');
  const th = repo ? 5 : 6, tf = focus === 'prompt';
  g.box(m.x, y, m.w, th, { f: tf ? 'ac' : 'ln', fill: 'B0' });
  const pl = wrap(repo ? BILLING : EXPENSE, m.w - 4);
  pl.slice(0, th - 2).forEach((l, i) => g.text(m.x + 2, y + 1 + i, l, '', { b: 'B0' }));
  if (tf) { const last = Math.min(pl.length, th - 2) - 1; const cx = m.x + 2 + len(pl[last]); g.text(cx, y + 1 + last, ' ', 'rv'); }
  g.region(m.x, y, m.w, th, 'TextArea', '#prompt');
  y += th;
  g.text(m.x, y, 'Type', 'mu'); radios(g, m.x + 10, y, ['Frontend', 'Backend', 'Fullstack'], repo ? 1 : 0, { focus: focus === 'type' });
  g.region(m.x + 10, y++, m.w - 10, 1, 'RadioSet', '#project-type');
  g.text(m.x, y, 'Start', 'mu'); radios(g, m.x + 10, y, ['Empty project', 'Existing Git repository'], repo ? 1 : 0, { focus: focus === 'start' });
  g.region(m.x + 10, y++, m.w - 10, 1, 'RadioSet', '#baseline-kind');
  y++;
  if (!repo) {
    g.text(m.x, y++, fit('● Baseline: an empty folder. Every configuration gets its own copy.', m.w), 'mu');
    y++;
    y = para(g, m.x, y, m.w, 'Next: plan seven tasks, acceptance checks and setup instructions with Claude Code · claude-opus-5-5 · high. You can change the planner, then review, edit or regenerate before approving.', 'mu');
  } else {
    const bad = repo === 'invalid';
    g.text(m.x, y, 'Repository', 'mu'); input(g, m.x + 12, y, m.w - 12, bad ? '~/Downloads/billing-export' : '~/code/acme-billing', { focus: focus === 'repo' });
    g.region(m.x + 12, y++, m.w - 12, 1, 'Input', '#repo-path');
    if (bad) { g.text(m.x + 12, y, '✗', 'bd'); g.text(m.x + 14, y++, fit('Not a Git repository. Choose a folder with committed history.', m.w - 14), 'bd'); }
    else { g.text(m.x + 12, y, '✓', 'ac'); g.text(m.x + 14, y++, fit('Git repository · branch main', m.w - 14), 'mu'); }
    g.text(m.x, y, 'Revision', 'mu'); input(g, m.x + 12, y, 20, bad ? '' : 'HEAD', { ph: 'HEAD', focus: focus === 'revision' });
    g.region(m.x + 12, y++, 20, 1, 'Input', '#revision');
    g.text(m.x + 12, y++, fit(bad ? '—' : '→ a41f9c2 “Add invoice PDF export” · 2026-09-30', m.w - 12), 'mu');
    y++;
    if (bad) y = para(g, m.x, y, m.w, 'Or start from an empty project. The selected folder is only read, never modified.', 'mu');
    else y = notice(g, m.x, y, m.w, 'warning', '3 uncommitted changes are excluded', 'The template snapshots committed revision a41f9c2. Your working tree and the repository are never modified.');
  }
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Library' }, { label: 'Continue to planning ▸', v: 'primary', go: repo === 'invalid' ? undefined : 'PlannerPicker', focus: focus === 'continue', off: repo === 'invalid' }]);
  g.region(m.x, m.bottom, m.w, 1, 'Horizontal', '.dialog-actions');
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Library' }, { k: 'tab', d: 'Next field', do: 'next' }, { k: '^s', d: 'Continue', off: repo === 'invalid' }], '');
  return g;
}

// ---------------------------------------------------------------- 4 · Duplicate and revise

export function revise(sz, focus = 'mode', st = {}) {
  const g = template(sz, 'none');
  const m = modal(g, sz.id === 'compact' ? 78 : 76, st.activeRun ? 25 : 20, 'Duplicate or revise', { sel: '#revise' });
  let y = m.y;
  g.text(m.x, y++, fit(`Inventory web app · r1 · ${s8(SHA.inv1)} · ★ built-in`, m.w), 'mu');
  y++;
  g.text(m.x, y++, 'Create', 'bd');
  const mf = focus === 'mode';
  g.text(m.x, y, fit('● New revision of this template', 38), mf ? 'bd' : '', mf ? { b: 'BT' } : {}); g.text(m.x + 40, y++, 'r2 · keeps lineage', 'mu');
  g.text(m.x, y, '○ Independent duplicate', 'mu'); g.text(m.x + 40, y++, 'new template · own lineage', 'mu');
  g.region(m.x, y - 2, m.w, 2, 'RadioSet', '#revise-mode');
  y++;
  g.text(m.x, y, 'Name', 'mu'); input(g, m.x + 10, y, m.w - 10, 'Inventory web app', { focus: focus === 'name' });
  g.region(m.x + 10, y++, m.w - 10, 1, 'Input', '#revise-name');
  y++;
  g.text(m.x, y, 'What will change', 'bd'); g.text(m.x + 17, y++, '· any of these creates a new SHA-256', 'mu');
  const cf = focus === 'changes';
  check(g, m.x, y, 'Task prompts and order', true, { focus: cf }); check(g, m.x + 30, y++, 'Acceptance checks', true);
  check(g, m.x, y, 'Baseline files', false); check(g, m.x + 30, y++, 'Grading rubric', false);
  g.region(m.x, y - 2, m.w, 2, 'Grid', '#revise-scope');
  y++;
  y = para(g, m.x, y, m.w, 'r1 stays approved and unchanged; its 3 configurations and 12 results stay with r1. Renaming alone never changes identity.', 'mu');
  if (st.activeRun) {
    const ny = y + 1;
    y = notice(g, m.x, ny, m.w, 'warning', 'Run 2026-10-01-a is active on r1',
      'This creates a new revision. The active run continues on r1, and its results will not be comparable with the new revision.');
    g.region(m.x, ny, m.w, y - ny, 'Static', '#revise-active-run.notice.-warning');
  }
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'TemplateTasks' }, { label: 'Open editor ▸', v: 'primary', go: 'ReviseConfirm', focus: focus === 'editor' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'TemplateTasks' }, { k: 'tab', d: 'Next field', do: 'next' }, { k: 'enter', d: 'Open editor', go: 'ReviseConfirm' }], '');
  return g;
}

export function reviseConfirm(sz, focus = 'approve', st = {}) {
  const g = template(sz, 'none');
  const compact = sz.id === 'compact', same = !!st.identical;
  const m = modal(g, compact ? 78 : 86, 19, same ? 'Approve revision · nothing changed' : 'Approve revision r2', { sel: '#approve-revision' });
  let y = m.y;
  g.text(m.x, y++, 'Changes from r1', 'bd');
  if (same) {
    g.text(m.x, y, '= same', 'mu'); g.text(m.x + 10, y++, fit('tasks, order, checks, spec, baseline, protocol, rubric', m.w - 10), 'mu');
    g.text(m.x, y, '~ edited', ''); g.text(m.x + 10, y++, fit('T4 ↔ T5 swapped, then swapped back · net change none', m.w - 10));
    y++;
  } else {
    g.text(m.x, y, '~ order', ''); g.text(m.x + 10, y++, fit('T4 Inventory lookup ↔ T5 Shopping cart', m.w - 10));
    g.text(m.x, y, '+ check', ''); g.text(m.x + 10, y++, fit('T6.4 Order history survives a page reload', m.w - 10));
    g.text(m.x, y, '= same', 'mu'); g.text(m.x + 10, y++, fit('specification, prompt text, baseline, protocol, rubric', m.w - 10), 'mu');
  }
  g.region(m.x, m.y + 1, m.w, 3, 'Static', '#revision-diff');
  y++;
  g.text(m.x, y++, 'Identity', 'bd');
  g.text(m.x, y, 'r1', 'mu'); g.text(m.x + 4, y++, SHA.inv1, 'mu');
  g.text(m.x, y, same ? 'new' : 'r2', 'bd'); g.text(m.x + 4, y++, same ? SHA.inv1 : SHA.inv2, 'bd');
  g.region(m.x, y - 2, m.w, 2, 'Static', '#revision-digests');
  if (same) {
    const ny = ++y;
    y = notice(g, m.x, y, m.w, 'error', 'Identical to r1 — nothing to approve',
      'The computed SHA-256 equals r1, so no revision is created. To change only the name, rename the lineage display name (n on the revision); identity is unaffected.');
    g.region(m.x, ny, m.w, y - ny, 'Static', '#revision-verdict.notice.-error');
    buttons(g, m.right, m.bottom, [{ label: 'Back to editor', go: 'Revise', focus: focus === 'back' }, { label: 'Open r1', go: 'TemplateTasks', focus: focus === 'open' }, { label: 'Approve', v: 'primary', off: true }]);
    footer(g, [{ k: 'esc', d: 'Back', go: 'Revise' }, { k: 'o', d: 'Open r1', go: 'TemplateTasks' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Approve', off: true }], '');
    return g;
  }
  g.text(m.x, y, '✓', 'ac');
  y = para(g, m.x + 2, y, m.w - 2, 'Content differs, so r2 gets a new SHA-256. r1 and its 12 results are untouched.');
  g.region(m.x, y - 1, m.w, 1, 'Static', '#revision-verdict');
  y++;
  check(g, m.x, y++, 'Copy 3 saved configurations to r2', false, { focus: focus === 'copy' });
  g.region(m.x, y - 1, m.w, 1, 'Checkbox', '#copy-configs');
  y = para(g, m.x + 2, y, m.w - 2, 'Copies become new configurations of r2; r1 keeps its own.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Back to editor', go: 'Revise' }, { label: 'Approve r2', v: 'primary', go: 'RevisionSaved', focus: focus === 'approve' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'Revise' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Approve', go: 'RevisionSaved' }], '');
  return g;
}

// ---------------------------------------------------------------- 5 · Exchange templates

export function exportTemplate(sz, focus = 'destination') {
  const g = library(sz, 'none');
  const m = modal(g, sz.id === 'compact' ? 78 : 84, 23, 'Export template', { sel: '#export' });
  let y = m.y;
  g.text(m.x, y++, 'Inventory web app · r1', 'bd');
  g.text(m.x, y, 'sha256', 'mu'); g.text(m.x + 7, y++, fit(SHA.inv1, m.w - 7));
  y++;
  g.text(m.x, y, 'Save as', 'mu'); input(g, m.x + 9, y, m.w - 9, `~/Desktop/inventory-web-app-r1-${s8(SHA.inv1)}.zip`, { focus: focus === 'destination' });
  g.region(m.x + 9, y++, m.w - 9, 1, 'Input', '#export-path');
  y++;
  g.text(m.x, y++, 'Package contents', 'bd');
  const items = [
    ['✓', 'Manifest axbenchmark-manifest/1 · 15 entries · recomputed before packing'],
    ['✓', 'Specification and 7 ordered task prompts'],
    ['✓', 'Baseline · empty project'],
    ['✓', '21 acceptance checks · execution protocol · setup, start and stop'],
    ['✓', 'Web grading rubric v1'],
    ['✓', 'Declared dependencies · Python 3.12, Playwright for Python'],
    ['✗', 'Excluded: installed dependency folders, credentials, local absolute paths'],
  ];
  items.forEach(([gl, t]) => { g.text(m.x, y, gl, gl === '✓' ? 'ac' : 'mu'); g.text(m.x + 2, y++, fit(t, m.w - 2), gl === '✓' ? '' : 'mu'); });
  g.region(m.x, y - 7, m.w, 7, 'Static', '#export-contents');
  y++;
  para(g, m.x, y, m.w, 'Saved configurations and results are not part of a template ZIP. To share a run, use Results › Export result ZIP.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Library' }, { label: 'Export ZIP', v: 'primary', focus: focus === 'export' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Export' }], '');
  return g;
}

export function importTemplate(sz, focus = 'files') {
  const g = library(sz, 'none');
  const m = modal(g, sz.id === 'compact' ? 78 : 80, 21, 'Import template', { sel: '#import' });
  let y = m.y;
  g.text(m.x, y, 'ZIP file', 'mu'); input(g, m.x + 10, y, m.w - 10, '~/Downloads/kanban-board-e0b6f2d9.zip', { focus: focus === 'path' });
  g.region(m.x + 10, y++, m.w - 10, 1, 'Input', '#zip-path');
  y++;
  const tf = focus === 'files';
  g.box(m.x, y, m.w, 9, { f: tf ? 'ac' : 'ln', fill: 'B0' });
  const w = m.w - 4;
  const row = (name, note) => fit(name, w - 14 - 3) + fit(note, 14, 'right');
  tree(g, m.x + 2, y + 1, w, [
    { t: '~/Downloads', depth: 0, kids: true, open: true, f: 'bd' },
    { t: 'screenshots/', depth: 1, kids: true, f: 'mu' },
    { t: row('inventory-results-lab-4090.zip', 'result ZIP'), depth: 1, f: 'mu' },
    { t: row('kanban-board-e0b6f2d9.zip', '1.8 MB'), depth: 1, sel: true },
    { t: row('recipe-planner-r2.zip', '2.4 MB'), depth: 1 },
    { t: 'notes.txt', depth: 1, last: true, f: 'mu' },
  ], { focused: tf });
  g.region(m.x, y, m.w, 9, 'DirectoryTree', '#zip-browser');
  y += 10;
  para(g, m.x, y, m.w, 'Importing is a data operation: it never runs scripts, installs dependencies or calls a model. The SHA-256 is recomputed from the extracted files before anything is added.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Library' }, { label: 'Validate and import', v: 'primary', go: 'ImportVerifying', focus: focus === 'import' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'enter', d: 'Validate', go: 'ImportVerifying' }], '');
  return g;
}

export const step = (g, x, y, w, state, text) => {
  const gl = { done: '✓', now: '●', todo: '○', fail: '✗' }[state];
  g.text(x, y, gl, state === 'done' || state === 'now' ? 'ac' : state === 'fail' ? 'bd' : 'mu');
  g.text(x + 2, y, fit(text, w - 2), state === 'now' || state === 'fail' ? 'bd' : state === 'todo' ? 'mu' : '');
};

export function importVerifying(sz) {
  const g = library(sz, 'none');
  const m = modal(g, sz.id === 'compact' ? 78 : 80, 18, 'Import template · validating', { sel: '#import' });
  let y = m.y;
  g.text(m.x, y++, 'kanban-board-e0b6f2d9.zip · 1.8 MB', 'bd');
  y++;
  step(g, m.x, y++, m.w, 'done', 'Archive paths are relative; no links or escaping entries · 38 files');
  step(g, m.x, y++, m.w, 'done', 'Bounded extraction · 6.4 MB uncompressed, within limits');
  step(g, m.x, y++, m.w, 'done', 'Manifest format axbenchmark-manifest/1 is supported');
  step(g, m.x, y++, m.w, 'now', 'Recomputing SHA-256 from the extracted files · 27 of 38');
  progress(g, m.x + 2, y++, m.w - 2, 71);
  step(g, m.x, y++, m.w, 'todo', 'Compare with the declared template hash');
  step(g, m.x, y++, m.w, 'todo', 'Register as a library revision');
  g.region(m.x, m.y + 2, m.w, 7, 'Vertical', '#import-steps');
  g.region(m.x + 2, m.y + 6, m.w - 2, 1, 'ProgressBar', '#import-progress');
  y++;
  g.text(m.x, y, fit('Nothing is added to the library until every step passes.', m.w), 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Library', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Cancel import', go: 'Library' }], '');
  return g;
}

export function importRejected(sz, focus = 'close') {
  const g = library(sz, 'none');
  const compact = sz.id === 'compact';
  const m = modal(g, compact ? 78 : 86, compact ? 17 : 15, 'Template not imported', { sel: '#import' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'SHA-256 mismatch — nothing was added to the library', null);
  g.region(m.x, m.y, m.w, 1, 'Static', '.notice.-error');
  y++;
  const pair = (label, value, f) => {
    if (compact) { g.text(m.x, y++, label, 'mu'); g.text(m.x, y++, value, f); }
    else { g.text(m.x, y, label, 'mu'); g.text(m.x + 10, y++, value, f); }
  };
  pair('Declared', SHA.kanban, '');
  pair('Computed', SHA.kanbanComputed, 'bd');
  g.text(m.x, y, 'Differs', 'mu'); g.text(m.x + (compact ? 10 : 10), y++, fit('tasks/T3-board.md · digest differs from its manifest entry', m.w - 10));
  g.region(m.x, m.y + 2, m.w, y - m.y - 2, 'Vertical', '#rejection-detail › #digest-detail');
  y++;
  para(g, m.x, y, m.w, 'The package is corrupt or was edited after export. The library is unchanged. Ask the sender to export the template again, then retry.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Show file digests', focus: focus === 'digests' }, { label: 'Close', v: 'primary', go: 'Library', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

export function importDuplicate(sz) {
  const g = library(sz, 'none');
  const m = modal(g, 72, 13, 'Already in the library', { sel: '#import' });
  let y = m.y;
  g.text(m.x, y, '✓', 'ac'); g.text(m.x + 2, y++, fit(`Kanban board · r1 · ${s8(SHA.kanban)} is already registered.`, m.w - 2), 'bd');
  y++;
  y = kv(g, m.x, y, 12, m.w, [['Imported', '2026-09-24 from lab-linux-4090'], ['Results', '3 linked · unchanged'], ['This import', 'identical content · nothing added']]);
  y++;
  para(g, m.x, y, m.w, 'Re-importing the same template is safe and never creates a duplicate.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open template', go: 'TemplateTasks' }, { label: 'Close', v: 'primary', go: 'Library', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'o', d: 'Open template', go: 'TemplateTasks' }], '');
  return g;
}

// ---------------------------------------------------------------- 6 · Launch identity check

export function launchCheck(sz) {
  const g = template(sz, 'none');
  const m = modal(g, sz.id === 'compact' ? 78 : 86, 18, 'Before launch · freeze inputs', { sel: '#launch-check' });
  let y = kv(g, m.x, m.y, 12, m.w, [['Template', 'Inventory web app · r1'], ['Run config', 'Four harnesses · defaults · 4 entries']]);
  y++;
  step(g, m.x, y++, m.w, 'done', 'Recomputed template SHA-256 matches approved r1');
  g.text(m.x + 2, y++, fit(SHA.inv1, m.w - 2), 'mu');
  step(g, m.x, y++, m.w, 'done', `Run configuration frozen separately · cfg ${s8(SHA.cfg)}`);
  step(g, m.x, y++, m.w, 'now', 'Freezing original weights · quality web v1 · ranking 1:1:1');
  progress(g, m.x + 2, y++, m.w - 2, 60);
  step(g, m.x, y++, m.w, 'todo', `Bind every result of this run to ${s8(SHA.inv1)}`);
  g.region(m.x, m.y + 3, m.w, 6, 'Vertical', '#launch-steps');
  y++;
  para(g, m.x, y, m.w, 'Every configuration receives the same frozen task suite and grading profile. Prompts, models and original weights cannot change once the run starts.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'TemplateTasks', focus: true }, { label: 'Launch', v: 'primary', off: true }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'TemplateTasks' }], '');
  return g;
}

export function launchMismatch(sz, focus = 'save') {
  const g = template(sz, 'none');
  const compact = sz.id === 'compact';
  const m = modal(g, compact ? 78 : 86, compact ? 17 : 15, 'Launch blocked', { sel: '#launch-check' });
  let y = notice(g, m.x, m.y, m.w, 'error', 'Template inputs changed since r1 was approved', null);
  y++;
  const pair = (label, value, f) => {
    if (compact) { g.text(m.x, y++, label, 'mu'); g.text(m.x, y++, value, f); }
    else { g.text(m.x, y, label, 'mu'); g.text(m.x + 10, y++, value, f); }
  };
  pair('Approved', SHA.inv1, '');
  pair('Computed', SHA.changed, 'bd');
  g.text(m.x, y, 'Changed', 'mu'); g.text(m.x + 10, y++, fit('tasks/T2-data.md · modified on disk 2026-10-01 21:12', m.w - 10));
  g.region(m.x, m.y + 2, m.w, y - m.y - 2, 'Static', '#launch-digests');
  y++;
  para(g, m.x, y, m.w, 'Nothing was launched. A run whose inputs changed cannot claim r1, and AxBenchmark never relabels it with another identity.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'TemplateTasks', focus: focus === 'cancel' }, { label: 'Restore r1 files', focus: focus === 'restore' }, { label: 'Save as new revision…', v: 'primary', go: 'Revise', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'TemplateTasks' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- Command palette (Textual built-in, ctrl+p)

export function commandPalette(sz) {
  const g = library(sz, 'none');
  g.dim();
  const w = sz.id === 'compact' ? 76 : 96, x = Math.floor((g.w - w) / 2), y = 1, h = 14;
  g.box(x, y, w, h, { f: 'ac', fill: 'B1' });
  g.text(x + 2, y + 1, '>', 'ac bd');
  input(g, x + 4, y + 1, w - 6, 'rev', { focus: true });
  g.hline(x + 1, y + 2, w - 2, 'ln');
  const items = [
    ['Revise template…', 'Duplicate or edit Inventory web app into a new revision', 'Revise'],
    ['Show revisions', 'Open the revision tree of the selected template', 'TemplateTasks'],
    ['Reconnect to run', '2026-10-01-a · 3/4 configurations running', null],
    ['Recheck environment', 'Detect harnesses, runtimes and collectors again', 'Environment'],
    ['Export template revision…', 'Write a portable ZIP with the frozen definition', 'ExportTemplate'],
  ];
  items.forEach(([t, help, go], i) => {
    const yy = y + 3 + i * 2, on = i === 0;
    g.fill(x + 1, yy, w - 2, 2, on ? 'BA' : 'B1');
    g.text(x + 3, yy, t, on ? 'on bd' : 'bd');
    const hit = t.toLowerCase().indexOf('re') === 0 ? 2 : t.toLowerCase().indexOf('rev') >= 0 ? 0 : 0;
    if (t.startsWith('Revise')) g.text(x + 3, yy, 'Rev', on ? 'on bd ul' : 'ac bd ul');
    else if (hit) g.text(x + 3, yy, t.slice(0, 2), on ? 'on bd ul' : 'ac bd ul');
    g.text(x + 3, yy + 1, fit(help, w - 6), on ? 'on' : 'mu');
    if (go) g.link(x + 1, yy, w - 2, 2, 'go:' + go);
  });
  g.region(x, y, w, h, 'CommandPalette', '');
  footer(g, [{ k: '↑↓', d: 'Move' }, { k: 'enter', d: 'Run', go: 'Revise' }, { k: 'esc', d: 'Close', go: 'Library' }], '');
  return g;
}

// ---------------------------------------------------------------- Widget states (empty · loading · error), drawn at panel size

const MINI = { w: 56, h: 8 };
const miniCols = [{ l: 'Name', w: 24 }, { l: 'Type', w: 10 }, { l: 'Tasks', w: 6, al: 'right' }, { l: 'SHA-256', w: 12 }];
const mini = (title, body) => {
  const g = new Grid(MINI.w, MINI.h);
  g.box(0, 0, MINI.w, MINI.h, { title, f: 'ln' });
  body(g, 2, 1, MINI.w - 4);
  return g;
};
const centered = (g, y, t, f = '') => g.text(Math.floor((g.w - len(t)) / 2), y, fit(t, g.w - 4), f);

export const WIDGET_STATES = [
  { widget: 'DataTable#templates', label: 'Library templates', states: [
    ['Loading', mini('Library · … templates', (g, x, y, w) => { table(g, x, y, w, miniCols, []); loading(g, x, y + 2, w, 'Reading library…'); })],
    ['Empty', mini('Library · 0 of 6 templates', (g, x, y, w) => { table(g, x, y, w, miniCols, []); centered(g, y + 2, 'No templates match “graphql”', 'bd'); centered(g, y + 3, 'esc clear filter · n create a template', 'mu'); })],
    ['Error', mini('Library', (g, x, y, w) => { const yy = notice(g, x, y, w, 'error', 'Library index could not be read', 'Permission denied: ~/.axbenchmark/library/index.yaml'); button(g, x + 2, yy + 1, 'Retry', { focus: true }); })],
  ] },
  { widget: 'Tree#revisions', label: 'Revision lineage', states: [
    ['Loading', mini('Revisions', (g, x, y, w) => loading(g, x, y + 1, w, 'Loading lineage…'))],
    ['Empty', mini('Revisions', (g, x, y, w) => { tree(g, x, y, w, [{ t: 'Kanban board', depth: 0, kids: true, open: true, f: 'bd' }, { t: `r1 imported    ${s8(SHA.kanban)}`, depth: 1, last: true, sel: true }], { focused: false }); para(g, x, y + 3, w, 'Only r1 so far. e Revise creates r2; r1 is never modified.', 'mu'); })],
    ['Error', mini('Revisions', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Lineage record missing', 'Revisions are still listed by SHA-256; parent links are unknown. Identity is unaffected.'); })],
  ] },
  { widget: 'DataTable#tasks', label: 'Ordered tasks', states: [
    ['Loading', mini('Ordered tasks', (g, x, y, w) => loading(g, x, y + 1, w, 'Reading frozen task prompts…'))],
    ['Empty', mini('Ordered tasks', (g, x, y, w) => { centered(g, y + 1, 'This draft has no approved tasks yet', 'bd'); centered(g, y + 2, 'Plan and approve them before the first run', 'mu'); centered(g, y + 4, 'p Plan tasks', 'ac'); })],
    ['Error', mini('Ordered tasks', (g, x, y, w) => { notice(g, x, y, w, 'error', 'tasks/T3-management.md is missing', 'The revision fails its integrity check and cannot run. Restore it from the library package or a template ZIP.'); })],
  ] },
  { widget: 'DataTable#manifest', label: 'Identity manifest', states: [
    ['Loading', mini('Covered by the hash', (g, x, y, w) => { g.text(x, y + 1, 'Recomputing SHA-256 · 9 of 15 files', 'bd'); progress(g, x, y + 2, w, 60); g.text(x, y + 4, fit('Runs and exports wait for the result.', w), 'mu'); })],
    ['Empty', mini('Covered by the hash', (g, x, y, w) => { centered(g, y + 1, 'No identity yet', 'bd'); para(g, x + 2, y + 2, w - 4, 'Draft templates get a manifest and SHA-256 when you approve them.', 'mu'); })],
    ['Error', mini('Covered by the hash', (g, x, y, w) => { notice(g, x, y, w, 'error', 'Digest mismatch · tasks/T2-data.md', 'Recomputed content differs from the approved manifest. Launch and export are blocked.'); })],
  ] },
  { widget: 'DataTable#configs', label: 'Saved configurations', states: [
    ['Loading', mini('Saved for r1', (g, x, y, w) => loading(g, x, y + 1, w, 'Reading saved configurations…'))],
    ['Empty', mini('Saved for r2', (g, x, y, w) => { centered(g, y + 1, 'No saved configurations for r2', 'bd'); centered(g, y + 2, 'They are saved per revision; r1 keeps its 3.', 'mu'); centered(g, y + 4, 'n New configuration · c Copy from r1', 'ac'); })],
    ['Error', mini('Saved for r1', (g, x, y, w) => { notice(g, x, y, w, 'error', 'configs/r1.yaml is not valid YAML', 'Line 14: mapping values are not allowed here. The file was left untouched; fix it or create a new configuration.'); })],
  ] },
  { widget: 'DataTable#results', label: 'Results for the revision', states: [
    ['Loading', mini('Runs', (g, x, y, w) => loading(g, x, y + 1, w, 'Reading retained results…'))],
    ['Empty', mini('Runs', (g, x, y, w) => { centered(g, y + 1, 'No results for r2 yet', 'bd'); centered(g, y + 2, 'Results bind to the exact revision they ran.', 'mu'); centered(g, y + 4, 'enter Configure run · i Import results', 'ac'); })],
    ['Error', mini('Runs', (g, x, y, w) => { const yy = notice(g, x, y, w, 'error', 'Results index could not be read', 'Disk read failed: ~/.axbenchmark/results/index.yaml'); button(g, x + 2, yy + 1, 'Retry', { focus: true }); })],
  ] },
];
