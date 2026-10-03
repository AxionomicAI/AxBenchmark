// Artboard catalogue for M02–M06: one canvas page per module, grouped into the flows of navigation.md.
// Same legend shape as boards.mjs: Textual screen, widget tree, ids/classes with TCSS, bindings, related frames, notes.
import { results, resultsTrials, resultOrigin, resultOutcomes, resultReviews, rejudge, resultImport, resultImportConflict, exportResult, reportReady, rankings, rankingsTrials, scoreBreakdown, weightsEditor } from './screens-results.mjs';
import { environment, catalog, catalogOverride, catalogBilling, catalogRates, modelPicker } from './screens-readiness.mjs';
import { runConfig, envPolicy, cleanBlocked, runIsolation } from './screens-execution.mjs';
import { decisionEngines, decisionEngineEdit, decisionEngineTest } from './screens-decisions.mjs';
import { setup, judgePicker, reviewLaunch, trialBudget, launchRecord } from './screens-setup.mjs';
import { taskChecks, finalRegression, checkOutcomes, screenshots, verifyProgress, judgeHandoff, evidenceViewer } from './screens-verify.mjs';
import { inventoryAbout, inventoryPrompts, inventoryChecks, inventoryVariant, inventoryUpgrade } from './screens-inventory.mjs';

const S = (name, title, def) => ({ name, title, ...def });
const modalSel = (screen, id, w) => [
  [screen, 'align: center middle; background: $background 60%;'],
  [id, `width: ${w}; max-width: 100%; height: auto; border: round $primary; background: $surface; padding: 1 2;`],
  ['.dialog-actions', 'height: 1; align-horizontal: right; margin-top: 1;'],
];
const MODAL_KEYS = (extra) => [['esc', 'dismiss(None)', 'Close without changes'], ['tab / shift+tab', 'focus_next / previous', 'Move between fields'], ...extra];

// ---------------------------------------------------------------- M02 · results

const RESULTS_TREE = `ResultsScreen(Screen)          AUTO_FOCUS = "#results"
├─ Header
├─ Static #identity-bar         template + full SHA-256 scope
├─ Static #analysis-label        weights · analysis tariff
├─ TabbedContent #results-tabs
│  ├─ TabPane #tab-results "Results"
│  │  ├─ Horizontal #filters
│  │  │  └─ Select × 5        machine · config · env · jobs · judge
│  │  ├─ ContentSwitcher #results-body
│  │  │  └─ DataTable #results .bordered   trial rows + mean / min–max
│  │  │                                   columns: outcomes | .-statistics (s)
│  │  ├─ Horizontal #result-detail
│  │  │  ├─ VerticalScroll #result-summary .pane
│  │  │  └─ Static #retained .pane
│  │  └─ Horizontal .actions
│  └─ TabPane #tab-rankings "Rankings"     (M06)
├─ Static #summary             .-compact only
└─ Footer`;
const RESULTS_SEL = [
  ['#identity-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#filters', 'height: 1; margin: 0 1;'],
  ['#filters Select', 'width: auto; margin-right: 2;  compact=True'],
  ['#results', 'height: 15; max-height: 1fr;  cursor_type = "row"'],
  ['#result-detail', 'height: 1fr;'],
  ['#result-summary, #retained', 'width: 1fr; border: solid $foreground 30%;'],
  ['Screen.-compact #result-detail', 'display: none;'],
  ['Screen.-compact #summary', 'display: block; height: 6;'],
  ['#results .-mean', 'text-style: bold;  mean row after the trials of a configuration'],
  ['#results .-range', 'color: $foreground 60%;  min–max row'],
  ['#results .-interrupted', 'text-style: bold;  not comparable, listed last'],
  ['#analysis-label.-alternative', 'text-style: bold;  “▲ analysis tariff … · alternative”'],
  ['#results.-statistics', 'columns Result · Harness · Model · Gen tok/s · In tok (cached) · Out tok (reasoning) · Files / LOC'],
  ['#results .-stat-partial', 'text-style: bold;  "▲ " prefix, independent per column'],
  ['#results .-stat-unknown', 'color: $foreground 60%;  "—" / "unknown", sorted last, never 0'],
];
const RESULTS_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the template revision'],
  ['1 · 2', 'show_tab', 'Results · Rankings'],
  ['f', 'focus("#filters")', 'Edit filters (compact: opens a filter sheet)'],
  ['o / enter', 'open_result', 'Push ResultScreen for the row'],
  ['j', 'rejudge', 'Review again with a selected judge (explicit only)'],
  ['i / x', 'import / export', 'Result ZIP import (M17) / export of a run'],
  ['h', 'report', 'Write the standalone HTML report (M13)'],
  ['w', 'weights', 'Push WeightsScreen (M06)'],
  ['s', 'toggle_columns', 'Outcome ⇄ statistics column set of #results; same setting for Rankings #all-entries'],
  ['g / a', 'throughput / artifact_stats', 'Statistics view: ThroughputScreen or ArtifactStatsScreen (M10) of the row'],
  ['e', 'analysis_tariff', 'CurrencyEnergyScreen (M10) in analysis mode: an electricity tariff for this analysis only; records are not written'],
  ['tab', 'focus_next', 'Next focus stop (not shown in the Footer)'],
];
const RES_STATES = [['Results', 'Results'], ['Statistics', 'ResultsStatistics'], ['Trials', 'ResultsTrials'], ['Halted run', 'ResultsHalted'], ['Analysis tariff', 'ResultsAnalysisTariff'], ['Import', 'ResultImport'], ['Id conflict', 'ResultImportConflict'], ['Export', 'ExportResult'], ['Report', 'ReportReady'], ['Rankings', 'Rankings']];
const resLegend = (notes) => ({ screen: 'ResultsScreen', file: 'tui/screens/results.py', tree: RESULTS_TREE, sel: RESULTS_SEL, keys: RESULTS_KEYS, states: RES_STATES, notes });

const RESULT_TREE = `ResultScreen(Screen)           one retained result
├─ Header
├─ Static #result-bar
├─ TabbedContent #result-tabs
│  ├─ TabPane "Launch and origin"
│  │  ├─ VerticalScroll #definition .pane
│  │  ├─ VerticalScroll #origin .pane
│  │  └─ Static #provenance-note .notice.-warning
│  ├─ TabPane "Outcomes and measurements"
│  │  ├─ DataTable #task-outcomes .bordered
│  │  ├─ VerticalScroll #check-detail .pane
│  │  └─ Static #coverage .pane.kv
│  └─ TabPane "Reviews and evidence"
│     ├─ DataTable #grades .bordered
│     ├─ Static #review-meta .pane.kv
│     └─ Vertical #additional-reviews .pane
├─ Horizontal .actions
└─ Footer`;
const RESULT_SEL = [
  ['#result-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#definition, #origin', 'width: 1fr; height: 26; border: solid $foreground 30%;'],
  ['#task-outcomes', 'height: 11;  cursor_type = "row"'],
  ['#check-detail, #coverage', 'width: 1fr; height: 16;'],
  ['.kv', 'height: auto;  label column width: 12–15'],
  ['Screen.-compact #coverage', 'display: none;'],
];
const RESULT_KEYS = [
  ['esc', 'app.pop_screen', 'Back to Results (filters kept)'],
  ['1 · 2 · 3', 'show_tab', 'Launch and origin · Outcomes · Reviews'],
  ['j', 'rejudge', 'Review again with a selected judge'],
  ['x', 'export', 'Export this result’s run as a ZIP'],
  ['l', 'logs', 'Push EvidenceViewerScreen (M08) on the selected task’s log'],
];
const R1_STATES = [['Launch and origin', 'ResultOrigin'], ['Outcomes', 'ResultOutcomes'], ['Reviews', 'ResultReviews'], ['Review again', 'Rejudge']];
const resultLegend = (notes) => ({ screen: 'ResultScreen', file: 'tui/screens/result.py', tree: RESULT_TREE, sel: RESULT_SEL, keys: RESULT_KEYS, states: R1_STATES, notes });

const REJUDGE_TREE = `RejudgeScreen(ModalScreen[RejudgeRequest])
├─ Vertical #rejudge .dialog
│  ├─ Static #rejudge-subject
│  ├─ Static #original-review .kv
│  ├─ Select #rejudge-judge
│  ├─ Static #rejudge-terms .kv
│  └─ Horizontal .dialog-actions
└─ Footer`;
const IMPORT_RESULTS_TREE = `ImportResultsScreen(ModalScreen[ImportOutcome])
├─ Vertical #import-results .dialog
│  ├─ ContentSwitcher
│  │  ├─ Vertical #import-steps         (M17 validation)
│  │  ├─ Vertical #import-validated
│  │  │  ├─ DataTable #import-preview   add · skip
│  │  │  └─ Static .notice.-warning
│  │  └─ Vertical #import-conflict .notice.-error
│  │     └─ Static #conflict-digests
│  └─ Horizontal .dialog-actions
└─ Footer`;
const EXPORT_RESULTS_TREE = `ExportResultsScreen(ModalScreen[Path | None])
├─ Vertical #export-results .dialog
│  ├─ SelectionList #export-selection
│  ├─ Input #export-results-path
│  ├─ Static #export-results-contents
│  └─ Horizontal .dialog-actions
└─ Footer`;
const REPORT_TREE = `ReportScreen(ModalScreen[None])
├─ Vertical #report .dialog
│  ├─ Static #report-path        always shown
│  ├─ Static .notice.-warning    open failed
│  └─ Horizontal .dialog-actions
│     ├─ Button #copy-path
│     ├─ Button #open-folder
│     └─ Button #close .-primary
└─ Footer`;

