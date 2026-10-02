// M14 · Command-line and unattended access.
// Plain terminal output, drawn on the same character grid: no Textual header or footer. Every command delegates to
// the same contracts as the TUI (M07 validation, M11 lifecycle, M03 readiness, M04 catalog, M13 report, M17 ZIPs).
// Runs, results and versions match the TUI frames. All data is fictional.
import { Grid, fit, len } from './lib.mjs';
import { SHA, s8 } from './screens.mjs';
import { HALT_SHA } from './screens-run.mjs';

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
    ['axbenchmark --attach RUN_REF', 'observe a running run · never restarts tasks', 'RunReattached'],
    ['axbenchmark run --config benchmark.yaml --no-tui', 'validate, freeze, run unattended · plain output', 'CliRun'],
    ['axbenchmark status RUN_REF', 'saved status and failures · no TUI needed', 'CliStatusStop'],
    ['axbenchmark stop RUN_REF', 'stop and clean up processes and services', 'CliStatusStop'],
    ['axbenchmark models refresh', 'discover models · keeps the last valid catalog', 'CliDoctor'],
    ['axbenchmark doctor', 'check prerequisites · actionable guidance', 'CliDoctor'],
    ['axbenchmark report RUN_DIR', 'regenerate the offline report · no model calls', 'CliExchange'],
    ['axbenchmark templates export TEMPLATE_SHA --output template.zip', 'export one exact revision', 'CliExchange'],
    ['axbenchmark templates import template.zip', 'validate, recompute SHA-256, then add', 'CliExchange'],
    ['axbenchmark results export RUN_REF --output results.zip', 'records, evidence, provenance and the template', 'CliExchange'],
    ['axbenchmark results import results.zip --template TEMPLATE_SHA', 'validate identities and digests, then add', 'CliExchange'],
  ].forEach(([c, d, go]) => { s.cols([`  ${c}`, d], W, (i) => (i === 0 ? '' : 'mu')); s.g.link(1, s.y - 1, W[0] - 1, 1, 'go:' + go); });
  s.gap();
  s.out('Options for run', 'bd');
  [['  --jobs N', 'configurations at once · default: one per harness, up to 4 · --jobs 1 runs them one at a time'], ['  --no-tui', 'plain progress, never asks · waits for the completion report and prints its path'], ['  --no-wait-report', 'exit after the outcome · the report is still written · prints the regeneration command'], ['  --config FILE', 'a complete configuration: template SHA-256, entries, policy, judge, both weight sets']].forEach(([o, d]) => s.cols([o, d], [20, sz.cols - 22], (i) => (i === 0 ? 'bd' : '')));
  s.out('Options for doctor', 'bd');
  [['  --verify', 'one minimal model call per harness, after a [y/N] prompt listing them · nothing is called on No'], ['  --yes', 'consent without a prompt · required when there is no terminal (otherwise exit 2)']].forEach(([o, d]) => s.cols([o, d], [20, sz.cols - 22], (i) => (i === 0 ? 'bd' : '')));
  s.gap();
  s.out('Exit codes', 'bd');
  [['  0', 'success · includes a run that completed with failed or unverified tasks (see status --json)'], ['  1', 'typed error · rejected package, not found, incomplete config, followed run stopped/interrupted'], ['  2', 'usage · unknown command, option or argument · doctor --verify without a terminal and without --yes'], ['  3', 'engine unreachable or incompatible · nothing was started or changed']].forEach(([o, d]) => s.cols([o, d], [18, sz.cols - 20], (i) => (i === 0 ? 'bd' : '')));
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
    s.out('Frozen → runs/2026-10-02-a/ · template, config, weights, prices, rates');
    s.out('jobs 4 · one per harness · tasks sequential · 3:00:00/task', 'mu');
    s.gap();
    [['09:12:06', 'start  #1 claude #3 codex #4 grok #5 pi'], ['09:12:06', 'queue  #2 claude high · after #1'], ['09:17:10', '#1 claude T1 ✓ exit 0  5:04  6✓'], ['09:21:40', '#4 grok   T1 ✓ exit 0  9:34  6✓'], ['09:23:55', '#3 codex  T1 ✓ exit 0 11:49  6✓'], ['09:25:33', '#1 claude T2 ✓ exit 0  8:23  4✓'], ['09:26:20', '#5 pi     T1 ✓ exit 0 14:14  6✓'], ['09:31:52', '#5 pi     T2 using T1 commit 41d0e2a']].forEach(([t, m]) => s.out(`${t}  ${m}`));
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
  s.out(`Frozen       template · configuration cfg ${s8(SHA.cfg)}… · weights · prices · rates (display USD) → runs/2026-10-02-a/`);
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
    ['09:17:10', '#1', 'claude-code', 'T1 ✓ exit 0 · 5:04', 'checks 6✓ · $0.31 estimate'],
    ['09:21:40', '#4', 'grok-cli', 'T1 ✓ exit 0 · 9:34', 'checks 6✓ · $0.05 estimate'],
    ['09:23:55', '#3', 'codex', 'T1 ✓ exit 0 · 11:49', 'checks 6✓ · $0.58 reported'],
    ['09:25:33', '#1', 'claude-code', 'T2 ✓ exit 0 · 8:23', 'checks 4✓ · $0.49 estimate'],
    ['09:26:20', '#5', 'pi', 'T1 ✓ exit 0 · 14:14', 'checks 6✓ · cost unknown · local, parallel'],
    ['09:29:12', '#4', 'grok-cli', 'T2 ✓ exit 0 · 7:32', 'checks 4✓ · $0.12 estimate'],
    ['09:31:52', '#5', 'pi', 'T2 running', 'from the T1 workspace · commit 41d0e2a'],
  ].forEach((r) => s.cols(r, W, (i, c) => (i === 0 || i === 1 ? 'mu' : i === 3 && c.includes('✓') ? '' : i === 4 ? 'mu' : '')));
  s.out('', '');
  s.out('progress   #1 2/7 · #2 queued · #3 1/7 · #4 2/7 · #5 1/7      elapsed (sum of task processes) per entry in status', 'mu');
  s.gap();
  s.out('Ctrl-C stops watching only; the run keeps going. Followed to its end, run waits for the completion report, prints', 'mu');
  s.out('its path and exits 0 if it completed (even with failed tasks), 1 if it was stopped or interrupted. In the background:', 'mu');
  s.out('  reattach   axbenchmark --attach 2026-10-02-a', '', { go: 'RunQueued' });
  s.out('  status     axbenchmark status 2026-10-02-a', '', { go: 'CliStatusStop' });
  s.out('  stop       axbenchmark stop 2026-10-02-a', '', { go: 'CliStatusStop' });
  return s.g;
}

