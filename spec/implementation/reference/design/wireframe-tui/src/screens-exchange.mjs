// M17 · Portable ZIP exchange and validation.
// The M01/M02 frames already show export, the happy-path import, digest mismatch, duplicates and result-id conflicts.
// This file adds the validation order itself: an unsafe package, an incomplete package, what a result ZIP carries
// (with provenance through a relay machine), and a result ZIP whose template differs from the selected revision.
import { fit, len, footer, table, buttons, para, kv, notice, modal, tree, radios, sha, input } from './lib.mjs';
import { SHA, s8, mid, library, step } from './screens.mjs';
import { results } from './screens-results.mjs';

const VARIANT = '7d2e4a10' + sha('axbenchmark/template/inventory-web-app/lab-variant').slice(8);
const STEPS = ['Safe package boundary', 'Template definition', 'Result compatibility', 'Existing identities', 'Register'];

// The five ordered validation steps; `at` is where it stopped, `kind` the outcome of that step.
function order(g, m, y, at, kind, skip = []) {
  STEPS.forEach((t, i) => {
    const st = i < at ? 'done' : i === at ? kind : 'todo';
    step(g, m.x, y + i, m.w, skip.includes(i) && st !== kind ? 'todo' : st, `${i + 1} · ${t}${skip.includes(i) ? ' · not for a template ZIP' : i > at ? ' · not reached' : ''}`);
  });
  g.region(m.x, y, m.w, 5, 'Vertical', '#validation-order');
  return y + 5;
}

// ---------------------------------------------------------------- unsafe package (over Library)