const M02 = [
  { id: 'm02-results', page: 'm02', title: 'M02 · 1 · Compare retained results', note: 'ResultsScreen lists every result bound to one template SHA-256: local and imported, filterable by machine, configuration, environment policy, concurrency and judge. The selected row shows provenance and the four retained information groups. Import, export, explicit re-review and the HTML report work from retained data without model calls.', boards: [
    S('Results', 'Results', { sizes: ['wide', 'compact'], focus: { wide: [['results', 'DataTable #results'], ['filters', 'Select #filter-machine'], ['open', 'Button #open-result']], compact: [['results', 'DataTable #results'], ['filters', 'Select #filter-machine']] }, render: (sz, f) => results(sz, f), legend: resLegend([
      'Only results whose template SHA-256 matches r1 are listed; another hash opens its own comparison and never mixes in (R122).',
      'All five comparison filters are visible (R124). Machine differences are inputs, not hash mismatches.',
      'Measured tables default to highest known cost first, unknown last (M06 R131). Unknown cost reads “unknown”, never $0; a local endpoint in a parallel run has no cost (D4), and partial cost carries ▲ (D11).',
      'The selected result shows its cost basis: reported, price-table estimate with source and date, or energy estimate (D4).',
      'Imported rows carry ↓ and their source machine; the summary says validated, not certified (R123).',
      'Costs show in each run’s frozen display currency (all USD here). Rows from runs with different display currencies show in USD, and the table says so. There is no currency switch in Results; rankings compute in USD.',
      'R176: s switches #results to the statistics column set (ResultsStatistics). The selected summary always carries the four statistics, so the compact layout reveals them without hiding their availability.',
    ]) }),
    S('ResultsStatistics', 'Results · statistics columns', { sizes: ['wide', 'compact'], focus: { wide: [['results', 'DataTable #results'], ['summary', 'VerticalScroll #result-summary'], ['gen', 'Button #throughput']], compact: [['results', 'DataTable #results']] }, render: (sz, f) => results(sz, f, { stats: true }), legend: resLegend([
      'R173–R176: the primary statistics columns Gen tok/s, In tok (cached), Out tok (reasoning) and Files / LOC for all 12 results, from results-data.mjs STATS. Files / LOC groups two independent metrics.',
      'Gen tok/s is per-request generation throughput: exact paired output ÷ summed request generation seconds, labelled with its basis (proxy stream window or native decode). It is never wall-clock speed, task time or a mean of rates.',
      'Sorted by Gen tok/s with unknown last: sorting never reads null as 0. ▲ partial and ? not exposed are per column: R-0928a-3 has partial timing (41 of 44 requests) and no cache split, R-0921a-2 reported no usage but its Files / LOC is complete.',
      'R-0919lab-1 LOC is partial (an unmarked Windows-1252 file is not guessed); its file count stays complete.',
      'All five statistics weigh 0 in every original analysis, so they are shown, exported and inspectable but never looked up for ranking. More output, files or lines never means better quality.',
      'g and a open the derivations (M10 ThroughputDetail, ArtifactStats). The compact layout keeps every column and moves the derivation summary below.',
    ]) }),
    S('ResultsTrials', 'Results · 3 trials per configuration', { sizes: ['wide'], focus: { wide: [['results', 'DataTable #results'], ['filters', 'Select #filter-machine'], ['open', 'Button #open-result']] }, render: (sz, f) => resultsTrials(sz, f), legend: resLegend([
      'D7: every trial is its own result (trial index, own judge session). Each configuration lists its trials, then a bold mean row and a muted min–max row for cost, time and quality.',
      'A configuration is eligible only when every trial is: one failed check in trial 2 marks the Claude Code mean “✗ trial ineligible”. Rankings use the means.',
      'Fixture: Orders REST API r3, run 2026-09-27-t (results-data.mjs TRIAL_CONFIGS). Inventory r1 results have the default single trial.',
      'R174: the summary shows Gen tok/s pooled (Σ output ÷ Σ generation seconds, 81.36) with the per-trial range, never a mean of trial rates; In, Out, Files and LOC are exact means with their ranges.',
    ]) }),
    S('ResultsHalted', 'Results · run halted by a template change', { sizes: ['wide'], focus: { wide: [['results', 'DataTable #results'], ['open', 'Button #open-result']] }, render: (sz, f) => results(sz, f, { halted: true }), legend: resLegend([
      'D9: the first detection of a changed template halts the whole run with explicit-stop cleanup. Each configuration’s result is interrupted with reason “template identity invalidated”, approved and computed SHA-256 and the changed paths.',
      'Interrupted rows are listed last, marked not comparable, never ranked and never rebound to another revision. Partial cost and time carry ▲ (D11).',
      'Evidence stays: Open evidence opens EvidenceViewerScreen (M08).',
    ]) }),
    S('ResultsAnalysisTariff', 'Results · analysis tariff', { sizes: ['wide'], focus: { wide: [['reset', 'Button #reset-tariff'], ['results', 'DataTable #results']] }, render: (sz, f) => results(sz, f, { tariff: true }), legend: resLegend([
      'D4: e opens CurrencyEnergyScreen (M10) in analysis mode. The tariff applies to this analysis only and is labelled “analysis tariff · alternative”, like alternative weights.',
      'Only energy estimates change (R-0919lab-1, sequential, local). The frozen tariff stays in every record; Reset returns to it.',
    ]) }),
    S('ResultImport', 'Import results · validated', { sizes: ['wide'], focus: { wide: [['add', 'Button #add-results'], ['table', 'DataTable #import-preview']] }, render: (sz, f) => resultImport(sz, f), legend: { screen: 'ImportResultsScreen', file: 'tui/screens/exchange.py', tree: IMPORT_RESULTS_TREE, sel: [...modalSel('ImportResultsScreen', '#import-results', 86), ['#import-preview', 'height: 4;']], keys: MODAL_KEYS([['ctrl+s', 'add', 'Add the new results; skipped rows stay skipped']]), states: RES_STATES, notes: ['M17 owns this complete exchange screen and its VM; M02 only opens its injected factory.', 'Identical results are skipped, so re-importing is idempotent (R122).', 'Import never runs scripts or models and is never called certification (R123).'] } }),
    S('ResultImportConflict', 'Import · result id conflict', { sizes: ['wide', 'compact'], focus: { wide: [['close', 'Button #close'], ['diff', 'Button #show-differences']], compact: [['close', 'Button #close'], ['diff', 'Button #show-differences']] }, render: (sz, f) => resultImportConflict(sz, f), legend: { screen: 'ImportResultsScreen', file: 'tui/screens/exchange.py', tree: IMPORT_RESULTS_TREE, sel: modalSel('ImportResultsScreen', '#import-results', 86), keys: MODAL_KEYS([]), states: RES_STATES, notes: ['A different payload under an existing result id is rejected; the original is never overwritten and nothing is partially added (R122).', 'Digests stack under their labels at 80 columns so all 64 cells stay visible.'] } }),
    S('ExportResult', 'Export result ZIP', { sizes: ['wide'], focus: { wide: [['results', 'SelectionList #export-selection'], ['path', 'Input #export-results-path'], ['export', 'Button #export-zip']] }, render: (sz, f) => exportResult(sz, f), legend: { screen: 'ExportResultsScreen', file: 'tui/screens/exchange.py', tree: EXPORT_RESULTS_TREE, sel: [...modalSel('ExportResultsScreen', '#export-results', 84), ['#export-selection', 'height: 4; border: none;']], keys: MODAL_KEYS([['space', 'toggle', 'Include or leave out a result'], ['ctrl+s', 'export', 'Write the ZIP; the path is shown on success']]), states: RES_STATES, notes: ['Contents follow R116: exact template, selected run records and configuration, machine and harness details, outcomes, measurements with coverage, original weights, judge data, snapshots, evidence and a payload manifest.', 'Credentials and unrelated machine files are never packed (R066).'] } }),
    S('ReportReady', 'HTML report · could not open', { sizes: ['wide'], focus: { wide: [['close', 'Button #close'], ['copy', 'Button #copy-path']] }, render: (sz, f) => reportReady(sz, f), legend: { screen: 'ReportScreen', file: 'tui/screens/results.py', tree: REPORT_TREE, sel: modalSel('ReportScreen', '#report', 86), keys: MODAL_KEYS([['c', 'copy_path', 'Copy the report path']]), states: RES_STATES, notes: ['On completion the app tries to open the report and always shows its location, also when opening fails (R035, R134).', 'Report generation uses retained results only; no model is called.'] } }),
  ] },
  { id: 'm02-result', page: 'm02', title: 'M02 · 2 · Inspect one result', note: 'ResultScreen exposes every retained information group for one result: definition and launch, origin and execution, measurements and outcomes, reviews and evidence. Process outcomes, acceptance checks and quality grades stay in separate columns. Re-review is always an explicit request that keeps the original.', boards: [
    S('ResultOrigin', 'Result · launch and origin', { sizes: ['wide'], focus: { wide: [['definition', 'VerticalScroll #definition'], ['origin', 'VerticalScroll #origin']] }, render: (sz, f) => resultOrigin(sz, f), legend: resultLegend([
      'Definition and launch: approved template and full SHA-256, packaged baseline, resolved configuration, catalog metadata at launch, original weights (R066, R134).',
      'Origin: source result id, machine label and id, hardware and OS, local/imported provenance, harness version, timestamps, model/effort, policy, concurrency, judge (R116, R124, R143).',
      'Requested and effective settings stay apart; an unexposed effort is “unverified” (M04/M05 R065).',
    ]) }),
    S('ResultOutcomes', 'Result · outcomes and measurements', { sizes: ['wide', 'compact'], focus: { wide: [['tasks', 'DataTable #task-outcomes'], ['evidence', 'VerticalScroll #check-detail'], ['log', 'Button #open-log']], compact: [['tasks', 'DataTable #task-outcomes'], ['evidence', 'Static #check-detail']] }, render: (sz, f) => resultOutcomes(sz, f), legend: resultLegend([
      'Process (exit), checks (✓ ✗ ? ○) and measurements are separate columns; a zero exit never implies a passed check (R076).',
      'Unverified means the check could not run (here: browser missing). It is neither passed nor failed, and keeps the result out of default shortlists (M06 R100).',
      'Measurements show their source, coverage and limitations, which travel with exports and reports (R124).',
      'R176: tasks show Gen tok/s, In tok (cached) and Out tok (reasoning); Files / LOC is trial-scoped (final snapshot T7) and appears in the coverage pane, never as fabricated per-task counts. m opens MeasurementsScreen.',
      'Task totals equal the result’s cost and time on Results and Rankings.',
      'l, Open check log and Open snapshot push EvidenceViewerScreen (M08) on the selected task (W1).',
    ]) }),
    S('ResultReviews', 'Result · reviews and evidence', { sizes: ['wide'], focus: { wide: [['grades', 'DataTable #grades'], ['review', 'Static #review-meta'], ['additional', 'Button #rejudge']] }, render: (sz, f) => resultReviews(sz, f), legend: resultLegend([
      'Raw 1–5 grades are kept as the judge gave them; Q is computed by AxBenchmark from them and the original weights (M06 R096).',
      'Imported reviews keep their judge configuration, evidence and limitations (R082, R143).',
      'Additional reviews appear beside the original, never instead of it.',
    ]) }),
    S('Rejudge', 'Review again', { sizes: ['wide'], focus: { wide: [['judge', 'Select #rejudge-judge'], ['confirm', 'Button #rejudge']] }, render: (sz, f) => rejudge(sz, f), legend: { screen: 'RejudgeScreen', file: 'tui/screens/results.py', tree: REJUDGE_TREE, sel: [...modalSel('RejudgeScreen', '#rejudge', 84), ['#rejudge-judge', 'width: 1fr;']], keys: MODAL_KEYS([['ctrl+s', 'confirm', 'Start one fresh headless review (M12)']]), states: R1_STATES, notes: ['Only explicit: no screen re-reviews automatically (R082).', 'The original review is preserved; judging cost is recorded apart from run cost.', 'Same template rubric for every review; quality and combined rankings stay separate per judge configuration (R143).'] } }),
  ] },
];

// ---------------------------------------------------------------- M06 · rankings and weights

const RANK_TREE = `ResultsScreen › TabPane #tab-rankings
├─ Horizontal #ranking-controls
│  ├─ Select #judge-group           one judge configuration
│  ├─ Select #timing-basis          only when Gen tok/s carries weight
│  └─ Static #weights-label         original | alternative | profile defaults
├─ DataTable #combined .bordered    eligible only
├─ Horizontal #shortlists
│  ├─ DataTable #lowest-cost .bordered
│  ├─ DataTable #shortest-time .bordered
│  └─ DataTable #highest-quality .bordered
├─ DataTable #all-entries .bordered  everything, with reasons · s: statistics
├─ Static #minimums
└─ Horizontal .actions`;
const RANK_SEL = [
  ['#ranking-controls', 'height: 1; margin: 0 1;'],
  ['#combined', 'height: auto; max-height: 9;  cursor_type = "row"'],
  ['#shortlists DataTable', 'width: 1fr; height: 8;'],
  ['#all-entries', 'height: auto;'],
  ['#weights-label.-alternative', 'text-style: bold;'],
  ['Screen.-compact #shortlists', 'layout: vertical; height: 3;  one line each'],
  ['Screen.-compact #all-entries', 'display: none;  reasons shown as #excluded'],
  ['#combined .-enabled-only', 'one points column per enabled component; zero-weight components are not drawn'],
  ['#all-entries.-statistics', 'Gen tok/s · In tok (cached) · Out tok (reasoning) · Files / LOC; header_height = 2'],
];
const RANK_KEYS = [
  ['1 · 2', 'show_tab', 'Results · Rankings'],
  ['g', 'judge_group', 'Switch judge group; groups never merge'],
  ['b / enter', 'breakdown', 'Push ScoreBreakdownScreen for the row'],
  ['w', 'weights', 'Push WeightsScreen'],
  ['r', 'reset', 'Reset to the original analysis (alternative only)'],
  ['s', 'toggle_columns', 'Outcome ⇄ statistics columns of #all-entries'],
  ['h', 'report', 'HTML report with the current weights'],
  ['Save preset… · Export configuration', '', 'Push the shared PromptScreen (M15) for a name or a path'],
];
const RANK_STATES = [['Original', 'Rankings'], ['Profile defaults', 'RankingsProfileDefaults'], ['Trials', 'RankingsTrials'], ['Breakdown', 'ScoreBreakdown'], ['Weights', 'WeightsEditor'], ['Invalid', 'WeightsInvalid'], ['Alternative', 'RankingsAlternative'], ['Weights · 8 factors', 'WeightsFactors'], ['8 factors', 'RankingsFactors'], ['Breakdown · 8 factors', 'ScoreBreakdownFactors']];
const rankLegend = (notes) => ({ screen: 'ResultsScreen · Rankings', file: 'tui/screens/results.py', tree: RANK_TREE, sel: RANK_SEL, keys: RANK_KEYS, states: RANK_STATES, notes });

const BREAKDOWN_TREE = `ScoreBreakdownScreen(ModalScreen[None])
├─ Vertical #breakdown .dialog
│  ├─ Static #eligibility
│  ├─ DataTable #quality-breakdown
│  ├─ DataTable #combined-breakdown
│  └─ Horizontal .dialog-actions
└─ Footer`;
const WEIGHTS_TREE = `WeightsScreen(ModalScreen[WeightSet | None])
├─ Vertical #weights .dialog
│  ├─ Select #preset               original · defaults · saved
│  ├─ Horizontal #weight-sets
│  │  ├─ Vertical #quality-weights
│  │  │  └─ (Label, Input.weight, Static.pct) × 6
│  │  └─ Vertical #ranking-weights      RankingWeightsV2 · eight keys
│  │     ├─ (Label, Input.weight, Static.direction, Static.pct) × 3
│  │     │                        cost · time lower, quality higher · fixed
│  │     ├─ (Label, Input.weight, Select.direction, Static.pct) × 5
│  │     │                        Gen tok/s · In tok · Out tok · Files · LOC
│  │     └─ Select #timing-basis  proxy stream window v1 | native decode v1
│  ├─ Static #weights-hint
│  └─ Horizontal .dialog-actions
└─ Footer`;
const WEIGHTS_SEL = [...modalSel('WeightsScreen', '#weights', 86), ['#weight-sets', 'height: auto; grid-size: 2; grid-gutter: 0 4;'], ['Input.weight', 'width: 7;  type="number", validate_on=["changed"]'], ['Input.weight.-invalid', 'text-style: bold underline;'], ['Static.pct', 'width: 8; text-align: right;'], ['Select.direction', 'width: 13;  — | higher | lower · required before a statistic’s weight > 0'], ['Select.direction.-missing', 'text-style: bold underline;'], ['#weights', 'width: 112;  wider than other dialogs: 6 + 8 rows side by side']];