// ---------------------------------------------------------------- run --no-tui · trial budget warning · report wait (R3-3, R3-7)

export function cliRunReport(sz) {
  const s = shell(sz, TITLE);
  const W = [10, 8, sz.cols - 20];
  s.cmd('axbenchmark run --config benchmark-6x.yaml --no-tui', 'TrialBudgetWarning');
  s.out('Validating benchmark-6x.yaml (same checks as Review before launch)');
  s.out(`  ✓ template   Inventory web app r1 · sha256 ${s8(SHA.inv1)}… · recomputed, matches`);
  s.out('  ✓ entries    5 · Claude Code ×2, Codex, Grok CLI, Pi · all ready (doctor) · efforts known for each');
  s.out('  ▲ trials     6 per configuration, more than 5 · the extra trials will consume budget and subscription usage');
  s.out('               5 configurations × 6 trials × 7 tasks = 210 task runs · 30 judge sessions', 'bd');
  s.out('               provider accounts: #1 #2 Claude Code (subscription · declared by user) · #3 Codex · #4 Grok CLI', 'mu');
  s.out('               #5 Pi is on a local endpoint · printed, never asked · the launch continues', 'mu');
  s.out('Frozen       template · configuration · original weights · prices · rates (display USD) · warning → runs/2026-10-03-a/');
  s.out('Scheduling   one configuration per harness, up to 4 at once · 6 trials in turn, each from a fresh baseline', 'mu');
  s.out('^C stopped watching · the run continues · axbenchmark --attach 2026-10-03-a', 'mu', { go: 'RunQueued' });
  s.gap();
  s.out('# followed to its end, run waits for the completion report by default', 'mu');
  s.cmd('axbenchmark run --config benchmark.yaml --no-tui', 'CliRun');
  s.out('  … validation, frozen records and progress as above', 'mu');
  s.cols(['11:41:07', 'run', '✓ completed · 5 configurations · failed and unverified checks in status --json'], W, (i) => (i < 2 ? 'mu' : ''));
  s.cols(['11:41:07', 'report', 'waiting for the completion report · Ctrl-C detaches, the report is still written'], W, (i) => (i < 2 ? 'mu' : ''));
  s.cols(['11:41:19', 'report', '✓ ~/.axbenchmark/reports/inventory-web-app-r1-3f9c2e71-2026-10-02.html · opened in the browser'], W, (i) => (i < 2 ? 'mu' : ''));
  s.g.link(1, s.y - 1, sz.cols - 2, 1, 'go:ReportPage');
  s.cmd('echo $?');
  s.out('0');
  s.gap();
  s.out('# the report fails: its error and the regeneration command are printed, and the run still exits 0', 'mu');
  s.cmd('axbenchmark run --config nightly.yaml --no-tui');
  s.out('  …', 'mu');
  s.cols(['02:14:52', 'run', '✓ completed · 4 configurations'], W, (i) => (i < 2 ? 'mu' : ''));
  s.cols(['02:15:03', 'report', '✗ reports.write_failed · ~/.axbenchmark/reports/ is not writable (permission denied)'], W, (i) => (i < 2 ? 'mu' : 'bd'));
  s.cols(['', '', '  regenerate with: axbenchmark report 2026-10-04-n'], W, (i) => (i < 2 ? 'mu' : ''));
  s.cmd('echo $?');
  s.out('0    # the run completed; a failed report never changes the exit code', 'mu');
  s.gap();
  s.cmd('axbenchmark run --config nightly.yaml --no-tui --no-wait-report');
  s.out('  …', 'mu');
  s.cols(['02:14:49', 'run', '✓ completed · 4 configurations · exit 0'], W, (i) => (i < 2 ? 'mu' : ''));
  s.cols(['', 'report', '● not waited for · the engine still writes it · regenerate with: axbenchmark report 2026-10-05-n'], W, (i) => (i < 2 ? 'mu' : ''));
  s.gap();
  s.cursor();
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
  s.out('1');
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
    ['  Pi', 'qwen3.5-35b-a3b · default', '✓✓✓✓✓✗✓', '1:34:02', 'unknown', '✓ complete · T6 exit 1'],
  ].forEach((r) => s.cols(r, W, (i, c) => (i === 5 && c.startsWith('✗') ? 'bd' : i === 2 || i === 0 ? '' : i === 5 ? '' : 'mu')));
  s.out('  ▲ partial · cost basis per configuration in its result · unknown: local endpoint in a parallel run', 'mu');
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
    ['  Pi', 'qwen3.5-35b-a3b · default', '✓✓✓✓✓✗✓', '1:34:02', 'unknown', '✓ complete · T6 exit 1'],
  ].forEach((r) => s.cols(r, W, (i, c) => (i === 5 && c.startsWith('✗') ? 'bd' : i === 1 || i === 3 || i === 4 ? 'mu' : '')));
  s.gap();
  s.out('Closing a terminal or a TUI only detaches. Only stop ends work, and the authentication failure stays visible after it.', 'mu');
  s.cmd('echo $?');
  s.out('0');
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
  s.out('  ▲ GPU and power       insufficient permission · powermetrics is readable by root only');
  s.out('                        fix: grant read access as in docs/collectors/macos-powermetrics.md, then run doctor again', 'mu');
  s.out('                        or continue without them · AxBenchmark never asks for or runs as root', 'mu');
  s.out('  ○ NVIDIA GPU          unsupported hardware · Apple silicon has no NVIDIA GPU (nothing to install)', 'mu');
  // R3-6 · M03 reports approved revision folders whose read-only modes (files 0444, folders 0555) were changed.
  s.out('Approved revisions · read-only modes (files 0444, folders 0555)', 'bd');
  s.out(`  ▲ Billing service refactor r1 · revisions/${s8(SHA.billing)}…/ · 3 entries changed · doctor changes nothing`);
  s.out('      tasks/ 0755 (expected 0555) · tasks/T2.md 0644 (0444) · deps.yaml 0644 (0444)', 'mu');
  s.out(`      fix: axbenchmark templates restore ${s8(SHA.billing)}… --yes · rewrites it read-only from the stored content`, 'mu');
  s.out('      or delete the template (templates delete … --yes), which restores write permission only for the removal', 'mu');
  s.out('3 of 4 harnesses ready · planning and runs available with Claude Code, Codex and Pi', 'bd');
  s.gap();
  s.cmd('axbenchmark models refresh', 'CatalogRefreshFailed');
  s.out('Refreshing the model catalog (bundled 2026.09.2 + discovery)');
  s.out('  ✓ Claude Code · Anthropic · 6 models · efforts per model updated');
  s.out('  ✓ Codex · OpenAI · 5 models · gpt-6-astra added');
  s.out('  ✗ Grok CLI · xAI · refresh failed (401) · kept the last valid entries from 2026-09-28 (3 days old)');
  s.out('  ✓ Pi · local endpoint · 2 models · efforts unknown → harness default only');
  s.out('  ● overrides kept · 1 · claude-fable-5-1 (your metadata, never replaced by discovery)');
  s.out('  ✓ prices Anthropic · anthropic.com/pricing · retrieved 2026-10-01');
  s.out('  ✓ prices OpenAI · openai.com/api/pricing · retrieved 2026-10-01');
  s.out('  ▲ prices xAI · x.ai/api could not be read · kept last valid prices from 2026-09-15');
  s.out('  ○ prices local endpoint · none · no API charge · cost from energy only in sequential runs', 'mu');
  // R3-2 · one line per rate source (rates to USD), then user-supplied rates, kept and labelled.
  s.out('  ✓ rates open.er-api.com/v6/latest/USD · EUR GBP CNY units/USD · source date 2026-10-01 · retrieved 2026-10-01 21:38');
  s.out('  ● rates COP · supplied by you (4000.00 per USD, 2026-10-02) · kept, labelled · overrides the collected 4016.06');
  s.out('Catalog 2026.10.01-2214 · 1 source and 1 price page failed · no model was assumed compatible · exit 0', 'mu');
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
  s.out('1');
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

