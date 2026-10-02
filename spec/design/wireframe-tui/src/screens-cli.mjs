// M14 · Command-line and unattended access.
// Plain terminal output, drawn on the same character grid: no Textual header or footer. Every command delegates to
// the same contracts as the TUI (M07 validation, M11 lifecycle, M03 readiness, M04 catalog, M13 report, M17 ZIPs).
// Runs, results and versions match the TUI frames. All data is fictional.
import { Grid, fit, len } from './lib.mjs';
import { SHA, s8 } from './screens.mjs';

// Shell writer: $ prompt + bold command, then output lines. Glyph-led lines get the same emphasis as in the TUI.
function shell(sz, title) {
  const g = new Grid(sz.cols, sz.rows), W = g.w;
  g.fill(0, 0, W, 1, 'B2');
  g.text(Math.floor((W - len(title)) / 2), 0, title, 'mu', { b: 'B2' });
  let y = 1;
  const api = {
    g,
    get y() { return y; },
    gap() { y++; },
    cmd(c, go) { g.text(1, y, '$', 'mu'); g.text(3, y, fit(c, W - 4), 'bd'); if (go) g.link(3, y, Math.min(len(c), W - 4), 1, 'go:' + go); y++; },
    out(t, f = '', o = {}) {
      const s = fit(t, W - 2 - (o.x ?? 0));
      const lead = s.trimStart()[0];
      const ff = f || (lead === '✗' ? 'bd' : lead === '▲' ? 'bd' : '');
      g.text(1 + (o.x ?? 0), y, s, ff);
      if (lead === '✓' || lead === '●') { const i = s.indexOf(lead); g.text(1 + (o.x ?? 0) + i, y, lead, 'ac'); }
      if (o.go) g.link(1, y, W - 2, 1, 'go:' + o.go);
      y++;
    },
    cols(cells, widths, f = '') { let x = 1; cells.forEach((c, i) => { g.text(x, y, fit(c, widths[i] - 1), typeof f === 'function' ? f(i, c) : f); x += widths[i]; }); y++; },
    cursor() { g.text(1, y, '$', 'mu'); g.text(3, y, ' ', 'rv'); },
  };
  return api;
}

const TITLE = 'zsh — mike@mike-mbp-m4: ~/bench';

// ---------------------------------------------------------------- --help · the twelve signatures

export function cliHelp(sz) {
  const s = shell(sz, TITLE);
  s.cmd('axbenchmark --help');
  s.out('AxBenchmark · benchmark AI coding harnesses on approved templates. Without a command it opens the terminal UI.');
  s.gap();
  s.out('Usage', 'bd');
  const W = [70, sz.cols - 72];
  s.cols(['  Command', 'Does'], W, 'mu');
  [
    ['axbenchmark', 'open the TUI · library, setup, readiness', 'Library'],
    ['axbenchmark --attach RUN_ID', 'observe a running run · never restarts tasks', 'RunReattached'],
    ['axbenchmark run --config benchmark.yaml --no-tui', 'validate, freeze, run unattended · plain output', 'CliRun'],
    ['axbenchmark status RUN_ID', 'saved status and failures · no TUI needed', 'CliStatusStop'],
    ['axbenchmark stop RUN_ID', 'stop and clean up processes and services', 'CliStatusStop'],
    ['axbenchmark models refresh', 'discover models · keeps the last valid catalog', 'CliDoctor'],
    ['axbenchmark doctor', 'check prerequisites · actionable guidance', 'CliDoctor'],
    ['axbenchmark report RUN_DIR', 'regenerate the offline report · no model calls', 'CliExchange'],
    ['axbenchmark templates export TEMPLATE_SHA --output template.zip', 'export one exact revision', 'CliExchange'],
    ['axbenchmark templates import template.zip', 'validate, recompute SHA-256, then add', 'CliExchange'],
    ['axbenchmark results export RUN_ID --output results.zip', 'records, evidence, provenance and the template', 'CliExchange'],
    ['axbenchmark results import results.zip --template TEMPLATE_SHA', 'validate identities and digests, then add', 'CliExchange'],
  ].forEach(([c, d, go]) => { s.cols([`  ${c}`, d], W, (i) => (i === 0 ? '' : 'mu')); s.g.link(1, s.y - 1, W[0] - 1, 1, 'go:' + go); });
  s.gap();
  s.out('Options for run', 'bd');
  [['  --jobs N', 'configurations at once · default: one per harness, up to 4 · --jobs 1 runs them one at a time'], ['  --no-tui', 'plain progress lines · never asks a question'], ['  --config FILE', 'a complete configuration: template SHA-256, entries, policy, judge, both weight sets']].forEach(([o, d]) => s.cols([o, d], [18, sz.cols - 20], (i) => (i === 0 ? 'bd' : '')));
  s.gap();
  s.out('Exit codes', 'bd');
  [['  0', 'success'], ['  1', 'the run finished with failed tasks or configurations (saved in its status)'], ['  2', 'invalid or incomplete input · nothing was started or changed'], ['  3', 'package rejected · nothing was added'], ['  4', 'run or template not found']].forEach(([o, d]) => s.cols([o, d], [18, sz.cols - 20], (i) => (i === 0 ? 'bd' : '')));
  s.gap();
  s.out('Every command uses the same validation and lifecycle as the TUI. Closing a terminal never stops a run.', 'mu');
  s.gap();
  s.cursor();
  return s.g;
}