const M06 = [
  { id: 'm06-rank', page: 'm06', title: 'M06 · 1 · Rankings and eligibility', note: 'The Rankings tab ranks one judge group at a time. Combined scores, minima and shortlists are computed from retained raw grades and measurements with the M06 formulas; every number here is calculated from the same 12 results shown in M02. Failed and excluded entries stay in the full table with their reasons.', boards: [
    S('Rankings', 'Rankings · original weights', { sizes: ['wide', 'compact'], focus: { wide: [['combined', 'DataTable #combined'], ['group', 'Select #judge-group'], ['all', 'DataTable #all-entries'], ['breakdown', 'Button #breakdown']], compact: [['combined', 'DataTable #combined'], ['group', 'Select #judge-group']] }, render: (sz, f) => rankings(sz, f), legend: rankLegend([
      'Eligible = completed, every required check verified, valid grades, business/spec grade ≥ 4 (R100). A high Q never bypasses a gate.',
      'Missing a positively weighted measurement excludes the entry from that ranking only; weights are never redistributed (R100).',
      'Unknown or partial cost excludes an entry from cost-weighted rankings (D11): the local Pi runs ran in parallel, so their cost stays unknown (D4). Reasons such as “cost partial · covers 5 of 7 tasks” stay in the full table.',
      'A verified $0 minimum (only when reported $0 with complete coverage and no subscription) would give each $0 entry the full cost points (R101).',
      'Fewer than five qualify → only that many are shown (lowest cost: 4).',
      'R175: the original plan is schema 2 with all eight keys; Gen tok/s, In tok, Out tok, Files and LOC weigh 0, are never looked up and exclude nobody, so scores and order are exactly the three-component ones (verify.mjs checks rank8 = combined for both groups). s shows their raw columns.',
    ]) }),
    S('RankingsProfileDefaults', 'Rankings · profile defaults', { sizes: ['wide', 'compact'], focus: { wide: [['combined', 'DataTable #combined'], ['originals', 'Button #original-weights']], compact: [['combined', 'DataTable #combined'], ['group', 'Select #judge-group']] }, render: (sz, f) => rankings(sz, f, { profile: true }), legend: rankLegend([
      'D13: the results of one judge group froze different weights, so the original combined ranking uses the grading profile’s default weights, labelled “Profile defaults: original weights differ across results”.',
      'Each result’s original weights stay visible and selectable in WeightsScreen (w), plus custom weights. Quality uses one common set of category weights for every entry.',
      'Replaces the former scoring.original_weights_differ refusal.',
    ]) }),
    S('RankingsTrials', 'Rankings · means of trials', { sizes: ['wide'], focus: { wide: [['combined', 'DataTable #combined'], ['all', 'DataTable #all-entries']] }, render: (sz, f) => rankingsTrials(sz, f), legend: rankLegend([
      'D7: a configuration ranks by the means of its trials; per-trial min–max ranges are shown on the ranked row and never change the order.',
      'A configuration is eligible only when every trial is: the Claude Code entry is excluded with “trial ineligible” and the failing trial named.',
      'Minimums for the score come from the qualifying means.',
    ]) }),
    S('ScoreBreakdown', 'Score breakdown', { sizes: ['wide'], render: (sz) => scoreBreakdown(sz), legend: { screen: 'ScoreBreakdownScreen', file: 'tui/screens/results.py', tree: BREAKDOWN_TREE, sel: modalSel('ScoreBreakdownScreen', '#breakdown', 86), keys: [['esc', 'dismiss', 'Close'], ['← →', 'previous / next', 'Step through ranked entries']], states: RANK_STATES, notes: ['Q = Σ normalized category weight × raw grade (R097).', 'Score = 100 × Σ enabled w_k × factor_k: cost and time min / x, quality Q / 5, minima from this ranking’s eligible population (R098, R099, R175).', 'The five statistics appear as one muted “weight 0 · skipped” row: shown, never looked up.', 'Full precision internally; rounding is display only (R131).'] } }),
    S('ScoreBreakdownFactors', 'Score breakdown · 8 factors', { sizes: ['wide'], render: (sz) => scoreBreakdown(sz, { factors: true }), legend: { screen: 'ScoreBreakdownScreen', file: 'tui/screens/results.py', tree: BREAKDOWN_TREE, sel: modalSel('ScoreBreakdownScreen', '#breakdown', 92), keys: [['esc', 'dismiss', 'Close'], ['← →', 'previous / next', 'Step through ranked entries']], states: RANK_STATES, notes: ['R175: rows follow the enabled set. Gen tok/s · higher: factor x / max with the max 75.34 from the same 3 eligible entries; cost at 0 is shown as skipped with its raw value.', 'Eligibility adds “Gen tok/s complete, proxy”: a positively weighted statistic must be complete, known and on the selected basis in every trial.', 'Direction is the user’s priority and never changes a grade; the judge never sees these values (M12).'] } }),
  ] },
  { id: 'm06-weights', page: 'm06', title: 'M06 · 2 · Weights and alternatives', note: 'Two independent weight sets: quality categories (decide Q) and ranking components (decide the combined score). Each normalizes by its own total. Applying creates a labelled alternative analysis; original weights and raw grades never change, and reset returns to them.', boards: [
    S('WeightsEditor', 'Weights · ranking 2:1:1', { sizes: ['wide'], focus: { wide: [['ranking', 'Input #weight-cost'], ['quality', 'Input #weight-ux'], ['preset', 'Select #preset'], ['apply', 'Button #apply']] }, render: (sz, f) => weightsEditor(sz, f), legend: { screen: 'WeightsScreen', file: 'tui/screens/weights.py', tree: WEIGHTS_TREE, sel: WEIGHTS_SEL, keys: MODAL_KEYS([['ctrl+s', 'apply', 'Apply as a labelled alternative'], ['ctrl+r', 'restore_defaults', 'Load web v1 defaults and 1:1:1']]), states: RANK_STATES, notes: ['Ranking 2:1:1 previews 50% · 25% · 25%, independent of category weights (R094, R095).', 'Restore defaults (product profile) and Reset to original (frozen at launch) are different actions (R096).', 'Presets save both sets to YAML for reuse (R145). Save preset… asks for a name in the shared PromptScreen (M15).', 'The Preset select also lists each result’s original weights when they differ across the judge group (D13).', 'R175: eight ranking components normalized together, independent of the six category weights. Cost and time are fixed lower, quality fixed higher (Q / 5); every statistic starts at 0 with no direction.', 'Presets, defaults, reset and export always carry all eight weights and directions (schema 2). Legacy three-key records are read as five explicit zeros with null directions; their original bytes stay untouched.'] } }),
    S('WeightsInvalid', 'Weights · invalid values', { sizes: ['wide'], focus: { wide: [['ranking', 'Input #weight-time'], ['quality', 'Input #weight-ux']] }, render: (sz, f) => weightsEditor(sz, f, { invalid: true }), legend: { screen: 'WeightsScreen', file: 'tui/screens/weights.py', tree: WEIGHTS_TREE, sel: WEIGHTS_SEL, keys: MODAL_KEYS([]), states: RANK_STATES, notes: ['Rejected: negative, non-finite, unknown component, all-zero set; the message names the input (R145).', 'R175: LOC has weight 1 but no direction, so Apply stays disabled: a direction is never guessed from a metric’s name.', 'Apply and Save preset are disabled until both sets are valid. Previews show — instead of a percentage.'] } }),
    S('WeightsFactors', 'Weights · Gen tok/s enabled', { sizes: ['wide'], focus: { wide: [['direction', 'Select #direction-generation_rate'], ['weight', 'Input #weight-generation_rate'], ['basis', 'Select #timing-basis'], ['apply', 'Button #apply']] }, render: (sz, f) => weightsEditor(sz, f, { factors: true }), legend: { screen: 'WeightsScreen', file: 'tui/screens/weights.py', tree: WEIGHTS_TREE, sel: WEIGHTS_SEL, keys: MODAL_KEYS([['ctrl+s', 'apply', 'Apply as a labelled alternative (RankingsFactors)']]), states: RANK_STATES, notes: ['R175: time 1 · quality 1 · Gen tok/s 1 higher; cost and the other four statistics 0. Each normalizes to 33.3%.', 'Gen tok/s needs a direction before its weight can be positive; “higher” states that faster generation is preferred, nothing more.', 'Timing basis picks the comparison cohort before eligibility: proxy stream window and native decode are never converted into each other.', 'Cost at 0 is skipped before lookup, so unknown costs no longer exclude anyone from this combined ranking.'] } }),
    S('RankingsAlternative', 'Rankings · alternative weights', { sizes: ['wide'], focus: { wide: [['combined', 'DataTable #combined'], ['reset', 'Button #reset']] }, render: (sz, f) => rankings(sz, f, { alt: true }), legend: rankLegend([
      'Alternative weights are labelled on the tab row, the controls and a notice; nothing original is overwritten (R096).',
      'Scores, minima contributions and order are recomputed without judge calls.',
      'Export configuration asks for a path and Save preset… for a name, both in the shared PromptScreen (M15). Reports say which weights they use.',
    ]) }),
    S('RankingsFactors', 'Rankings · Gen tok/s weighted', { sizes: ['wide'], focus: { wide: [['combined', 'DataTable #combined'], ['basis', 'Select #timing-basis'], ['all', 'DataTable #all-entries'], ['reset', 'Button #reset']] }, render: (sz, f) => rankings(sz, f, { factors: true }), legend: rankLegend([
      'R175/R176: alternative plan time · quality · Gen tok/s higher at 33.3% each, cost and four statistics 0. #combined draws one points column per enabled component; raw Cost stays visible.',
      'Eligibility adds a complete, known Gen tok/s on the selected basis: R-0928a-3 → metric_partial (41 of 44 requests), R-0921a-1 → metric_basis_incompatible (native decode), R-0921a-2 → metric_unknown. Existing gate reasons stay beside them.',
      'References come from the same 3 eligible entries (max 75.34, min 31:44); excluded values never set a reference. Exact arithmetic; display rounding only.',
      'Lowest cost, shortest time and highest quality shortlists keep their own requirements: an enabled statistic in the combined plan does not apply to them.',
      '#all-entries shows the statistics column set with typed reasons; metric reasons are listed first in this view.',
    ]) }),
  ] },
];

// ---------------------------------------------------------------- M03 · environment

const ENV_TREE = `EnvironmentScreen(Screen)      F2 from any screen
├─ Header
├─ Static #env-summary          host · ready count · last check
├─ Horizontal #main
│  ├─ Vertical #checks
│  │  ├─ DataTable #harnesses .bordered
│  │  ├─ DataTable #runtimes .bordered
│  │  ├─ DataTable #collectors .bordered
│  │  └─ Static #models-summary .bordered
│  └─ VerticalScroll #detail-pane .pane
│     ├─ Static .detail-section × n    established · failed · unknown
│     ├─ Static .doc-link
│     └─ Horizontal .actions
├─ Static #readiness-strip      .-compact only
├─ Static #summary              .-compact only
└─ Footer`;
const ENV_SEL = [
  ['#env-summary', 'height: 1; background: $surface; padding: 0 1;'],
  ['#checks', 'width: 72;'],
  ['#detail-pane', 'width: 1fr; border: solid $foreground 30%; padding: 0 1;'],
  ['.pane:focus-within', 'border: solid $primary;'],
  ['#harnesses', 'height: 7;  cursor_type = "row"'],
  ['#collectors', 'height: 9;'],
  ['Screen.-compact #runtimes, Screen.-compact #collectors', 'display: none;'],
  ['Screen.-compact #readiness-strip', 'display: block; height: 2;'],
];
const ENV_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the previous screen'],
  ['f5', 'recheck', 'Run all readiness checks again in a worker'],
  ['enter', 'details', 'Show the selected row in the detail pane'],
  ['m', 'catalog', 'Push CatalogScreen (M04)'],
  ['d', 'docs', 'Open the guide for the selected row'],
  ['c', 'copy_path', 'Copy the executable or doc path'],
];
const ENV_STATES = [['Ready', 'Environment'], ['Auth failed', 'EnvironmentAuthFailed'], ['Rechecked', 'EnvironmentRechecked'], ['Offline', 'EnvironmentOffline'], ['No harness', 'EnvironmentNoHarness'], ['Linux collectors', 'EnvironmentCollectors']];
const envLegend = (notes) => ({ screen: 'EnvironmentScreen', file: 'tui/screens/environment.py', tree: ENV_TREE, sel: ENV_SEL, keys: ENV_KEYS, states: ENV_STATES, notes });