// ---------------------------------------------------------------- a followed run halts · status shows why · --json for scripts

export function cliHalted(sz) {
  const s = shell(sz, TITLE);
  s.cmd('axbenchmark run --config nightly.yaml --no-tui');
  s.out(`Frozen       template r1 ${s8(SHA.inv1)}… · 4 entries · jobs 4 → runs/2026-09-29-c/`, 'mu');
  const W = [11, 9, 14, sz.cols - 36];
  [
    ['15:09:58', '#1', 'claude-code', 'T4 ✓ exit 0 · 6:41 · checks 2✓ · $0.52 estimate'],
    ['15:11:30', '#3', 'grok-cli', 'T4 ✓ exit 0 · 5:02 · checks 2✓ · $0.07 estimate'],
  ].forEach((r) => s.cols(r, W, (i) => (i < 2 ? 'mu' : '')));
  s.cols(['15:12:40', 'run', '✗ halted', 'template identity invalidated · approved files changed on disk'], W, (i) => (i < 2 ? 'mu' : 'bd'));
  s.cols(['', '', '  approved', SHA.inv1], W, (i) => (i === 3 ? '' : 'mu'));
  s.cols(['', '', '  computed', HALT_SHA], W, (i) => (i === 3 ? 'bd' : 'mu'));
  s.cols(['', '', '  changed', 'checks/acceptance.v1.json · tasks/T6-checkout.md'], W, (i) => (i === 3 ? '' : 'mu'));
  s.cols(['15:12:44', 'run', '✓ cleaned up', '4 process trees · 1 service · 4 browser contexts · ports 41020–41059 released'], W, (i) => (i < 2 ? 'mu' : ''));
  s.out('Run 2026-09-29-c interrupted · 4 results recorded as interrupted · evidence kept · never compared', 'bd');
  s.cmd('echo $?');
  s.out('1');
  s.gap();
  s.cmd('axbenchmark status 2026-09-29-c', 'RunHalted');
  s.out('Run 2026-09-29-c · Inventory web app r1 · interrupted 15:12:40 · reason: template identity invalidated', 'bd');
  s.out(`  approved ${SHA.inv1} · computed ${s8(HALT_SHA)}… · 2 changed paths`, 'mu');
  const C = [15, 27, 10, 9, 10, sz.cols - 73];
  s.cols(['  harness', 'configuration', 'tasks', 'elapsed', 'cost', 'state'], C, 'mu');
  [
    ['  Claude Code', 'claude-opus-5-5 · medium', '✓✓✓✓✗––', '31:02', '$3.18 ▲', '✗ interrupted at T5 · identity invalidated'],
    ['  Codex', 'gpt-6-sol · medium', '✓✓✓✗–––', '33:47', '$1.66 ▲', '✗ interrupted at T4 · identity invalidated'],
    ['  Grok CLI', 'grok-4.7-fast · default', '✓✓✓✓✗––', '29:15', '$0.49 ▲', '✗ interrupted at T5 · identity invalidated'],
    ['  Pi', 'qwen3.5-35b-a3b · default', '✓✓✗––––', '34:40', 'unknown', '✗ interrupted at T3 · identity invalidated'],
  ].forEach((r) => s.cols(r, C, (i) => (i === 5 ? 'bd' : i === 1 || i === 3 || i === 4 ? 'mu' : '')));
  s.cmd('echo $?');
  s.out('0    # status read · status exits 0 whatever state the run is in', 'mu');
  s.gap();
  s.out('# a run that completed exits 0 even with failed checks · scripts read the details from status --json', 'mu');
  s.cmd(`axbenchmark status 2026-09-28-a --json | jq -c '.configurations[] | {harness, state, checks}'`, 'Results');
  [
    '{"harness":"claude-code","state":"complete","checks":{"passed":21,"failed":0,"unverified":0}}',
    '{"harness":"codex","state":"complete","checks":{"passed":21,"failed":0,"unverified":0}}',
    '{"harness":"grok-cli","state":"complete","checks":{"passed":20,"failed":0,"unverified":1}}',
    '{"harness":"pi","state":"complete","checks":{"passed":18,"failed":3,"unverified":0}}',
  ].forEach((l) => s.out(l, l.includes('"failed":3') || l.includes('"unverified":1') ? 'bd' : ''));
  s.gap();
  s.cursor();
  return s.g;
}