// ---------------------------------------------------------------- run --no-tui

export function cliRun(sz) {
  const compact = sz.id === 'compact';
  const s = shell(sz, compact ? 'zsh — ~/bench' : TITLE);
  s.cmd('axbenchmark run --config benchmark.yaml --no-tui');
  if (compact) {
    s.out('Validating benchmark.yaml · 5 entries');
    s.out(`  ✓ template r1 · sha256 ${s8(SHA.inv1)}… recomputed`);
    s.out('  ✓ entries ready · efforts known · judge set · weights');
    s.out('Frozen → runs/2026-10-02-a/  (template, config, weights)');
    s.out('jobs 4 · one per harness · tasks sequential · 3:00:00/task', 'mu');
    s.gap();
    [['09:12:06', 'start  #1 claude #3 codex #4 grok #5 pi'], ['09:12:06', 'queue  #2 claude high · after #1'], ['09:17:10', '#1 claude T1 ✓ exit 0  5:04  2✓'], ['09:21:40', '#4 grok   T1 ✓ exit 0  9:34  2✓'], ['09:23:55', '#3 codex  T1 ✓ exit 0 11:49  2✓'], ['09:25:33', '#1 claude T2 ✓ exit 0  8:23  4✓'], ['09:26:20', '#5 pi     T1 ✓ exit 0 14:14  2✓'], ['09:31:52', '#5 pi     T2 using T1 commit 41d0e2a']].forEach(([t, m]) => s.out(`${t}  ${m}`));
    s.gap();
    s.out('Ctrl-C stops watching; the run continues.', 'mu');
    s.out('  axbenchmark --attach 2026-10-02-a', '', { go: 'RunQueued' });
    s.out('  axbenchmark stop 2026-10-02-a', '', { go: 'CliStatusStop' });
    return s.g;
  }
  s.out('Validating benchmark.yaml (same checks as Review before launch)');
  s.out(`  ✓ template   Inventory web app r1 · sha256 ${SHA.inv1} · recomputed, matches`);
  s.out('  ✓ entries    5 · Claude Code ×2, Codex, Grok CLI, Pi · all ready (doctor) · efforts known for each');
  s.out('  ✓ policy     clean for all 5 · established for every harness');
  s.out('  ✓ judge      Claude Code · claude-opus-5-5 · high · image input known');
  s.out('  ✓ weights    quality web v1 25 15 20 25 10 5 · ranking 1 : 1 : 1');
  s.out(`Frozen       template · configuration cfg ${s8(SHA.cfg)}… · original weights → runs/2026-10-02-a/`);
  s.out('Scheduling   one configuration per harness, up to 4 at once (jobs 4) · tasks sequential · 1 trial · 3:00:00 per task', 'mu');
  s.gap();
  const W = [11, 9, 14, 30, sz.cols - 66];
  s.cols(['time', 'entry', 'harness', 'event', 'detail'], W, 'mu');
  [
    ['09:12:06', '#1', 'claude-code', 'start', 'claude-opus-5-5 · medium'],
    ['09:12:06', '#3', 'codex', 'start', 'gpt-6-sol · medium'],
    ['09:12:06', '#4', 'grok-cli', 'start', 'grok-4.7-fast · harness default'],
    ['09:12:06', '#5', 'pi', 'start', 'qwen3.5-35b-a3b · harness default'],
    ['09:12:06', '#2', 'claude-code', 'queued', 'starts when #1 ends (same harness)'],
    ['09:17:10', '#1', 'claude-code', 'T1 ✓ exit 0 · 5:04', 'checks 2✓ · $0.31 estimate'],
    ['09:21:40', '#4', 'grok-cli', 'T1 ✓ exit 0 · 9:34', 'checks 2✓ · $0.05 estimate'],
    ['09:23:55', '#3', 'codex', 'T1 ✓ exit 0 · 11:49', 'checks 2✓ · $0.58 reported'],
    ['09:25:33', '#1', 'claude-code', 'T2 ✓ exit 0 · 8:23', 'checks 4✓ · $0.49 estimate'],
    ['09:26:20', '#5', 'pi', 'T1 ✓ exit 0 · 14:14', 'checks 2✓ · $0.00 local endpoint'],
    ['09:29:12', '#4', 'grok-cli', 'T2 ✓ exit 0 · 7:32', 'checks 4✓ · $0.12 estimate'],
    ['09:31:52', '#5', 'pi', 'T2 running', 'from the T1 workspace · commit 41d0e2a'],
  ].forEach((r) => s.cols(r, W, (i, c) => (i === 0 || i === 1 ? 'mu' : i === 3 && c.includes('✓') ? '' : i === 4 ? 'mu' : '')));
  s.out('', '');
  s.out('progress   #1 2/7 · #2 queued · #3 1/7 · #4 2/7 · #5 1/7      elapsed (sum of task processes) per entry in status', 'mu');
  s.gap();
  s.out('Ctrl-C stops watching only. The run keeps going in the background:', 'mu');
  s.out('  reattach   axbenchmark --attach 2026-10-02-a', '', { go: 'RunQueued' });
  s.out('  status     axbenchmark status 2026-10-02-a', '', { go: 'CliStatusStop' });
  s.out('  stop       axbenchmark stop 2026-10-02-a', '', { go: 'CliStatusStop' });
  return s.g;
}