const M03 = [
  { id: 'm03-env', page: 'm03', title: 'M03 · 1 · Environment readiness', note: 'EnvironmentScreen (F2) reports each prerequisite on its own: harness executable, version, authentication, models and headless probe; runtimes and browser; hardware collectors. Found is not authenticated, and authenticated is not usable. Unknown stays unknown; recheck repeats the checks without installing or changing anything.', boards: [
    S('Environment', 'Environment · ready', { sizes: ['wide', 'compact'], focus: { wide: [['harnesses', 'DataTable #harnesses'], ['runtimes', 'DataTable #runtimes'], ['collectors', 'DataTable #collectors'], ['detail', 'Button #recheck']], compact: [['harnesses', 'DataTable #harnesses'], ['detail', 'Static #summary']] }, render: (sz, f) => environment(sz, f), legend: envLegend([
      'Four named harnesses on macOS and Linux, each with independent findings (R005, R006, R029).',
      'The detail pane separates what was established from what is only known later (effective effort, per-model access) (R137).',
      'Collectors are optional and never block a run; their scope is shown (R146).',
    ]) }),
    S('EnvironmentAuthFailed', 'Environment · authentication failed', { sizes: ['wide', 'compact'], focus: { wide: [['detail', 'Button #recheck'], ['harnesses', 'DataTable #harnesses']], compact: [['harnesses', 'DataTable #harnesses']] }, render: (sz, f) => environment(sz, f, { authFail: true }), legend: envLegend([
      'An authentication failure is shown as one; it is not reported as a missing install (R137).',
      'Models for that account stay unknown instead of falling back to another account’s list.',
      'Other harnesses stay usable; launch validation (M07) receives the specific failure.',
    ]) }),
    S('EnvironmentRechecked', 'Environment · rechecked', { sizes: ['wide'], render: (sz) => environment(sz, 'harnesses', { rechecked: true }), legend: envLegend([
      'Recheck reflects changes the user made outside the app and lists what changed (R103).',
      'Recheck never installs software or changes permissions; the toast says so.',
    ]) }),
    S('EnvironmentOffline', 'Environment · offline', { sizes: ['wide'], focus: { wide: [['detail', 'Button #recheck'], ['harnesses', 'DataTable #harnesses']] }, render: (sz, f) => environment(sz, f, { offline: true }), legend: envLegend([
      'Offline is not a rejection: authentication reads “? offline” with the last verified time (R137).',
      'Cached and bundled model data show source and age (◷) and never prove current access (M04).',
      'A local endpoint (Pi) can still be probed and run.',
    ]) }),
  ] },
  { id: 'm03-setup', page: 'm03', title: 'M03 · 2 · Missing prerequisites and collectors', note: 'With no supported harness, planning and runs are blocked with install guidance while library, ZIP exchange and saved results keep working. Collector failures are split into five causes with platform guidance; none of them blocks a benchmark.', boards: [
    S('EnvironmentNoHarness', 'Environment · no supported harness', { sizes: ['wide'], focus: { wide: [['detail', 'Button #recheck'], ['harnesses', 'DataTable #harnesses']] }, render: (sz, f) => environment(sz, f, { noHarness: true }), legend: envLegend([
      'Actionable block for planning and execution only (R029, R137); the library shows the same state in #env-bar.',
      'Guides cover macOS and Linux; the app never installs a harness itself.',
    ]) }),
    S('EnvironmentCollectors', 'Environment · Linux collectors', { sizes: ['wide'], focus: { wide: [['collectors', 'DataTable #collectors'], ['detail', 'Button #recheck']] }, render: (sz, f) => environment(sz, f, { linux: true }), legend: envLegend([
      'All five causes are distinct: insufficient permission, missing driver or kernel interface, collector failure, unsupported hardware, missing tool (R103).',
      'Guidance matches the cause; installing a tool is never suggested for unsupported hardware.',
      'Unavailable metrics are labelled with their cause in results and reports (R146, M18).',
    ]) }),
  ] },
];

// ---------------------------------------------------------------- M04 · catalog

const CATALOG_TREE = `CatalogScreen(Screen)          m from Environment
├─ Header
├─ Static #catalog-bar          version · sources · refresh state
├─ Horizontal #main
│  ├─ Vertical #providers-pane .pane
│  │  ├─ Tree #providers          harness › provider · account
│  │  ├─ Static #provider-facts .kv   account billing kind · default model
│  │  └─ Static #rates-summary        units per USD · x
│  └─ Vertical #entries
│     ├─ DataTable #models .bordered
│     └─ VerticalScroll #entry-detail .pane
│        ├─ Static #entry-fields .kv
│        ├─ DataTable #entry-sources   override › discovered › bundled
│        └─ Horizontal .actions
├─ Select #provider             .-compact only
└─ Footer`;
const CATALOG_SEL = [
  ['#catalog-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#providers-pane', 'width: 32; border: solid $foreground 30%;'],
  ['#models', 'height: auto;  cursor_type = "row"'],
  ['#entry-detail', 'height: 1fr; border: solid $foreground 30%; padding: 0 1;'],
  ['.unknown', 'text-style: italic;  “? unknown” cells'],
  ['Screen.-compact #providers-pane', 'display: none;'],
  ['Screen.-compact #provider', 'display: block;'],
];
const CATALOG_KEYS = [
  ['esc', 'app.pop_screen', 'Back to Environment'],
  ['f5', 'refresh', 'Refresh discovery for the selected provider'],
  ['o', 'override', 'Push OverrideScreen for the selected entry'],
  ['b', 'billing', 'Push BillingScreen for this account'],
  ['x', 'rates', 'Push RatesScreen: exchange rates to USD with source and date'],
  ['/', 'filter', 'Filter models by name'],
  ['y', 'open_yaml', 'Open the catalog YAML (baseline, cache, overrides)'],
  ['tab', 'focus_next', 'Next pane'],
];
const CAT_STATES = [['Catalog', 'Catalog'], ['Refresh failed', 'CatalogRefreshFailed'], ['Override', 'CatalogOverride'], ['Billing', 'CatalogBilling'], ['Rates', 'CatalogRates'], ['Entry · known efforts', 'ModelPicker'], ['Entry · unknown effort', 'ModelPickerUnknown']];
const catLegend = (notes) => ({ screen: 'CatalogScreen', file: 'tui/screens/catalog.py', tree: CATALOG_TREE, sel: CATALOG_SEL, keys: CATALOG_KEYS, states: CAT_STATES, notes });

const OVERRIDE_TREE = `OverrideScreen(ModalScreen[Override | None])
├─ Vertical #override .dialog
│  ├─ Static #override-subject
│  ├─ Horizontal .override-field × 5   Label · Select mode · value
│  │  ├─ #override-efforts      Input
│  │  ├─ #override-default      Select
│  │  ├─ #override-image        Select
│  │  ├─ #override-price-in     Input
│  │  └─ #override-price-out    Input
│  ├─ Horizontal .override-field
│  │  └─ #override-currency     Input · ISO currency
│  ├─ Static #override-effect
│  ├─ Static #override-hint
│  └─ Horizontal .dialog-actions
└─ Footer`;
const PICKER_TREE = `EntryPickerScreen(ModalScreen[ConfigEntry | None])   Setup · M07
├─ Vertical #entry-picker .dialog
│  ├─ Horizontal #entry-target
│  │  ├─ Select #harness
│  │  └─ Select #provider
│  ├─ OptionList #model-options
│  ├─ RadioSet #effort             only known values
│  ├─ Static #effort-hint
│  └─ Horizontal .dialog-actions
└─ Footer`;

const M04 = [
  { id: 'm04-catalog', page: 'm04', title: 'M04 · 1 · Model catalog', note: 'CatalogScreen shows entries per harness, provider and account, each with supported efforts, default effort, image input and pricing, and the source that supplied them: overrides beat discovered data, which beats the bundled baseline. Unknown stays unknown. A failed refresh keeps the last valid data and says how old it is.', boards: [
    S('Catalog', 'Model catalog', { sizes: ['wide', 'compact'], focus: { wide: [['models', 'DataTable #models'], ['providers', 'Tree #providers'], ['detail', 'Button #add-override']], compact: [['models', 'DataTable #models'], ['provider', 'Select #provider']] }, render: (sz, f) => catalog(sz, f), legend: catLegend([
      'Lookup is by harness + installed version + provider/endpoint + account + model, never by display name alone (R010, R061).',
      'Known, unsupported and unknown are different states; unknown is never filled in (R062).',
      'Each source is kept separately and shown per entry with its retrieval date (R064). Prices come from per-provider price sources during an explicit refresh, with source URL and date; bundled prices are the fallback (D4).',
      '#provider-facts names the harness’s own default model and where it was read (D17), and the account’s billing kind with its source: harness status or “declared by user” (R3-1).',
      '#rates-summary lists the rates to USD collected at the last explicit refresh, with source and date; a rate you supplied is marked ▲ (R3-2). x opens RatesScreen.',
    ]) }),
    S('CatalogRefreshFailed', 'Catalog · refresh failed', { sizes: ['wide'], focus: { wide: [['detail', 'Button #retry'], ['models', 'DataTable #models']] }, render: (sz, f) => catalog(sz, f, { failed: true }), legend: catLegend([
      'A failed refresh preserves the last valid catalog and shows the failure beside it (R063).',
      'Cached entries keep source and age; they are not presented as current account access (R137).',
      'Refresh never touches overrides (R064).',
      'Exchange rates keep their last valid values and dates; nothing is converted with a guess (R3-2).',
    ]) }),
    S('CatalogOverride', 'Override catalog entry', { sizes: ['wide'], focus: { wide: [['efforts', 'Select #override-efforts-mode'], ['default', 'Select #override-default-mode'], ['image', 'Select #override-image-mode'], ['price', 'Select #override-price-in-mode'], ['currency', 'Input #override-currency'], ['save', 'Button #save']] }, render: (sz, f) => catalogOverride(sz, f), legend: { screen: 'OverrideScreen', file: 'tui/screens/catalog.py', tree: OVERRIDE_TREE, sel: [...modalSel('OverrideScreen', '#override', 86), ['.override-field', 'height: 1; grid-size: 3; grid-columns: 16 14 1fr;'], ['.override-field Select', 'width: 12;  Inherit · Value · Unknown'], ['.override-field.-unknown', 'text-style: bold;']], keys: MODAL_KEYS([['ctrl+s', 'save', 'Write overrides.yaml']]), states: CAT_STATES, notes: ['D14: every field is tri-state through its mode Select (#…-mode): Inherit (empty, lower layers decide), Value, or Unknown. Unknown stops resolution with source “override”.', 'Unknown efforts → harness default only; unknown image input → not accepted as UI judge; unknown price → no API-equivalent estimate.', 'Overrides win over discovered and bundled values and survive refresh (R064). An override is user metadata, never evidence of authentication or effective settings (R065, R137); see ModelRejected in M05.', 'Model-only Save calls catalog.save_override once; price currency is explicit. Account billing is edited with b in BillingScreen (R157).'] } }),
    S('CatalogBilling', 'Account billing', { sizes: ['wide', 'compact'], focus: { wide: [['mode', 'Select #billing-mode'], ['value', 'Select #billing-value'], ['save', 'Button #save']], compact: [['mode', 'Select #billing-mode'], ['value', 'Select #billing-value'], ['save', 'Button #save']] }, render: (sz, f) => catalogBilling(sz, f), legend: { screen: 'BillingScreen', file: 'tui/screens/catalog.py', tree: 'BillingScreen(ModalScreen)\n├─ Static #account-scope\n├─ Select #billing-mode\n├─ Select #billing-value\n├─ Static #billing-source\n└─ Button #save', sel: modalSel('BillingScreen', '#billing', 86), keys: MODAL_KEYS([['ctrl+s', 'save', 'catalog.save_account_override only']]), states: CAT_STATES, notes: ['R157/F16: full harness/target/account identity; applies to all models and versions in this account.', 'ContextDTO.billing_form preserves Value, Inherit and Unknown; do not derive form mode from resolved billing.', 'One Save calls catalog.save_account_override(harness,target,account_id,billing). Typed field errors retain the form; Escape sends nothing.', 'Unknown and Inherit examples are visible explanations; interactive mode changes, pending save, cloud-local rejection and account isolation remain future M04.4 tests.'] } }),
    S('CatalogRates', 'Exchange rates · units per USD', { sizes: ['wide', 'compact'], focus: { compact: [['rates', 'DataTable #rates-table'], ['value', 'Input #rate-value'], ['save', 'Button #save']], wide: [['rates', 'DataTable #rates-table'], ['mode', 'Select #rate-mode'], ['value', 'Input #rate-value'], ['save', 'Button #save']] }, render: (sz, f) => catalogRates(sz, f), legend: { screen: 'RatesScreen', file: 'tui/screens/catalog.py', tree: `RatesScreen(ModalScreen[RateOverrides | None])
├─ Vertical #rates .dialog
│  ├─ Static #rates-subject       refresh time · counts
│  ├─ DataTable #rates-table       currency · units per 1 USD · layer · source · retrieved
│  ├─ Horizontal #rate-edit        Select #rate-mode · Input #rate-value
│  ├─ Static #rates-hint
│  └─ Horizontal .dialog-actions
└─ Footer`, sel: [...modalSel('RatesScreen', '#rates', 92), ['#rates-table', 'height: 6;  cursor_type = "row"'], ['#rate-mode', 'width: 12;  Inherit · Value · Unknown'], ['#rate-value', 'width: 12;  type="number", > 0'], ['#rates-table .-override', 'text-style: bold;  “▲ override · supplied by you”']], keys: MODAL_KEYS([['a', 'add_rate', 'Add a rate for a currency with none collected'], ['delete', 'remove_rate', 'Remove your rate; the collected one applies again'], ['ctrl+s', 'save', 'Write rates: in overrides.yaml']]), states: CAT_STATES, notes: ['R3-2: M04’s ExchangeRateSource collects rates to USD only during an explicit catalog refresh, never during a run, each with source and date.', 'A rate you supply overrides the collected one and is labelled “supplied by you” wherever it is used; the collected rate is kept.', 'Launch freezes a RateSnapshot (M07) with the rates for every price currency and the display currency; later changes here never reach a frozen run.', 'A currency without a rate converts to unknown (no_rate_conversion), never to a guess. The README’s historical COP rate is never used.'] } }),
  ] },
  { id: 'm04-picker', page: 'm04', title: 'M04 · 2 · Choosing model and effort', note: 'When an entry is added in Setup (M07), only efforts known for that exact combination are offered. If effort support is unknown, the only choice is harness default, and execution passes no effort argument.', boards: [
    S('ModelPicker', 'Add entry · known efforts', { sizes: ['wide'], focus: { wide: [['model', 'OptionList #model-options'], ['effort', 'RadioSet #effort'], ['harness', 'Select #harness'], ['add', 'Button #add-entry']] }, render: (sz, f) => modelPicker(sz, f), legend: { screen: 'EntryPickerScreen', file: 'tui/screens/entry_picker.py', tree: PICKER_TREE, sel: [...modalSel('EntryPickerScreen', '#entry-picker', 86), ['#model-options', 'height: 6; border: solid $foreground 30%;'], ['#effort', 'layout: horizontal;']], keys: MODAL_KEYS([['↑ ↓', 'cursor', 'Choose a model'], ['ctrl+s', 'add', 'Add the entry to the configuration']]), states: CAT_STATES, notes: ['Unsupported efforts are not offered; nothing is guessed from another model, provider, account or version (R065).', 'The catalog default is a requested setting, not proof of the effort used.', 'D17: the harness’s own default model (read from its config during refresh) is labelled but never preselected for a competitor entry, which always needs an explicit model.'] } }),
    S('ModelPickerUnknown', 'Add entry · unknown effort', { sizes: ['wide'], focus: { wide: [['effort', 'RadioSet #effort'], ['model', 'OptionList #model-options']] }, render: (sz, f) => modelPicker(sz, f, { unknown: true }), legend: { screen: 'EntryPickerScreen', file: 'tui/screens/entry_picker.py', tree: PICKER_TREE, sel: modalSel('EntryPickerScreen', '#entry-picker', 86), keys: MODAL_KEYS([]), states: CAT_STATES, notes: ['Unknown effort support → only “harness default”, and M05 omits the effort argument (R065).', 'Results record the effort as harness default; the effective value appears only if the harness exposes it.'] } }),
  ] },
];

