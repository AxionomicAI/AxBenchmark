// Artboard catalogue for M10–M18: one canvas page per module, grouped into the flows of navigation.md.
// Same legend shape as boards-modules.mjs. CLI frames (M14) are plain terminal output, so their legend names the
// output contract and arguments instead of TCSS and key bindings.
import { measurements, measurementsPartial, measurementsTrials, timingPhases, costBasis, currencyEnergy } from './screens-measure.mjs';
import { runOverview, runDetach, stopConfirm, stopCleanup, activeLocked, harnessLive, runHalted } from './screens-run.mjs';
import { judging, judgingTrials, reviewDetail, reviewUngraded, judgeCapability, rubricProfiles } from './screens-judging.mjs';
import { reportGenerate, reportProgress } from './screens-report.mjs';
import { cliHelp, cliRun, cliRunReport, cliInvalid, cliStatusStop, cliDoctor, cliExchange, cliHalted, cliVerify } from './screens-cli.mjs';
import { helpKeys, runListDetail, promptScreen } from './screens-tui.mjs';
import { plannerPicker, plannerVerify, planningProgress, planReview, planServices, planServiceEdit, planEdit, planRegenerate, planApprove, planApproveIdentical, planningFailed } from './screens-planning.mjs';
import { importUnsafe, importIncomplete, resultPackage, resultPackagePick, resultMismatch, resultEmbedded } from './screens-exchange.mjs';
import { monitoringSettings, collectorGuide, telemetry, energyDetail, sequentialEnergy } from './screens-telemetry.mjs';
import { rankings } from './screens-results.mjs';

const S = (name, title, def) => ({ name, title, ...def });
const modalSel = (screen, id, w) => [
  [screen, 'align: center middle; background: $background 60%;'],
  [id, `width: ${w}; max-width: 100%; height: auto; border: round $primary; background: $surface; padding: 1 2;`],
  ['.dialog-actions', 'height: 1; align-horizontal: right; margin-top: 1;'],
];
const MODAL_KEYS = (extra) => [['esc', 'dismiss(None)', 'Close without changes'], ['tab / shift+tab', 'focus_next / previous', 'Move between fields'], ...extra];

// ---------------------------------------------------------------- M10 · measurements and cost

const MEAS_TREE = `MeasurementsScreen(Screen)     m from Result › Outcomes
├─ Header
├─ Static #result-bar
├─ Vertical #measurements-pane .pane
│  ├─ DataTable #measurements    per task + Σ row · per trial
│  ├─ Static #trial-summary      mean · min–max, N trials only
│  └─ Static #overlap-hint
├─ Horizontal
│  ├─ Static #formation .pane.kv     selected task
│  └─ Static #phases .pane.kv        elapsed vs excluded
├─ Horizontal .actions
├─ Static #accounting           .-compact only
└─ Footer`;
const MEAS_SEL = [
  ['#measurements', 'height: 9;  cursor_type = "row"'],
  ['#measurements .-partial', 'text-style: bold;  value + " ▲"'],
  ['#measurements .-unknown', 'color: $foreground 60%;  "—", never 0'],
  ['#trial-summary', 'height: 2; text-style: bold;  display: none with 1 trial'],
  ['#formation, #phases', 'width: 1fr; height: 18;'],
  ['Screen.-compact #formation, Screen.-compact #phases', 'display: none;'],
  ['Screen.-compact #accounting', 'display: block; height: 1fr;'],
];
const MEAS_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the result'],
  ['t', 'timing', 'Push TimingScreen for the run'],
  ['b', 'cost_basis', 'Cost basis of every result of this revision'],
  ['u', 'currency', 'Display currency, exchange rates and tariff frozen at launch'],
  ['enter', 'open_task', 'Task checks and evidence (M08)'],
];
const MEAS_STATES = [['Complete', 'Measurements'], ['Halted · partial', 'MeasurementsPartial'], ['3 trials', 'MeasurementsTrials'], ['Timing', 'TimingPhases'], ['Cost basis', 'CostBasis'], ['Currency and energy', 'CurrencyEnergy'], ['Tariff · analysis', 'TariffAnalysis'], ['Results · tariff (M02)', 'ResultsAnalysisTariff'], ['Results · trials (M02)', 'ResultsTrials'], ['Outcomes tab', 'ResultOutcomes']];
const measLegend = (notes) => ({ screen: 'MeasurementsScreen', file: 'tui/screens/measurements.py', tree: MEAS_TREE, sel: MEAS_SEL, keys: MEAS_KEYS, states: MEAS_STATES, notes });

const TIMING_TREE = `TimingScreen(Screen)
├─ Header · Static #run-bar
├─ Static #timeline .pane        clock time, █ ▒ ░
├─ DataTable #phase-table .bordered
├─ Static #phase-note
└─ Footer`;
const BASIS_TREE = `CostBasisScreen(ModalScreen[None])     b from Results
├─ Vertical #cost-basis .dialog
│  ├─ DataTable #basis-table
│  ├─ Static #basis-legend .kv
│  └─ Horizontal .dialog-actions
└─ Footer`;
const CURRENCY_TREE = `CurrencyEnergyScreen(ModalScreen[Accounting | None])
│                                 mode = setup (c in Setup) | analysis (e in Results)
├─ Vertical #currency-energy .dialog
│  ├─ Select #display-currency     setup · default USD · display only
│  ├─ DataTable #rate-table        setup · rates to USD from M04 · source, date, at launch
│  ├─ Static #rate-snapshot .kv    setup · what launch freezes · no_rate_conversion
│  ├─ Vertical #tariff
│  │  └─ Checkbox · Input #tariff-per-kwh · Select #tariff-currency
│  ├─ Static #energy-scope .kv     from M18 · setup
│  ├─ DataTable #tariff-effect     analysis: what is recalculated
│  └─ Horizontal .dialog-actions   analysis: #reset · Apply as alternative
└─ Footer`;
const CURRENCY_SEL = [...modalSel('CurrencyEnergyScreen', '#currency-energy', 100), ['#display-currency', 'width: 9;  ISO 4217 code · default USD'], ['#rate-table', 'height: 6;  cursor_type = "row" · read-only · rates are edited in the catalog (M04)'], ['#rate-table .-override', 'text-style: bold;  “supplied by you”'], ['#tariff-per-kwh', 'width: 16;  type="number"'], ['#tariff-currency', 'width: 9;  USD or a currency with a rate at launch'], ['#tariff-effect', 'height: 4;  analysis mode only'], ['#reset', 'Button · “Reset to recorded” · analysis mode only']];

const M10 = [
  { id: 'm10-measure', page: 'm10', title: 'M10 · 1 · Measurements per task and configuration', note: 'Every task and every configuration total shows wall time, input, cached, output and reasoning tokens, cost, check results and execution status, each with its source and coverage. Cumulative usage events count once; overlapping token categories are shown apart and never added. Missing stays unknown, incomplete stays partial. Benchmark elapsed time is only the sum of task processes.', boards: [
    S('Measurements', 'Measurements · complete', { sizes: ['wide', 'compact'], focus: { wide: [['tasks', 'DataTable #measurements'], ['rules', 'Static #formation'], ['elapsed', 'Static #phases'], ['timing', 'Button #timing']], compact: [['tasks', 'DataTable #measurements'], ['rules', 'Static #accounting']] }, render: (sz, f) => measurements(sz, f), legend: measLegend([
      'Same result as the Outcomes tab (R-0928a-3): times and costs add up to 51:30 and $0.92 there and on Rankings (R078).',
      'Grok CLI reports no cost, so every cost is an API-equivalent estimate from known usage × recorded rates, labelled as such (R080).',
      'Reasoning ⊂ output and cached ⊂ input are separate columns; ? means not exposed, not zero (R078).',
      'A stream with running totals is counted once, from its final total (R078).',
    ]) }),
    S('MeasurementsPartial', 'Measurements · halted, partial', { sizes: ['wide'], focus: { wide: [['tasks', 'DataTable #measurements'], ['sources', 'Static #coverage']] }, render: (sz, f) => measurementsPartial(sz, f), legend: measLegend([
      'R-0925b-2: authentication failed in T5. Usage up to the failure is kept as partial (▲); T6 and T7 are unknown (—), never zero (R078, R147).',
      'The total keeps ▲ and its coverage (5 of 7) so it is never read as a complete benchmark cost (R080).',
      'D11: a partial cost or time counts as missing in any ranking where it carries weight; the entry stays in tables with its ▲ value and “covers 5 of 7 tasks”.',
      'Status (halted, not interrupted, not timeout) stays beside the measurements.',
    ]) }),
    S('MeasurementsTrials', 'Measurements · 3 trials per configuration', { sizes: ['wide'], focus: { wide: [['codex', 'DataTable #measurements'], ['claude', 'DataTable #measurements-2'], ['rules', 'Static #trial-rules']] }, render: (sz, f) => measurementsTrials(sz, f), legend: measLegend([
      'D7: Orders REST API r3, run 2026-09-27-t, 2 configurations × 3 trials (the 6 results the Library lists). Fixture TRIAL_CONFIGS in results-data.mjs, shared with M02 and M12.',
      'Each trial is its own result with its own fresh baseline and judge session; #trial-summary shows the mean of cost, time and quality and the min–max range.',
      'Rankings use the means. Claude Code trial 2 failed a check, so that configuration is listed with the reason and not ranked.',
      'Trials default to 1: Inventory r1 frames show one row and no #trial-summary.',
    ]) }),
    S('TimingPhases', 'Timing · elapsed vs phases', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #phase-table'], ['chart', 'Static #timeline']] }, render: (sz, f) => timingPhases(sz, f), legend: { screen: 'TimingScreen', file: 'tui/screens/measurements.py', tree: TIMING_TREE, sel: [['#timeline', 'height: 15;  one row per configuration'], ['#phase-table', 'height: 10;  cursor_type = "row"']], keys: [['esc', 'app.pop_screen', 'Back'], ['enter', 'open_result', 'Measurements of the selected configuration']], states: MEAS_STATES, notes: [
      'Benchmark elapsed = Σ task process durations, tool work included; queue, planning, verification and judging are reported apart (R079).',
      'The experiment duration (1:56:00) is clock time; with four configurations at once it is far below their summed elapsed times (R079).',
      'Elapsed times are those of run 2026-09-28-a in results-data.mjs.',
    ] } }),
  ] },
  { id: 'm10-cost', page: 'm10', title: 'M10 · 2 · Cost basis, currency and energy', note: 'Reported cost wins; without it an API-equivalent estimate is made from known usage and the price table recorded at launch, labelled with its price source and date. Subscriptions, unknown billing and missing prices or rates never become $0. A local endpoint in a sequential run is costed as an energy estimate (its windows’ kWh × the frozen tariff, with scope); in a parallel run shared energy is never divided, so its cost stays unknown. Costs are computed and ranked in USD and shown in each run’s frozen display currency with its frozen rates; there is no currency switch at analysis time.', boards: [
    S('CostBasis', 'Cost basis · 12 results', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #basis-table'], ['close', 'Button #close']] }, render: (sz, f) => costBasis(sz, f), legend: { screen: 'CostBasisScreen', file: 'tui/screens/results.py', tree: BASIS_TREE, sel: [...modalSel('CostBasisScreen', '#cost-basis', 112), ['#basis-table', 'height: 13;  Result · Cost · Basis · Billing at launch · Source'], ['#basis-table .-unknown', 'text-style: italic;  reason, e.g. parallel_energy_shared, no_rate_conversion'], ['#basis-table .-declared', 'text-style: bold;  “declared by user”'], ['#basis-currency', 'Static .kv · display currency, frozen rates, no_rate_conversion']], keys: MODAL_KEYS([['enter', 'open', 'Measurements of the selected result'], ['u', 'currency', 'Currency and energy']]), states: MEAS_STATES, notes: [
      'D4: cost and basis are those of results-data.mjs (RESULTS.cost, basis, price); this dialog adds the source, scope or coverage column (R080).',
      'Bases: reported · verified $0 (reported $0, complete usage, not a subscription; none here) · estimate (price table, source and retrieval date, recorded at launch) · energy estimate (sequential local only, with scope) · unknown with its reason.',
      'Pi on a local endpoint in parallel runs (jobs 2–4) is unknown with reason parallel_energy_shared; R-0919lab-1 ran alone (jobs 1), so its $0.01 is an energy estimate: 80.7 Wh × $0.18/kWh, CPU package + GPU.',
      'A subscription is not $0: with known usage it is an API-equivalent estimate from the price table (R080).',
      'R3-1: Billing at launch is the account’s billing kind frozen by M07: read from the harness status output (“api · harness status”) or declared in the catalog (M04 override), labelled “declared by user” (R-0928a-1). Unknown billing never yields a verified $0.',
      'R3-2: every r1 price is in USD and all four runs froze display USD, so nothing is converted here. A price currency without a frozen rate makes the estimate unknown with no_rate_conversion, never a guessed or later rate.',
    ] } }),
    S('CurrencyEnergy', 'Currency and energy · Setup', { sizes: ['wide'], focus: { wide: [['currency', 'Select #display-currency'], ['rates', 'DataTable #rate-table'], ['tariff', 'Input #tariff-per-kwh'], ['tariff-currency', 'Select #tariff-currency'], ['save', 'Button #save']] }, render: (sz, f) => currencyEnergy(sz, f), legend: { screen: 'CurrencyEnergyScreen', file: 'tui/screens/setup.py', tree: CURRENCY_TREE, sel: CURRENCY_SEL, keys: MODAL_KEYS([['ctrl+s', 'save', 'Store with the configuration; frozen at launch']]), states: MEAS_STATES, notes: [
      'Opened with c in Setup (W4). R3-2: the display currency (default USD) only changes how values are shown; costs are computed and ranked in USD.',
      '#rate-table lists the catalog’s rates to USD (M04 ExchangeRateSource, collected during an explicit catalog refresh, never during a run) with source and date; a user-supplied rate overrides and is labelled “supplied by you”. Rates are edited in the catalog, not here.',
      'At launch M07 freezes a RateSnapshot beside the PriceSnapshot: a rate for every price currency, the display currency and the tariff currency. Here all are USD, so only USD 1 is frozen. A missing rate is frozen as missing and its values show unknown · no_rate_conversion.',
      'D4: the optional tariff (per kWh with its currency) is frozen with the run. Energy scope comes from M18: CPU package + GPU is never whole-system cost (R114, R147).',
      'Sequential runs only: a local configuration’s cost for rankings is its windows’ kWh × tariff, labelled “energy estimate”. In parallel runs shared energy is never divided, so that cost stays unknown.',
      'The README’s historical exchange rate is never used (R081).',
    ] } }),
    S('TariffAnalysis', 'Tariff · analysis setting in Results', { sizes: ['wide'], focus: { wide: [['tariff', 'Input #tariff-per-kwh'], ['reset', 'Button #reset'], ['apply', 'Button #apply']] }, render: (sz, f) => currencyEnergy(sz, f, { analysis: true }), legend: { screen: 'CurrencyEnergyScreen · analysis', file: 'tui/screens/setup.py', tree: CURRENCY_TREE, sel: CURRENCY_SEL, keys: MODAL_KEYS([['ctrl+s', 'apply', 'Apply as alternative'], ['r', 'reset', 'Reset to recorded']]), states: MEAS_STATES, notes: [
      'D4: opened from Results after the runs. A changed tariff recalculates energy estimates only and is labelled alternative, like alternative weights; the recorded tariff stays in every original record.',
      'R-0919lab-1: 80.7 Wh × 0.22 = $0.02 instead of the recorded $0.01. Parallel local results stay unknown at any tariff.',
      'Reset to recorded removes the alternative everywhere (Results, Rankings, report).',
      'R3-2: only the tariff is an analysis setting. There is no display currency at analysis time; values keep each run’s frozen display currency, and a view spanning runs with different display currencies shows USD and says so.',
    ] } }),
  ] },
];