// ---------------------------------------------------------------- incomplete unattended configuration

export function cliInvalid(sz) {
  const s = shell(sz, TITLE);
  s.cmd('axbenchmark run --config bench-draft.yaml --no-tui');
  s.out('Validating bench-draft.yaml (same checks as Review before launch)');
  s.out(`  ✓ template   Inventory web app r1 · sha256 ${s8(SHA.inv1)}… · recomputed, matches`);
  s.out('  ✗ entries[2] codex · gpt-6-sol · effort "max" is not supported on Codex 0.98.0');
  s.out('               supported: low, medium, high · source: discovered 2026-10-01 (M04)', 'mu');
  s.out('  ✗ entries[3] grok-cli · authentication failed (401) · run "grok login", then axbenchmark doctor');
  s.out('  ✗ judge      not set · unattended runs need judge.harness, judge.model and judge.effort');
  s.out('  ✗ weights    ranking preset "Team preset" does not exist · give the three weights or a known preset');
  s.out('  ✓ policy     clean for all entries');
  s.gap();
  s.out('4 problems · nothing was frozen or started · unattended mode never asks questions or picks substitutes', 'bd');
  s.out('Fix bench-draft.yaml, or open it in the TUI to choose interactively:  axbenchmark', 'mu');
  s.gap();
  s.cmd('echo $?');
  s.out('2');
  s.gap();
  s.out('# bench-draft.yaml · the lines that failed', 'mu');
  ['entries:', '  - harness: codex', '    model: gpt-6-sol', '    effort: max            # ✗ not supported', '  - harness: grok-cli      # ✗ not authenticated', '    model: grok-4.7-fast', 'judge: {}                  # ✗ incomplete', 'weights:', '  ranking: Team preset     # ✗ unknown preset'].forEach((l) => s.out(`  ${l}`, l.includes('✗') ? 'bd' : 'mu'));
  s.gap();
  s.cursor();
  return s.g;
}

// ---------------------------------------------------------------- status and stop