// ---------------------------------------------------------------- M05 · execution and isolation

const RUN_TREE = `RunConfigScreen(Screen)        one configuration of a run
├─ Header
├─ Static #run-bar
├─ Horizontal #upper
│  ├─ Vertical #left
│  │  ├─ DataTable #run-tasks .bordered   one process per task
│  │  └─ Static #task-contract .kv
│  └─ Vertical #right
│     ├─ DataTable #invocation .bordered  requested vs effective
│     └─ Static #established .pane.kv
├─ Vertical #log-pane .bordered
│  ├─ Input #log-search
│  └─ RichLog #log                 auto_scroll, highlight
├─ Static #invocation-summary     .-compact only
└─ Footer`;
const RUN_SEL = [
  ['#run-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#left', 'width: 50;'],
  ['#run-tasks', 'height: 10;  cursor_type = "row"'],
  ['#invocation', 'height: 9;'],
  ['#log-pane', 'height: 1fr;'],
  ['#log .-blocked', 'background: $primary 24%; text-style: bold;'],
  ['Screen.-compact #established, Screen.-compact #task-contract', 'display: none;'],
  ['Screen.-compact #invocation-summary', 'display: block; height: 5;'],
];
const RUN_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the run overview (M11)'],
  ['/', 'focus("#log-search")', 'Search the log; n next match'],
  ['i', 'isolation', 'Push IsolationScreen for the whole run'],
  ['p', 'verify_progress', 'Push VerifyProgressScreen(run_id, configuration_id) for the task being verified (M08)'],
  ['v', 'live_view', 'Open HarnessLive for this configuration (M11)'],
  ['s', 'stop_configuration', 'Stop this configuration; M11 cleans up its processes'],
  ['d', 'detach', 'Detach; the run keeps going'],
  ['tab', 'focus_next', 'Next focus stop'],
];
const RUN_STATES = [['Run overview (M11)', 'RunOverview'], ['Running', 'RunConfig'], ['Verifying', 'VerifyProgress'], ['Live view', 'HarnessLive'], ['Blocked action', 'TaskBlocked'], ['Model rejected', 'ModelRejected'], ['Isolation', 'RunIsolation'], ['Policy', 'EnvPolicy'], ['Clean impossible', 'CleanModeBlocked']];
const runLegend = (notes) => ({ screen: 'RunConfigScreen', file: 'tui/screens/run_config.py', tree: RUN_TREE, sel: RUN_SEL, keys: RUN_KEYS, states: RUN_STATES, notes });

const POLICY_TREE = `EnvPolicyScreen(ModalScreen[EnvPolicy | None])   Setup · M07
├─ Vertical #env-policy .dialog
│  ├─ RadioSet #policy             clean · current
│  ├─ DataTable #clean-matrix      per harness, this machine
│  ├─ Static #policy-hint
│  └─ Horizontal .dialog-actions
└─ Footer`;
const CLEAN_TREE = `CleanBlockedScreen(ModalScreen[CleanDecision])
├─ Vertical #clean-blocked .dialog
│  ├─ Static .notice.-error
│  ├─ Static #clean-cause .kv
│  ├─ RadioSet #clean-choice       remove · current · cancel
│  └─ Horizontal .dialog-actions
└─ Footer`;
const ISO_TREE = `IsolationScreen(ModalScreen[None])
├─ Vertical #isolation .dialog
│  ├─ DataTable #isolation-table
│  ├─ Static #isolation-hint
│  ├─ Static #permissions .kv
│  └─ Horizontal .dialog-actions
└─ Footer`;

const M05 = [
  { id: 'm05-policy', page: 'm05', title: 'M05 · 1 · Environment policy', note: 'Clean mode is the default: authentication stays, personal instructions, memories, plugins, hooks and MCP servers are disabled through supported controls, and native tools stay on. Current mode is an explicit choice. When clean mode cannot be established, launch asks instead of silently falling back.', boards: [
    S('EnvPolicy', 'Environment policy', { sizes: ['wide'], focus: { wide: [['clean', 'RadioSet #policy'], ['matrix', 'DataTable #clean-matrix'], ['save', 'Button #save']] }, render: (sz, f) => envPolicy(sz, f), legend: { screen: 'EnvPolicyScreen', file: 'tui/screens/setup.py', tree: POLICY_TREE, sel: [...modalSel('EnvPolicyScreen', '#env-policy', 86), ['#policy', 'layout: vertical; border: none;'], ['#clean-matrix', 'height: 5;']], keys: MODAL_KEYS([['ctrl+s', 'save', 'Save the policy in the configuration YAML']]), states: RUN_STATES, notes: ['Clean: the five personal integration categories are disabled per harness; ○ means the harness has none (R070).', 'Current: explicit model/effort still win; a sanitized settings fingerprint is recorded, never credentials (R071).', 'Opened from Configurations (p) in Setup (M07).'] } }),
    S('CleanModeBlocked', 'Clean mode cannot be established', { sizes: ['wide'], focus: { wide: [['choice', 'RadioSet #clean-choice'], ['continue', 'Button #continue']] }, render: (sz, f) => cleanBlocked(sz, f), legend: { screen: 'CleanBlockedScreen', file: 'tui/screens/launch_check.py', tree: CLEAN_TREE, sel: modalSel('CleanBlockedScreen', '#clean-blocked', 84), keys: MODAL_KEYS([['enter', 'continue', 'Apply the chosen option']]), states: RUN_STATES, notes: ['Never a silent fallback to current, never “clean” for partial isolation (R070).', 'Choosing current for one entry records that entry as current with its fingerprint.'] } }),
  ] },
  { id: 'm05-run', page: 'm05', title: 'M05 · 2 · Invocation and isolation', note: 'Inside a run, each configuration shows one fresh process and conversation per task, what was requested next to what the harness actually reported, and the environment that was established for it. Blocked actions and rejected models are explicit outcomes. The 2×2 run overview is drawn on the M11 page.', boards: [
    S('RunConfig', 'Run · configuration detail', { sizes: ['wide', 'compact'], focus: { wide: [['tasks', 'DataTable #run-tasks'], ['invocation', 'DataTable #invocation'], ['log', 'RichLog #log'], ['search', 'Input #log-search']], compact: [['tasks', 'DataTable #run-tasks'], ['log', 'RichLog #log']] }, render: (sz, f) => runConfig(sz, f), legend: runLegend([
      'Each task: new process, new conversation, shared spec + its own prompt; state carries only through workspace files (R069).',
      'Requested and effective settings are separate; an effort the harness does not expose stays “? unverified” (R065).',
      'Established environment lists baseline copy, workspace, ports, browser context, test data, managed settings and limitations (R068, R070, R072).',
    ]) }),
    S('TaskBlocked', 'Run · blocked action', { sizes: ['wide'], focus: { wide: [['log', 'RichLog #log'], ['tasks', 'DataTable #run-tasks']] }, render: (sz, f) => runConfig(sz, f, { blocked: true }), legend: runLegend([
      'Permission handling is set before launch; a blocked action returns an explicit outcome and never waits on a prompt (R072).',
      'The task row and the log both record the blocked action; the task itself can still finish.',
    ]) }),
    S('ModelRejected', 'Run · model rejected', { sizes: ['wide'], focus: { wide: [['tasks', 'DataTable #run-tasks'], ['invocation', 'DataTable #invocation']] }, render: (sz, f) => runConfig(sz, f, { rejected: true }), legend: runLegend([
      'A failed request never switches to another model (R065).',
      'The entry came from a catalog override: overrides never prove access (M04).',
      'Only this configuration stops; M11 continues the others and records cleanup.',
    ]) }),
    S('RunIsolation', 'Run · isolation', { sizes: ['wide'], render: (sz) => runIsolation(sz), legend: { screen: 'IsolationScreen', file: 'tui/screens/run_config.py', tree: ISO_TREE, sel: [...modalSel('IsolationScreen', '#isolation', 86), ['#isolation-table', 'height: 5;']], keys: [['esc', 'dismiss', 'Close'], ['enter', 'open', 'Open that configuration']], states: RUN_STATES, notes: ['Independent workspaces, ports, test data and browser contexts per configuration, also for two configurations of one harness and in sequential mode (R072).', 'Every configuration starts from an equivalent copy of the same packaged baseline (R068).'] } }),
  ] },
];

// ---------------------------------------------------------------- M07 · setup and launch

