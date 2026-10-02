// Artboard catalogue for M10–M18: one canvas page per module, grouped into the flows of navigation.md.
// Same legend shape as boards-modules.mjs. CLI frames (M14) are plain terminal output, so their legend names the
// output contract and arguments instead of TCSS and key bindings.
import { measurements, measurementsPartial, timingPhases, costBasis, currencyEnergy } from './screens-measure.mjs';
import { runOverview, runDetach, stopConfirm, stopCleanup, activeLocked } from './screens-run.mjs';
import { judging, reviewDetail, reviewUngraded, judgeCapability, rubricProfiles } from './screens-judging.mjs';
import { reportGenerate, reportProgress } from './screens-report.mjs';
import { cliHelp, cliRun, cliInvalid, cliStatusStop, cliDoctor, cliExchange } from './screens-cli.mjs';
import { helpKeys, runListDetail } from './screens-tui.mjs';
import { plannerPicker, planningProgress, planReview, planServices, planEdit, planRegenerate, planApprove, planningFailed } from './screens-planning.mjs';
import { importUnsafe, importIncomplete, resultPackage, resultMismatch, resultEmbedded } from './screens-exchange.mjs';
import { monitoringSettings, collectorGuide, telemetry, energyDetail, sequentialEnergy } from './screens-telemetry.mjs';

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
│  ├─ DataTable #measurements    per task + Σ row
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
  ['#formation, #phases', 'width: 1fr; height: 18;'],
  ['Screen.-compact #formation, Screen.-compact #phases', 'display: none;'],
  ['Screen.-compact #accounting', 'display: block; height: 1fr;'],
];
const MEAS_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the result'],
  ['t', 'timing', 'Push TimingScreen for the run'],
  ['b', 'cost_basis', 'Cost basis of every result of this revision'],
  ['u', 'currency', 'Currency and energy inputs recorded at launch'],
  ['enter', 'open_task', 'Task checks and evidence (M08)'],
];
const MEAS_STATES = [['Complete', 'Measurements'], ['Halted · partial', 'MeasurementsPartial'], ['Timing', 'TimingPhases'], ['Cost basis', 'CostBasis'], ['Currency and energy', 'CurrencyEnergy'], ['Outcomes tab', 'ResultOutcomes']];
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
├─ Vertical #currency-energy .dialog
│  ├─ Static #primary              USD, fixed
│  ├─ Vertical #cop
│  │  ├─ Checkbox · Input #cop-rate · Input #cop-date
│  ├─ Static .notice.-warning      historical rate
│  ├─ Vertical #tariff
│  │  └─ Checkbox · Input #tariff-usd-kwh
│  ├─ Static #energy-scope .kv     from M18
│  └─ Horizontal .dialog-actions
└─ Footer`;

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
      'Status (halted, not interrupted, not timeout) stays beside the measurements.',
    ]) }),
    S('TimingPhases', 'Timing · elapsed vs phases', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #phase-table'], ['chart', 'Static #timeline']] }, render: (sz, f) => timingPhases(sz, f), legend: { screen: 'TimingScreen', file: 'tui/screens/measurements.py', tree: TIMING_TREE, sel: [['#timeline', 'height: 15;  one row per configuration'], ['#phase-table', 'height: 10;  cursor_type = "row"']], keys: [['esc', 'app.pop_screen', 'Back'], ['enter', 'open_result', 'Measurements of the selected configuration']], states: MEAS_STATES, notes: [
      'Benchmark elapsed = Σ task process durations, tool work included; queue, planning, verification and judging are reported apart (R079).',
      'The experiment duration (1:56:00) is clock time; with four configurations at once it is far below their summed elapsed times (R079).',
      'Elapsed times are those of run 2026-09-28-a in results-data.mjs.',
    ] } }),
  ] },
  { id: 'm10-cost', page: 'm10', title: 'M10 · 2 · Cost basis, currency and energy', note: 'Reported cost wins; without it an API-equivalent estimate is made only from known usage and recorded rates, and labelled. Subscriptions and missing prices never become $0. USD is primary; COP needs a supplied rate recorded with the benchmark. An optional tariff gives an energy estimate that keeps its measured scope and is never split across concurrent configurations or added to provider costs.', boards: [
    S('CostBasis', 'Cost basis · 12 results', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #basis-table'], ['close', 'Button #close']] }, render: (sz, f) => costBasis(sz, f), legend: { screen: 'CostBasisScreen', file: 'tui/screens/results.py', tree: BASIS_TREE, sel: [...modalSel('CostBasisScreen', '#cost-basis', 86), ['#basis-table', 'height: 13;']], keys: MODAL_KEYS([['enter', 'open', 'Measurements of the selected result'], ['u', 'currency', 'Currency and energy']]), states: MEAS_STATES, notes: [
      'Costs are the 12 results of results-data.mjs; only the basis column is added (R080).',
      'Reported, estimate, verified $0, partial and unknown stay distinguishable wherever rankings appear (R081).',
      'A subscription is not $0: with known usage it is estimated (R080).',
    ] } }),
    S('CurrencyEnergy', 'Currency and energy', { sizes: ['wide'], focus: { wide: [['rate', 'Input #cop-rate'], ['tariff', 'Input #tariff-usd-kwh'], ['save', 'Button #save']] }, render: (sz, f) => currencyEnergy(sz, f), legend: { screen: 'CurrencyEnergyScreen', file: 'tui/screens/setup.py', tree: CURRENCY_TREE, sel: [...modalSel('CurrencyEnergyScreen', '#currency-energy', 86), ['#cop-rate, #tariff-usd-kwh', 'width: 16;  type="number"']], keys: MODAL_KEYS([['ctrl+s', 'save', 'Store with the configuration; frozen at launch']]), states: MEAS_STATES, notes: [
      'COP appears only with a supplied, recorded rate; the README rate is historical (R081).',
      'Energy scope comes from M18: CPU package + GPU is never whole-system cost (R114, R147).',
      'Shared experiment energy is not allocated to configurations and never added to provider charges (R114).',
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
│     └─ Static .kv               now · elapsed · cost · queue
├─ RichLog #events .bordered
├─ DataTable #lanes-table         .-compact only
└─ Footer`;
const RUN_SEL = [
  ['#run-bar, #frozen', 'height: 1; padding: 0 1;'],
  ['#lanes', 'layout: grid; grid-size: 2 2; height: 22;'],
  ['#lanes .pane', 'height: 11;'],
  ['.task-strip .-running', 'color: $primary; text-style: bold;'],
  ['#events', 'height: 1fr;  auto_scroll = True'],
  ['Screen.-compact #lanes', 'display: none;'],
  ['Screen.-compact #lanes-table', 'display: block; height: 8;'],
];
const RUN_KEYS = [
  ['enter', 'open_configuration', 'RunConfigScreen for the focused lane (M05)'],
  ['s', 'stop_configuration', 'Stop the focused configuration, with cleanup'],
  ['S', 'stop_run', 'Stop the whole run, with cleanup'],
  ['d', 'detach', 'Leave; the run keeps going'],
  ['e', 'edit', 'Dimmed: frozen while running (check_action)'],
  ['tab', 'focus_next', 'Next lane, then events'],
];
const RUN_STATES = [['Running', 'RunOverview'], ['Queued', 'RunQueued'], ['Sequential', 'RunSequential'], ['Failures', 'RunFailures'], ['Detach', 'RunDetach'], ['Reattached', 'RunReattached'], ['Stop', 'StopConfirm'], ['Locked', 'ActiveLocked']];
const LANES = { wide: [['lane1', 'Vertical #lane-2'], ['lane0', 'Vertical #lane-1'], ['lane2', 'Vertical #lane-3'], ['lane3', 'Vertical #lane-4'], ['events', 'RichLog #events']] };
const runLegend = (notes) => ({ screen: 'RunScreen', file: 'tui/screens/run.py', tree: RUN_TREE, sel: RUN_SEL, keys: RUN_KEYS, states: RUN_STATES, notes });

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
    S('RunOverview', 'Run overview', { sizes: ['wide', 'compact'], focus: { ...LANES, compact: [['lane1', 'DataTable #lanes-table'], ['events', 'RichLog #events']] }, render: (sz, f) => runOverview(sz, f), legend: runLegend([
      'Run 2026-10-01-a from M05/M07: four configurations, one per harness, all at once (R045, R138).',
      'Elapsed is the sum of task processes (M10); cost keeps its basis.',
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
  ] },
  { id: 'm11-lifecycle', page: 'm11', title: 'M11 · 2 · Detach, reconnect and stop', note: 'Execution outlives the interface. Detaching, closing the terminal or quitting only stops observing; reconnecting observes the same processes without restarting anything. Stopping is the one explicit action that ends work, for one configuration or the whole run, and it cleans up child processes and application services. Frozen inputs cannot be edited while the run is active.', boards: [
    S('RunDetach', 'Detach', { sizes: ['wide'], focus: { wide: [['detach', 'Button #detach']] }, render: (sz, f) => runDetach(sz, f), legend: { screen: 'DetachScreen', file: 'tui/screens/run.py', tree: DETACH_TREE, sel: modalSel('DetachScreen', '#detach', 84), keys: MODAL_KEYS([['enter', 'detach', 'Return to the Library; the run continues']]), states: RUN_STATES, notes: ['Disconnecting is not an interruption and is never recorded as one (R046, R060, R139).', 'Reattach from the Library (ctrl+r) or with axbenchmark --attach RUN_ID (M14).'] } }),
    S('RunReattached', 'Reattached', { sizes: ['wide'], focus: LANES, render: (sz, f) => runOverview(sz, f, { reattached: true }), legend: runLegend([
      'Reattaching observes existing work; no task restarts and no new trial starts (R046, R138).',
      'The detached interval is shown so a gap in observation is not mistaken for a gap in execution.',
    ]) }),
    S('StopConfirm', 'Stop · confirm and clean up', { sizes: ['wide'], focus: { wide: [['scope', 'RadioSet #stop-scope'], ['items', 'DataTable #cleanup'], ['stop', 'Button #stop']] }, render: (sz, f) => stopConfirm(sz, f), legend: { screen: 'StopScreen', file: 'tui/screens/run.py', tree: STOP_TREE, sel: [...modalSel('StopScreen', '#stop', 86), ['#cleanup', 'height: 5;']], keys: MODAL_KEYS([['enter', 'stop', 'Stop and clean up the chosen scope']]), states: RUN_STATES, notes: ['Stopping a configuration or the run ends its process tree and application services (R046, R139).', 'The stopped task is saved as interrupted; later tasks are not run, never zero (M10).'] } }),
    S('StopCleanup', 'Stop · cleaning up', { sizes: ['wide'], render: (sz) => stopCleanup(sz), legend: { screen: 'StoppingScreen', file: 'tui/screens/run.py', tree: 'StoppingScreen(ModalScreen[None])\n├─ Vertical #stopping .dialog\n│  ├─ Vertical #stop-steps\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('StoppingScreen', '#stopping', 84), keys: [['esc', 'dismiss', 'Hide; cleanup continues']], states: RUN_STATES, notes: ['The stop is reported only after processes, services, browser context and ports are released (R139).'] } }),
    S('ActiveLocked', 'Frozen while running', { sizes: ['wide'], render: (sz) => activeLocked(sz), legend: { screen: 'LockedScreen', file: 'tui/screens/run.py', tree: 'LockedScreen(ModalScreen[None])\n├─ Vertical #locked .dialog\n│  ├─ DataTable #allowed\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('LockedScreen', '#locked', 84), keys: [['esc', 'dismiss', 'Close']], states: RUN_STATES, notes: ['Allowed while running: inspect, detach, reconnect, stop (R047).', 'Template mutation during the run invalidates the identity claim; it is never relabelled (R067).'] } }),
  ] },
];

// ---------------------------------------------------------------- M12 · quality judging

const JUDGING_TREE = `JudgingScreen(Screen)          after the last configuration
├─ Header · Static #judging-bar
├─ DataTable #reviews .bordered   label · status · grades · cost
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
  ['Screen.-compact #current', 'display: none;'],
];
const JUDGING_KEYS = [
  ['enter', 'open_review', 'ReviewScreen for a graded or ungraded artifact'],
  ['p', 'profiles', 'Grading profiles and anchors'],
  ['d', 'detach', 'Leave; judging continues'],
  ['s', 'stop_judging', 'Stop judging; unreviewed artifacts stay not judged'],
];
const J_STATES = [['In progress', 'Judging'], ['Finished · 1 ungraded', 'JudgingDone'], ['Ungraded review', 'ReviewUngraded'], ['Complete review', 'ReviewDetail'], ['Profiles', 'RubricProfiles'], ['No screenshot support', 'JudgeCapability'], ['Judge input (M08)', 'JudgeHandoff']];
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
  { id: 'm12-judging', page: 'm12', title: 'M12 · 1 · Sequential independent reviews', note: 'After execution each delivered artifact is reviewed in its own fresh headless session, one at a time, under an anonymous label. The judge receives the artifact, specification, rubric and acceptance evidence, never cost, time or other reviews, and it never repairs anything. A malformed or incomplete response stays ungraded with its deficiencies visible; nothing is filled in.', boards: [
    S('Judging', 'Judging · in progress', { sizes: ['wide', 'compact'], focus: { wide: [['queue', 'DataTable #reviews'], ['now', 'Vertical #current'], ['inputs', 'Static #inputs']], compact: [['queue', 'DataTable #reviews'], ['inputs', 'Static #inputs']] }, render: (sz, f) => judging(sz, f), legend: judgingLegend([
      'One fresh session per artifact, in sequence; no earlier conversation or review is carried over (R083).',
      'Labels are anonymous to the judge; the label → result mapping stays with AxBenchmark (R083).',
      'Judging cost is its own column and is recorded through M10, apart from competitor cost (R082).',
    ]) }),
    S('JudgingDone', 'Judging · finished, 1 ungraded', { sizes: ['wide'], focus: { wide: [['queue', 'DataTable #reviews'], ['open', 'Button #open-ungraded']] }, render: (sz, f) => judging(sz, f, { ungraded: true }), legend: judgingLegend([
      'An invalid response is preserved and explained, and the result is ungraded (R084).',
      'Ungraded results stay out of quality and combined rankings with that reason (M06).',
    ]) }),
    S('ReviewUngraded', 'Review · not graded', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['table', 'DataTable #validation'], ['raw', 'Button #raw']] }, render: (sz, f) => reviewUngraded(sz, f), legend: { screen: 'UngradedReviewScreen', file: 'tui/screens/judging.py', tree: 'UngradedReviewScreen(ModalScreen[None])\n├─ Vertical #ungraded-review .dialog\n│  ├─ DataTable #validation\n│  ├─ Static #kept .kv\n│  ├─ Static #consequences\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('UngradedReviewScreen', '#ungraded-review', 86), ['#validation', 'height: 7;']], keys: MODAL_KEYS([['r', 'raw', 'Open the preserved raw response']]), states: J_STATES, notes: ['Missing category, a value off the 0.5 grid, a missing evidence reference and missing commentary each make a review ungraded (R084).', 'No averages, zeroes or guesses; checks and process outcomes stay as they are (R144).'] } }),
  ] },
  { id: 'm12-review', page: 'm12', title: 'M12 · 2 · Review contract, profiles and judge capability', note: 'A complete review has a 1–5 grade in 0.5 steps for every rubric category with evidence references, limitations and comments on code quality, usability and specification adherence. AxBenchmark computes weighted quality from those raw grades. Web and backend profiles each have six categories; one profile applies to the whole comparison. UI judging needs a judge whose screenshot inspection is known.', boards: [
    S('ReviewDetail', 'Review · complete', { sizes: ['wide'], focus: { wide: [['grades', 'DataTable #grades'], ['comments', 'VerticalScroll #comments'], ['meta', 'Static #review-meta'], ['raw', 'Button #raw']] }, render: (sz, f) => reviewDetail(sz, f), legend: { screen: 'ReviewScreen', file: 'tui/screens/judging.py', tree: REVIEW_TREE, sel: [['#grades', 'height: 9;'], ['#comments', 'width: 80; height: 18;'], ['#review-meta', 'width: 40; height: 18;']], keys: [['esc', 'app.pop_screen', 'Back'], ['e', 'evidence', 'Open referenced screenshots and traces'], ['b', 'breakdown', 'Score breakdown (M06)'], ['r', 'raw', 'Raw judge response']], states: J_STATES, notes: ['R-0928a-1, judge group A: the grades of results-data.mjs; Q = 4.40 as on Rankings (R084, M06).', 'Anchors: 1 missing or largely broken · 3 usable with material gaps · 5 excellent for the scope (R084).', 'Judging time 3:10 matches the Timing frame (M10).'] } }),
    S('RubricProfiles', 'Grading profiles', { sizes: ['wide'], render: (sz) => rubricProfiles(sz), legend: { screen: 'ProfilesScreen', file: 'tui/screens/judging.py', tree: 'ProfilesScreen(ModalScreen[None])\n├─ Vertical #profiles .dialog\n│  ├─ DataTable #profile-table\n│  ├─ Static #profile-notes .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('ProfilesScreen', '#profiles', 86), keys: [['esc', 'dismiss', 'Close'], ['w', 'weights', 'Quality weights (M06)']], states: J_STATES, notes: ['Web: UX 25, visual 15, code 20, spec 25, robustness 10, accessibility 5. Backend: developer experience, API/interface, code, spec, robustness, operability/docs, same weights (R085–R091).'] } }),
    S('JudgeCapability', 'Judge cannot inspect screenshots', { sizes: ['wide'], focus: { wide: [['choose', 'Button #choose-judge']] }, render: (sz, f) => judgeCapability(sz, f), legend: { screen: 'JudgeCapabilityScreen', file: 'tui/screens/setup.py', tree: 'JudgeCapabilityScreen(ModalScreen[Action])\n├─ Vertical #judge-capability .dialog\n│  ├─ Static .notice.-error\n│  ├─ Static #capability .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('JudgeCapabilityScreen', '#judge-capability', 84), keys: MODAL_KEYS([['j', 'judge', 'Back to the judge picker (M07)']]), states: J_STATES, notes: ['Setup names the issue before launch; capability comes from the catalog (M04), never from a model name (R084).', 'No other judge is substituted.'] } }),
  ] },
];

// ---------------------------------------------------------------- M13 · HTML report

const GEN_TREE = `ReportGenerateScreen(ModalScreen[ReportRequest | None])   h from Results
├─ Vertical #report-generate .dialog
│  ├─ Static #report-scope .kv
│  ├─ RadioSet #report-weights     original · alternative
│  ├─ SelectionList #report-contents
│  ├─ Input #report-path
│  └─ Horizontal .dialog-actions
└─ Footer`;
const R_STATES = [['Generate', 'ReportGenerate'], ['Progress', 'ReportProgress'], ['Path · open failed', 'ReportReady'], ['The HTML file', 'ReportPage'], ['CLI report', 'CliExchange']];

const M13 = [
  { id: 'm13-generate', page: 'm13', title: 'M13 · 1 · Generate from retained results', note: 'The report is built only from retained results of one template SHA-256, with no model calls. The dialog shows the scope, judge groups, which weights open first and every included part. Text from prompts, logs and reviews is escaped. At the end the app tries to open the file and always shows its path.', boards: [
    S('ReportGenerate', 'Generate HTML report', { sizes: ['wide'], focus: { wide: [['weights', 'RadioSet #report-weights'], ['contents', 'SelectionList #report-contents'], ['path', 'Input #report-path'], ['generate', 'Button #generate']] }, render: (sz, f) => reportGenerate(sz, f), legend: { screen: 'ReportGenerateScreen', file: 'tui/screens/results.py', tree: GEN_TREE, sel: [...modalSel('ReportGenerateScreen', '#report-generate', 86), ['#report-contents', 'height: 7; border: none;']], keys: MODAL_KEYS([['ctrl+s', 'generate', 'Write the report']]), states: R_STATES, notes: ['Full SHA-256 is shown because identity is the subject; it is printed in every report (R131).', 'Both tables and all three chart groups are always included (R148).', 'Zero-cost and unknown-cost results are left off the log axis and explained, never dropped from tables (R132).'] } }),
    S('ReportProgress', 'Generating', { sizes: ['wide'], render: (sz) => reportProgress(sz), legend: { screen: 'ReportProgressScreen', file: 'tui/screens/results.py', tree: 'ReportProgressScreen(ModalScreen[Path])\n├─ Vertical #report-progress .dialog\n│  ├─ Vertical #report-steps\n│  │  └─ ProgressBar\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('ReportProgressScreen', '#report-progress', 84), keys: [['esc', 'cancel', 'Cancel; nothing is written']], states: R_STATES, notes: ['Original measurements, grades and weights are only read (R134).', 'Hostile markup in competitor material stays inert text (R125, R133).', 'Ends in ReportReady (M02), which always shows the path.'] } }),
  ] },
  { id: 'm13-file', page: 'm13', title: 'M13 · 2 · The generated HTML file', note: 'A wireframe of the report itself: one offline HTML5 file with inline vanilla JavaScript and CSS. Header with the full SHA-256, filters and both weight sets with apply, reset and export, the three top-five charts, the log-cost scatter, the stacked combined ranking, the measured and quality tables, task evidence and hardware timelines. Every number is computed with the M06 contract from the 12 results shown in M02.', boards: [
    { name: 'ReportPage', title: 'Report · standalone HTML', special: 'report', legend: null },
  ] },
];

// ---------------------------------------------------------------- M14 · command line

const CLI_SEL = [
  ['stdout', 'results and progress, one line per event · no colour needed'],
  ['stderr', 'problems, one per line, prefixed ✗'],
  ['glyphs', '✓ ✗ ▲ ● ○ ? as in the TUI, always with words'],
  ['TTY', 'never prompts; a missing choice is an error'],
];
const CLI_STATES = [['--help', 'CliHelp'], ['run --no-tui', 'CliRun'], ['Invalid config', 'CliInvalid'], ['status · stop', 'CliStatusStop'], ['doctor · refresh', 'CliDoctor'], ['Exchange · report', 'CliExchange'], ['TUI run', 'RunOverview']];
const cliLegend = (screen, tree, keys, notes) => ({ screen, file: 'axbenchmark/cli.py', tree, sel: CLI_SEL, selTitle: 'Output contract', keys, keysTitle: 'Arguments and exit codes', states: CLI_STATES, notes });

const M14 = [
  { id: 'm14-run', page: 'm14', title: 'M14 · 1 · Commands and unattended runs', note: 'Twelve signatures, each delegating to the same contract as the TUI. A bare axbenchmark opens the TUI. run --no-tui needs a complete configuration, validates and freezes it exactly like Review before launch, prints plain progress and never asks a question; anything incomplete is explained and nothing starts.', boards: [
    S('CliHelp', 'axbenchmark --help', { sizes: ['wide'], render: (sz) => cliHelp(sz), legend: cliLegend('axbenchmark --help', 'axbenchmark\n├─ (no command)         → TUI (M15)\n├─ --attach RUN_ID      → M11 observe\n├─ run                  → M07 + M11\n├─ status · stop        → M11\n├─ models refresh       → M04\n├─ doctor               → M03\n├─ report               → M13\n├─ templates export · import  → M01 + M17\n└─ results export · import    → M02 + M17', [['--help', '', 'This screen'], ['0 · 1 · 2 · 3 · 4', '', 'success · finished with failures · invalid input · package rejected · not found']], [
      'All twelve required signatures are listed with their placeholders (R048–R059).',
      'Exit codes are a proposal; the spec defines behaviour, not numbers.',
    ]) }),
    S('CliRun', 'run --no-tui', { sizes: ['wide', 'compact'], render: (sz) => cliRun(sz), legend: cliLegend('axbenchmark run --no-tui', 'run\n├─ --config FILE     complete configuration\n├─ --no-tui          plain progress\n└─ --jobs N          default: per harness, ≤ 4', [['--config FILE', '', 'template SHA-256, entries, policy, judge, both weight sets'], ['--jobs 1', '', 'one configuration at a time (M11)'], ['Ctrl-C', '', 'stops watching only; the run continues']], [
      'Validation and freezing are the same as interactive launch (R050, R067).',
      'Run 2026-10-02-a is the queued run drawn on the M11 page (R045, R138).',
      'All model work runs headlessly; nothing waits for input (R060).',
    ]) }),
    S('CliInvalid', 'run · incomplete configuration', { sizes: ['wide'], render: (sz) => cliInvalid(sz), legend: cliLegend('axbenchmark run --no-tui', 'run\n└─ validate (M07) → 4 problems → exit 2', [['exit 2', '', 'invalid or incomplete input · nothing frozen or started']], [
      'Incomplete unattended settings get a useful explanation instead of a prompt (R050, R060).',
      'Nothing is substituted: no other effort, judge or preset is chosen (M04, M07).',
    ]) }),
  ] },
  { id: 'm14-ops', page: 'm14', title: 'M14 · 2 · Observe, stop, check and exchange', note: 'status reads saved state without a TUI, including real failures; stop is the explicit end with cleanup. doctor and models refresh use M03 and M04 and keep data-only work available. Imports are data operations: identities and digests are recomputed, nothing runs, and a rejected package adds nothing. Reports regenerate from retained results without model calls.', boards: [
    S('CliStatusStop', 'status · stop', { sizes: ['wide'], render: (sz) => cliStatusStop(sz), legend: cliLegend('axbenchmark status · stop', 'status RUN_ID   saved state (M11)\nstop RUN_ID     explicit stop + cleanup', [['RUN_ID', '', 'run folder name, e.g. 2026-09-30-b'], ['exit 0', '', 'status read / stop completed']], [
      'Status does not depend on an attached TUI and keeps the authentication failure visible after the stop (R051, R060).',
      'Stop cleans up child processes and services before it reports (R052, R139).',
      'Run 2026-09-30-b is the failures frame on the M11 page.',
    ]) }),
    S('CliDoctor', 'doctor · models refresh', { sizes: ['wide'], render: (sz) => cliDoctor(sz), legend: cliLegend('axbenchmark doctor · models refresh', 'doctor          readiness (M03)\nmodels refresh  discovery (M04)', [['exit 0', '', 'checks ran; problems are reported, not fatal']], [
      'Collector problems name their cause and never block a run (R054, R103).',
      'A failed provider keeps the last valid catalog and all overrides (R053, R063, R064).',
    ]) }),
    S('CliExchange', 'exchange · report', { sizes: ['wide'], render: (sz) => cliExchange(sz), legend: cliLegend('axbenchmark templates · results · report', 'templates export SHA --output\ntemplates import ZIP\nresults import ZIP --template SHA\nresults export RUN_ID --output\nreport RUN_DIR', [['exit 3', '', 'package rejected · nothing added'], ['TEMPLATE_SHA', '', 'full SHA-256 or an unambiguous prefix']], [
      'Expected and received identities are shown in full on mismatch (R057, R120).',
      'Identical re-imports are skipped, so importing is idempotent (R122).',
      'The report path is printed even when no browser opens (R055, R134).',
    ]) }),
  ] },
];


// ---------------------------------------------------------------- M15 · terminal interface

const M15 = [
  { id: 'm15-tui', page: 'm15', title: 'M15 · Keys, views and small terminals', note: 'The five views are Library, Environment, Setup, Run and Results, drawn on their module pages. Every screen shows its keys in the footer, every key is a palette command, and everything is clickable. From 100×30 the run shows four live panels in a 2×2 grid; below that it becomes list and detail with the same search, scrolling and task details. No tmux.', boards: [
    S('HelpKeys', 'Keys and views', { sizes: ['wide'], focus: { wide: [['views', 'DataTable #views'], ['close', 'Button #close']] }, render: (sz, f) => helpKeys(sz, f), legend: { screen: 'HelpScreen', file: 'tui/screens/help.py', tree: 'HelpScreen(ModalScreen[str | None])   ? from any screen\n├─ Vertical #help .dialog\n│  ├─ DataTable #views          enter switches view\n│  ├─ Static #global-keys .kv\n│  ├─ Static #mouse .kv\n│  ├─ Static #sizes .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('HelpScreen', '#help', 86), ['#views', 'height: 6;  cursor_type = "row"']], keys: MODAL_KEYS([['enter', 'switch_view', 'Go to the selected view'], ['F1–F4 · F6', 'app.switch_view', 'Library · Environment · Setup · Run · Results']]), states: [['Library', 'Library'], ['Environment', 'Environment'], ['Setup', 'Setup'], ['Run 2×2', 'RunOverview'], ['Run list/detail', 'RunListDetail'], ['Results', 'Results'], ['Palette', 'CommandPalette']], notes: [
      'View keys are a proposal; F5 is left to Recheck and Refresh, which already use it (R038).',
      'Bindings that cannot run are dimmed, never hidden; q with an active run only detaches (R046).',
      'Resizing switches layouts without losing focus or the selected configuration (R044).',
    ] } }),
    S('RunListDetail', 'Run · list and detail', { sizes: ['compact'], focus: { compact: [['list', 'ListView #lane-list'], ['tasks', 'Vertical #lane-detail'], ['search', 'Input #log-search'], ['log', 'RichLog #log']] }, render: (sz, f) => runListDetail(sz, f), legend: { screen: 'RunScreen · -compact', file: 'tui/screens/run.py', tree: 'RunScreen(Screen)              Screen.-compact\n├─ Header · Static #run-bar\n├─ Horizontal\n│  ├─ ListView #lane-list .pane   one item per configuration\n│  └─ Vertical #detail\n│     ├─ Vertical #lane-detail .pane\n│     └─ RichLog #log .bordered\n│        └─ Input #log-search\n└─ Footer', sel: [['Screen.-compact #lanes', 'display: none;'], ['#lane-list', 'width: 26;'], ['#detail', 'width: 1fr;'], ['#log .-match', 'background: $primary 24%;']], keys: [['↑ ↓', 'cursor', 'Select a configuration; the detail follows'], ['enter', 'open_configuration', 'RunConfigScreen with all tasks'], ['/', 'focus("#log-search")', 'Search the log; n next match'], ['s · d', 'stop · detach', 'Same as the 2×2 layout']], states: [['2×2 layout', 'RunOverview'], ['Compact table', 'RunOverview'], ['Configuration', 'RunConfig']], notes: [
      'Below 100×30 the four panels become a list with the selected configuration’s detail (R044).',
      'Log search, scrolling and task detail work the same in both layouts (R038, R044).',
    ] } }),
  ] },
];

// ---------------------------------------------------------------- M16 · custom template planning

const PLAN_TREE = `PlanReviewScreen(Screen)       after planning
├─ Header · Static #draft-bar      draft, never a template
├─ TabbedContent #draft-tabs
│  ├─ TabPane "Specification"
│  ├─ TabPane "Tasks"
│  │  ├─ DataTable #draft-tasks .bordered
│  │  ├─ Static #draft-summary .pane.kv
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
  ['Screen.-compact #draft-summary', 'display: none;'],
];
const PLAN_KEYS = [
  ['e', 'edit', 'Edit the selected task, its checks or a service'],
  ['r', 'regenerate', 'Regenerate a task, all tasks or the spec'],
  ['a', 'approve', 'Approve and save as r1 · computes the SHA-256'],
  ['1–4', 'show_tab', 'Specification · Tasks · Checks · Services'],
  ['esc', 'close', 'Close; the draft is kept, not approved'],
];
const P_STATES = [['New template (M01)', 'NewTemplateRepo'], ['Planner', 'PlannerPicker'], ['Planning', 'PlanningProgress'], ['Review', 'PlanReview'], ['Services', 'PlanServices'], ['Edit', 'PlanEdit'], ['Regenerate', 'PlanRegenerate'], ['Approve', 'PlanApprove'], ['Failed', 'PlanningFailed']];
const planLegend = (notes) => ({ screen: 'PlanReviewScreen', file: 'tui/screens/planning.py', tree: PLAN_TREE, sel: PLAN_SEL, keys: PLAN_KEYS, states: P_STATES, notes });

const M16 = [
  { id: 'm16-plan', page: 'm16', title: 'M16 · 1 · Planner, baseline capture and planning', note: 'Continues “New template” (M01) for a backend refactor of ~/code/acme-billing. The planner is preselected from a valid previous choice, else the first usable harness in the order Claude Code, Codex, Grok, Pi. Capture snapshots the committed revision (HEAD → a41f9c2), leaves uncommitted work out and never touches the repository. A failed plan saves nothing and nothing stands in for it.', boards: [
    S('PlannerPicker', 'Planner · fallback order', { sizes: ['wide'], focus: { wide: [['model', 'Select #planner-model'], ['order', 'DataTable #planner-order'], ['start', 'Button #start']] }, render: (sz, f) => plannerPicker(sz, f), legend: { screen: 'PlannerScreen', file: 'tui/screens/planning.py', tree: 'PlannerScreen(ModalScreen[Planner | None])\n├─ Vertical #planner .dialog\n│  ├─ Static #previous-choice\n│  ├─ DataTable #planner-order\n│  ├─ Vertical #planner-fields   harness · model · effort\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('PlannerScreen', '#planner', 86), ['#planner-order', 'height: 5;']], keys: MODAL_KEYS([['ctrl+s', 'start', 'Capture the baseline and plan']]), states: P_STATES, notes: ['A previous choice that is no longer valid falls through to the fixed order (R031).', 'Detected but unusable harnesses are skipped; defaults come from discovery (M03, M04).'] } }),
    S('PlanningProgress', 'Capture and plan', { sizes: ['wide'], render: (sz) => planningProgress(sz), legend: { screen: 'PlanningScreen', file: 'tui/screens/planning.py', tree: 'PlanningScreen(ModalScreen[Draft])\n├─ Vertical #planning .dialog\n│  ├─ Vertical #planning-steps\n│  │  └─ ProgressBar\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('PlanningScreen', '#planning', 84), keys: [['esc', 'hide', 'Hide; planning continues']], states: P_STATES, notes: ['The snapshot is the committed revision only; HEAD is never resolved again later (R068).', 'The source repository and its uncommitted work stay untouched (R140).'] } }),
    S('PlanningFailed', 'Planning failed', { sizes: ['wide'], focus: { wide: [['retry', 'RadioSet #planning-next'], ['go', 'Button #continue']] }, render: (sz, f) => planningFailed(sz, f), legend: { screen: 'PlanningFailedScreen', file: 'tui/screens/planning.py', tree: 'PlanningFailedScreen(ModalScreen[Action])\n├─ Vertical #planning-failed .dialog\n│  ├─ Static .notice.-error\n│  ├─ Vertical #planning-steps\n│  ├─ RadioSet #planning-next\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('PlanningFailedScreen', '#planning-failed', 84), keys: MODAL_KEYS([]), states: P_STATES, notes: ['No partial draft, earlier template or live working tree replaces a failed plan (R031, R068, R149).'] } }),
  ] },
  { id: 'm16-review', page: 'm16', title: 'M16 · 2 · Review, edit, regenerate and approve', note: 'The draft holds a specification, seven ordered tasks by default (the last one verifies and fixes), acceptance checks and setup/start/stop instructions. Everything can be edited or regenerated; generation is not approval. Approving computes the SHA-256 and saves r1, which later runs reuse without calling the planner.', boards: [
    S('PlanReview', 'Review the draft', { sizes: ['wide', 'compact'], focus: { wide: [['tasks', 'DataTable #draft-tasks'], ['detail', 'VerticalScroll #task-detail'], ['spec', 'Static #draft-summary'], ['edit', 'Button #edit']], compact: [['tasks', 'DataTable #draft-tasks'], ['detail', 'Static #task-detail']] }, render: (sz, f) => planReview(sz, f), legend: planLegend([
      'Seven tasks is the default for custom work, not a rule; T7 is final verification and fixes (R007, R031).',
      'Edited tasks are marked; the generated text is kept beside the edit.',
      'Planning cost is shown but is not a benchmark measurement.',
    ]) }),
    S('PlanServices', 'Draft · setup, start and stop', { sizes: ['wide'], focus: { wide: [['services', 'DataTable #services'], ['deps', 'Static #deps'], ['approve', 'Button #approve']] }, render: (sz, f) => planServices(sz, f), legend: planLegend([
      'Setup, start and stop instructions are generated with the tasks and covered by the hash (R031, R115).',
      'Dependencies are declared, never installed during import (M17).',
    ]) }),
    S('PlanEdit', 'Edit a task', { sizes: ['wide'], focus: { wide: [['text', 'TextArea #task-text'], ['checks', 'DataTable #task-checks'], ['done', 'Button #done']] }, render: (sz, f) => planEdit(sz, f), legend: { screen: 'TaskEditorScreen', file: 'tui/screens/planning.py', tree: 'TaskEditorScreen(Screen)\n├─ Header · Static #draft-bar\n├─ Input #task-title\n├─ Horizontal\n│  ├─ TextArea #task-text\n│  └─ Static #task-diff\n├─ DataTable #task-checks .bordered\n├─ Horizontal .actions\n└─ Footer', sel: [['#task-text', 'width: 60; height: 14;  language="markdown"'], ['#task-diff', 'width: 1fr;'], ['#task-checks', 'height: 10;']], keys: [['esc', 'done', 'Back to the draft'], ['ctrl+z', 'undo', 'Undo'], ['a', 'add_check', 'Add an acceptance check']], states: P_STATES, notes: ['Edits change only the draft; also used when revising an approved template into r2 (M01).', 'Checks may not add obligations the prompt does not state.'] } }),
    S('PlanRegenerate', 'Regenerate', { sizes: ['wide'], focus: { wide: [['scope', 'RadioSet #regen-scope'], ['guidance', 'Input #regen-guidance'], ['go', 'Button #regenerate']] }, render: (sz, f) => planRegenerate(sz, f), legend: { screen: 'RegenerateScreen', file: 'tui/screens/planning.py', tree: 'RegenerateScreen(ModalScreen[Request | None])\n├─ Vertical #regenerate .dialog\n│  ├─ RadioSet #regen-scope\n│  ├─ Input #regen-guidance\n│  ├─ Static .kv\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('RegenerateScreen', '#regenerate', 84), keys: MODAL_KEYS([]), states: P_STATES, notes: ['Regeneration produces a new draft to review (R031).', 'An approved template is never regenerated (R030).'] } }),
    S('PlanApprove', 'Approve and save', { sizes: ['wide'], focus: { wide: [['approve', 'Button #approve']] }, render: (sz, f) => planApprove(sz, f), legend: { screen: 'ApproveDraftScreen', file: 'tui/screens/planning.py', tree: 'ApproveDraftScreen(ModalScreen[bool])\n├─ Vertical #approve-draft .dialog\n│  ├─ Static .kv\n│  ├─ Static #draft-sha\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: modalSel('ApproveDraftScreen', '#approve-draft', 86), keys: MODAL_KEYS([['enter', 'approve', 'Save r1 and open it']]), states: P_STATES, notes: ['The saved template is the Library’s “Billing service refactor r1” (M01).', 'Later runs and imports use the packaged baseline, never HEAD again (R068).'] } }),
  ] },
];

// ---------------------------------------------------------------- M17 · ZIP exchange

const ZIP_STATES = [['Import (M01)', 'ImportTemplate'], ['Unsafe', 'ImportUnsafe'], ['Incomplete', 'ImportIncomplete'], ['Digest mismatch', 'ImportRejected'], ['Identical', 'ImportDuplicate'], ['Result package', 'ResultPackage'], ['Template differs', 'ResultMismatch'], ['Separate revision', 'ResultEmbedded'], ['Id conflict', 'ResultImportConflict']];
const zipTree = (screen, id, rows) => `${screen}\n├─ Vertical ${id} .dialog\n${rows.map((r) => `│  ├─ ${r}`).join('\n')}\n│  └─ Horizontal .dialog-actions\n└─ Footer`;

const M17 = [
  { id: 'm17-template', page: 'm17', title: 'M17 · 1 · Validation order and rejected packages', note: 'Every import runs the same five steps: a safe package boundary, the definition (complete, then its recomputed SHA-256), result compatibility, existing identities, and only then registration. A failure at any step adds nothing. Contents are data: nothing runs, installs or calls a model.', boards: [
    S('ImportUnsafe', 'Unsafe package', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['entries', 'DataTable #unsafe-entries']] }, render: (sz, f) => importUnsafe(sz, f), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: zipTree('ImportScreen(ModalScreen[ImportOutcome])', '#import', ['Vertical #validation-order', 'DataTable #unsafe-entries', 'Static .kv']), sel: modalSel('ImportScreen', '#import', 86), keys: [['esc', 'dismiss', 'Close']], states: ZIP_STATES, notes: ['Escaping paths, links and extraction-bound violations are refused before extraction (R117, R142).', 'The exact extraction bound is an implementation choice; this frame shows the outcome only.'] } }),
    S('ImportIncomplete', 'Incomplete package', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['table', 'DataTable #completeness']] }, render: (sz, f) => importIncomplete(sz, f), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: zipTree('ImportScreen(ModalScreen[ImportOutcome])', '#import', ['Vertical #validation-order', 'DataTable #completeness', 'Static #next-action']), sel: modalSel('ImportScreen', '#import', 86), keys: [['esc', 'dismiss', 'Close'], ['c', 'copy', 'Copy the diagnostics']], states: ZIP_STATES, notes: ['Completeness is checked against the template contract before identity (R115).', 'Diagnostics name the failed requirement and a next action (R117).'] } }),
  ] },
  { id: 'm17-results', page: 'm17', title: 'M17 · 2 · Result packages and template mismatch', note: 'A result ZIP carries the exact template and everything about the selected runs, with a digest manifest; origin and source ids survive relays through other machines. Results join only a revision whose recomputed identity matches; otherwise the expected and received identities are shown, and the embedded template can be imported as its own revision.', boards: [
    S('ResultPackage', 'Result package contents', { sizes: ['wide'], focus: { wide: [['tree', 'Tree #package-tree'], ['import', 'Button #import']] }, render: (sz, f) => resultPackage(sz, f), legend: { screen: 'ResultPackageScreen', file: 'tui/screens/exchange.py', tree: zipTree('ResultPackageScreen(ModalScreen[bool])', '#result-package', ['Tree #package-tree', 'DataTable #provenance', 'Static .kv']), sel: [...modalSel('ResultPackageScreen', '#result-package', 86), ['#package-tree', 'height: 9;']], keys: MODAL_KEYS([['enter', 'import', 'Validate and import']]), states: ZIP_STATES, notes: ['Contents follow R116; credentials and unrelated files are never packed.', 'A relay machine is recorded but never replaces the origin (R116).'] } }),
    S('ResultMismatch', 'Result · template differs', { sizes: ['wide'], focus: { wide: [['choice', 'RadioSet #mismatch-choice'], ['go', 'Button #continue']] }, render: (sz, f) => resultMismatch(sz, f), legend: { screen: 'ImportResultsScreen', file: 'tui/screens/exchange.py', tree: zipTree('ImportResultsScreen(ModalScreen[ImportOutcome])', '#result-mismatch', ['Vertical #validation-order', 'Static #identities', 'RadioSet #mismatch-choice']), sel: modalSel('ImportResultsScreen', '#result-mismatch', 86), keys: MODAL_KEYS([]), states: ZIP_STATES, notes: ['Embedded, declared and local identities must all agree (R120).', 'Expected and received are shown in full; nothing is force-merged (R121).'] } }),
    S('ResultEmbedded', 'Imported as its own revision', { sizes: ['wide'], render: (sz) => resultEmbedded(sz), legend: { screen: 'ImportResultsScreen', file: 'tui/screens/exchange.py', tree: zipTree('ImportResultsScreen(ModalScreen[ImportOutcome])', '#result-embedded', ['Vertical #validation-order', 'Static .kv']), sel: modalSel('ImportResultsScreen', '#result-embedded', 86), keys: [['esc', 'dismiss', 'Close'], ['o', 'open', 'Open the new revision']], states: ZIP_STATES, notes: ['The embedded template passes the same validation and is registered with its results atomically (R121, R142).', 'Different hashes never share a comparison (R122).'] } }),
  ] },
];

// ---------------------------------------------------------------- M18 · hardware monitoring

const TEL_TREE = `TelemetryScreen(Screen)        t from a result
├─ Header · Static #telemetry-bar
├─ Static #charts .pane            host, one collection
├─ Horizontal
│  ├─ Vertical .pane
│  │  └─ DataTable #process-trees
│  └─ Static #energy .pane.kv
├─ Horizontal .actions
└─ Footer`;
const T_STATES = [['Settings', 'MonitoringSettings'], ['Five causes (M03)', 'EnvironmentCollectors'], ['Guidance', 'CollectorGuide'], ['Telemetry', 'Telemetry'], ['Energy detail', 'EnergyDetail'], ['Sequential windows', 'SequentialEnergy'], ['Currency and energy (M10)', 'CurrencyEnergy']];

const M18 = [
  { id: 'm18-setup', page: 'm18', title: 'M18 · 1 · Optional collectors and guidance', note: 'Monitoring is automatic by default and can be turned off. Only metrics whose tool, hardware and permission are confirmed are collected; every other metric names one of five causes. Guidance is platform-specific, the user runs it, and recheck confirms it. Nothing is installed or changed by AxBenchmark, and no sensor is ever required.', boards: [
    S('MonitoringSettings', 'Monitoring settings', { sizes: ['wide'], focus: { wide: [['mode', 'RadioSet #monitoring-mode'], ['table', 'DataTable #detected'], ['save', 'Button #save']] }, render: (sz, f) => monitoringSettings(sz, f), legend: { screen: 'MonitoringScreen', file: 'tui/screens/setup.py', tree: zipTree('MonitoringScreen(ModalScreen[Monitoring | None])', '#monitoring', ['RadioSet #monitoring-mode', 'DataTable #detected', 'Static .kv']), sel: [...modalSel('MonitoringScreen', '#monitoring', 86), ['#detected', 'height: 6;']], keys: MODAL_KEYS([['ctrl+s', 'save', 'Store with the configuration']]), states: T_STATES, notes: ['Automatic detection by default, explicit off (R102).', 'One host collection per experiment at 1 s (R106).', 'Same mike-mbp-m4 collectors as the Environment frames (M03).'] } }),
    S('CollectorGuide', 'Collector guidance', { sizes: ['wide'], focus: { wide: [['recheck', 'Button #recheck'], ['copy', 'Button #copy']] }, render: (sz, f) => collectorGuide(sz, f), legend: { screen: 'CollectorGuideScreen', file: 'tui/screens/environment.py', tree: zipTree('CollectorGuideScreen(ModalScreen[None])', '#collector-guide', ['Static #collector-cause .kv', 'TextArea #guide-commands', 'Static #guide-links .kv']), sel: modalSel('CollectorGuideScreen', '#collector-guide', 86), keys: MODAL_KEYS([['f5', 'recheck', 'Run the collector checks again'], ['c', 'copy', 'Copy the commands']]), states: T_STATES, notes: ['Opened from the Linux collectors frame (M03); the counter exists, permission is the cause (R103).', 'Commands are shown for a verified distribution only; the guide links the kernel powercap docs (R105).'] } }),
  ] },
  { id: 'm18-data', page: 'm18', title: 'M18 · 2 · Telemetry, attribution and energy', note: 'Host telemetry is collected once per experiment and keeps its source, scope and coverage. Process-tree CPU time and memory are attributed per configuration, but a separate model server is not, and cloud models are measured on the client only. Shared energy is never split between concurrent configurations; counters beat sampled power, gaps stay partial, and overlapping domains are never added.', boards: [
    S('Telemetry', 'Telemetry · one experiment', { sizes: ['wide'], focus: { wide: [['charts', 'Static #charts'], ['process', 'DataTable #process-trees'], ['energy', 'Static #energy'], ['detail', 'Button #energy-detail']] }, render: (sz, f) => telemetry(sz, f), legend: { screen: 'TelemetryScreen', file: 'tui/screens/telemetry.py', tree: TEL_TREE, sel: [['#charts', 'height: 12;  Sparkline per metric'], ['#process-trees', 'height: 5;'], ['#energy', 'width: 54;']], keys: [['esc', 'app.pop_screen', 'Back to the result'], ['e', 'energy_detail', 'How energy was derived'], ['w', 'windows', 'Sequential run windows']], states: T_STATES, notes: ['Imported results of run 2026-09-24-lab keep the telemetry collected on lab-linux-4090 (M02).', 'llama-server is a separate model server, not part of Pi’s process tree (R107, R108).', 'Cloud configurations: client machine only (R111).'] } }),
    S('EnergyDetail', 'Energy derivation', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #energy-domains']] }, render: (sz, f) => energyDetail(sz, f), legend: { screen: 'EnergyDetailScreen', file: 'tui/screens/telemetry.py', tree: zipTree('EnergyDetailScreen(ModalScreen[None])', '#energy-detail', ['DataTable #energy-domains', 'Static .kv']), sel: modalSel('EnergyDetailScreen', '#energy-detail', 86), keys: [['esc', 'dismiss', 'Close']], states: T_STATES, notes: ['Counter deltas preferred; wraparound handled; gaps keep coverage partial (R112, R147).', 'Package and its subdomains are never added; power estimates are not wall-socket readings (R113).', 'The tariff estimate keeps the measured scope (R114).'] } }),
    S('SequentialEnergy', 'Sequential execution windows', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #window-energy']] }, render: (sz, f) => sequentialEnergy(sz, f), legend: { screen: 'WindowsScreen', file: 'tui/screens/telemetry.py', tree: zipTree('WindowsScreen(ModalScreen[None])', '#windows', ['DataTable #window-energy', 'Static #windows-note']), sel: modalSel('WindowsScreen', '#windows', 86), keys: [['esc', 'dismiss', 'Close']], states: T_STATES, notes: ['R-0919lab-1 ran alone (jobs 1); window durations add up to its 27:30 (results-data).', 'Windows include background activity and are never exclusive consumption (R110).'] } }),
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