export function importUnsafe(sz, focus = 'close') {
  const g = library(sz, 'none');
  const m = modal(g, 86, 24, 'Template not imported · unsafe package', { sel: '#import' });
  let y = order(g, m, m.y, 0, 'fail', [2]);
  y++;
  table(g, m.x, y, m.w, [{ l: 'Entry', w: 36 }, { l: 'Problem', w: m.w - 36 }], [
    { v: ['../../.ssh/authorized_keys', { t: '✗ path escapes the package', f: 'bd' }] },
    { v: ['baseline/config → /etc', { t: '✗ symbolic link · links are refused', f: 'bd' }] },
    { v: ['baseline/fixtures/data.bin', { t: '✗ 2.1 KB → 4.1 GB unpacked · over bound', f: 'bd' }] },
  ], { cursor: 0, focused: focus === 'entries' });
  g.region(m.x, y, m.w, 4, 'DataTable', '#unsafe-entries');
  y += 5;
  y = kv(g, m.x, y, 12, m.w, [
    ['Extracted', 'nothing · checked from the archive index before extraction'],
    ['Library', 'unchanged · no partial template, no temporary files left'],
    ['Ran', 'nothing · no scripts, installs or model calls'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'This is not an AxBenchmark export. Ask the sender to export the template again from AxBenchmark (x in the Library, or axbenchmark templates export).', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', go: 'Library', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }], '');
  return g;
}

// ---------------------------------------------------------------- incomplete package

export function importIncomplete(sz, focus = 'close') {
  const g = library(sz, 'none');
  const m = modal(g, 86, 25, 'Template not imported · incomplete package', { sel: '#import' });
  let y = order(g, m, m.y, 1, 'fail', [2]);
  y++;
  table(g, m.x, y, m.w, [{ l: 'Required content', w: 30 }, { l: 'In recipe-planner-r2.zip', w: m.w - 30 }], [
    { v: ['Manifest', '✓ format v1 · supported'] },
    { v: ['Specification', '✓ spec/00-project.md'] },
    { v: ['Task prompts · ordered', '✓ 5 · T1–T5'] },
    { v: ['Acceptance checks', { t: '✗ checks/acceptance.v1.json listed, missing', f: 'bd' }] },
    { v: ['Setup · start · stop', '✓ protocol/services.yaml'] },
    { v: ['Execution protocol · rubric', '✓ both present'] },
    { v: ['Baseline', { t: '✗ manifest lists 41 files, archive has 0', f: 'bd' }] },
  ], { cursor: 3, focused: focus === 'table' });
  g.region(m.x, y, m.w, 8, 'DataTable', '#completeness');
  y += 9;
  para(g, m.x, y, m.w, 'The SHA-256 was not computed: an incomplete definition has no identity to compare. Nothing was added. Ask for a complete export of Recipe planner PWA r2; the copy in your library is unaffected.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Copy report' }, { label: 'Close', v: 'primary', go: 'Library', focus: focus === 'close' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Library' }, { k: 'c', d: 'Copy report' }], '');
  return g;
}

// ---------------------------------------------------------------- choose a result ZIP (over Results) · W3
// Same picker as the template import (M01): Input #zip-path above DirectoryTree #zip-browser.

export function resultPackagePick(sz, focus = 'files') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 23, 'Import results · choose a ZIP', { sel: '#result-package' });
  let y = m.y;
  g.text(m.x, y, 'ZIP file', 'mu'); input(g, m.x + 10, y, m.w - 10, '~/bench/lab-results.zip', { focus: focus === 'path' });
  g.region(m.x + 10, y++, m.w - 10, 1, 'Input', '#zip-path');
  y++;
  const tf = focus === 'files';
  g.box(m.x, y, m.w, 10, { f: tf ? 'ac' : 'ln', fill: 'B0' });
  const w = m.w - 4;
  const row = (name, note) => fit(name, w - 22 - 3) + fit(note, 22, 'right');
  tree(g, m.x + 2, y + 1, w, [
    { t: '~/bench', depth: 0, kids: true, open: true, f: 'bd' },
    { t: 'runs/', depth: 1, kids: true, f: 'mu' },
    { t: row('bench-draft.yaml', 'configuration'), depth: 1, f: 'mu' },
    { t: row('benchmark.yaml', 'configuration'), depth: 1, f: 'mu' },
    { t: row('lab-results.zip', 'result ZIP · 48.2 MB'), depth: 1, sel: true },
    { t: row('results.zip', 'result ZIP · 31.7 MB'), depth: 1 },
    { t: row('template.zip', 'template ZIP · M01'), depth: 1, f: 'mu' },
    { t: row('nightly.yaml', 'configuration'), depth: 1, last: true, f: 'mu' },
  ], { focused: tf });
  g.region(m.x, y, m.w, 10, 'DirectoryTree', '#zip-browser');
  y += 11;
  para(g, m.x, y, m.w, 'Choosing a file reads only its index and manifest, to show what it carries before anything is validated. A template ZIP here is refused with a pointer to Library › Import.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }, { label: 'Inspect package ▸', v: 'primary', go: 'ResultPackage', focus: focus === 'inspect' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }, { k: 'enter', d: 'Inspect', go: 'ResultPackage' }], '');
  return g;
}

// ---------------------------------------------------------------- what a result ZIP carries (over Results)

export function resultPackage(sz, focus = 'tree') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 27, 'Result package · lab-results.zip', { sel: '#result-package' });
  let y = m.y;
  const tf = focus === 'tree';
  const row = (a, b) => fit(a, 38) + fit(b, m.w - 46);
  tree(g, m.x, y, m.w, [
    { t: row('manifest.json', 'format v1 · payload digests'), depth: 0, f: 'bd' },
    { t: row('template/', `Inventory web app r1 · ${s8(SHA.inv1)}`), depth: 0, kids: true },
    { t: row('results/R-0924lab-1…3/', '3 results · run 2026-09-24-lab'), depth: 0, kids: true, open: true, sel: true },
    { t: row('records · configuration · weights', 'original weights, judge B metadata'), depth: 1 },
    { t: row('prices · rates · billing', 'frozen at launch · display USD'), depth: 1 },
    { t: row('machine · harness versions · times', 'lab-linux-4090 · Ubuntu 24.04'), depth: 1 },
    { t: row('outcomes · measurements · coverage', 'process, checks, tokens, cost'), depth: 1 },
    { t: row('reviews · grades · evidence', 'raw grades, 42 screenshots'), depth: 1 },
    { t: row('snapshots · telemetry', 'T1–T7 per result · actual intervals'), depth: 1, last: true },
    { t: row('results/R-0919lab-1/', '1 result · run 2026-09-19-lab'), depth: 0, kids: true, last: true },
  ], { focused: tf });
  g.region(m.x, y, m.w, 10, 'Tree', '#package-tree');
  y += 11;
  g.text(m.x, y++, 'Provenance · kept through every relay', 'bd');
  table(g, m.x, y, m.w, [{ l: 'Result', w: 13 }, { l: 'Origin', w: 18 }, { l: 'Relayed by', w: 18 }, { l: 'Source id', w: m.w - 49 }], [
    { v: ['R-0924lab-1', 'lab-linux-4090', 'ci-mini-01', 'R-0924lab-1 · unchanged'] },
    { v: ['R-0919lab-1', 'lab-linux-4090', '—', 'R-0919lab-1 · unchanged'] },
  ], { cursor: -1 });
  g.region(m.x, y, m.w, 3, 'DataTable', '#provenance');
  y += 4;
  y = kv(g, m.x, y, 12, m.w, [
    ['Not inside', 'credentials, .venv / node_modules, unrelated files'],
    ['Origin', 'a relay never replaces the machine that ran the result'],
  ]);
  para(g, m.x, y + 1, m.w, 'Inspecting reads the archive index and manifest only. Validation runs when you import.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Other ZIP…', go: 'ResultPackagePick' }, { label: 'Cancel', go: 'Results' }, { label: 'Validate and import', v: 'primary', go: 'ResultImport', focus: focus === 'import' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'enter', d: 'Import', go: 'ResultImport' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

// ---------------------------------------------------------------- template mismatch (over Results)

export function resultMismatch(sz, focus = 'choice') {
  const g = results(sz, 'none');
  const m = modal(g, 86, 25, 'Results not added · different template', { sel: '#result-mismatch' });
  let y = order(g, m, m.y, 2, 'fail');
  y++;
  const pair = (label, value, f, note) => { g.text(m.x, y, label, 'mu'); g.text(m.x + 10, y++, value, f); if (note) g.text(m.x + 10, y++, fit(note, m.w - 10), 'mu'); };
  pair('Expected', SHA.inv1, '', 'Inventory web app r1 · selected here · recomputed locally');
  pair('Received', VARIANT, 'bd', 'embedded template, recomputed · equals the package’s declared hash');
  g.text(m.x, y, 'Differs', 'mu'); g.text(m.x + 10, y++, fit('tasks/T5-cart.md · rubric/web.v1.yaml', m.w - 10));
  g.region(m.x, m.y + 6, m.w, y - m.y - 6, 'Static', '#identities');
  y++;
  g.text(m.x, y++, 'Choose how to continue', 'bd');
  const cf = focus === 'choice';
  [['● Import the embedded template as its own revision, then add the 2 results to it', true], ['○ Cancel · nothing is added', false]].forEach(([t, on]) => g.text(m.x, y++, fit(t, m.w), on ? (cf ? 'bd' : '') : 'mu', on && cf ? { b: 'BT' } : {}));
  g.region(m.x, y - 2, m.w, 2, 'RadioSet', '#mismatch-choice');
  y++;
  para(g, m.x, y, m.w, 'r1 and its 12 results stay as they are. Different templates are never merged or overwritten, and the new revision’s results are compared only with each other.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }, { label: 'Continue', v: 'primary', go: 'ResultEmbedded', focus: focus === 'go' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }], '');
  return g;
}

export function resultEmbedded(sz) {
  const g = results(sz, 'none');
  const m = modal(g, 86, 19, 'Imported as a separate revision', { sel: '#result-embedded' });
  let y = m.y;
  step(g, m.x, y++, m.w, 'done', '1 · Safe package boundary');
  step(g, m.x, y++, m.w, 'done', `2 · Embedded template complete · recomputed ${s8(VARIANT)} = declared`);
  step(g, m.x, y++, m.w, 'done', '3 · Results reference it · task ids T1–T7 · payload digests match');
  step(g, m.x, y++, m.w, 'done', '4 · New template identity · no result id reused');
  step(g, m.x, y++, m.w, 'done', '5 · Registered together · template and 2 results in one step');
  g.region(m.x, m.y, m.w, 5, 'Vertical', '#validation-order');
  y++;
  y = kv(g, m.x, y, 12, m.w, [
    ['Library', `↓ Inventory web app · imported revision · ${s8(VARIANT)}`],
    ['Results', '2 · lab-linux-4090 · judge B · compared only with each other'],
    ['r1', `unchanged · ${s8(SHA.inv1)} · 12 results`],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Importing did not run the benchmark or a judge. Running or re-reviewing this revision is a separate, explicit action.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Open revision', go: 'TemplateTasks' }, { label: 'Close', v: 'primary', go: 'Results', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Results' }, { k: 'o', d: 'Open revision', go: 'TemplateTasks' }], '');
  return g;
}