const SETUP_TREE = `SetupScreen(Screen)            one revision-scoped configuration
├─ Header
├─ Static #identity-bar         pinned SHA-256 · planner used or not
├─ Horizontal #config-row
│  ├─ Select #configuration     configs/<revision>/*.yaml
│  └─ Static #dirty
├─ DataTable #entries .bordered  harness · provider · model · effort · policy
├─ Horizontal #middle            three role cards, 1fr each
│  ├─ Vertical #grading-card .pane    harness review | decision rubric
│  ├─ Vertical #context-card .pane    native capture · label profile
│  └─ Vertical #weights-pane .pane
│     ├─ Select #quality-preset
│     └─ Select #ranking-preset
├─ Vertical #execution-pane .pane
│  ├─ RadioSet #concurrency
│  ├─ Input #trials                default 1
│  ├─ Input #sampling-interval     0.5–10 s · default 1 s
│  ├─ Select #display-currency     default USD
│  └─ Static #cost-energy          rates frozen at launch · tariff · c
├─ Static #limitations | #validation
├─ Horizontal .actions
└─ Footer`;
const SETUP_SEL = [
  ['#identity-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#entries', 'height: 8;  cursor_type = "row"'],
  ['#grading-card, #context-card, #weights-pane', 'width: 1fr; height: 12;'],
  ['#context-card .-off', 'text-style: bold;  engine reason verbatim + Configure decision engine'],
  ['#execution-pane', 'height: 9;'],
  ['#trials', 'width: 5;  type="integer", validate ≥ 1'],
  ['#sampling-interval', 'width: 7;  0.5–10 s, invalid values rejected'],
  ['#display-currency', 'width: 9;  currencies with a catalog rate · default USD'],
  ['#validation', 'display: none;'],
  ['SetupScreen.-invalid #validation', 'display: block;'],
  ['SetupScreen.-invalid #review', 'disabled: True;  via check_action'],
  ['Screen.-compact #middle, Screen.-compact #execution-pane', 'display: none;  → #setup-summary'],
];
const SETUP_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the revision’s configurations'],
  ['a / e / del', 'add / edit / remove entry', 'Entry picker (M04) · several entries per harness'],
  ['p', 'policy', 'Environment policy for the entry (M05)'],
  ['j', 'judge', 'Push JudgeScreen'],
  ['w', 'weights', 'Push WeightsScreen (M06)'],
  ['g', 'grading', 'Choose the grading backend: harness review or a decision-rubric profile'],
  ['x', 'decision_engines', 'Push DecisionEnginesScreen (M07.3); also the Configure decision engine action'],
  ['c', 'currency', 'Push CurrencyEnergyScreen(mode="setup") (M10): display currency and electricity tariff'],
  ['ctrl+s', 'save', 'Save the configuration YAML; the template is untouched'],
  ['enter', 'review', 'Push ReviewLaunchScreen (disabled while invalid)'],
];
const SETUP_STATES = [['Setup', 'Setup'], ['No decision engine', 'SetupNoEngine'], ['Text-only grader', 'SetupGradingTextOnly'], ['Decision engines', 'DecisionEngines'], ['Blocking issues', 'SetupInvalid'], ['Judge', 'JudgePicker'], ['Judge fallback', 'JudgeFallback'], ['Review', 'ReviewLaunch'], ['Budget warning', 'TrialBudgetWarning'], ['Launch record', 'LaunchRecord']];
const setupLegend = (notes) => ({ screen: 'SetupScreen', file: 'tui/screens/setup.py', tree: SETUP_TREE, sel: SETUP_SEL, keys: SETUP_KEYS, states: SETUP_STATES, notes });
const JUDGE_TREE = `JudgeScreen(ModalScreen[JudgeChoice | None])
├─ Vertical #judge .dialog
│  ├─ Static #preselection        saved › planner › first usable
│  ├─ Vertical #judge-fields
│  │  ├─ Select #judge-harness
│  │  ├─ Select #judge-model
│  │  └─ RadioSet #judge-effort    known efforts only
│  ├─ Static .notice.-warning     fallback only
│  └─ Horizontal .dialog-actions
└─ Footer`;
const REVIEW_TREE = `ReviewLaunchScreen(Screen)
├─ Header
├─ Static #review-bar
├─ VerticalScroll #review
│  ├─ Static #review-template .kv
│  ├─ DataTable #review-entries
│  ├─ Static #review-judging .kv
│  ├─ Static #review-execution .kv
│  └─ Static #review-recorded .kv
├─ Horizontal .actions
└─ Footer`;
const RECORD_TREE = `LaunchRecordScreen(ModalScreen[None])
├─ Vertical #launch-record .dialog
│  ├─ Static .record × 4          template · configuration · weights · machine
│  ├─ TextArea #resolved-yaml     read_only=True
│  └─ Horizontal .dialog-actions
└─ Footer`;

const ENG_TREE = `DecisionEnginesScreen(Screen)     x in Setup · palette · Configure decision engine
├─ Header · Static #engines-bar
├─ DataTable #profiles .bordered    profile · dialect · destination · model · inputs · state
├─ Horizontal
│  ├─ VerticalScroll #profile-detail .pane   evidence of the selected version
│  └─ Vertical #roles .pane         context monitoring · grading, chosen separately
├─ Horizontal .actions
└─ Footer`;
const ENG_SEL = [
  ['#profiles', 'height: 9;  cursor_type = "row"'],
  ['#profiles .-unready', 'text-style: bold;  state reason verbatim from decisions.capabilities'],
  ['#profile-detail', 'width: 72;'],
  ['#roles Button:disabled', 'no compatible READY profile for that role'],
  ['Screen.-compact #profile-detail', 'height: 4;  protocol, model, images'],
];
const ENG_KEYS = [
  ['esc', 'app.pop_screen', 'Back to Setup'],
  ['n', 'new_profile', 'ProfileEditorScreen from a preset'],
  ['e', 'edit_profile', 'Editor for the selected profile; saving makes the next version'],
  ['t', 'test_profile', 'ProfileTestScreen · metadata by default'],
  ['r', 'recheck', 'Refresh observations bound to the selected version'],
  ['enter', 'choose_for_role', 'Choose the selected ready profile for context monitoring or grading'],
];
const ENG_STATES = [['Text-only ready', 'DecisionEngines'], ['None configured', 'DecisionEnginesEmpty'], ['Local vision', 'DecisionEnginesLocal'], ['Model missing', 'DecisionEnginesMissing'], ['Editor', 'DecisionEngineEdit'], ['Test', 'DecisionEngineTest'], ['Tested', 'DecisionEngineTested'], ['Setup', 'Setup']];
const engLegend = (notes) => ({ screen: 'DecisionEnginesScreen', file: 'tui/screens/decision_engines.py', tree: ENG_TREE, sel: ENG_SEL, keys: ENG_KEYS, states: ENG_STATES, notes });