export function cliStatusStop(sz) {
  const s = shell(sz, TITLE);
  s.cmd('axbenchmark status 2026-09-30-b', 'RunFailures');
  s.out('Run 2026-09-30-b · Inventory web app r1 · 3f9c2e71… · jobs 4 · saved state, no TUI attached');
  const W = [15, 27, 10, 9, 9, sz.cols - 72];
  s.cols(['  harness', 'configuration', 'tasks', 'elapsed', 'cost', 'state'], W, 'mu');
  [
    ['  Claude Code', 'claude-opus-5-5 · medium', '✓✓✗––––', '22:46', '$1.52 ▲', '✗ halted at T3 · authentication failed (401)'],
    ['  Codex', 'gpt-6-sol · medium', '✓✓✓✗●○○', '3:41:09', '$5.88', '● running T5 · T4 timed out at 3:00:00'],
    ['  Grok CLI', 'grok-4.7-fast · default', '✓✓✓✓✓●○', '46:20', '$0.66', '● running T6 · 2 harness retries in T2'],
    ['  Pi', 'qwen3.5-35b-a3b · default', '✓✓✓✓✓✗✓', '1:34:02', '$0.00', '✓ complete · T6 exit 1'],
  ].forEach((r) => s.cols(r, W, (i, c) => (i === 5 && c.startsWith('✗') ? 'bd' : i === 2 || i === 0 ? '' : i === 5 ? '' : 'mu')));
  s.out('  ▲ partial · costs: reported or estimate per configuration, see the result for its basis', 'mu');
  s.gap();
  s.cmd('axbenchmark stop 2026-09-30-b');
  s.out('Stopping run 2026-09-30-b · 2 running configurations');
  s.out('  ✓ codex     pid 61204 + 2 children ended (SIGTERM) · service npx serve :41021 stopped · browser context closed');
  s.out('  ✓ grok-cli  pid 61877 + 1 child ended (SIGTERM) · no services running · browser context closed');
  s.out('  ✓ saved     Codex T5 and Grok CLI T6 interrupted (stopped by you) · later tasks not run · nothing retried');
  s.out('Stopped 13:41:07 · ports 41020–41049 released · results kept in runs/2026-09-30-b/');
  s.gap();
  s.cmd('axbenchmark status 2026-09-30-b');
  s.out('Run 2026-09-30-b · stopped by you 13:41:07 · 1 complete · 1 halted · 2 interrupted');
  [
    ['  Claude Code', 'claude-opus-5-5 · medium', '✓✓✗––––', '22:46', '$1.52 ▲', '✗ halted at T3 · authentication failed (401)'],
    ['  Codex', 'gpt-6-sol · medium', '✓✓✓✗✗––', '3:57:31', '$6.40 ▲', '✗ interrupted at T5 · stopped by you'],
    ['  Grok CLI', 'grok-4.7-fast · default', '✓✓✓✓✓✗–', '50:14', '$0.71 ▲', '✗ interrupted at T6 · stopped by you'],
    ['  Pi', 'qwen3.5-35b-a3b · default', '✓✓✓✓✓✗✓', '1:34:02', '$0.00', '✓ complete · T6 exit 1'],
  ].forEach((r) => s.cols(r, W, (i, c) => (i === 5 && c.startsWith('✗') ? 'bd' : i === 1 || i === 3 || i === 4 ? 'mu' : '')));
  s.gap();
  s.out('Closing a terminal or a TUI only detaches. Only stop ends work, and the authentication failure stays visible after it.', 'mu');
  s.gap();
  s.cursor();
  return s.g;
}

// ---------------------------------------------------------------- doctor and models refresh