// ---------------------------------------------------------------- M11 · run orchestration

const RUN_TREE = `RunScreen(Screen)              pushed at launch · ^r from Library
├─ Header
├─ Static #run-bar
├─ Static #frozen
├─ Grid #lanes                    2 × 2, one per harness
│  └─ Vertical .pane × 4         #lane-1 … #lane-4
│     ├─ Static .lane-state
│     ├─ Static .task-strip       T1 … T7 glyphs
│     ├─ ProgressBar
│     └─ Static .kv               now · elapsed · cost · queue · live
├─ RichLog #events .bordered
└─ Footer                         below 100×30: RunListDetail (M15)`;
const RUN_SEL = [
  ['#run-bar, #frozen', 'height: 1; padding: 0 1;'],
  ['#lanes', 'layout: grid; grid-size: 2 2; height: 22;'],
  ['#lanes .pane', 'height: 11;'],
  ['.task-strip .-running', 'color: $primary; text-style: bold;'],
  ['#events', 'height: 1fr;  auto_scroll = True'],
  ['Screen.-compact #lanes', 'display: none;  list and detail instead (RunListDetail)'],
  ['#run-bar.-halted', 'text-style: bold;  halted run, reason first'],
];
const RUN_KEYS = [
  ['enter', 'open_configuration', 'RunConfigScreen for the focused lane (M05)'],
  ['s', 'stop_configuration', 'Stop the focused configuration, with cleanup'],
  ['S', 'stop_run', 'Stop the whole run, with cleanup'],
  ['v', 'live_view', 'HarnessLiveScreen for the focused lane: code, thinking, tok/s, context'],
  ['d', 'detach', 'Leave; the run keeps going'],
  ['e', 'edit', 'Dimmed: frozen while running (check_action)'],
  ['tab', 'focus_next', 'Next lane, then events'],
];
const RUN_STATES = [['Running', 'RunOverview'], ['Below 100×30', 'RunListDetail'], ['Live view', 'HarnessLive'], ['Queued', 'RunQueued'], ['Sequential', 'RunSequential'], ['Failures', 'RunFailures'], ['Halted · identity', 'RunHalted'], ['Halted · results (M02)', 'ResultsHalted'], ['Detach', 'RunDetach'], ['Reattached', 'RunReattached'], ['Stop', 'StopConfirm'], ['Locked', 'ActiveLocked']];
const LANES = { wide: [['lane1', 'Vertical #lane-2'], ['lane0', 'Vertical #lane-1'], ['lane2', 'Vertical #lane-3'], ['lane3', 'Vertical #lane-4'], ['events', 'RichLog #events']] };
const runLegend = (notes) => ({ screen: 'RunScreen', file: 'tui/screens/run.py', tree: RUN_TREE, sel: RUN_SEL, keys: RUN_KEYS, states: RUN_STATES, notes });

const LIVE_TREE = `HarnessLiveScreen(Screen)      v on a lane · v in RunConfigScreen
├─ Header
├─ Static #live-task             task · model · effort · harness
├─ Vertical #live-meters .pane   tok/s · context · task tokens
│  ├─ Sparkline #live-rate
│  └─ ProgressBar #live-context
├─ Horizontal
│  ├─ RichLog #live-activity     thinking (Collapsible) · actions
│  └─ Vertical #live-code .pane
│     ├─ Tabs #live-files        files changed in this task
│     └─ TextArea #live-diff     read_only · follows the stream
└─ Footer`;
const LIVE_SEL = [
  ['#live-task', 'height: 1; padding: 0 1; background: $surface;'],
  ['#live-meters', 'height: 5;'],
  ['#live-activity', 'width: 52;  auto_scroll = True'],
  ['#live-code', 'width: 1fr;'],
  ['#live-diff .-added', 'background: $primary 24%;'],
  ['Screen.-compact #live-activity', 'display: none;  a toggles it as an overlay'],
];
const LIVE_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the run; nothing in the run changes'],
  ['t', 'toggle_thinking', 'Show or hide thinking; dimmed when the harness exposes none'],
  ['f', 'toggle_follow', 'Pause or resume following the stream'],
  ['[ · ]', 'previous_file / next_file', 'Files changed in this task'],
  ['/', 'search', 'Search thinking and actions'],
  ['enter', 'open_configuration', 'RunConfigScreen for this configuration (M05)'],
  ['tab', 'focus_next', 'Code, then thinking and actions'],
];
const LIVE_STATES = [['Codex · thinking summarized', 'HarnessLive'], ['Edit streaming', 'HarnessLiveStreaming'], ['Less exposed · Grok CLI', 'HarnessLiveLimited'], ['Run overview', 'RunOverview'], ['Configuration', 'RunConfig']];

const DETACH_TREE = `DetachScreen(ModalScreen[bool])
├─ Vertical #detach .dialog
│  ├─ Static .notice
│  ├─ Static #reattach .kv
│  └─ Horizontal .dialog-actions
└─ Footer`;
const STOP_TREE = `StopScreen(ModalScreen[StopRequest | None])
├─ Vertical #stop .dialog
│  ├─ RadioSet #stop-scope         configuration · whole run
│  ├─ DataTable #cleanup           processes · services · ports
│  ├─ Static #stop-outcome .kv
│  └─ Horizontal .dialog-actions
└─ Footer`;