const M07 = [
  { id: 'm07-setup', page: 'm07', title: 'M07 · 1 · Configure a run', note: 'SetupScreen edits one configuration of one template revision: competitor entries (several per harness allowed), environment policy, an independent judge, both weight presets and execution settings. Saving writes YAML and never touches the template hash or earlier results. Invalid or incomplete settings are explained here and never substituted.', boards: [
    S('Setup', 'Setup · configuration', { sizes: ['wide', 'compact'], focus: { wide: [['entries', 'DataTable #entries'], ['judge', 'Button #change-judge'], ['context', 'Button #change-context'], ['weights', 'Button #edit-weights'], ['execution', 'RadioSet #concurrency'], ['review', 'Button #review']], compact: [['entries', 'DataTable #entries'], ['review', 'Button #review']] }, render: (sz, f) => setup(sz, f), legend: setupLegend([
      'Configurations are saved per revision and pin its SHA-256 (R019). The built-in benchmark reuses its approved tasks with no planner call (R136).',
      'Two Claude Code entries are distinct configurations; same-harness entries queue (R017, M11).',
      'Clean is the default policy; current is chosen per entry and never applied silently (R032).',
      'Presets are resolved into actual weights at launch, so later preset edits cannot change the run (R033).',
      'Trials (#trials, default 1, no upper limit) run one after another from fresh baselines; each is its own result and review (D7). More than 5 for a configuration not on a local endpoint asks to confirm the budget at launch (R3-7).',
      'Sampling interval 0.5–10 s, default 1 s, frozen at launch and not part of template identity; a slower collector records its own interval (D18).',
      'Display currency (#display-currency, default USD) and the optional electricity tariff are frozen with the run, with a RateSnapshot of the rates for every price currency and the display currency (R3-2). Results and reports show this run in that currency; there is no later currency switch. c opens CurrencyEnergyScreen (W4, D4).',
      'DECISION-ENGINES: grading and context monitoring are separate cards with separate profile choices. Grading stays harness review here; context monitoring labels ambiguous blocks with typesafe-context v3 (text, ready) and shows what is sent where. x opens DecisionEnginesScreen.',
    ]) }),
    S('SetupNoEngine', 'Setup · no decision engine', { sizes: ['wide'], focus: { wide: [['context', 'Button #configure-engine'], ['judge', 'Button #change-judge']] }, render: (sz, f) => setup(sz, f, { engine: 'none' }), legend: setupLegend([
      'no_engine: context classification is off with engine_not_configured and Configure decision engine stays available; the decision-rubric option shows ✗ no_engine.',
      'Native capture, counts, harness grading and rankings are unaffected, and launch is not blocked: an unavailable optional observer never invalidates competitors.',
      'Empty new drafts start here; nothing is selected implicitly when an engine is added later.',
    ]) }),
    S('SetupGradingTextOnly', 'Setup · text-only decision grader', { sizes: ['wide'], focus: { wide: [['judge', 'Button #choose-profile'], ['context', 'Button #change-context']] }, render: (sz, f) => setup(sz, f, { engine: 'textonly' }), legend: setupLegend([
      'Decision rubric with typesafe-context v3 (text only, Jev) cannot grade web v1: it needs vision and the final-regression screenshots at 1440×1000 and 390×844.',
      'The explicitly selected unusable grader blocks launch; it never falls back to harness review. ollama-clef v2 (ready, vision) is offered by name.',
      'The same text profile stays valid for context monitoring: roles are checked separately.',
    ]) }),
    S('SetupInvalid', 'Setup · blocking issues', { sizes: ['wide'], focus: { wide: [['entries', 'DataTable #entries']] }, render: (sz, f) => setup(sz, f, { invalid: true }), legend: setupLegend([
      'Each issue names its source: M04 for an unsupported effort, M03 for authentication, M06 for unresolved weights (R032, R033).',
      'An unsupported effort is never replaced by a supported one; weights can never stay unresolved at launch.',
    ]) }),
    S('JudgePicker', 'Judge · saved selection', { sizes: ['wide'], focus: { wide: [['model', 'Select #judge-model'], ['effort', 'RadioSet #judge-effort'], ['use', 'Button #use']] }, render: (sz, f) => judgePicker(sz, f), legend: { screen: 'JudgeScreen', file: 'tui/screens/setup.py', tree: JUDGE_TREE, sel: [...modalSel('JudgeScreen', '#judge', 86), ['#preselection', 'height: auto;']], keys: MODAL_KEYS([['ctrl+s', 'use', 'Use this judge']]), states: SETUP_STATES, notes: ['Preselection order: valid saved judge, then the planner configuration if planning was used, then the first usable entry (R033).', 'Each candidate is resolved against current readiness and the catalog; the judge is edited independently of the entries.'] } }),
    S('JudgeFallback', 'Judge · fallback preselection', { sizes: ['wide'], focus: { wide: [['use', 'Button #use'], ['model', 'Select #judge-model']] }, render: (sz, f) => judgePicker(sz, f, { fallback: true }), legend: { screen: 'JudgeScreen', file: 'tui/screens/setup.py', tree: JUDGE_TREE, sel: modalSel('JudgeScreen', '#judge', 86), keys: MODAL_KEYS([]), states: SETUP_STATES, notes: ['An unusable saved judge is skipped with its reason, never assumed to work (R033).', 'If no candidate is usable, the judge stays unresolved and Setup lists it as a blocking issue.'] } }),
  ] },
  { id: 'm07-launch', page: 'm07', title: 'M07 · 2 · Review, launch and freeze', note: 'Before execution the complete setup is shown exactly as it will be frozen. Launch then runs the M01 identity check and freezes the template binding, the resolved configuration and the original weights as separate records, with machine and catalog metadata and no credentials.', boards: [
    S('ReviewLaunch', 'Review before launch', { sizes: ['wide', 'compact'], focus: { wide: [['launch', 'Button #launch'], ['entries', 'DataTable #review-entries']], compact: [['launch', 'Button #launch'], ['entries', 'DataTable #review-entries']] }, render: (sz, f) => reviewLaunch(sz, f), legend: { screen: 'ReviewLaunchScreen', file: 'tui/screens/setup.py', tree: REVIEW_TREE, sel: [['#review-bar', 'height: 1; background: $surface;'], ['#review', 'height: 1fr; padding: 0 1;'], ['.section-rule', 'color: $foreground 30%;']], keys: [['esc', 'app.pop_screen', 'Back to setup'], ['c', 'copy_cli', 'Copy the equivalent unattended command (M14)'], ['ctrl+l', 'launch', 'Launch → identity check (M01)']], states: SETUP_STATES, notes: ['Shows template identity, every entry, policies, judge, grading profile, both weight sets, execution settings (trials with task-run and judge-session totals, sampling interval, display currency, tariff, billing kinds) and limitations (R032, R033, R037).', 'What is shown is what is frozen: the screen renders the resolved launch record, not the editable configuration.', 'Launch goes to TrialBudgetWarning when launch validation returns trial_budget_warning (R3-7), otherwise straight to the identity check.'] } }),
    S('TrialBudgetWarning', 'Launch · trial budget warning', { sizes: ['wide'], focus: { wide: [['back', 'Button #cancel'], ['ok', 'Button #ok']] }, render: (sz, f) => trialBudget(sz, f), legend: { screen: 'ConfirmScreen (M15, shared)', file: 'tui/screens/confirm.py', tree: `ConfirmScreen(ModalScreen[bool])   over ReviewLaunchScreen
├─ Vertical #confirm .dialog
│  ├─ Static #confirm-message     budget and subscription usage
│  ├─ Static #budget-totals .kv    task runs · judge sessions
│  ├─ DataTable #budget-entries    configurations not on a local endpoint
│  └─ Horizontal .dialog-actions   #cancel · #ok
└─ Footer`, sel: [...modalSel('ConfirmScreen', '#confirm', 86), ['#budget-entries', 'height: 5;'], ['#ok', 'variant: primary;  “Launch N trials”']], keys: [['esc', 'dismiss(False)', 'Back to the review; nothing starts'], ['tab / shift+tab', 'focus_next / previous', 'Move between buttons'], ['enter', 'press', 'Activate the focused button']], states: SETUP_STATES, notes: ['R3-7: there is no upper limit on trials. When a launch requests more than 5 trials for any configuration not on a local endpoint, M07’s launch validation returns trial_budget_warning with its totals.', 'Totals: task runs = configurations × trials × tasks; judge sessions = configurations × trials. The dialog states clearly that the extra trials consume budget and subscription usage.', 'Not shown when every configuration above 5 trials is on a local endpoint; local configurations are listed apart as using no budget.', 'Focus starts on Back to review. run --no-tui prints the same warning and continues; it never prompts (M14).'] } }),
    S('LaunchRecord', 'Launch record', { sizes: ['wide'], render: (sz) => launchRecord(sz), legend: { screen: 'LaunchRecordScreen', file: 'tui/screens/run_config.py', tree: RECORD_TREE, sel: [...modalSel('LaunchRecordScreen', '#launch-record', 86), ['#resolved-yaml', 'height: 7;']], keys: [['esc', 'dismiss', 'Close'], ['c', 'copy_path', 'Copy the record path']], states: SETUP_STATES, notes: ['Template binding, resolved configuration and original weights are frozen separately before the first task (R067).', 'Machine and catalog metadata are captured for M02; credentials appear only as “set” (R066).'] } }),
  ] },
  { id: 'm07-engines', page: 'm07', title: 'M07 · 3 · Decision engines', note: 'DecisionEnginesScreen (M07.3 over M12.4 decisions.profiles.*) manages shared System One profiles: TypeSafe remote and directly addressed Ollama local through one adapter. List → edit (saves a new immutable version) → test (metadata, no inference, unless a smoke check is chosen explicitly) → choose a profile for each role separately. Readiness, capabilities and disabled reasons are engine states shown verbatim.', boards: [
    S('DecisionEngines', 'Decision engines · text-only ready', { sizes: ['wide', 'compact'], focus: { wide: [['profiles', 'DataTable #profiles'], ['detail', 'VerticalScroll #profile-detail'], ['roles', 'Vertical #roles'], ['test', 'Button #test']], compact: [['profiles', 'DataTable #profiles']] }, render: (sz, f) => decisionEngines(sz, f), legend: engLegend([
      'ready_text_only: typesafe-context v3 is pinned (requested = resolved), remote, Choice/Score/Noul, no images. It may serve context monitoring but not web grading.',
      'Five profiles show every widget state: ready_text_only, ready_vision, local_model_missing, auth_unsupported and configured_not_ready (untested, locality unknown).',
      'Credentials appear only as references. Listing and reading make no model call.',
    ]) }),
    S('DecisionEnginesEmpty', 'Decision engines · none configured', { sizes: ['wide'], focus: { wide: [['profiles', 'Horizontal #presets'], ['detail', 'VerticalScroll #profile-detail']] }, render: (sz, f) => decisionEngines(sz, f, { empty: true }), legend: engLegend([
      'no_engine: two presets only; generic chat endpoints are not System One and are not offered.',
      'Roles: context monitoring off with its reason, grading stays harness review; both Choose buttons are disabled until a profile is ready.',
    ]) }),
    S('DecisionEnginesLocal', 'Decision engines · local vision ready', { sizes: ['wide'], focus: { wide: [['profiles', 'DataTable #profiles'], ['detail', 'VerticalScroll #profile-detail']] }, render: (sz, f) => decisionEngines(sz, f, { sel: 1 }), legend: engLegend([
      'ready_vision: ollama-clef v2 on 127.0.0.1:11434, Ollama 0.35.2, model bound to its digest and quantization; the echoed model name is not proof of weights.',
      'Default resource policy defers local inference until no competitor is measured in any run; live overlap is an explicit, disclosed, filterable choice.',
      'No credentials are forwarded to a local endpoint; locality is verified routing, not a privacy promise.',
    ]) }),
    S('DecisionEnginesMissing', 'Decision engines · local model missing', { sizes: ['wide'], focus: { wide: [['profiles', 'DataTable #profiles'], ['detail', 'VerticalScroll #profile-detail']] }, render: (sz, f) => decisionEngines(sz, f, { sel: 2 }), legend: engLegend([
      'local_model_missing: the tag is not on the server. Nothing is downloaded, started or killed; the remedy names the command the user runs, then r rechecks.',
      'auth_unsupported (typesafe-lab) and configured_not_ready (lab-ollama, untested, unknown locality) stay in the list with their reasons; none can be chosen for a role.',
    ]) }),
    S('DecisionEngineEdit', 'Profile editor · saves v3', { sizes: ['wide'], focus: { wide: [['endpoint', 'Input #endpoint'], ['preset', 'RadioSet #preset'], ['model', 'Select #model'], ['resources', 'RadioSet #resource-policy'], ['save', 'Button #save']] }, render: (sz, f) => decisionEngineEdit(sz, f), legend: { screen: 'ProfileEditorScreen', file: 'tui/screens/decision_engines.py', tree: `ProfileEditorScreen(ModalScreen[ProfileRef | None])
├─ Vertical #profile-editor .dialog
│  ├─ RadioSet #preset            TypeSafe remote | Ollama local
│  ├─ Input #name · Input #endpoint
│  ├─ Select #auth · Select #model   discovered tags with digest
│  ├─ Input #keepalive · #timeout · #budget
│  ├─ RadioSet #resource-policy   deferred | live overlap
│  └─ Horizontal .dialog-actions
└─ Footer`, sel: [...modalSel('ProfileEditorScreen', '#profile-editor', 104), ['#endpoint', 'width: 40;  base URL without /v1; a pasted /v1/systemone URL gets a field-specific correction'], ['#auth', 'credential references only; values never rendered']], keys: MODAL_KEYS([['ctrl+s', 'save', 'decisions.profiles.save → a new immutable version, then the test dialog']]), states: ENG_STATES, notes: ['Saving creates v3 with its own digest; v2 and runs that froze it are unchanged.', 'No effort or generation controls: native System One has none.', 'Capabilities are recorded only by a test bound to the saved version.'] } }),
    S('DecisionEngineTest', 'Profile test · metadata', { sizes: ['wide'], focus: { wide: [['mode', 'RadioSet #test-mode'], ['cancel', 'Button #cancel-test']] }, render: (sz, f) => decisionEngineTest(sz, f), legend: { screen: 'ProfileTestScreen', file: 'tui/screens/decision_engines.py', tree: 'ProfileTestScreen(ModalScreen[Observation | None])\n├─ Vertical #profile-test .dialog\n│  ├─ RadioSet #test-mode   metadata | inference smoke check\n│  ├─ Vertical #test-steps  ProgressBar on the running step\n│  └─ Horizontal .dialog-actions\n└─ Footer', sel: [...modalSel('ProfileTestScreen', '#profile-test', 92)], keys: [['esc', 'cancel', 'Cancel the test job (jobs.cancel); no role changes'], ['enter', 'close', 'After completion']], states: ENG_STATES, notes: ['decisions.profiles.test in metadata mode: reachability, systemone/1, model digest binding, image capability, question bounds and confidence semantics, with no inference.', 'An inference smoke check is a separate explicit choice with its own budget, cancellation and receipt.', 'The resulting observation is bound to v3 only; recheck never edits another role.'] } }),
    S('DecisionEngineTested', 'Profile test · ready vision', { sizes: ['wide'], render: (sz) => decisionEngineTest(sz, 'none', { done: 6 }), legend: { screen: 'ProfileTestScreen', file: 'tui/screens/decision_engines.py', tree: 'ProfileTestScreen(ModalScreen[Observation | None])', sel: modalSel('ProfileTestScreen', '#profile-test', 92), keys: [['enter', 'close', 'Back to the list with v3 ready']], states: ENG_STATES, notes: ['All six checks pass: ready_vision for v3. Roles still have to be chosen explicitly.'] } }),
  ] },
];

// ---------------------------------------------------------------- M08 · verification and evidence

const CHECKS_TREE = `TaskChecksScreen(Screen)       explicit trial/task/phase
├─ Header · Static #result-bar
├─ DataTable #task-checks .bordered
├─ VerticalScroll #check-detail .pane
│  ├─ Static #check-outcome
│  ├─ Static #check-observation
│  └─ Static #check-evidence
└─ Footer`;
const CHECKS_SEL = [
  ['#task-checks', 'height: auto; cursor_type = "row"'],
  ['#check-detail', 'height: 1fr; border: solid $foreground 30%;'],
  ['.outcome-failed', 'text-style: bold;'],
  ['.outcome-unverified', 'text-style: italic;'],
];
const CHECKS_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the result’s outcomes (M02)'],
  ['← →', 'previous / next task', 'Step through T1–T7'],
  ['s', 'screenshots', 'Push ScreenshotsScreen'],
  ['f', 'final_regression', 'Push FinalRegressionScreen'],
  ['j', 'judge_input', 'Show what the judge receives'],
  ['l', 'log', 'Push EvidenceViewerScreen on the check log'],
];
const V_STATES = [['Task checks', 'TaskChecks'], ['Final regression', 'FinalRegression'], ['Not passed', 'CheckOutcomes'], ['Screenshots', 'Screenshots'], ['Evidence', 'EvidenceViewer'], ['In progress', 'VerifyProgress'], ['Judge input', 'JudgeHandoff']];
const checksLegend = (screen, tree, sel, notes) => ({ screen, file: 'tui/screens/verification.py', tree, sel, keys: CHECKS_KEYS, states: V_STATES, notes });
const REG_TREE = `FinalRegressionScreen(Screen)
├─ Header · Static #result-bar
├─ DataTable #regression .bordered   at task | final phase and target
├─ Static #regression-summary .kv
├─ Static .notice
└─ Footer`;
const NP_TREE = `ChecksScreen(Screen)           not passed · all results of r1
├─ Header · Static #result-bar
├─ Horizontal #cause-legend        4 × Static .cause
├─ DataTable #not-passed .bordered
├─ Static #outcome-detail .pane
└─ Footer`;
const SHOT_TREE = `ScreenshotsScreen(Screen)
├─ Header · Static #result-bar
├─ DataTable #shots .bordered
├─ Horizontal #shot-frames
│  ├─ Static .shot.-desktop        1440×1000 to scale
│  └─ Static .shot.-mobile         390×844 to scale
└─ Footer`;
const PROG_TREE = `VerifyProgressScreen(ModalScreen[None])
├─ Vertical #verify-progress .dialog
│  ├─ Vertical #verify-steps
│  │  └─ ProgressBar
│  ├─ Static #verify-so-far
│  └─ Horizontal .dialog-actions
└─ Footer`;
const HANDOFF_TREE = `JudgeInputScreen(ModalScreen[None])
├─ Vertical #judge-input .dialog
│  ├─ Static #given                ✓ list
│  ├─ Static #kept-apart           ✗ list
│  └─ Horizontal .dialog-actions
└─ Footer`;