// ---------------------------------------------------------------- doctor --verify · one minimal call per harness

export function cliVerify(sz) {
  const s = shell(sz, TITLE);
  s.cmd('axbenchmark doctor', 'EnvironmentAuthFailed');
  const W = [16, 10, 20, sz.cols - 48];
  [
    ['  ? Claude Code', '3.4.1', 'login found', 'headless operation not confirmed yet'],
    ['  ? Codex', '0.98.0', 'login found', 'headless operation not confirmed yet'],
    ['  ✗ Grok CLI', '1.9.2', 'auth failed (401)', 'run "grok login", then axbenchmark doctor again'],
    ['  ✗ Pi', '0.31.0', 'local endpoint', 'localhost:8080 not reachable · start llama-server'],
  ].forEach((r) => s.cols(r, W, (i) => (r[0].includes('✗') && i !== 1 ? 'bd' : i === 1 ? 'mu' : '')));
  s.out('No harness is confirmed usable · planning and runs need one · confirm with: axbenchmark doctor --verify', 'bd');
  s.gap();
  s.cmd('axbenchmark doctor --verify');
  s.out('Confirms login and headless operation with one minimal call per harness that can be called:');
  s.out('  headless · no model or effort argument (the harness default) · no tools · 60 s deadline · a few tokens may be billed', 'mu');
  s.out('  Claude Code 3.4.1 · one minimal model call');
  s.out('  Codex 0.98.0      · one minimal model call');
  s.out('  Grok CLI and Pi are skipped until their failure is fixed', 'mu');
  s.out('Verify these 2 harnesses now? [y/N] y');
  s.cols(['  ✓ Claude Code', '3.4.1', 'confirmed · 4.1 s', 'logged in · headless ok · default model claude-opus-5-5'], W, (i) => (i === 1 ? 'mu' : ''));
  s.cols(['  ✓ Codex', '0.98.0', 'confirmed · 6.8 s', 'logged in · headless ok · default model gpt-6-sol'], W, (i) => (i === 1 ? 'mu' : ''));
  [3, 3].forEach((_, i) => s.g.text(3, s.y - 2 + i, '✓', 'ac'));
  s.out('Recorded in readiness 2026-10-02 09:02 (M03) · 2 of 4 usable · planning now preselects Claude Code', 'bd');
  s.out('The default is No: Enter, n or end of input prints “No verification call was made.” and exits 0.', 'mu');
  s.gap();
  s.out('# in a script there is no terminal to ask: consent must be given with --yes', 'mu');
  s.cmd('axbenchmark doctor --verify < /dev/null');
  s.out('✗ doctor --verify makes one minimal model call per harness and needs consent: run it in a terminal or pass --yes');
  s.cmd('echo $?');
  s.out('2    # usage · nothing was sent, no model was called', 'mu');
  s.cmd('axbenchmark doctor --verify --harness codex --yes < /dev/null');
  s.out('Consent given with --yes · Codex 0.98.0 · one minimal model call');
  s.cols(['  ✓ Codex', '0.98.0', 'confirmed · 6.2 s', 'logged in · headless ok · replaces the 09:02 outcome'], W, (i) => (i === 1 ? 'mu' : ''));
  s.g.text(3, s.y - 1, '✓', 'ac');
  s.cmd('echo $?');
  s.out('0');
  s.gap();
  s.out('Without --verify, doctor never calls a model. Each outcome keeps its time; a later failure replaces it.', 'mu');
  s.gap();
  s.cursor();
  return s.g;
}