const M11 = [
  { id: 'm11-overview', page: 'm11', title: 'M11 · 1 · Run overview and scheduling', note: 'RunScreen has one lane per harness. By default one configuration per harness runs at once, up to four; further configurations of the same harness queue in their lane, and tasks always run in order. --jobs 1 and its TUI setting run one configuration at a time. Ordinary failures and timeouts continue from the resulting workspace; authentication or configuration failures halt only that configuration.', boards: [
    S('RunOverview', 'Run overview', { sizes: ['wide'], focus: LANES, render: (sz, f) => runOverview(sz, f), legend: runLegend([
      'Run 2026-10-01-a from M05/M07: four configurations, one per harness, all at once (R045, R138).',
      'Elapsed is the sum of task processes (M10); cost keeps its basis. Pi is on a local endpoint in a parallel run, so its cost is unknown: shared energy is never divided (D4).',
      'Below 100×30 the same screen is list and detail (RunListDetail, M15); there is no compact table (W6).',
      'The event log records harness-internal retries as observed; the orchestrator never adds a retry (R077).',
    ]) }),
    S('RunQueued', 'Run · same-harness queue', { sizes: ['wide'], focus: LANES, render: (sz, f) => runOverview(sz, f, { run: 'queued' }), legend: runLegend([
      'Five entries from Setup (M07): Claude Code #2 waits in its lane until #1 ends; the other harnesses start at once (R045).',
      'The scheduling policy and queue order are recorded with every result.',
    ]) }),
    S('RunSequential', 'Run · sequential (jobs 1)', { sizes: ['wide'], focus: LANES, render: (sz, f) => runOverview(sz, f, { run: 'seq' }), legend: runLegend([
      '--jobs 1 or “Sequential” in Setup: one configuration at a time, tasks still in order (R045, R138).',
      'The spec does not prescribe which queued configuration goes first; this frame uses entry order.',
    ]) }),
    S('RunFailures', 'Run · failures recorded', { sizes: ['wide'], focus: LANES, render: (sz, f) => runOverview(sz, f, { run: 'fail' }), legend: runLegend([
      'Authentication failure halts only Claude Code; the others continue (R077).',
      'Codex T4 timed out at the 3:00:00 default; T5 continues from the T4 workspace, with no rerun (R077).',
      'Pi T6 failed and T7 used the T6 workspace. One trial per configuration.',
    ]) }),
    S('RunHalted', 'Run halted · template identity invalidated', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['paths', 'DataTable #changed-paths']] }, render: (sz, f) => runHalted(sz, f), legend: { screen: 'RunHaltedScreen', file: 'tui/screens/run.py', tree: 'RunHaltedScreen(ModalScreen[None])   pushed over RunScreen\n├─ Vertical #halted .dialog\n│  ├─ Static .notice.-error\n│  ├─ Static #halt-identities      approved · computed SHA-256\n│  ├─ DataTable #changed-paths\n│  ├─ Static .kv                   recorded outcome\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('RunHaltedScreen', '#halted', 86), ['#halt-identities', 'height: 3;  both digests in full'], ['#changed-paths', 'height: 3;']], keys: MODAL_KEYS([['enter', 'close', 'Back to the Library; the run is over']]), states: RUN_STATES, notes: [
      'D9: approved revision files are read-only on disk; the first detected change halts the whole run with the same cleanup as an explicit stop.',
      'Every configuration is recorded as interrupted with reason “template identity invalidated”, the approved and computed SHA-256 and the changed paths. Evidence is kept; results are never rebound and never compared.',
      'axbenchmark status shows the same reason, and a followed run --no-tui exits 1 (CliHalted).',
      'Run 2026-09-29-c is fictional and is not one of r1’s 12 comparable results.',
    ] } }),
  ] },
  { id: 'm11-live', page: 'm11', title: 'M11 · 2 · Live view inside one harness', note: 'v on a lane (or in its configuration screen) watches the current task process of that configuration: the code being written as a live diff, the thinking as far as the harness exposes it, its actions, output tok/s and context use. It is observation only: it never sends input, pauses or slows the harness, and leaving it changes nothing in the run.', boards: [
    S('HarnessLive', 'Live view · Codex', { sizes: ['wide', 'compact'], focus: { wide: [['code', 'Vertical #live-code'], ['activity', 'RichLog #live-activity']], compact: [['code', 'Vertical #live-code']] }, render: (sz, f) => harnessLive(sz, f), legend: { screen: 'HarnessLiveScreen', file: 'tui/screens/live.py', tree: LIVE_TREE, sel: LIVE_SEL, keys: LIVE_KEYS, states: LIVE_STATES, notes: [
      'Opened with v from the focused lane of RunScreen or from RunConfigScreen; esc returns to the run. Observation only (R042, R044, R047).',
      'The task line names the task, model and effort as requested and as observed: Codex does not expose effort, so it stays “? unverified” (M05).',
      'tok/s is output tokens per second over the last second, measured from the stream when the harness reports no rate. Context is the current conversation’s use; every task is a new conversation, so it restarts per task.',
      'Thinking is shown only as the harness gives it and is labelled “summarized” when it is a summary; it is never presented as the full reasoning.',
      'Token figures keep the M10 rules: cached ⊂ input and reasoning ⊂ output are shown apart and never added.',
    ] } }),
    S('HarnessLiveStreaming', 'Live view · edit streaming', { sizes: ['wide'], focus: { wide: [['code', 'Vertical #live-code']] }, render: (sz, f) => harnessLive(sz, f, { adds: 2, rate: 58.6, ctx: 83.9 }), legend: { screen: 'HarnessLiveScreen', file: 'tui/screens/live.py', tree: LIVE_TREE, sel: LIVE_SEL, keys: LIVE_KEYS, states: LIVE_STATES, notes: [
      'While the harness streams an edit, added lines appear as they arrive with a block caret on the newest; the pane follows unless f pauses it.',
      'The file is final only when the harness saves it; the diff is against the previous task commit, which is the workspace this task started from.',
    ] } }),
    S('HarnessLiveLimited', 'Live view · less exposed', { sizes: ['wide'], focus: { wide: [['code', 'Vertical #live-code']] }, render: (sz, f) => harnessLive(sz, f, { who: 'grok' }), legend: { screen: 'HarnessLiveScreen', file: 'tui/screens/live.py', tree: LIVE_TREE, sel: LIVE_SEL, keys: LIVE_KEYS, states: LIVE_STATES, notes: [
      'Grok CLI reports neither context nor reasoning while it runs: context stays “? not reported” with no bar, and t is dimmed through check_action.',
      'Unknown is never estimated silently: each value names its source (harness, endpoint or measured from the stream).',
      'The code pane works for every harness, because it is read from the configuration’s own workspace, not from the model stream.',
    ] } }),
  ] },
  { id: 'm11-lifecycle', page: 'm11', title: 'M11 · 3 · Detach, reconnect and stop', note: 'Execution outlives the interface. Detaching, closing the terminal or quitting only stops observing; reconnecting observes the same processes without restarting anything. Stopping is the one explicit action that ends work, for one configuration or the whole run, and it cleans up child processes and application services. Frozen inputs cannot be edited while the run is active.', boards: [
    S('RunDetach', 'Detach', { sizes: ['wide'], focus: { wide: [['detach', 'Button #detach']] }, render: (sz, f) => runDetach(sz, f), legend: { screen: 'DetachScreen', file: 'tui/screens/run.py', tree: DETACH_TREE, sel: modalSel('DetachScreen', '#detach', 84), keys: MODAL_KEYS([['enter', 'detach', 'Return to the Library; the run continues']]), states: RUN_STATES, notes: ['Disconnecting is not an interruption and is never recorded as one (R046, R060, R139).', 'Reattach from the Library (ctrl+r) or with axbenchmark --attach RUN_ID (M14).'] } }),
    S('RunReattached', 'Reattached', { sizes: ['wide'], focus: LANES, render: (sz, f) => runOverview(sz, f, { reattached: true }), legend: runLegend([
      'Reattaching observes existing work; no task restarts and no new trial starts (R046, R138).',
      'The detached interval is shown so a gap in observation is not mistaken for a gap in execution.',
    ]) }),
    S('StopConfirm', 'Stop · confirm and clean up', { sizes: ['wide'], focus: { wide: [['scope', 'RadioSet #stop-scope'], ['items', 'DataTable #cleanup'], ['stop', 'Button #stop']] }, render: (sz, f) => stopConfirm(sz, f), legend: { screen: 'StopScreen', file: 'tui/screens/run.py', tree: STOP_TREE, sel: [...modalSel('StopScreen', '#stop', 86), ['#cleanup', 'height: 5;']], keys: MODAL_KEYS([['enter', 'stop', 'Stop and clean up the chosen scope']]), states: RUN_STATES, notes: ['Stopping a configuration or the run ends its process tree and application services (R046, R139).', 'The stopped task is saved as interrupted; later tasks are not run, never zero (M10).'] } }),
    S('StopCleanup', 'Stop · cleaning up', { sizes: ['wide'], render: (sz) => stopCleanup(sz), legend: { screen: 'StoppingScreen', file: 'tui/screens/run.py', tree: 'StoppingScreen(ModalScreen[None])\n├─ Vertical #stopping .dialog\n│  ├─ Vertical #stop-steps\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('StoppingScreen', '#stopping', 84), keys: [['esc', 'dismiss', 'Hide; cleanup continues']], states: RUN_STATES, notes: ['The stop is reported only after processes, services, browser context and ports are released (R139).'] } }),
    S('ActiveLocked', 'Frozen while running', { sizes: ['wide'], render: (sz) => activeLocked(sz), legend: { screen: 'LockedScreen', file: 'tui/screens/run.py', tree: 'LockedScreen(ModalScreen[None])\n├─ Vertical #locked .dialog\n│  ├─ DataTable #allowed\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('LockedScreen', '#locked', 84), keys: [['esc', 'dismiss', 'Close']], states: RUN_STATES, notes: ['Allowed while running: inspect, detach, reconnect, stop (R047).', 'Template mutation during the run halts the whole run and invalidates the identity claim; it is never relabelled (R067, D9 · RunHalted).'] } }),
  ] },
];

// ---------------------------------------------------------------- M12 · quality judging

const JUDGING_TREE = `JudgingScreen(Screen)          after the last configuration
├─ Header · Static #judging-bar
├─ DataTable #reviews .bordered   label · status · grades · cost · one row per trial
├─ DataTable #trial-quality       mean · min–max, N trials only
├─ Horizontal
│  ├─ Vertical #current .pane      fresh session, read-only copy
│  │  └─ ProgressBar
│  └─ Static #inputs .pane         given · never given
├─ Static .notice.-error          ungraded (finished state)
└─ Footer`;
const JUDGING_SEL = [
  ['#reviews', 'height: 6;  cursor_type = "row"'],
  ['#current, #inputs', 'width: 1fr; height: 17;'],
  ['#inputs .-withheld', 'color: $foreground 60%;'],
  ['#trial-quality', 'height: 5;  display: none with 1 trial'],
  ['Screen.-compact #current', 'display: none;'],
];
const JUDGING_KEYS = [
  ['enter', 'open_review', 'ReviewScreen for a graded or ungraded artifact'],
  ['p', 'profiles', 'Grading profiles and anchors'],
  ['d', 'detach', 'Leave; judging continues'],
  ['s', 'stop_judging', 'Stop judging; unreviewed artifacts stay not judged'],
];
const J_STATES = [['In progress', 'Judging'], ['Finished · 1 ungraded', 'JudgingDone'], ['3 trials', 'JudgingTrials'], ['Trials ranked (M06)', 'RankingsTrials'], ['Ungraded review', 'ReviewUngraded'], ['Complete review', 'ReviewDetail'], ['Profiles', 'RubricProfiles'], ['No screenshot support', 'JudgeCapability'], ['Judge input (M08)', 'JudgeHandoff']];
const judgingLegend = (notes) => ({ screen: 'JudgingScreen', file: 'tui/screens/judging.py', tree: JUDGING_TREE, sel: JUDGING_SEL, keys: JUDGING_KEYS, states: J_STATES, notes });

const REVIEW_TREE = `ReviewScreen(Screen)           enter on a review
├─ Header · Static #review-bar
├─ DataTable #grades .bordered    raw grade · anchor · evidence
├─ Horizontal
│  ├─ VerticalScroll #comments .pane   code · usability · spec
│  └─ Static #review-meta .pane.kv     record · limitations
├─ Horizontal .actions
└─ Footer`;

const M12 = [
  { id: 'm12-judging', page: 'm12', title: 'M12 · 1 · Sequential independent reviews', note: 'After execution each delivered artifact is reviewed in its own fresh headless session, one at a time, under an anonymous label; with N trials each trial is its own artifact and session. The judge receives the artifact, specification, rubric, acceptance evidence and the screenshots of the final regression, never cost, time or other reviews, and it never repairs anything. A malformed or incomplete response stays ungraded; nothing is filled in.', boards: [
    S('Judging', 'Judging · in progress', { sizes: ['wide', 'compact'], focus: { wide: [['queue', 'DataTable #reviews'], ['now', 'Vertical #current'], ['inputs', 'Static #inputs']], compact: [['queue', 'DataTable #reviews'], ['inputs', 'Static #inputs']] }, render: (sz, f) => judging(sz, f), legend: judgingLegend([
      'One fresh session per artifact, in sequence; no earlier conversation or review is carried over (R083).',
      'Labels are anonymous to the judge; the label → result mapping stays with AxBenchmark (R083).',
      'Judging cost is its own column and is recorded through M10, apart from competitor cost (R082).',
      'D12: the screenshots given are the 14 of the final regression on the delivered artifact, at 1440×1000 and 390×844; per-task screenshots stay in evidence, results and the report.',
    ]) }),
    S('JudgingDone', 'Judging · finished, 1 ungraded', { sizes: ['wide'], focus: { wide: [['queue', 'DataTable #reviews'], ['open', 'Button #open-ungraded']] }, render: (sz, f) => judging(sz, f, { ungraded: true }), legend: judgingLegend([
      'An invalid response is preserved and explained, and the result is ungraded (R084).',
      'Ungraded results stay out of quality and combined rankings with that reason (M06).',
    ]) }),
    S('JudgingTrials', 'Judging · 3 trials per configuration', { sizes: ['wide'], focus: { wide: [['queue', 'DataTable #reviews'], ['summary', 'DataTable #trial-quality'], ['inputs', 'Static #inputs']] }, render: (sz, f) => judgingTrials(sz, f), legend: judgingLegend([
      'D7: Orders REST API r3, run 2026-09-27-t (TRIAL_CONFIGS). Six artifacts, six fresh sessions: each trial is judged separately under its own anonymous label.',
      '#trial-quality shows the mean and min–max per category and of Q, computed by AxBenchmark; rankings use the mean Q.',
      'A configuration is eligible only when every trial is: Claude Code trial 2 (spec 3.5, 1 failed check) keeps it out of rankings, with that reason.',
      'Backend profile: no screenshots are part of this template’s final regression.',
    ]) }),
    S('ReviewUngraded', 'Review · not graded', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['table', 'DataTable #validation'], ['raw', 'Button #raw']] }, render: (sz, f) => reviewUngraded(sz, f), legend: { screen: 'UngradedReviewScreen', file: 'tui/screens/judging.py', tree: 'UngradedReviewScreen(ModalScreen[None])\n├─ Vertical #ungraded-review .dialog\n│  ├─ DataTable #validation\n│  ├─ Static #kept .kv\n│  ├─ Static #consequences\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('UngradedReviewScreen', '#ungraded-review', 86), ['#validation', 'height: 7;']], keys: MODAL_KEYS([['r', 'raw', 'Open the preserved raw response']]), states: J_STATES, notes: ['Missing category, a value off the 0.5 grid, a missing evidence reference and missing commentary each make a review ungraded (R084).', 'No averages, zeroes or guesses; checks and process outcomes stay as they are (R144).'] } }),
  ] },
  { id: 'm12-review', page: 'm12', title: 'M12 · 2 · Review contract, profiles and judge capability', note: 'A complete review has a 1–5 grade in 0.5 steps for every rubric category with evidence references, limitations and comments on code quality, usability and specification adherence. AxBenchmark computes weighted quality from those raw grades. Web and backend profiles each have six categories; one profile applies to the whole comparison. UI judging needs a judge whose screenshot inspection is known.', boards: [
    S('ReviewDetail', 'Review · complete', { sizes: ['wide'], focus: { wide: [['grades', 'DataTable #grades'], ['comments', 'VerticalScroll #comments'], ['meta', 'Static #review-meta'], ['raw', 'Button #raw']] }, render: (sz, f) => reviewDetail(sz, f), legend: { screen: 'ReviewScreen', file: 'tui/screens/judging.py', tree: REVIEW_TREE, sel: [['#grades', 'height: 9;'], ['#comments', 'width: 80; height: 18;'], ['#review-meta', 'width: 40; height: 18;']], keys: [['esc', 'app.pop_screen', 'Back'], ['e', 'evidence', 'Open referenced screenshots and traces'], ['b', 'breakdown', 'Score breakdown (M06)'], ['r', 'raw', 'Raw judge response']], states: J_STATES, notes: ['R-0928a-1, judge group A: the grades of results-data.mjs; Q = 4.40 as on Rankings (R084, M06).', 'Anchors: 1 missing or largely broken · 3 usable with material gaps · 5 excellent for the scope (R084).', 'Screenshot references name final-regression shots (D12): page and viewport, not a task.', 'Judging time 3:10 matches the Timing frame (M10).'] } }),
    S('RubricProfiles', 'Grading profiles', { sizes: ['wide'], render: (sz) => rubricProfiles(sz), legend: { screen: 'ProfilesScreen', file: 'tui/screens/judging.py', tree: 'ProfilesScreen(ModalScreen[None])\n├─ Vertical #profiles .dialog\n│  ├─ DataTable #profile-table\n│  ├─ Static #profile-notes .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('ProfilesScreen', '#profiles', 86), keys: [['esc', 'dismiss', 'Close'], ['w', 'weights', 'Quality weights (M06)']], states: J_STATES, notes: ['Web: UX 25, visual 15, code 20, spec 25, robustness 10, accessibility 5. Backend: developer experience, API/interface, code, spec, robustness, operability/docs, same weights (R085–R091).'] } }),
    S('JudgeCapability', 'Judge cannot inspect screenshots', { sizes: ['wide'], focus: { wide: [['choose', 'Button #choose-judge']] }, render: (sz, f) => judgeCapability(sz, f), legend: { screen: 'JudgeCapabilityScreen', file: 'tui/screens/setup.py', tree: 'JudgeCapabilityScreen(ModalScreen[Action])\n├─ Vertical #judge-capability .dialog\n│  ├─ Static .notice.-error\n│  ├─ Static #capability .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('JudgeCapabilityScreen', '#judge-capability', 84), keys: MODAL_KEYS([['j', 'judge', 'Back to the judge picker (M07)']]), states: J_STATES, notes: ['Setup names the issue before launch; capability comes from the catalog (M04), never from a model name (R084).', 'No other judge is substituted.'] } }),
  ] },
];

// ---------------------------------------------------------------- M13 · HTML report

const GEN_TREE = `ReportGenerateScreen(ModalScreen[ReportRequest | None])   h from Results
├─ Vertical #report-generate .dialog
│  ├─ Static #report-scope .kv
│  ├─ RadioSet #report-weights     original · alternative
│  ├─ Static #weights-origin .kv   per judge group, when frozen weights differ
│  ├─ SelectionList #report-contents
│  ├─ Input #report-path
│  └─ Horizontal .dialog-actions
└─ Footer`;
const R_STATES = [['Generate', 'ReportGenerate'], ['Weights differ', 'ReportGenerateDefaults'], ['Profile defaults (M06)', 'RankingsProfileDefaults'], ['Progress', 'ReportProgress'], ['Path · open failed', 'ReportReady'], ['The HTML file', 'ReportPage'], ['CLI report', 'CliExchange']];

const M13 = [
  { id: 'm13-generate', page: 'm13', title: 'M13 · 1 · Generate from retained results', note: 'The report is built only from retained results of one template SHA-256, with no model calls. The dialog shows the scope, judge groups, which weights open first and every included part. Text from prompts, logs and reviews is escaped. At the end the app tries to open the file and always shows its path.', boards: [
    S('ReportGenerate', 'Generate HTML report', { sizes: ['wide'], focus: { wide: [['weights', 'RadioSet #report-weights'], ['contents', 'SelectionList #report-contents'], ['path', 'Input #report-path'], ['generate', 'Button #generate']] }, render: (sz, f) => reportGenerate(sz, f), legend: { screen: 'ReportGenerateScreen', file: 'tui/screens/results.py', tree: GEN_TREE, sel: [...modalSel('ReportGenerateScreen', '#report-generate', 86), ['#report-contents', 'height: 7; border: none;']], keys: MODAL_KEYS([['ctrl+s', 'generate', 'Write the report']]), states: R_STATES, notes: ['Full SHA-256 is shown because identity is the subject; it is printed in every report (R131).', 'Both tables and all three chart groups are always included (R148).', 'Unknown-cost and partial-cost results are left off the log axis and explained, never dropped from tables (R132, D11).'] } }),
    S('ReportGenerateDefaults', 'Generate · original weights differ', { sizes: ['wide'], focus: { wide: [['weights', 'RadioSet #report-weights'], ['generate', 'Button #generate']] }, render: (sz, f) => reportGenerate(sz, f, { differ: true }), legend: { screen: 'ReportGenerateScreen', file: 'tui/screens/results.py', tree: GEN_TREE, sel: [...modalSel('ReportGenerateScreen', '#report-generate', 86), ['#weights-origin', 'height: 4;  only when a judge group’s frozen weights differ']], keys: MODAL_KEYS([['ctrl+s', 'generate', 'Write the report']]), states: R_STATES, notes: [
      'D13: if every result of a judge group froze the same weights, they are used and labelled “original”; otherwise the profile’s SPEC §6 defaults, labelled “Profile defaults: original weights differ across results”.',
      'Group B here: R-0924lab-1…3 froze 1 : 1 : 1 and R-0919lab-1 froze 2 : 1 : 1. Each result’s own weights stay selectable in the file, plus custom weights.',
      'Within one combined ranking, quality always uses the same category weights for every entry.',
    ] } }),
    S('ReportProgress', 'Generating', { sizes: ['wide'], render: (sz) => reportProgress(sz), legend: { screen: 'ReportProgressScreen', file: 'tui/screens/results.py', tree: 'ReportProgressScreen(ModalScreen[Path])\n├─ Vertical #report-progress .dialog\n│  ├─ Vertical #report-steps\n│  │  └─ ProgressBar\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('ReportProgressScreen', '#report-progress', 84), keys: [['esc', 'cancel', 'Cancel; nothing is written']], states: R_STATES, notes: ['Original measurements, grades and weights are only read (R134).', 'Hostile markup in competitor material stays inert text (R125, R133).', 'Ends in ReportReady (M02), which always shows the path.'] } }),
  ] },
  { id: 'm13-file', page: 'm13', title: 'M13 · 2 · The generated HTML file', note: 'A wireframe of the report itself: one offline HTML5 file with inline vanilla JavaScript and CSS. Header with the full SHA-256, filters, both weight sets and the electricity tariff as an analysis setting with apply, reset and export, the three top-five charts, the log-cost scatter, the stacked combined ranking, the measured table (basis, price source, trial) and quality table, task evidence and hardware timelines. Every number is computed with the M06 contract from the 12 results shown in M02; partial and unknown costs never rank where cost is weighted.', boards: [
    { name: 'ReportPage', title: 'Report · standalone HTML', special: 'report', legend: null },
  ] },
];

// ---------------------------------------------------------------- M14 · command line

const CLI_SEL = [
  ['stdout', 'results and progress, one line per event · no colour needed'],
  ['stderr', 'problems, one per line, prefixed ✗'],
  ['glyphs', '✓ ✗ ▲ ● ○ ? as in the TUI, always with words'],
  ['TTY', 'run never prompts; a missing choice is an error · only doctor --verify reads stdin: [y/N] on a terminal, --yes otherwise (no terminal and no --yes: exit 2)'],
  ['exit', '0 success (a completed run, even with failed tasks or a failed report) · 1 typed error · 2 usage · 3 engine unreachable or incompatible'],
  ['--json', 'status RUN_ID --json is the machine-readable state; scripts read task failures there'],
];
const CLI_STATES = [['--help', 'CliHelp'], ['run --no-tui', 'CliRun'], ['Trials · report wait', 'CliRunReport'], ['Invalid config', 'CliInvalid'], ['Halted · exit 1', 'CliHalted'], ['status · stop', 'CliStatusStop'], ['doctor · refresh', 'CliDoctor'], ['doctor --verify', 'CliVerify'], ['Exchange · report', 'CliExchange'], ['TUI run', 'RunOverview']];
const cliLegend = (screen, tree, keys, notes) => ({ screen, file: 'axbenchmark/cli.py', tree, sel: CLI_SEL, selTitle: 'Output contract', keys, keysTitle: 'Arguments and exit codes', states: CLI_STATES, notes });

const M14 = [
  { id: 'm14-run', page: 'm14', title: 'M14 · 1 · Commands and unattended runs', note: 'Twelve signatures, each delegating to the same contract as the TUI. A bare axbenchmark opens the TUI. run --no-tui needs a complete configuration, validates and freezes it exactly like Review before launch, prints plain progress and never asks a question; anything incomplete is explained and nothing starts.', boards: [
    S('CliHelp', 'axbenchmark --help', { sizes: ['wide'], render: (sz) => cliHelp(sz), legend: cliLegend('axbenchmark --help', 'axbenchmark\n├─ (no command)         → TUI (M15)\n├─ --attach RUN_ID      → M11 observe\n├─ run                  → M07 + M11\n├─ status · stop        → M11\n├─ models refresh       → M04\n├─ doctor               → M03\n├─ report               → M13\n├─ templates export · import  → M01 + M17\n└─ results export · import    → M02 + M17', [['--help', '', 'This screen'], ['exit 0', '', 'success · includes a run that completed with failed or unverified tasks'], ['exit 1', '', 'typed error · package rejected, not found, incomplete configuration, followed run stopped or interrupted'], ['exit 2', '', 'usage · unknown command, option or argument'], ['exit 3', '', 'engine unreachable or incompatible']], [
      'All twelve required signatures are listed with their placeholders (R048–R059).',
      'Exit codes 0–3 are settled (D1, W8). Task failures never change the exit code of a completed run; scripts read them from status RUN_ID --json.',
    ]) }),
    S('CliRun', 'run --no-tui', { sizes: ['wide', 'compact'], render: (sz) => cliRun(sz), legend: cliLegend('axbenchmark run --no-tui', 'run\n├─ --config FILE     complete configuration\n├─ --no-tui          plain progress\n└─ --jobs N          default: per harness, ≤ 4', [['--config FILE', '', 'template SHA-256, entries, policy, judge, both weight sets'], ['--jobs 1', '', 'one configuration at a time (M11)'], ['Ctrl-C', '', 'stops watching only; the run continues'], ['exit 0 · 1', '', 'followed to the end: 0 completed (even with failed tasks) · 1 stopped or interrupted, with the reason']], [
      'Validation and freezing are the same as interactive launch (R050, R067).',
      'Pi runs on a local endpoint in a parallel run, so its cost is printed as unknown (D4).',
      'Run 2026-10-02-a is the queued run drawn on the M11 page (R045, R138).',
      'All model work runs headlessly; nothing waits for input (R060).',
      'R3-2: the frozen records include the price snapshot and the rate snapshot with the display currency (USD here).',
      'R3-3: followed to its end, run waits for the completion report and prints its path (CliRunReport); --no-wait-report skips the wait.',
    ]) }),
    S('CliRunReport', 'run · trial budget warning · report wait', { sizes: ['wide'], render: (sz) => cliRunReport(sz), legend: cliLegend('axbenchmark run --no-tui', 'run --no-tui\n├─ ▲ trial_budget_warning   printed, never asked\n├─ followed to the end\n│  └─ completion report      path · or error + regeneration command\n└─ --no-wait-report          exit after the outcome', [['--no-wait-report', '', 'exit after the outcome line; the engine still writes the report; the regeneration command is printed'], ['exit 0', '', 'a completed run, whether the report was written, failed or not waited for'], ['Ctrl-C', '', 'detaches, also while waiting for the report']], [
      'R3-7: more than 5 trials for a configuration not on a local endpoint returns trial_budget_warning from M07. Unattended, it is printed as a ▲ line with the totals (5 × 6 × 7 = 210 task runs, 30 judge sessions) and the launch continues without reading stdin. The TUI shows the same totals in ConfirmScreen (TrialBudgetWarning).',
      'No warning when every configuration above 5 trials is on a local endpoint. There is no upper limit on trials.',
      'R3-3: after a completed run, run waits for M13’s completion report and prints its path and open attempt. A failed report prints its error (reports.write_failed) and axbenchmark report RUN_ID, and still exits 0.',
      'A stopped or interrupted run has no completion report, so there is nothing to wait for (CliHalted).',
    ]) }),
    S('CliInvalid', 'run · incomplete configuration', { sizes: ['wide'], render: (sz) => cliInvalid(sz), legend: cliLegend('axbenchmark run --no-tui', 'run\n└─ validate (M07) → 4 problems → exit 1', [['exit 1', '', 'typed error: incomplete configuration · nothing frozen or started'], ['exit 2', '', 'only for usage errors, e.g. an unknown option']], [
      'Incomplete unattended settings get a useful explanation instead of a prompt (R050, R060).',
      'Nothing is substituted: no other effort, judge or preset is chosen (M04, M07).',
    ]) }),
    S('CliHalted', 'run · halted, then status', { sizes: ['wide'], render: (sz) => cliHalted(sz), legend: cliLegend('axbenchmark run --no-tui · status', 'run --no-tui      followed to the end\n└─ halted → reason → exit 1\nstatus RUN_ID     always exit 0\n└─ --json         machine-readable state', [['exit 1', '', 'the followed run was interrupted; the reason is printed'], ['exit 0', '', 'status read, whatever the run state'], ['--json', '', 'configurations[] with harness, state, checks']], [
      'D9: run 2026-09-29-c halts when approved files change on disk (RunHalted). The reason, both SHA-256 and the changed paths are printed, then exit 1.',
      'D1: status exits 0 whatever the run state; run 2026-09-28-a completed with 3 failed and 1 unverified check and exited 0, and status --json shows them.',
    ]) }),
  ] },
  { id: 'm14-ops', page: 'm14', title: 'M14 · 2 · Observe, stop, check and exchange', note: 'status reads saved state without a TUI, including real failures; stop is the explicit end with cleanup. doctor and models refresh use M03 and M04 and keep data-only work available. Imports are data operations: identities and digests are recomputed, nothing runs, and a rejected package adds nothing. Reports regenerate from retained results without model calls.', boards: [
    S('CliStatusStop', 'status · stop', { sizes: ['wide'], render: (sz) => cliStatusStop(sz), legend: cliLegend('axbenchmark status · stop', 'status RUN_ID   saved state (M11)\nstop RUN_ID     explicit stop + cleanup', [['RUN_ID', '', 'run folder name, e.g. 2026-09-30-b'], ['exit 0', '', 'status read / stop completed']], [
      'Status does not depend on an attached TUI and keeps the authentication failure visible after the stop (R051, R060). It exits 0 whatever the run state (D1).',
      'Stop cleans up child processes and services before it reports (R052, R139).',
      'Run 2026-09-30-b is the failures frame on the M11 page.',
    ]) }),
    S('CliDoctor', 'doctor · models refresh', { sizes: ['wide'], render: (sz) => cliDoctor(sz), legend: cliLegend('axbenchmark doctor · models refresh', 'doctor          readiness (M03)\n└─ approved revisions with changed read-only modes (M01 audit)\nmodels refresh  discovery + prices + exchange rates (M04)', [['exit 0', '', 'checks ran; problems are reported, not fatal'], ['exit 3', '', 'engine unreachable or incompatible']], [
      'Collector problems name their cause and never block a run (R054, R103). D5: an insufficient permission points to the collector guide; there is no root mode and no sudo suggestion.',
      'A failed provider keeps the last valid catalog and all overrides (R053, R063, R064).',
      'D4: refresh prints one price line per provider with source and retrieval date, or “kept last valid prices”. Prices are never fetched during a run. R3-5: first-version price sources are Anthropic, OpenAI and xAI; other providers use bundled prices and overrides.',
      'R3-2: the same refresh prints one line per rate source (source URL, source date, retrieval date, currencies collected to USD) and lists user-supplied rates as kept and labelled. Rates are never fetched during a run.',
      'R3-6: approved revision files stay read-only (files 0444, folders 0555). doctor lists each revision folder whose modes were changed, with expected and found modes and the restore remedy; it never offers chmod or sudo and the CLI never changes modes.',
    ]) }),
    S('CliVerify', 'doctor --verify', { sizes: ['wide'], render: (sz) => cliVerify(sz), legend: cliLegend('axbenchmark doctor --verify', 'doctor --verify [--harness H] [--yes]\n├─ terminal: [y/N] listing the harnesses\n├─ --yes: no prompt\n├─ no terminal, no --yes → exit 2\n├─ one minimal call per callable harness\n└─ outcome recorded in readiness (M03)', [['--verify', '', 'headless, no model or effort argument, no tools, 60 s deadline'], ['--yes', '', 'consent without a prompt; required without a terminal'], ['exit 0', '', 'checks ran, whatever their outcome · or consent declined'], ['exit 2', '', 'no terminal and no --yes · nothing sent']], [
      'D15: the CLI form of “Verify now”. Undetermined harnesses are confirmed with the user’s consent; failed ones are skipped until fixed.',
      'The recorded outcome drives planner preselection (PlannerPicker) and readiness everywhere.',
      'Without --verify, doctor never calls a model.',
      'R3-4: on a terminal the [y/N] prompt lists the harnesses and that each makes one minimal model call; the default is No (“No verification call was made.”, exit 0). --yes consents without a prompt. Without a terminal and without --yes: exit 2, a message naming --yes, nothing sent.',
    ]) }),
    S('CliExchange', 'exchange · report', { sizes: ['wide'], render: (sz) => cliExchange(sz), legend: cliLegend('axbenchmark templates · results · report', 'templates export SHA --output\ntemplates import ZIP\nresults import ZIP --template SHA\nresults export RUN_ID --output\nreport RUN_DIR', [['exit 1', '', 'typed error: package rejected · nothing added'], ['TEMPLATE_SHA', '', 'full SHA-256 or an unambiguous prefix']], [
      'Expected and received identities are shown in full on mismatch (R057, R120).',
      'Identical re-imports are skipped, so importing is idempotent (R122).',
      'The report path is printed even when no browser opens (R055, R134).',
    ]) }),
  ] },
];


// ---------------------------------------------------------------- M15 · terminal interface

const PROMPT_TREE = `PromptScreen(ModalScreen[str | None])   shared · one typed value
├─ Vertical #prompt .dialog
│  ├─ Static #prompt-label
│  ├─ Input #prompt-input
│  ├─ Static #prompt-error           typed error · dialog stays open
│  └─ Horizontal .dialog-actions
│     ├─ Button #cancel
│     └─ Button #ok .-primary
└─ Footer`;
const PROMPT_STATES = [['Save preset', 'PromptSavePreset'], ['Export configuration', 'PromptExportConfig'], ['Export CSV', 'PromptExportCsv'], ['Alternative weights', 'RankingsAlternative'], ['Telemetry', 'Telemetry']];
const promptLegend = (opened, notes) => ({ screen: 'PromptScreen', file: 'tui/widgets/prompt.py', tree: PROMPT_TREE, sel: [...modalSel('PromptScreen', '#prompt', 76), ['#prompt-input', 'width: 1fr;  validate_on = ["submitted"]'], ['#prompt-error', 'text-style: bold; display: none until a typed error']], keys: [['esc', 'dismiss(None)', 'Cancel; nothing changes'], ['enter', 'submit', 'Validate; dismiss(value) only when valid'], ['tab', 'focus_next', 'Input, Cancel, OK']], states: PROMPT_STATES, notes: [`Opened by ${opened}.`, ...notes] });

const M15 = [
  { id: 'm15-tui', page: 'm15', title: 'M15 · Keys, views and small terminals', note: 'The five views are Library, Environment, Setup, Run and Results, drawn on their module pages. Every screen shows its keys in the footer, every key is a palette command, and everything is clickable. From 100×30 the run shows four live panels in a 2×2 grid; below that it becomes list and detail with the same search, scrolling and task details. No tmux.', boards: [
    S('HelpKeys', 'Keys and views', { sizes: ['wide'], focus: { wide: [['views', 'DataTable #views'], ['close', 'Button #close']] }, render: (sz, f) => helpKeys(sz, f), legend: { screen: 'HelpScreen', file: 'tui/screens/help.py', tree: 'HelpScreen(ModalScreen[str | None])   ? from any screen\n├─ Vertical #help .dialog\n│  ├─ DataTable #views          enter switches view\n│  ├─ Static #global-keys .kv\n│  ├─ Static #mouse .kv\n│  ├─ Static #sizes .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('HelpScreen', '#help', 86), ['#views', 'height: 6;  cursor_type = "row"']], keys: MODAL_KEYS([['enter', 'switch_view', 'Go to the selected view'], ['F1–F4 · F6', 'app.switch_view', 'Library · Environment · Setup · Run · Results']]), states: [['Library', 'Library'], ['Environment', 'Environment'], ['Setup', 'Setup'], ['Run 2×2', 'RunOverview'], ['Run list/detail', 'RunListDetail'], ['Results', 'Results'], ['Palette', 'CommandPalette']], notes: [
      'View keys are a proposal; F5 is left to Recheck and Refresh, which already use it (R038).',
      'Bindings that cannot run are dimmed, never hidden; q with an active run only detaches (R046).',
      'Resizing switches layouts without losing focus or the selected configuration (R044).',
    ] } }),
    S('RunListDetail', 'Run · list and detail', { sizes: ['compact'], focus: { compact: [['list', 'ListView #lane-list'], ['tasks', 'Vertical #lane-detail'], ['search', 'Input #log-search'], ['log', 'RichLog #log']] }, render: (sz, f) => runListDetail(sz, f), legend: { screen: 'RunScreen · -compact', file: 'tui/screens/run.py', tree: 'RunScreen(Screen)              Screen.-compact\n├─ Header · Static #run-bar\n├─ Horizontal\n│  ├─ ListView #lane-list .pane   one item per configuration\n│  └─ Vertical #detail\n│     ├─ Vertical #lane-detail .pane\n│     └─ RichLog #log .bordered\n│        └─ Input #log-search\n└─ Footer', sel: [['Screen.-compact #lanes', 'display: none;'], ['#lane-list', 'width: 26;'], ['#detail', 'width: 1fr;'], ['#log .-match', 'background: $primary 24%;']], keys: [['↑ ↓', 'cursor', 'Select a configuration; the detail follows'], ['enter', 'open_configuration', 'RunConfigScreen with all tasks'], ['v', 'live_view', 'HarnessLiveScreen for the selected configuration'], ['/', 'focus("#log-search")', 'Search the log; n next match'], ['s · d', 'stop · detach', 'Same as the 2×2 layout']], states: [['2×2 layout', 'RunOverview'], ['Configuration', 'RunConfig'], ['Halted run', 'RunHalted']], notes: [
      'Below 100×30 the four panels become a list with the selected configuration’s detail (R044). This is the only compact run layout; RunScreen has no compact table (W6).',
      'Log search, scrolling and task detail work the same in both layouts (R038, R044).',
    ] } }),
  ] },
  { id: 'm15-prompts', page: 'm15', title: 'M15 · Prompts · one value, typed', note: 'PromptScreen is the one shared dialog for a single typed value: a preset name or an export path. It opens over the screen that needs it, validates on enter, keeps the dialog open with the error in #prompt-error, and returns None on esc without changing anything.', boards: [
    S('PromptSavePreset', 'Prompt · Save preset…', { sizes: ['wide'], focus: { wide: [['input', 'Input #prompt-input'], ['ok', 'Button #ok']] }, render: (sz, f) => promptScreen(rankings(sz, 'none', { alt: true }), { title: 'Save preset', label: 'Name for these weights · quality web v1 25 15 20 25 10 5 · ranking 2 : 1 : 1', value: 'Cost first', hint: 'new name · offered in Setup and the weights editor', ok: 'Save preset', back: 'RankingsAlternative', focus: f }), legend: promptLegend('Save preset… on alternative weights (M06)', ['W2: “Save preset…” on RankingsAlternative opens the shared PromptScreen with the name as its value.', 'A name already in use is a typed error shown in #prompt-error; the dialog stays open.', 'Presets resolve into actual weights at launch (M07).']) }),
    S('PromptExportConfig', 'Prompt · Export configuration', { sizes: ['wide'], focus: { wide: [['input', 'Input #prompt-input'], ['ok', 'Button #ok']] }, render: (sz, f) => promptScreen(rankings(sz, 'none', { alt: true }), { title: 'Export configuration', label: 'Path for the configuration YAML · template SHA-256, entries, judge and these weights as its ranking weights', value: '~/bench/benchmark.yaml', error: 'file exists · choose another path · nothing was written', ok: 'Export', back: 'RankingsAlternative', focus: f }), legend: promptLegend('Export configuration on alternative weights (M06, M07)', ['W2: the typed error state. The path is kept so it can be corrected; OK stays available and validates again.', 'The file can be run with axbenchmark run --config (M14).', 'Exporting never changes the original weights of any result.']) }),
    S('PromptExportCsv', 'Prompt · Export CSV · telemetry', { sizes: ['wide'], focus: { wide: [['input', 'Input #prompt-input'], ['ok', 'Button #ok']] }, render: (sz, f) => promptScreen(telemetry(sz, 'none'), { title: 'Export CSV · telemetry', label: 'Path for the telemetry CSV of run 2026-09-24-lab · one row per sample with source, scope, actual interval and coverage', value: '~/bench/telemetry-2026-09-24-lab.csv', hint: '5 metrics · 1 row per sample · gaps stay empty, never 0', ok: 'Export', back: 'Telemetry', focus: f }), legend: promptLegend('Export CSV… on Telemetry (M18)', ['W2: #export-csv on TelemetryScreen (x) opens the shared PromptScreen with a default path.', 'Every row keeps its collector’s actual interval (D18), never the requested one.']) }),
  ] },
];

// ---------------------------------------------------------------- M16 · custom template planning

const PLAN_TREE = `PlanReviewScreen(Screen)       after planning
├─ Header · Static #draft-bar      draft, never a template · reopened
├─ TabbedContent #draft-tabs
│  ├─ TabPane "Specification"
│  ├─ TabPane "Tasks"
│  │  ├─ DataTable #draft-tasks .bordered
│  │  ├─ Static #draft-summary .pane.kv
│  │  │  └─ Input #draft-name       prefilled by the planner
│  │  └─ VerticalScroll #task-detail .pane
│  ├─ TabPane "Acceptance checks"
│  └─ TabPane "Setup · start · stop"
│     ├─ DataTable #services
│     ├─ Static #deps .pane.kv
│     └─ Static #protocol .pane.kv
├─ Horizontal .actions
└─ Footer`;
const PLAN_SEL = [
  ['#draft-bar', 'height: 1; background: $surface; text-style: bold;'],
  ['#draft-tasks', 'height: 9;  cursor_type = "row"'],
  ['#draft-tasks .-edited', 'text-style: bold;  “~ edited”'],
  ['#task-detail', 'width: 56; height: 25;'],
  ['#draft-name', 'width: 47;  editable until approval'],
  ['Screen.-compact #draft-summary', 'display: none;'],
];
const PLAN_KEYS = [
  ['e', 'edit', 'Edit the selected task and its checks · on Setup · start · stop: the selected service row'],
  ['r', 'regenerate', 'Regenerate a task, all tasks or the spec'],
  ['a', 'approve', 'Approve and save as r1 · computes the SHA-256'],
  ['1–4', 'show_tab', 'Specification · Tasks · Checks · Services'],
  ['esc', 'close', 'Close; the draft is kept, not approved'],
];
const P_STATES = [['New template (M01)', 'NewTemplateRepo'], ['Planner', 'PlannerPicker'], ['No default model', 'PlannerUnknownModel'], ['No usable harness', 'PlannerNoUsable'], ['Verify now', 'PlannerVerify'], ['Planning', 'PlanningProgress'], ['Review', 'PlanReview'], ['Reopened draft', 'PlanReopened'], ['Services', 'PlanServices'], ['Edit service', 'PlanServiceEdit'], ['Edit', 'PlanEdit'], ['Regenerate', 'PlanRegenerate'], ['Approve', 'PlanApprove'], ['Identical', 'PlanApproveIdentical'], ['Failed', 'PlanningFailed'], ['Interrupted', 'PlanningInterrupted'], ['Library drafts (M01)', 'Library']];
const planLegend = (notes) => ({ screen: 'PlanReviewScreen', file: 'tui/screens/planning.py', tree: PLAN_TREE, sel: PLAN_SEL, keys: PLAN_KEYS, states: P_STATES, notes });
const PLANNER_TREE = 'PlannerScreen(ModalScreen[Planner | None])\n├─ Vertical #planner .dialog\n│  ├─ Static #previous-choice · Static #no-usable .notice.-error\n│  ├─ DataTable #planner-order       readiness · catalog default model\n│  ├─ Vertical #planner-fields\n│  │  ├─ Input #planner-harness\n│  │  ├─ Input #planner-model · Static #model-source\n│  │  └─ RadioSet #planner-effort\n│  └─ Horizontal .dialog-actions     … · Button #verify-now · Button #start\n└─ Footer';
const plannerLegend = (keys, notes) => ({ screen: 'PlannerScreen', file: 'tui/screens/planning.py', tree: PLANNER_TREE, sel: [...modalSel('PlannerScreen', '#planner', 86), ['#planner-order', 'height: 5;'], ['#model-source', 'color: $foreground 60%;  source and date of the default'], ['#no-usable', 'display: none unless nothing is usable'], ['#verify-now', 'Button.-primary · only in the error state']], keys, states: P_STATES, notes });
const failedLegend = (notes) => ({ screen: 'PlanningFailedScreen', file: 'tui/screens/planning.py', tree: 'PlanningFailedScreen(ModalScreen[Action])\n├─ Vertical #planning-failed .dialog\n│  ├─ Static .notice.-error        reason: error · interrupted\n│  ├─ Vertical #planning-steps\n│  ├─ RadioSet #planning-next\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('PlanningFailedScreen', '#planning-failed', 84), keys: MODAL_KEYS([]), states: P_STATES, notes });
const approveLegend = (notes) => ({ screen: 'ApproveDraftScreen', file: 'tui/screens/planning.py', tree: 'ApproveDraftScreen(ModalScreen[bool])\n├─ Vertical #approve-draft .dialog\n│  ├─ Static .kv                     name · type · baseline · tasks\n│  ├─ Static #draft-sha · Static #identical\n│  └─ Horizontal .dialog-actions     … · Button #open-existing\n└─ Footer', sel: [...modalSel('ApproveDraftScreen', '#approve-draft', 86), ['#identical', 'display: none unless the SHA-256 already exists'], ['#approve:disabled', 'dimmed via check_action when identical']], keys: MODAL_KEYS([['enter', 'approve', 'Save r1 and open it · dimmed when identical'], ['o', 'open_existing', 'Open the identical revision']]), states: P_STATES, notes });

const M16 = [
  { id: 'm16-plan', page: 'm16', title: 'M16 · 1 · Planner, baseline capture and planning', note: 'Continues “New template” (M01) for a backend refactor of ~/code/acme-billing. The planner is preselected from a valid previous choice, else the first usable harness in the order Claude Code, Codex, Grok, Pi, with the catalog’s default model for it; undetermined harnesses are never preselected or run. Capture snapshots the committed revision (HEAD → a41f9c2) and never touches the repository. Drafts persist under ~/.axbenchmark/drafts/; a failed plan saves nothing reviewable.', boards: [
    S('PlannerPicker', 'Planner · fallback order', { sizes: ['wide'], focus: { wide: [['model', 'Input #planner-model'], ['order', 'DataTable #planner-order'], ['start', 'Button #start']] }, render: (sz, f) => plannerPicker(sz, f), legend: plannerLegend(MODAL_KEYS([['ctrl+s', 'start', 'Capture the baseline and plan']]), ['A previous choice that is no longer valid falls through to the fixed order (R031, D15).', 'D17: the model is the catalog’s default for this harness and account, read from the harness’s settings or status output at refresh without a model call, with source and date (M04, M05).', 'Detected but unusable harnesses are skipped (M03).']) }),
    S('PlannerUnknownModel', 'Planner · no default model', { sizes: ['wide'], focus: { wide: [['model', 'Input #planner-model'], ['order', 'DataTable #planner-order']] }, render: (sz, f) => plannerPicker(sz, f, { mode: 'unknown' }), legend: plannerLegend(MODAL_KEYS([['ctrl+s', 'start', 'Dimmed until a model is picked']]), ['D17: the catalog records no default model for Claude Code on this account, so #planner-model stays empty with a note and Start is dimmed.', 'The planner never runs without an explicit model, so the template’s provenance always names it.']) }),
    S('PlannerNoUsable', 'Planner · no confirmed-usable harness', { sizes: ['wide'], focus: { wide: [['verify', 'Button #verify-now'], ['order', 'DataTable #planner-order']] }, render: (sz, f) => plannerPicker(sz, f, { mode: 'none' }), legend: plannerLegend(MODAL_KEYS([['v', 'verify_now', 'Consent, then one minimal call per harness (M03 verify job)'], ['ctrl+s', 'start', 'Dimmed: nothing usable']]), ['D15: undetermined harnesses (login found, headless not confirmed) are never preselected or run for planning; with none usable, planning shows this error.', 'Verify now opens the shared ConfirmScreen (PlannerVerify); Grok CLI and Pi are skipped until their failure is fixed (M03).', 'Same machine state as CliVerify (M14) before verification.']) }),
    S('PlannerVerify', 'Planner · Verify now consent', { sizes: ['wide'], focus: { wide: [['verify', 'Button #ok'], ['cancel', 'Button #cancel']] }, render: (sz, f) => plannerVerify(sz, f), legend: { screen: 'ConfirmScreen', file: 'tui/widgets/confirm.py', tree: 'ConfirmScreen(ModalScreen[bool])   shared (M15)\n├─ Vertical #confirm .dialog\n│  ├─ Static #confirm-text\n│  └─ Horizontal .dialog-actions\n│     ├─ Button #cancel\n│     └─ Button #ok\n└─ Footer', sel: modalSel('ConfirmScreen', '#confirm', 72), keys: [['esc', 'dismiss(False)', 'Back to the planner; nothing is called'], ['enter', 'dismiss(True)', 'Run the verify job (M03)']], states: P_STATES, notes: ['D15: one minimal headless call per harness, no model or effort argument, no tools, 60 s deadline. The outcome is recorded in readiness and the first usable harness is then preselected.', 'Consent covers this request only; nothing is verified in the background.'] } }),
    S('PlanningProgress', 'Capture and plan', { sizes: ['wide'], render: (sz) => planningProgress(sz), legend: { screen: 'PlanningScreen', file: 'tui/screens/planning.py', tree: 'PlanningScreen(ModalScreen[Draft])\n├─ Vertical #planning .dialog\n│  ├─ Vertical #planning-steps\n│  │  └─ ProgressBar\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('PlanningScreen', '#planning', 84), keys: [['esc', 'hide', 'Hide; planning continues']], states: P_STATES, notes: ['The snapshot is the committed revision only; HEAD is never resolved again later (R068).', 'The source repository and its uncommitted work stay untouched (R140).', 'D10, W10: the draft is saved under ~/.axbenchmark/drafts/ and survives engine exit; while hidden the Library lists it as “planning”, then “ready for review” (the Library draft rows, M01).'] } }),
    S('PlanningFailed', 'Planning failed', { sizes: ['wide'], focus: { wide: [['retry', 'RadioSet #planning-next'], ['go', 'Button #continue']] }, render: (sz, f) => planningFailed(sz, f), legend: failedLegend(['No partial draft, earlier template or live working tree replaces a failed plan (R031, R068, R149).', 'W10: until the user chooses, the Library lists the draft as “failed”; Discard opens the shared ConfirmScreen (DraftDiscard, M01).']) }),
    S('PlanningInterrupted', 'Planning failed · interrupted, reopened', { sizes: ['wide'], focus: { wide: [['retry', 'RadioSet #planning-next'], ['go', 'Button #continue']] }, render: (sz, f) => planningFailed(sz, f, { interrupted: true }), legend: failedLegend(['W10: the Library’s “Photo gallery uploader · failed” draft, reopened with enter. The engine stopped while it was planning, so the draft is failed with reason “interrupted”.', 'The baseline snapshot is kept for a retry; the partial planner output is evidence only.']) }),
  ] },
  { id: 'm16-review', page: 'm16', title: 'M16 · 2 · Review, edit, regenerate and approve', note: 'The draft holds a specification, seven ordered tasks by default (the last one verifies and fixes), acceptance checks and setup/start/stop instructions. Everything can be edited or regenerated; generation is not approval. Approving computes the SHA-256 and saves r1, which later runs reuse without calling the planner.', boards: [
    S('PlanReview', 'Review the draft', { sizes: ['wide', 'compact'], focus: { wide: [['tasks', 'DataTable #draft-tasks'], ['detail', 'VerticalScroll #task-detail'], ['name', 'Input #draft-name'], ['edit', 'Button #edit']], compact: [['tasks', 'DataTable #draft-tasks'], ['detail', 'Static #task-detail']] }, render: (sz, f) => planReview(sz, f), legend: planLegend([
      'Seven tasks is the default for custom work, not a rule; T7 is final verification and fixes (R007, R031).',
      'W9: #draft-name is prefilled with the planner’s suggestion and editable until approval; after approval it is the lineage display name, editable without changing identity.',
      'Edited tasks are marked; the generated text is kept beside the edit.',
      'Planning cost is shown but is not a benchmark measurement.',
    ]) }),
    S('PlanReopened', 'Draft reopened from the Library', { sizes: ['wide'], focus: { wide: [['tasks', 'DataTable #draft-tasks'], ['name', 'Input #draft-name']] }, render: (sz, f) => planReview(sz, f, { reopened: true }), legend: planLegend([
      'W10: enter on a “ready for review” draft in the Library reopens it where it was left: same tab, selection and edits, with a toast.',
      'D10: drafts live under ~/.axbenchmark/drafts/ and survive closing the app and the engine; esc keeps the draft.',
    ]) }),
    S('PlanServices', 'Draft · setup, start and stop', { sizes: ['wide'], focus: { wide: [['services', 'DataTable #services'], ['deps', 'Static #deps'], ['approve', 'Button #approve']] }, render: (sz, f) => planServices(sz, f), legend: planLegend([
      'Setup, start and stop instructions are generated with the tasks and covered by the hash (R031, R115).',
      'e on a row opens the service editor (PlanServiceEdit, W9).',
      'Dependencies are declared, never installed during import (M17).',
    ]) }),
    S('PlanServiceEdit', 'Edit a service row', { sizes: ['wide'], focus: { wide: [['cwd', 'Input #service-cwd'], ['command', 'Input #service-command'], ['port', 'Input #service-port'], ['ready', 'Input #service-ready'], ['save', 'Button #save']] }, render: (sz, f) => planServiceEdit(sz, f), legend: { screen: 'ServiceEditScreen', file: 'tui/screens/planning.py', tree: 'ServiceEditScreen(ModalScreen[Service | None])   e on Setup · start · stop\n├─ Vertical #service-edit .dialog\n│  ├─ Input #service-command · Static .field-error\n│  ├─ Input #service-cwd · Static .field-error\n│  ├─ Input #service-port · Static .field-error\n│  ├─ Input #service-ready · Static .field-error\n│  ├─ Static #service-diff        changes from generated\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('ServiceEditScreen', '#service-edit', 86), ['Input.-invalid', 'text-style: bold;  validate_on = ["blur", "changed"]'], ['.field-error', 'height: 1;  ✓ hint or ✗ reason per field']], keys: MODAL_KEYS([['ctrl+s', 'save', 'Dimmed while a field is invalid'], ['ctrl+z', 'undo', 'Undo'], ['r', 'reset', 'Reset to the generated row']]), states: P_STATES, notes: [
      'W9 (R2-8): command, working directory, port and readiness check, each validated on its own, styled like the task editor with a diff against the generated row.',
      'The working directory must exist in the a41f9c2 snapshot; the port must come from the configuration’s range, never a fixed number.',
      'Edits change only the draft; after approval any change is a new revision.',
    ] } }),
    S('PlanEdit', 'Edit a task', { sizes: ['wide'], focus: { wide: [['text', 'TextArea #task-text'], ['checks', 'DataTable #task-checks'], ['done', 'Button #done']] }, render: (sz, f) => planEdit(sz, f), legend: { screen: 'TaskEditorScreen', file: 'tui/screens/planning.py', tree: 'TaskEditorScreen(Screen)\n├─ Header · Static #draft-bar\n├─ Input #task-title\n├─ Horizontal\n│  ├─ TextArea #task-text\n│  └─ Static #task-diff\n├─ DataTable #task-checks .bordered\n├─ Horizontal .actions\n└─ Footer', sel: [['#task-text', 'width: 60; height: 14;  language="markdown"'], ['#task-diff', 'width: 1fr;'], ['#task-checks', 'height: 10;']], keys: [['esc', 'done', 'Back to the draft'], ['ctrl+z', 'undo', 'Undo'], ['a', 'add_check', 'Add an acceptance check']], states: P_STATES, notes: ['Edits change only the draft; also used when revising an approved template into r2 (M01).', 'Checks may not add obligations the prompt does not state.'] } }),
    S('PlanRegenerate', 'Regenerate', { sizes: ['wide'], focus: { wide: [['scope', 'RadioSet #regen-scope'], ['guidance', 'Input #regen-guidance'], ['go', 'Button #regenerate']] }, render: (sz, f) => planRegenerate(sz, f), legend: { screen: 'RegenerateScreen', file: 'tui/screens/planning.py', tree: 'RegenerateScreen(ModalScreen[Request | None])\n├─ Vertical #regenerate .dialog\n│  ├─ RadioSet #regen-scope\n│  ├─ Input #regen-guidance\n│  ├─ Static .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('RegenerateScreen', '#regenerate', 84), keys: MODAL_KEYS([]), states: P_STATES, notes: ['Regeneration produces a new draft to review (R031).', 'An approved template is never regenerated (R030).'] } }),
    S('PlanApprove', 'Approve and save', { sizes: ['wide'], focus: { wide: [['approve', 'Button #approve']] }, render: (sz, f) => planApprove(sz, f), legend: approveLegend(['The saved template is the Library’s “Billing service refactor r1” (M01); its name comes from #draft-name and is the lineage display name.', 'Later runs and imports use the packaged baseline, never HEAD again (R068).']) }),
    S('PlanApproveIdentical', 'Approve · identical, blocked', { sizes: ['wide'], focus: { wide: [['open', 'Button #open-existing']] }, render: (sz, f) => planApproveIdentical(sz, f), legend: approveLegend(['D6: a duplicate whose computed SHA-256 equals an existing revision cannot be approved: “Identical to <label> — nothing to approve”, Approve dimmed, #open-existing opens that revision.', 'Renaming is done on the lineage display name, which never touches identity.']) }),
  ] },
];

// ---------------------------------------------------------------- M17 · ZIP exchange

const ZIP_STATES = [['Import (M01)', 'ImportTemplate'], ['Choose result ZIP', 'ResultPackagePick'], ['Unsafe', 'ImportUnsafe'], ['Incomplete', 'ImportIncomplete'], ['Digest mismatch', 'ImportRejected'], ['Identical', 'ImportDuplicate'], ['Result package', 'ResultPackage'], ['Template differs', 'ResultMismatch'], ['Separate revision', 'ResultEmbedded'], ['Id conflict', 'ResultImportConflict']];
const zipTree = (screen, id, rows) => `${screen}\n├─ Vertical ${id} .dialog\n${rows.map((r) => `│  ├─ ${r}`).join('\n')}\n│  └─ Horizontal .dialog-actions\n└─ Footer`;

const M17 = [
  { id: 'm17-template', page: 'm17', title: 'M17 · 1 · Validation order and rejected packages', note: 'Every import runs the same five steps: a safe package boundary, the definition (complete, then its recomputed SHA-256), result compatibility, existing identities, and only then registration. A failure at any step adds nothing. Contents are data: nothing runs, installs or calls a model.', boards: [
    S('ImportUnsafe', 'Unsafe package', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['entries', 'DataTable #unsafe-entries']] }, render: (sz, f) => importUnsafe(sz, f), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: zipTree('ImportScreen(ModalScreen[ImportOutcome])', '#import', ['Vertical #validation-order', 'DataTable #unsafe-entries', 'Static .kv']), sel: modalSel('ImportScreen', '#import', 86), keys: [['esc', 'dismiss', 'Close']], states: ZIP_STATES, notes: ['Escaping paths, links and extraction-bound violations are refused before extraction (R117, R142).', 'The exact extraction bound is an implementation choice; this frame shows the outcome only.'] } }),
    S('ImportIncomplete', 'Incomplete package', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['table', 'DataTable #completeness']] }, render: (sz, f) => importIncomplete(sz, f), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: zipTree('ImportScreen(ModalScreen[ImportOutcome])', '#import', ['Vertical #validation-order', 'DataTable #completeness', 'Static #next-action']), sel: modalSel('ImportScreen', '#import', 86), keys: [['esc', 'dismiss', 'Close'], ['c', 'copy', 'Copy the diagnostics']], states: ZIP_STATES, notes: ['Completeness is checked against the template contract before identity (R115).', 'Diagnostics name the failed requirement and a next action (R117).'] } }),
  ] },
  { id: 'm17-results', page: 'm17', title: 'M17 · 2 · Result packages and template mismatch', note: 'A result ZIP carries the exact template and everything about the selected runs, with a digest manifest; origin and source ids survive relays through other machines. Results join only a revision whose recomputed identity matches; otherwise the expected and received identities are shown, and the embedded template can be imported as its own revision.', boards: [
    S('ResultPackagePick', 'Result package · choose a ZIP', { sizes: ['wide'], focus: { wide: [['files', 'DirectoryTree #zip-browser'], ['path', 'Input #zip-path'], ['inspect', 'Button #inspect']] }, render: (sz, f) => resultPackagePick(sz, f), legend: { screen: 'ResultPackageScreen', file: 'tui/screens/exchange.py', tree: zipTree('ResultPackageScreen(ModalScreen[bool])   i from Results', '#result-package', ['ContentSwitcher #package-step   pick · contents', '├─ Input #zip-path', '└─ DirectoryTree #zip-browser']), sel: [...modalSel('ResultPackageScreen', '#result-package', 86), ['#zip-path', 'width: 1fr;  same widget as M01 import'], ['#zip-browser', 'height: 10;  .zip highlighted, others dimmed']], keys: MODAL_KEYS([['enter', 'inspect', 'Read the index and manifest, then show the contents']]), states: ZIP_STATES, notes: ['W3: the first state of ResultPackageScreen reuses M01’s #zip-path and #zip-browser, opened at ~/bench where the CLI frames export and import (M14).', 'Choosing reads only the archive index and manifest; validation runs on import.'] } }),
    S('ResultPackage', 'Result package contents', { sizes: ['wide'], focus: { wide: [['tree', 'Tree #package-tree'], ['import', 'Button #import']] }, render: (sz, f) => resultPackage(sz, f), legend: { screen: 'ResultPackageScreen', file: 'tui/screens/exchange.py', tree: zipTree('ResultPackageScreen(ModalScreen[bool])', '#result-package', ['Tree #package-tree', 'DataTable #provenance', 'Static .kv']), sel: [...modalSel('ResultPackageScreen', '#result-package', 86), ['#package-tree', 'height: 10;']], keys: MODAL_KEYS([['enter', 'import', 'Validate and import']]), states: ZIP_STATES, notes: ['Contents follow R116; credentials and unrelated files are never packed.', 'A relay machine is recorded but never replaces the origin (R116).', 'Each result carries its run’s frozen records, including the price snapshot, the rate snapshot with the display currency (rates.yaml) and the billing kind; nothing is converted or recomputed on import (R3-2).'] } }),
    S('ResultMismatch', 'Result · template differs', { sizes: ['wide'], focus: { wide: [['choice', 'RadioSet #mismatch-choice'], ['go', 'Button #continue']] }, render: (sz, f) => resultMismatch(sz, f), legend: { screen: 'ImportResultsScreen', file: 'tui/screens/results.py', tree: zipTree('ImportResultsScreen(ModalScreen[ImportOutcome])', '#result-mismatch', ['Vertical #validation-order', 'Static #identities', 'RadioSet #mismatch-choice']), sel: modalSel('ImportResultsScreen', '#result-mismatch', 86), keys: MODAL_KEYS([]), states: ZIP_STATES, notes: ['Embedded, declared and local identities must all agree (R120).', 'Expected and received are shown in full; nothing is force-merged (R121).'] } }),
    S('ResultEmbedded', 'Imported as its own revision', { sizes: ['wide'], render: (sz) => resultEmbedded(sz), legend: { screen: 'ImportResultsScreen', file: 'tui/screens/results.py', tree: zipTree('ImportResultsScreen(ModalScreen[ImportOutcome])', '#result-embedded', ['Vertical #validation-order', 'Static .kv']), sel: modalSel('ImportResultsScreen', '#result-embedded', 86), keys: [['esc', 'dismiss', 'Close'], ['o', 'open', 'Open the new revision']], states: ZIP_STATES, notes: ['The embedded template passes the same validation and is registered with its results atomically (R121, R142).', 'Different hashes never share a comparison (R122).'] } }),
  ] },
];

// ---------------------------------------------------------------- M18 · hardware monitoring

const TEL_TREE = `TelemetryScreen(Screen)        t from a result
├─ Header · Static #telemetry-bar
├─ Static #charts .pane            host, one collection · actual intervals
├─ Horizontal
│  ├─ Vertical .pane
│  │  └─ DataTable #process-trees
│  └─ Static #energy .pane.kv
├─ Horizontal .actions            … · Button #export-csv
└─ Footer`;
const T_STATES = [['Settings', 'MonitoringSettings'], ['Export CSV (M15)', 'PromptExportCsv'], ['Five causes (M03)', 'EnvironmentCollectors'], ['Guidance', 'CollectorGuide'], ['Telemetry', 'Telemetry'], ['Energy detail', 'EnergyDetail'], ['Sequential windows', 'SequentialEnergy'], ['Currency and energy (M10)', 'CurrencyEnergy']];

const M18 = [
  { id: 'm18-setup', page: 'm18', title: 'M18 · 1 · Optional collectors and guidance', note: 'Monitoring is automatic by default and can be turned off. Only metrics whose tool, hardware and permission are confirmed are collected; every other metric names one of five causes. Guidance is platform-specific, the user runs it, and recheck confirms it. Nothing is installed or changed by AxBenchmark, and no sensor is ever required.', boards: [
    S('MonitoringSettings', 'Monitoring settings', { sizes: ['wide'], focus: { wide: [['mode', 'RadioSet #monitoring-mode'], ['table', 'DataTable #detected'], ['save', 'Button #save']] }, render: (sz, f) => monitoringSettings(sz, f), legend: { screen: 'MonitoringScreen', file: 'tui/screens/setup.py', tree: zipTree('MonitoringScreen(ModalScreen[Monitoring | None])', '#monitoring', ['RadioSet #monitoring-mode', 'Input #sampling-interval', 'DataTable #detected    Interval: actual per collector', 'Static .kv']), sel: [...modalSel('MonitoringScreen', '#monitoring', 86), ['#sampling-interval', 'width: 8;  type="number" · 0.5–10 · default 1'], ['#detected', 'height: 6;'], ['#detected .-slower', 'text-style: bold;  actual ≠ requested']], keys: MODAL_KEYS([['ctrl+s', 'save', 'Store with the configuration; frozen at launch']]), states: T_STATES, notes: ['Automatic detection by default, explicit off (R102).', 'D18: the sampling interval is a run-configuration setting, 0.5–10 s, default 1 s, frozen at launch and not part of the template identity; invalid values are rejected.', 'A collector that cannot sample that fast uses its own minimum (IOReport: 1 s); the actual interval is recorded and shown, never presented as the requested one.', 'Same mike-mbp-m4 collectors as the Environment frames (M03).'] } }),
    S('CollectorGuide', 'Collector guidance', { sizes: ['wide'], focus: { wide: [['recheck', 'Button #recheck'], ['copy', 'Button #copy']] }, render: (sz, f) => collectorGuide(sz, f), legend: { screen: 'CollectorGuideScreen', file: 'tui/screens/environment.py', tree: zipTree('CollectorGuideScreen(ModalScreen[None])', '#collector-guide', ['Static #collector-cause .kv', 'TextArea #guide-commands', 'Static #guide-links .kv']), sel: modalSel('CollectorGuideScreen', '#collector-guide', 86), keys: MODAL_KEYS([['f5', 'recheck', 'Run the collector checks again'], ['c', 'copy', 'Copy the commands']]), states: T_STATES, notes: ['Opened from the Linux collectors frame (M03); the counter exists, permission is the cause (R103).', 'Commands are shown for a verified distribution only; the guide links the kernel powercap docs (R105).'] } }),
  ] },
  { id: 'm18-data', page: 'm18', title: 'M18 · 2 · Telemetry, attribution and energy', note: 'Host telemetry is collected once per experiment and keeps its source, scope and coverage. Process-tree CPU time and memory are attributed per configuration, but a separate model server is not, and cloud models are measured on the client only. Shared energy is never split between concurrent configurations; counters beat sampled power, gaps stay partial, and overlapping domains are never added.', boards: [
    S('Telemetry', 'Telemetry · one experiment', { sizes: ['wide'], focus: { wide: [['charts', 'Static #charts'], ['process', 'DataTable #process-trees'], ['energy', 'Static #energy'], ['detail', 'Button #energy-detail'], ['csv', 'Button #export-csv']] }, render: (sz, f) => telemetry(sz, f), legend: { screen: 'TelemetryScreen', file: 'tui/screens/telemetry.py', tree: TEL_TREE, sel: [['#charts', 'height: 12;  Sparkline per metric · source · actual interval'], ['#process-trees', 'height: 5;'], ['#energy', 'width: 54;'], ['#export-csv', 'Button · opens PromptScreen (M15)']], keys: [['esc', 'app.pop_screen', 'Back to the result'], ['e', 'energy_detail', 'How energy was derived'], ['w', 'windows', 'Sequential run windows'], ['x', 'export_csv', 'Export CSV… · path prompt (W2)']], states: T_STATES, notes: ['Imported results of run 2026-09-24-lab keep the telemetry collected on lab-linux-4090 (M02).', 'D18: each metric names its collector and actual interval; k10temp could not sample at the requested 1 s and shows its 2 s minimum.', 'llama-server is a separate model server, not part of Pi’s process tree (R107, R108).', 'Parallel run (jobs 3): shared energy is never divided, so Pi’s cost stays unknown in rankings (D4). Cloud configurations: client machine only (R111).'] } }),
    S('EnergyDetail', 'Energy derivation', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #energy-domains']] }, render: (sz, f) => energyDetail(sz, f), legend: { screen: 'EnergyDetailScreen', file: 'tui/screens/telemetry.py', tree: zipTree('EnergyDetailScreen(ModalScreen[None])', '#energy-detail', ['DataTable #energy-domains', 'Static .kv']), sel: modalSel('EnergyDetailScreen', '#energy-detail', 86), keys: [['esc', 'dismiss', 'Close']], states: T_STATES, notes: ['Counter deltas preferred; wraparound handled; gaps keep coverage partial (R112, R147).', 'Package and its subdomains are never added; power estimates are not wall-socket readings (R113).', 'The tariff estimate keeps the measured scope (R114).'] } }),
    S('SequentialEnergy', 'Sequential execution windows', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #window-energy']] }, render: (sz, f) => sequentialEnergy(sz, f), legend: { screen: 'WindowsScreen', file: 'tui/screens/telemetry.py', tree: zipTree('WindowsScreen(ModalScreen[None])', '#windows', ['DataTable #window-energy', 'Static #windows-note']), sel: modalSel('WindowsScreen', '#windows', 86), keys: [['esc', 'dismiss', 'Close']], states: T_STATES, notes: ['R-0919lab-1 ran alone (jobs 1); window durations add up to its 27:30 (results-data).', 'Windows include background activity and are never exclusive consumption (R110).', 'D4: in a sequential run a local configuration’s cost for rankings is this kWh × the frozen tariff, labelled “energy estimate” with its scope: $0.01 (results-data R-0919lab-1).'] } }),
  ] },
];

export const LATER_PAGES = [
  { id: 'm10', name: '120×40 · M10 measurements and cost' },
  { id: 'm11', name: '120×40 · M11 run orchestration' },
  { id: 'm12', name: '120×40 · M12 quality judging' },
  { id: 'm13', name: 'M13 · HTML report' },
  { id: 'm14', name: '120×40 · M14 command line' },
  { id: 'm15', name: 'M15 · terminal interface' },
  { id: 'm16', name: '120×40 · M16 custom template planning' },
  { id: 'm17', name: '120×40 · M17 ZIP exchange' },
  { id: 'm18', name: '120×40 · M18 hardware monitoring' },
];
export const LATER_GROUPS = [...M10, ...M11, ...M12, ...M13, ...M14, ...M15, ...M16, ...M17, ...M18];