const M08 = [
  { id: 'm08-checks', page: 'm08', title: 'M08 · 1 · Checks and evidence', note: 'Every task is verified by its frozen acceptance checks on a disposable copy of its snapshot, with tooling outside the competitor workspace and no repairs. Each check is passed, failed or unverified; final regression observes 19 artifact targets and 11 original task-history targets. Screenshots and logs stay with the task they describe and open read-only in the evidence viewer.', boards: [
    S('TaskChecks', 'Task checks · T5', { sizes: ['wide', 'compact'], focus: { wide: [['checks', 'DataTable #task-checks'], ['detail', 'VerticalScroll #check-detail']], compact: [['checks', 'DataTable #task-checks'], ['detail', 'VerticalScroll #check-detail']] }, render: (sz, f) => taskChecks(sz, f), legend: checksLegend('TaskChecksScreen', CHECKS_TREE, CHECKS_SEL, [
      'The frozen checks decide task success; exit code, agent claims and grades are separate observations (R073, R144).',
      'Disposable copy, tooling outside the source, no manual fixes; the snapshot is preserved (R074).',
      'Browser checks use Python Playwright with real workflows, keyboard steps, console errors and screenshots at 1440×1000 and 390×844 (R075).',
    ]) }),
    S('FinalRegression', 'Final regression', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #regression']] }, render: (sz, f) => finalRegression(sz, f), legend: checksLegend('FinalRegressionScreen', REG_TREE, [['#regression', 'height: 24;  cursor_type = "row"'], ['.change-regressed', 'text-style: bold;']], [
      'All 30 checks have final outcomes: 19 observe the delivered artifact; 11 re-observe their original task history. Earlier artifact passes never stand in for final behavior (R074).',
      'Task-time evidence is kept beside the final evidence. Both columns here total 27✓ 3✗ with different failing checks.',
    ]) }),
    S('CheckOutcomes', 'Why checks did not pass', { sizes: ['wide'], focus: { wide: [['table', 'DataTable #not-passed'], ['detail', 'Static #outcome-detail']] }, render: (sz, f) => checkOutcomes(sz, f), legend: checksLegend('ChecksScreen', NP_TREE, [['.cause', 'width: 1fr; height: 5; border: solid $foreground 30%;'], ['#not-passed', 'height: auto;']], [
      'Application failure, missing prerequisite, verifier error and not run stay distinct, with reasons kept (R076, R144).',
      'Inability to run a check never produces a pass; an interrupted process keeps whatever its snapshot established.',
    ]) }),
    S('Screenshots', 'Screenshots', { sizes: ['wide'], focus: { wide: [['list', 'DataTable #shots']] }, render: (sz, f) => screenshots(sz, f), legend: checksLegend('ScreenshotsScreen', SHOT_TREE, [['.shot', 'border: solid $foreground 30%; content-align: center middle;'], ['.shot.-desktop', 'width: 63; height: 24;'], ['.shot.-mobile', 'width: 21; height: 24;']], [
      'Both required sizes are captured per check (R075); frames are drawn to scale as placeholders.',
      'Images open in the system viewer; terminals are not assumed to render them.',
      'Per-task screenshots stay in evidence, results and the report but are not judge input; the judge gets the final regression’s screenshots (D12).',
    ]) }),
    S('EvidenceViewer', 'Evidence viewer · check log', { sizes: ['wide', 'compact'], focus: { wide: [['text', 'TextArea #evidence-text'], ['files', 'DataTable #evidence-files'], ['open', 'Button #open-external']], compact: [['text', 'TextArea #evidence-text']] }, render: (sz, f) => evidenceViewer(sz, f), legend: { screen: 'EvidenceViewerScreen', file: 'tui/screens/evidence.py · EvidenceViewerVM', tree: `EvidenceViewerScreen(Screen)   result_id, path
├─ Header
├─ Static #evidence-bar
├─ Horizontal #main
│  ├─ Vertical #evidence-side          hidden when compact
│  │  ├─ DataTable #evidence-files
│  │  └─ Static #evidence-meta .kv
│  └─ TextArea #evidence-text          read_only=True · paged
├─ Horizontal .actions
│  ├─ Button #open-external
│  └─ Button #reveal
└─ Footer`, sel: [['#evidence-bar', 'height: 1; background: $surface; padding: 0 1;'], ['#evidence-side', 'width: 44;'], ['#evidence-files', 'height: 10;  cursor_type = "row"'], ['#evidence-text', 'width: 1fr; border: solid $foreground 30%;  read_only=True, show_line_numbers=True'], ['Screen.-compact #evidence-side', 'display: none;  e toggles the file list']], keys: [['esc', 'app.pop_screen', 'Back to where it was opened'], ['enter', 'show_file', 'Show the selected file'], ['o', 'open_external', 'Open in the system viewer (images, snapshots)'], ['f', 'reveal', 'Reveal the file in its folder'], ['end', 'scroll_end', 'Jump to the end; pages load from results.read_evidence'], ['e', 'files', 'Compact only: show the file list']], states: V_STATES, notes: ['W1: opened from results with l and the Open log / Open snapshot / Open evidence buttons (M02), and with l on TaskChecks.', 'Content is paged from results.read_evidence; the view never writes, so outcomes and grades cannot change.', 'Binary evidence (screenshots) opens externally; snapshots list their files at the recorded commit.'] } }),
  ] },
  { id: 'm08-flow', page: 'm08', title: 'M08 · 2 · During the run and handoff to the judge', note: 'Verification progress is part of the run view (p on a configuration). The judge receives the artifact, acceptance evidence and the final regression’s screenshots, kept apart from measured statistics, and a later grade can never rewrite a check outcome.', boards: [
    S('VerifyProgress', 'Verifying a task', { sizes: ['wide'], render: (sz) => verifyProgress(sz), legend: { screen: 'VerifyProgressScreen', file: 'tui/screens/run_config.py', tree: PROG_TREE, sel: [...modalSel('VerifyProgressScreen', '#verify-progress', 84), ['ProgressBar', 'show_eta = False']], keys: [['esc', 'dismiss', 'Hide; verification continues']], states: V_STATES, notes: ['Opened with p on RunConfigScreen: VerifyProgressScreen(run_id, configuration_id) (W5).', 'Verification progress and outcomes are supplied to the run view (R034).', 'Setup exposing an application defect is recorded, never repaired (R074).'] } }),
    S('JudgeHandoff', 'Judge input', { sizes: ['wide'], render: (sz) => judgeHandoff(sz), legend: { screen: 'JudgeInputScreen', file: 'tui/screens/verification.py', tree: HANDOFF_TREE, sel: modalSel('JudgeInputScreen', '#judge-input', 86), keys: [['esc', 'dismiss', 'Close']], states: V_STATES, notes: ['D12: the judge gets the screenshots from the final regression on the delivered artifact, at 1440×1000 and 390×844; for the inventory that is 14 (one desktop and one mobile per task area). Which steps capture is defined by the template’s checks.', 'Per-task screenshots stay in evidence, results and the report, not in judge input.', 'Acceptance evidence goes to the judge separately from cost, time and other measurements (R075). A grade never rewrites a check outcome (R144).'] } }),
  ] },
];

// ---------------------------------------------------------------- M09 · default benchmark

const PROMPTS_TREE = `PromptsScreen(Screen)          read-only
├─ Header
├─ Static #prompts-bar
├─ Horizontal
│  ├─ Vertical .pane
│  │  └─ Tree #prompt-files
│  └─ MarkdownViewer #prompt-text  show_table_of_contents=False
└─ Footer`;
const INV_STATES = [['Contract', 'InventoryAbout'], ['Prompts', 'InventoryPrompts'], ['Checks', 'InventoryChecks'], ['Look-alike', 'InventoryVariant'], ['Newer built-in', 'InventoryUpgrade']];
const M09 = [
  { id: 'm09-default', page: 'm09', title: 'M09 · Default seven-task inventory benchmark', note: 'The built-in Inventory web app r1: an empty starting project, HTML5 and vanilla JavaScript, localStorage, the shared specification and exactly T1–T7, bundled checks and the web rubric. It runs without a planner. The prompts are packaged unchanged; anything they leave open is not checked. A look-alike with another task count is a different template, and a newer built-in revision never replaces a default that already has results.', boards: [
    S('InventoryAbout', 'Default benchmark · contract', { sizes: ['wide'], focus: { wide: [['configure', 'Button #configure'], ['contract', 'DataTable #contract'], ['prompts', 'Button #prompts']] }, render: (sz, f) => inventoryAbout(sz, f), legend: { screen: 'InventoryAboutScreen', file: 'tui/screens/library.py', tree: `InventoryAboutScreen(ModalScreen[None])\n├─ Vertical #inventory-about .dialog\n│  ├─ DataTable #contract\n│  ├─ Static #left-open\n│  └─ Horizontal .dialog-actions\n└─ Footer`, sel: modalSel('InventoryAboutScreen', '#inventory-about', 86), keys: MODAL_KEYS([['p / c', 'prompts / checks', 'Open the prompts or the check coverage'], ['enter', 'configure', 'Setup for r1, no planning (M07)']]), states: INV_STATES, notes: ['Opened with a (About) from the Library, enabled only on the built-in inventory row (D2); ? stays the app-wide Help.', 'Empty baseline, technology, persistence, seven ordered tasks with commits, bundled checks and rubric (R020–R028).', 'The website is the competitors’ artifact, not an AxBenchmark feature.'] } }),
    S('InventoryPrompts', 'Preserved prompts', { sizes: ['wide'], focus: { wide: [['text', 'MarkdownViewer #prompt-text'], ['files', 'Tree #prompt-files']] }, render: (sz, f) => inventoryPrompts(sz, f), legend: { screen: 'PromptsScreen', file: 'tui/screens/template.py', tree: PROMPTS_TREE, sel: [['#prompt-files', 'width: 30;'], ['#prompt-text', 'width: 1fr; border: solid $foreground 30%;']], keys: [['esc', 'app.pop_screen', 'Back'], ['↑ ↓', 'scroll', 'Scroll'], ['c', 'checks', 'Check coverage'], ['y', 'copy', 'Copy the selected file']], states: INV_STATES, notes: ['Text is read from legacy/benchmark/tasks/ when the wireframes are built, so it is the preserved text verbatim (R020, R028).', 'Read-only: editing creates a new revision through M01.'] } }),
    S('InventoryChecks', 'Check coverage', { sizes: ['wide'], focus: { wide: [['checks', 'DataTable #coverage'], ['detail', 'VerticalScroll #check-observation']] }, render: (sz, f) => inventoryChecks(sz, f), legend: { screen: 'CoverageScreen', file: 'tui/screens/template.py', tree: `CoverageScreen(Screen)\n├─ Header · Static #checks-bar\n├─ DataTable #coverage .bordered\n├─ Horizontal\n│  ├─ VerticalScroll #check-observation .pane\n│  └─ Static #not-checked .pane\n└─ Footer`, sel: [['#coverage', 'height: 21; scrolls all 30 rows;'], ['#check-observation, #not-checked', 'width: 1fr;']], keys: [['esc', 'app.pop_screen', 'Back'], ['p', 'prompts', 'Preserved prompts'], ['o', 'open', 'Open checks/acceptance.v1.json']], states: INV_STATES, notes: ['Every task contract is covered, including README creation and update, persistence, lookup, checkout stock and browser QA (R021–R027).', 'Exact M09 catalog: 30 unique, 30 at-task, 30 final (19 artifact + 11 history). Detail shows requirement, phase/target, observation strategy, evidence and limitation. also_checked remains empty in the DTO.'] } }),
    S('InventoryVariant', 'Look-alike is not the default', { sizes: ['wide'], render: (sz) => inventoryVariant(sz), legend: { screen: 'VariantScreen', file: 'tui/screens/library.py', tree: `VariantScreen(ModalScreen[None])\n├─ Vertical #variant .dialog\n│  ├─ DataTable #variant-compare\n│  ├─ Static .notice.-warning\n│  └─ Horizontal .dialog-actions\n└─ Footer`, sel: modalSel('VariantScreen', '#variant', 86), keys: [['esc', 'dismiss', 'Close']], states: INV_STATES, notes: ['Opened with Why not the default? (#why-not-default) on a look-alike row (LibraryLookAlike).', 'A six-task suite is a different template even with a similar name (R136); names and task counts never confer identity.'] } }),
    S('InventoryUpgrade', 'Newer built-in revision · what changed', { sizes: ['wide'], focus: { wide: [['close', 'Button #close']] }, render: (sz, f) => inventoryUpgrade(sz, f), legend: { screen: 'DefaultChangesScreen', file: 'tui/screens/library.py', tree: `DefaultChangesScreen(ModalScreen[None])\n├─ Vertical #default-changes-dialog .dialog\n│  ├─ Static #changes-diff\n│  ├─ Static #changes-digests\n│  ├─ Static .notice.-warning\n│  └─ Horizontal .dialog-actions\n│     ├─ Button #open-revision\n│     ├─ Button #make-default   → ConfirmScreen (M15)\n│     └─ Button #close .-primary\n└─ Footer`, sel: modalSel('DefaultChangesScreen', '#default-changes-dialog', 86), keys: [['esc', 'dismiss', 'Close'], ['tab', 'focus_next', 'Next button']], states: INV_STATES, notes: ['D16: opened from #default-changes in the Library notice. All built-in revisions stay available.', 'Prompts stay verbatim; only checks and protocol changed, which is enough for a new SHA-256, so r1 and r3 results never compare.', 'Make r3 the default… confirms through ConfirmScreen and changes only the Library’s default selection.'] } }),
  ] },
];

export const MODULE_PAGES = [
  { id: 'm02', name: '120×40 · M02 results and comparability' },
  { id: 'm03', name: '120×40 · M03 environment readiness' },
  { id: 'm04', name: '120×40 · M04 model catalog' },
  { id: 'm05', name: '120×40 · M05 execution and isolation' },
  { id: 'm06', name: '120×40 · M06 weights and rankings' },
  { id: 'm07', name: '120×40 · M07 setup and launch' },
  { id: 'm08', name: '120×40 · M08 verification and evidence' },
  { id: 'm09', name: '120×40 · M09 default benchmark' },
];
export const MODULE_GROUPS = [...M02, ...M03, ...M04, ...M05, ...M06, ...M07, ...M08, ...M09];