export function cliDoctor(sz) {
  const s = shell(sz, TITLE);
  s.cmd('axbenchmark doctor', 'EnvironmentAuthFailed');
  s.out('Harnesses', 'bd');
  const W = [16, 10, 20, sz.cols - 48];
  [
    ['  ✓ Claude Code', '3.4.1', 'authenticated', 'headless probe ok · 6 models'],
    ['  ✓ Codex', '0.98.0', 'authenticated', 'headless probe ok · 5 models'],
    ['  ✗ Grok CLI', '1.9.2', 'auth failed (401)', 'run "grok login", then axbenchmark doctor again'],
    ['  ✓ Pi', '0.31.0', 'local endpoint', 'localhost:8080 reachable · 2 models'],
  ].forEach((r) => { s.cols(r, W, (i, c) => (r[0].includes('✗') && i !== 1 ? 'bd' : i === 1 ? 'mu' : '')); const x = 3; s.g.text(x, s.y - 1, r[0].trim()[0], r[0].includes('✓') ? 'ac' : 'bd'); });
  s.out('Runtimes', 'bd');
  s.out('  ✓ Python 3.13.1 · ✓ Node.js 22.11 · ✓ Git 2.47 · ✓ Playwright for Python 1.52.0 · ✓ Chromium 140.0');
  s.out('Hardware collectors · optional, never block a run', 'bd');
  s.out('  ✓ CPU utilisation     psutil 6.1 · 1 s samples');
  s.out('  ▲ GPU and power       insufficient permission · powermetrics needs root');
  s.out('                        run "sudo axbenchmark doctor --collectors" to check, or continue without them', 'mu');
  s.out('  ○ NVIDIA GPU          unsupported hardware · Apple silicon has no NVIDIA GPU (nothing to install)', 'mu');
  s.out('3 of 4 harnesses ready · planning and runs available with Claude Code, Codex and Pi', 'bd');
  s.gap();
  s.cmd('axbenchmark models refresh', 'CatalogRefreshFailed');
  s.out('Refreshing the model catalog (bundled 2026.09.2 + discovery)');
  s.out('  ✓ Claude Code · Anthropic · 6 models · efforts per model updated');
  s.out('  ✓ Codex · OpenAI · 5 models · gpt-6-astra added');
  s.out('  ✗ Grok CLI · xAI · refresh failed (401) · kept the last valid entries from 2026-09-28 (3 days old)');
  s.out('  ✓ Pi · local endpoint · 2 models · efforts unknown → harness default only');
  s.out('  ● overrides kept · 1 · claude-fable-5-1 (your metadata, never replaced by discovery)');
  s.out('Catalog 2026.10.01-2214 · 1 source failed · no model was assumed compatible', 'mu');
  s.gap();
  s.cmd('echo $?');
  s.out('0');
  s.gap();
  s.cursor();
  return s.g;
}

// ---------------------------------------------------------------- exchange and report

export function cliExchange(sz) {
  const s = shell(sz, TITLE);
  s.cmd(`axbenchmark templates export ${SHA.inv1} --output template.zip`, 'ExportTemplate');
  s.out('  ✓ wrote template.zip · 15 files · 14.8 KB · Inventory web app r1 · sha256 matches the library');
  s.gap();
  s.cmd('axbenchmark templates import kanban-board.zip', 'ImportRejected');
  s.out('  ✗ rejected · computed SHA-256 does not match the declared identity · nothing was added');
  s.out(`    declared  ${SHA.kanban}`, 'mu');
  s.out(`    computed  ${SHA.kanbanComputed}`, 'mu');
  s.out('    tasks/T3-board.md differs from the package manifest · no scripts ran, nothing was installed', 'mu');
  s.cmd('echo $?');
  s.out('3');
  s.gap();
  s.cmd(`axbenchmark results import lab-results.zip --template ${s8(SHA.inv1)}${SHA.inv1.slice(8, 16)}…`, 'ResultImport');
  s.out('  ✓ package     paths, size and format safe · payload digests match · 4 results');
  s.out('  ✓ template    embedded, declared and local SHA-256 all equal r1');
  s.out('  ✓ references  task ids T1–T7 · evidence present for every result');
  s.out('  ✓ added 1 · skipped 3 identical (already present) · imported results keep machine lab-linux-4090 and judge B');
  s.gap();
  s.cmd('axbenchmark report runs/2026-09-28-a', 'ReportReady');
  s.out('  ✓ read 12 retained results of r1 · 2 judge groups · original weights · no model calls');
  s.out('  ✓ wrote ~/.axbenchmark/reports/inventory-web-app-r1-3f9c2e71-2026-10-01.html · 1.9 MB · standalone, offline', '', { go: 'ReportPage' });
  s.out('  ▲ could not open a browser (open exited 1) · the file is complete at the path above');
  s.gap();
  s.cmd('axbenchmark results export 2026-09-28-a --output results.zip', 'ExportResult');
  s.out('  ✓ wrote results.zip · 4 results · evidence, provenance, measurements and the exact r1 template · no credentials');
  s.gap();
  s.cursor();
  return s.g;
}
