// Special artboards: the design system, the navigation map and the widget-state matrix.
import { Grid, esc, header, footer, table, tabs, button, input, radios, check, progress, loading, notice, toast, tree, SIZES } from './lib.mjs';
import { TOKENS } from './theme.mjs';
import { SHA, WIDGET_STATES as M01_STATES } from './screens.mjs';
import { RESULT_WIDGET_STATES } from './screens-results.mjs';
import { READINESS_WIDGET_STATES } from './screens-readiness.mjs';
import { EXECUTION_WIDGET_STATES } from './screens-execution.mjs';
import { SETUP_WIDGET_STATES } from './screens-setup.mjs';
import { VERIFY_WIDGET_STATES } from './screens-verify.mjs';
import { MEASURE_WIDGET_STATES } from './screens-measure.mjs';
import { RUN_WIDGET_STATES } from './screens-run.mjs';
import { JUDGING_WIDGET_STATES } from './screens-judging.mjs';

const WIDGET_STATES = [...M01_STATES, ...RESULT_WIDGET_STATES, ...READINESS_WIDGET_STATES, ...EXECUTION_WIDGET_STATES, ...SETUP_WIDGET_STATES, ...VERIFY_WIDGET_STATES, ...MEASURE_WIDGET_STATES, ...RUN_WIDGET_STATES, ...JUDGING_WIDGET_STATES];

const term = (g, ctx) => `<div class="term" style="width: ${g.w}ch; height: ${g.h * 16}px">\n${g.html(ctx)}\n</div>`;
const s8 = (h) => h.slice(0, 8);

// ---------------------------------------------------------------- design system

function catalog() {
  const g = new Grid(116, 38);
  header(g, 'AxBenchmark', 'Header · title — sub_title');
  const L = (x, y, t) => g.text(x, y, t, 'mu it');
  const cols = [{ l: 'Name', w: 24 }, { l: 'Type', w: 12 }, { l: 'SHA-256', w: 18 }];
  const rows = [{ v: ['Inventory web app', 'Frontend', s8(SHA.inv1)] }, { v: ['Orders REST API', 'Backend', s8(SHA.orders)] }, { v: ['Kanban board', 'Fullstack', s8(SHA.kanban)] }];
  L(2, 2, 'DataTable · focused · cursor $primary'); L(60, 2, 'DataTable · blurred · cursor stays visible');
  table(g, 2, 3, 54, cols, rows, { cursor: 0, focused: true });
  table(g, 60, 3, 54, cols, rows, { cursor: 0, focused: false });
  L(2, 8, 'Pane · idle · solid $foreground 30%'); L(60, 8, 'Pane · :focus-within · solid $primary');
  g.box(2, 9, 54, 4, { title: 'Library · 6 templates', sub: 'default first' });
  g.text(4, 10, 'Border title names the pane; subtitle is metadata.', 'mu');
  g.box(60, 9, 54, 4, { f: 'ac', title: 'Library · 6 templates', sub: 'default first' });
  g.text(62, 10, 'A child has focus: border and title take $primary.', 'mu');
  L(2, 14, 'Tabs · active label bold + $primary rule'); tabs(g, 2, 15, 54, ['Tasks', 'Identity', 'Configurations', 'Results'], 1, { focused: true });
  L(60, 14, 'Button(compact) · primary · default · focus · off');
  let x = button(g, 60, 15, 'Approve r2', { v: 'primary' }); x = button(g, x + 2, 15, 'Cancel'); x = button(g, x + 2, 15, 'Retry', { focus: true }); button(g, x + 2, 15, 'Launch', { v: 'primary', off: true });
  L(2, 18, 'Input(compact) · placeholder · focused'); input(g, 2, 19, 26, '', { ph: '/ Filter by name' }); input(g, 30, 19, 26, '~/code/acme-billing', { focus: true });
  L(60, 18, 'RadioSet · Checkbox'); radios(g, 60, 19, ['Frontend', 'Backend', 'Fullstack'], 0, { focus: true });
  check(g, 60, 20, 'Copy 3 configurations', true); check(g, 88, 20, 'Grading rubric', false);
  L(2, 22, 'ProgressBar(show_eta=False)'); progress(g, 2, 23, 54, 71);
  L(60, 22, 'LoadingIndicator'); loading(g, 60, 23, 54, '');
  L(2, 25, 'Tree · guides ├─ └─ · cursor like DataTable');
  tree(g, 2, 26, 54, [
    { t: 'Inventory web app', depth: 0, kids: true, open: true, f: 'bd' },
    { t: `r1 ★ built-in    ${s8(SHA.inv1)}`, depth: 1 },
    { t: `r2 custom        ${s8(SHA.inv2)}`, depth: 1, last: true, sel: true },
    { t: 'Duplicates', depth: 0, kids: true },
  ], { focused: true });
  L(60, 25, 'Static.notice · -error · -warning · -success · info');
  notice(g, 60, 26, 54, 'error', 'Library index could not be read');
  notice(g, 60, 27, 54, 'warning', '3 uncommitted changes are excluded');
  notice(g, 60, 28, 54, 'success', 'Revision r2 approved');
  notice(g, 60, 29, 54, 'info', 'Configurations are saved per revision');
  L(2, 31, 'ModalScreen dialog · round $primary on $surface');
  g.box(2, 32, 54, 4, { round: true, f: 'ac', fill: 'B1', title: 'Approve revision r2' });
  g.text(5, 33, 'Background screen is dimmed to $background 60%.', 'mu');
  L(60, 31, 'Toast · app.notify()');
  toast(g, '✓ Revision r2 approved', `sha256 ${s8(SHA.inv2)}… · r1 unchanged.`, 44);
  footer(g, [{ k: 'enter', d: 'Configure' }, { k: 'o', d: 'Open' }, { k: '/', d: 'Filter' }, { k: 'tab', d: 'Pane' }, { k: 'n', d: 'New (disabled)', off: true }, { k: 'q', d: 'Quit' }]);
  return g;
}

function effects() {
  const g = new Grid(116, 3);
  const items = [['Bold', 'bd', 'bold'], ['Dim', 'dm', 'dim'], ['Italic', 'it', 'italic'], ['Underline', 'ul', 'underline'], ['Reverse', 'rv', 'reverse'], ['$primary', 'ac', 'color: $primary'], ['Muted', 'mu', '$foreground 60%']];
  items.forEach(([t, f, rule], i) => {
    const x = 1 + i * 16;
    g.text(x, 0, ` ${t} `, f);
    g.text(x, 2, rule, 'mu');
  });
  return g;
}

const GLYPHS = [
  ['Borders', '─ │ ┌ ┐ └ ┘ ├ ┤ ╭ ╮ ╰ ╯', 'Panes use square corners; ModalScreen dialogs use round corners. Widgets draw their own borders, so borders never join.'],
  ['Status', '✓ ▲ ✗ ● ○', 'passed/ok · warning or partial · error/failed · in progress/active · pending'],
  ['Readiness', '✓ ✗ ? ▲ ○ ◷', 'established · failed or absent · unknown · limited · not applicable · cached (M03, M04)'],
  ['Checks', '✓ ✗ ? ○', 'passed · failed · unverified (could not run) · not run; never merged with exit status (M02)'],
  ['Source', '★ ◆ ↓ ◇', 'built-in default · custom · imported · draft (no SHA-256 yet)'],
  ['Change', '~ + = ↔', 'modified · added · unchanged · swapped (revision diffs)'],
  ['Controls', '● ○ ■ □ ▸ ▾ ▶', 'radio on/off · checkbox on/off · collapsed/expanded · run'],
  ['Meters', '█ ░ ▌', 'progress fill/track and scrollbar thumb/track · toast bar'],
  ['Text', '… · → ←', 'truncation (always an ellipsis) · separator · resolves to · back'],
];

const RULES = [
  ['Grid', 'One cell = 1ch × 1 line. 120×40 is the reference layout, 80×24 the minimum. Nothing is placed between cells; widths are fixed cells or fr.'],
  ['Reflow', 'App.on_resize sets Screen.-compact when width < 100 or height < 30. Compact hides secondary panes (detail, revisions) and shows a summary strip or a key instead.'],
  ['Focus', 'Tab follows DOM order. A pane shows focus with :focus-within → border $primary. DataTable/Tree cursor is $primary when focused, blurred cursor otherwise. Buttons: reverse bold. Inputs: $primary tint + reverse caret.'],
  ['Keys', 'Every screen shows its bindings in the Footer; bindings that cannot run are dimmed with check_action, never hidden. Every binding is also a command-palette entry.'],
  ['States', 'Each data widget sits in a ContentSwitcher with #x (data), #x-loading (LoadingIndicator), #x-empty (Static.empty) and #x-error (Static.notice.-error + Retry).'],
  ['Modals', 'ModalScreen[T], centered (align: center middle), dialog width fixed in cells (72–112, max-width 100%), padding 1 2, actions right-aligned. Esc always dismisses without changes.'],
  ['Shared dialogs', 'ConfirmScreen (#confirm, #cancel, #ok) for consent, budget warnings and destructive steps; PromptScreen (#prompt, #prompt-label, #prompt-input, #prompt-error, #cancel, #ok) for one typed value. A typed error keeps the prompt open.'],
  ['Measured values', 'Unknown is “unknown” or “—”, partial carries ▲ and its coverage, estimates name their source and date. A partial or unknown value never ranks where it carries weight. Money is ranked in USD and shown in the run’s frozen display currency; a missing rate reads “unknown · no_rate_conversion”; a declared billing kind reads “declared by user”.'],
  ['Identity', 'Full SHA-256 = 64 cells. Show it in full where identity is the subject; elsewhere 8 cells, or first 16 … last 8. Never truncate silently.'],
  ['Copy', 'Realistic data only; fictional names, machines and digests. Status always pairs a glyph with words, so meaning survives grayscale.'],
];

const NAMING = `axbenchmark/
└─ tui/
   ├─ app.py                 AxBenchmarkApp(App) · SCREENS · COMMANDS
   ├─ axbenchmark.tcss       one stylesheet, selectors as in the legends
   ├─ commands.py            LibraryCommands(Provider)
   └─ screens/
      ├─ library.py          LibraryScreen
      ├─ template.py         TemplateScreen
      ├─ new_template.py     NewTemplateScreen(ModalScreen)
      ├─ revise.py           ReviseScreen · ApproveRevisionScreen
      ├─ exchange.py         ExportScreen · ImportScreen
      ├─ launch_check.py     LaunchCheckScreen · CleanBlockedScreen
      ├─ results.py          ResultsScreen · Import/ExportResults · Rejudge
      ├─ result.py           ResultScreen
      ├─ weights.py          WeightsScreen
      ├─ environment.py      EnvironmentScreen
      ├─ catalog.py          CatalogScreen · OverrideScreen
      ├─ setup.py            SetupScreen · Judge · ReviewLaunch · EntryPicker · EnvPolicy
      ├─ verification.py     TaskChecks · FinalRegression · Checks · Screenshots
      └─ run_config.py       RunConfigScreen · IsolationScreen

Screens   PascalCase + "Screen"      ids   kebab-case, unique per screen
Classes   .pane .kv .notice .empty .actions .dialog .dialog-actions .bordered
Modifiers .-compact .-error .-warning .-success .-primary (Textual style)`;

const TCSS = `/* axbenchmark.tcss — excerpt; full selectors in each frame legend */
Screen { layout: vertical; background: $background; }
.pane { border: solid $foreground 30%; border-title-style: bold; }
.pane:focus-within { border: solid $primary; border-title-color: $primary; }
.bordered { border: solid $foreground 30%; }
.bordered:focus { border: solid $primary; }
Input { height: 1; border: none; background: $surface; padding: 0 1; }
Input:focus { background: $primary 24%; }
Button { min-width: 0; height: 1; border: none; }        /* compact=True */
Button.-primary { background: $primary; color: $background; text-style: bold; }
Button:focus { text-style: reverse bold; }
.kv { height: auto; }
.notice { height: auto; padding: 0 0 1 0; }
.notice.-error { text-style: bold; }
ModalScreen { align: center middle; background: $background 60%; }
.dialog { height: auto; max-height: 100%; border: round $primary;
          background: $surface; padding: 1 2; }
.dialog-actions { height: 1; align-horizontal: right; margin-top: 1; }
Screen.-compact #detail-pane, Screen.-compact #revisions-pane { display: none; }
Screen.-compact #summary { display: block; }`;

export function designSystem(ctx) {
  const tokenRows = TOKENS.map(([v, css, dark, light, use]) => `<tr><td><div class="sw" style="background: ${dark.startsWith('#') || dark === 'accent' ? `var(${css})` : 'transparent'}"></div></td><td><code>${esc(v)}</code></td><td class="mut">${dark.startsWith('#') ? `${dark} / ${light}` : esc(dark)}</td><td>${esc(use)}</td></tr>`).join('');
  return `<div style="display: flex; flex-direction: column; gap: 36px">
<div style="display: flex; flex-direction: column; gap: 8px">
<h1 style="margin: 0; font-size: 28px; line-height: 34px; font-weight: 700">AxBenchmark TUI · wireframe design system</h1>
<p style="margin: 0; max-width: 1100px; font-size: 14px; line-height: 21px; color: var(--mu)">Low-fidelity system for a Python Textual application. Grayscale plus one accent, named only by Textual theme variables. Every frame is a fixed character grid rendered in JetBrains Mono at ${SIZES.wide.label} and ${SIZES.compact.label}; bold, dim, italic, underline and reverse are the only text effects. Use the Tweaks panel to switch dark/light and the accent.</p>
</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px">
<section class="sec lg"><h2>Theme variables</h2><table>${tokenRows}</table></section>
<section class="sec lg"><h2>Rules</h2><table>${RULES.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('')}</table></section>
</div>
<section class="sec"><h2>Text effects</h2>${term(effects(), ctx)}</section>
<section class="sec"><h2>Widget catalogue · ${catalog().w}×${catalog().h} cells</h2>${term(catalog(), ctx)}</section>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px">
<section class="sec lg"><h2>Glyphs · Unicode only, no emoji or images</h2><table>${GLYPHS.map(([k, g, v]) => `<tr><td><b>${k}</b></td><td style="font-size: 16px; white-space: nowrap">${esc(g)}</td><td class="mut">${esc(v)}</td></tr>`).join('')}</table></section>
<section class="sec lg"><h2>Files and naming</h2><pre>${esc(NAMING)}</pre></section>
</div>
<section class="sec lg"><h2>TCSS foundation</h2><pre>${esc(TCSS)}</pre></section>
</div>`;
}

// ---------------------------------------------------------------- navigation map

const FLOWS = [
  ['1 · Browse the library', [['Library', 'Library', 'home · default r1'], ['o / enter row'], ['TemplateTasks', 'Revision · tasks', 'TemplateScreen'], ['ctrl+p'], ['CommandPalette', 'Command palette', 'all actions']],
    [['LibraryLoading', 'Loading'], ['LibraryEmpty', 'Filter · no match'], ['LibraryError', 'Index unreadable'], ['LibraryNoHarness', 'No harness'], ['LibraryDrafts', 'Drafts · reopen'], ['DraftDiscard', 'Discard draft'], ['LibraryLookAlike', 'Look-alike'], ['LibraryUpgrade', 'r2 available']]],
  ['2 · Inspect a template revision', [['TemplateTasks', 'Tasks', 'tab 1'], ['1–4'], ['TemplateIdentity', 'Identity', 'tab 2 · SHA-256'], ['1–4'], ['TemplateConfigs', 'Configurations', 'tab 3 · per revision'], ['1–4'], ['TemplateResults', 'Results', 'tab 4 · bound runs']],
    [['WidgetStates', 'Empty · loading · error for every data widget']]],
  ['3 · Create a template', [['Library', 'Library', ''], ['n'], ['NewTemplate', 'New template', 'empty project'], ['Existing Git repository'], ['NewTemplateRepo', 'Existing repository', 'HEAD → a41f9c2'], ['Continue'], ['PlannerPicker', 'Planner', 'M16'], ['Start'], ['PlanReview', 'Review draft', 'approve → r1']],
    [['NewTemplateInvalid', 'Not a Git repository']]],
  ['4 · Duplicate and revise', [['TemplateTasks', 'Revision r1', ''], ['e / d'], ['Revise', 'Duplicate or revise', 'mode · name · scope'], ['Open editor'], ['PlanEdit', 'Edit tasks', 'M16 editor'], ['Approve'], ['ReviseConfirm', 'Approve r2', 'new SHA-256'], ['Approve r2'], ['RevisionSaved', 'Revision r2', 'toast · r1 unchanged']], [['ReviseActiveRun', 'Active run warning'], ['ReviseIdentical', 'Identical · nothing to approve']]],
  ['5 · Exchange templates', [['Library', 'Library', ''], ['i'], ['ImportTemplate', 'Import · choose ZIP', 'DirectoryTree'], ['Validate'], ['ImportVerifying', 'Validating', 'paths · size · SHA-256']],
    [['ImportRejected', 'Mismatch · nothing added'], ['ImportDuplicate', 'Identical · idempotent'], ['ExportTemplate', 'x · Export template ZIP']]],
  ['6 · Launch identity check', [['TemplateConfigs', 'Configure run', ''], ['enter'], ['Setup', 'Setup', 'M07'], ['Review · Launch'], ['LaunchCheck', 'Freeze inputs', 'recompute · freeze · bind'], ['changed'], ['LaunchMismatch', 'Launch blocked', 'never relabelled'], ['Save as new revision'], ['Revise', 'Duplicate or revise', '']], []],
  ['M02 · Compare retained results', [['TemplateResults', 'Revision · results', 'M01 tab 4'], ['Open result'], ['Results', 'Results', '12 · filters'], ['o'], ['ResultOrigin', 'Result', 'launch · origin'], ['2'], ['ResultOutcomes', 'Outcomes', 'exit ≠ checks'], ['3'], ['ResultReviews', 'Reviews', 'raw grades']],
    [['ResultImport', 'Import · validated'], ['ResultImportConflict', 'Id conflict · nothing added'], ['ExportResult', 'Export result ZIP'], ['Rejudge', 'Review again'], ['ReportReady', 'HTML report · location'], ['ResultsTrials', '3 trials · mean, min–max'], ['ResultsStatistics', 's · statistics columns'], ['ResultsHalted', 'Halted run'], ['ResultsAnalysisTariff', 'Analysis tariff']]],
  ['M03 · Environment readiness', [['Library', 'Library', '#env-bar'], ['F2'], ['EnvironmentAuthFailed', 'Environment', '3 of 4 ready'], ['f5'], ['EnvironmentRechecked', 'Rechecked', '1 change'], ['m'], ['Catalog', 'Model catalog', 'M04']],
    [['Environment', 'All ready'], ['EnvironmentOffline', 'Offline · cached'], ['EnvironmentNoHarness', 'No harness'], ['EnvironmentCollectors', 'Linux collectors · 5 causes']]],
  ['M04 · Models and efforts', [['Environment', 'Environment', ''], ['m'], ['Catalog', 'Model catalog', 'source · age'], ['o'], ['CatalogOverride', 'Override', 'your metadata'], ['Setup'], ['ModelPicker', 'Add entry', 'known efforts only']],
    [['CatalogBilling', 'b · Account billing'], ['CatalogRates', 'x · Units per 1 USD'], ['CatalogRefreshFailed', 'Refresh failed · last valid kept'], ['ModelPickerUnknown', 'Unknown effort → harness default']]],
  ['M05 · Headless execution and isolation', [['Setup', 'Setup', 'M07'], ['p'], ['EnvPolicy', 'Environment policy', 'clean · current'], ['Launch'], ['LaunchCheck', 'Freeze inputs', 'M01'], ['run'], ['RunConfig', 'Configuration detail', 'requested · effective'], ['i'], ['RunIsolation', 'Isolation', 'per configuration']],
    [['CleanModeBlocked', 'Clean mode impossible'], ['TaskBlocked', 'Blocked action'], ['ModelRejected', 'Model rejected · no substitute']]],
  ['M06 · Rankings and weights', [['Results', 'Results', ''], ['2'], ['Rankings', 'Rankings', 'judge group A'], ['b'], ['ScoreBreakdown', 'Breakdown', 'full precision'], ['w'], ['WeightsEditor', 'Weights', 'two sets'], ['Apply'], ['RankingsAlternative', 'Alternative', 'labelled · reset']],
    [['WeightsInvalid', 'Invalid weights'], ['RankingsProfileDefaults', 'Profile defaults'], ['RankingsTrials', 'Trials · means'], ['WeightsFactors', 'Gen tok/s · direction'], ['RankingsFactors', '8 factors · typed exclusions'], ['ScoreBreakdownFactors', 'Breakdown · enabled set']]],
  ['M07 · Setup and launch', [['Library', 'Library', 'enter'], ['enter'], ['Setup', 'Setup', 'entries · judge · weights'], ['enter'], ['ReviewLaunch', 'Review', 'what will be frozen'], ['Launch'], ['LaunchCheck', 'Freeze inputs', 'M01'], ['run'], ['LaunchRecord', 'Launch record', 'three frozen records']],
    [['SetupInvalid', 'Blocking issues'], ['JudgePicker', 'Judge · saved'], ['JudgeFallback', 'Judge · fallback'], ['SetupNoEngine', 'No decision engine'], ['SetupGradingTextOnly', 'Text-only grader blocked'], ['DecisionEngines', 'x · Decision engines'], ['DecisionEnginesEmpty', 'Engines · none'], ['DecisionEnginesLocal', 'Engines · local vision'], ['DecisionEnginesMissing', 'Engines · model missing'], ['DecisionEngineEdit', 'Profile editor'], ['DecisionEngineTest', 'Profile test'], ['DecisionEngineTested', 'Tested · ready']]],
  ['M08 · Verification and evidence', [['ResultOutcomes', 'Outcomes', 'M02'], ['enter'], ['TaskChecks', 'Task checks', 'passed · failed · unverified'], ['f'], ['FinalRegression', 'Final regression', 'delivered artifact'], ['n'], ['CheckOutcomes', 'Not passed', 'four causes']],
    [['VerifyProgress', 'Verifying during the run'], ['Screenshots', 'Screenshots'], ['JudgeHandoff', 'Judge input'], ['EvidenceViewer', 'Evidence viewer']]],
  ['M09 · Default inventory benchmark', [['Library', 'Library', 'a About'], ['a'], ['InventoryAbout', 'Frozen contract', 'r1 · built-in'], ['p'], ['InventoryPrompts', 'Prompts', 'verbatim'], ['c'], ['InventoryChecks', 'Check coverage', '30 checks']],
    [['InventoryVariant', 'Look-alike is not the default'], ['InventoryUpgrade', 'r2 available']]],
  ['M10 · Measurements and cost', [['ResultOutcomes', 'Outcomes', 'M02'], ['m'], ['Measurements', 'Measurements', 'per task · Σ'], ['t'], ['TimingPhases', 'Timing', 'elapsed vs phases'], ['b'], ['CostBasis', 'Cost basis', '12 results'], ['u'], ['CurrencyEnergy', 'Currency and energy', 'display · rates · tariff']],
    [['MeasurementsPartial', 'Halted · partial, never zero'], ['MeasurementsTrials', '3 trials · pooled, mean, min–max'], ['ThroughputDetail', 'g · Gen tok/s pairs'], ['ArtifactStats', 'a · Files / LOC snapshot'], ['ContextDetailRetained', 'x · context · retained'], ['ContextDetailHistory', 'Context history · compaction'], ['ContextDetailDeferred', 'Context · deferred'], ['ContextDetailFailed', 'Context · partial'], ['ContextDetailReset', 'Context · reset · gap'], ['ContextDetailImported', 'Context · imported'], ['TariffAnalysis', 'Tariff · analysis setting']]],
  ['M11 · Run orchestration', [['LaunchRecord', 'Launch record', 'M07'], ['run'], ['RunOverview', 'Run overview', 'one lane per harness'], ['enter'], ['RunConfig', 'Configuration', 'M05'], ['d'], ['RunDetach', 'Detach', 'run continues'], ['^r'], ['RunReattached', 'Reattached', 'nothing restarted']],
    [['HarnessLive', 'v · live view'], ['HarnessLiveStreaming', 'Live · edit streaming'], ['HarnessLiveLimited', 'Live · less exposed'], ['HarnessLiveContextOff', 'Live · no decision engine'], ['ContextDetail', 'c · context window'], ['RunQueued', 'Same-harness queue'], ['RunSequential', 'Sequential · jobs 1'], ['RunFailures', 'Failures recorded'], ['RunHalted', 'Halted · identity invalidated'], ['StopConfirm', 'Stop · cleanup'], ['StopCleanup', 'Cleaning up'], ['ActiveLocked', 'Frozen while running']]],
  ['M12 · Quality judging', [['RunOverview', 'Run', 'M11'], ['all ended'], ['Judging', 'Judging', 'one session each'], ['enter'], ['ReviewDetail', 'Review', 'raw grades'], ['p'], ['RubricProfiles', 'Profiles', 'web · backend']],
    [['JudgingDone', 'Finished · 1 ungraded'], ['JudgingTrials', '3 trials · one session each'], ['ReviewUngraded', 'Ungraded review'], ['JudgeCapability', 'No screenshot support']]],
  ['M13 · HTML report', [['Results', 'Results', 'M02'], ['h'], ['ReportGenerate', 'Generate', 'scope · weights'], ['Generate'], ['ReportProgress', 'Generating', 'escape · embed'], ['done'], ['ReportReady', 'Path', 'always shown'], ['open'], ['ReportPage', 'HTML file', 'offline, standalone']], [['ReportGenerateDefaults', 'Original weights differ']]],
  ['M14 · Command line', [[null, 'Shell', 'axbenchmark …'], ['--help'], ['CliHelp', '--help', '12 signatures'], ['run'], ['CliRun', 'run --no-tui', 'plain progress'], ['--attach'], ['RunQueued', 'Run in the TUI', 'M11']],
    [['CliRunReport', 'Trial warning · report wait'], ['CliInvalid', 'Incomplete config · exit 1'], ['CliHalted', 'Halted · exit 1 · status'], ['CliStatusStop', 'status · stop'], ['CliDoctor', 'doctor · refresh'], ['CliVerify', 'doctor --verify'], ['CliExchange', 'exchange · report'], ['CliStatistics', 'status · statistics · schema 2']]],
  ['M15 · Terminal interface', [['HelpKeys', 'Keys and views', '? anywhere'], ['F1'], ['Library', 'Library', ''], ['F2'], ['Environment', 'Environment', ''], ['F3'], ['Setup', 'Setup', ''], ['F4'], ['RunOverview', 'Run', '2×2'], ['F6'], ['Results', 'Results', '']],
    [['RunListDetail', 'Run below 100×30 · list and detail'], ['CommandPalette', 'Command palette'], ['PromptSavePreset', 'Prompt · Save preset'], ['PromptExportConfig', 'Prompt · typed error'], ['PromptExportCsv', 'Prompt · Export CSV']]],
  ['M16 · Custom template planning', [['NewTemplateRepo', 'New template', 'M01'], ['Continue'], ['PlannerPicker', 'Planner', 'fallback order'], ['Start'], ['PlanningProgress', 'Capture and plan', 'HEAD → a41f9c2'], ['done'], ['PlanReview', 'Review draft', '7 tasks'], ['a'], ['PlanApprove', 'Approve r1', 'SHA-256']],
    [['PlannerUnknownModel', 'No default model'], ['PlannerNoUsable', 'No usable harness'], ['PlannerVerify', 'Verify now · consent'], ['PlanReopened', 'Draft reopened'], ['PlanServices', 'Setup · start · stop'], ['PlanServiceEdit', 'Edit a service'], ['PlanEdit', 'Edit a task'], ['PlanRegenerate', 'Regenerate'], ['PlanApproveIdentical', 'Identical · blocked'], ['PlanningFailed', 'Planning failed'], ['PlanningInterrupted', 'Failed · interrupted']]],
  ['M17 · ZIP exchange', [['Results', 'Results', 'M02'], ['i'], ['ResultPackagePick', 'Choose ZIP', '#zip-browser'], ['Inspect'], ['ResultPackage', 'Result package', 'contents · provenance'], ['Import'], ['ResultMismatch', 'Template differs', 'expected · received'], ['Continue'], ['ResultEmbedded', 'Own revision', 'atomic']],
    [['ImportUnsafe', 'Unsafe package'], ['ImportIncomplete', 'Incomplete package'], ['ImportRejected', 'Digest mismatch'], ['ImportDuplicate', 'Identical']]],
  ['M18 · Hardware monitoring', [['Setup', 'Setup', 'M07'], ['Execution pane'], ['MonitoringSettings', 'Monitoring', 'auto · off'], ['Guidance'], ['CollectorGuide', 'Guidance', 'you run it'], ['f5'], ['EnvironmentCollectors', 'Recheck', 'five causes']],
    [['Telemetry', 'Telemetry · one experiment'], ['EnergyDetail', 'Energy derivation'], ['SequentialEnergy', 'Sequential windows'], ['PromptExportCsv', 'Export CSV']]],
];

export const NAV_H = Math.ceil((200 + FLOWS.length * 196) / 20) * 20;
export const STATES_H = Math.ceil((180 + WIDGET_STATES.length * 210) / 20) * 20;

export function navMap(ctx) {
  const node = ([name, title, sub]) => name
    ? `<a class="node" href="${ctx.href(name)}"><b>${esc(title)}</b><span style="color: var(--mu)">${esc(name)}</span>${sub ? `<span style="color: var(--mu)">${esc(sub)}</span>` : ''}</a>`
    : `<div class="node ghost"><b>${esc(title)}</b><span>${esc(sub)}</span></div>`;
  const edge = ([label]) => `<div class="edge"><span>${esc(label)}</span><i>──▸</i></div>`;
  return `<div style="display: flex; flex-direction: column; gap: 28px">
<div style="display: flex; flex-direction: column; gap: 6px"><h1 style="margin: 0; font-size: 28px; line-height: 34px">M01–M18 · navigation map</h1>
<p style="margin: 0; font-size: 14px; line-height: 21px; color: var(--mu); max-width: 1100px">Screens are Textual Screens; modals are ModalScreens pushed over them. Every box opens its frame; dashed boxes belong to later modules. Solid arrows are key bindings or buttons; the row below each flow lists its alternate states.</p></div>
${FLOWS.map(([title, steps, alts]) => `<section class="sec"><h2>${esc(title)}</h2>
<div style="display: flex; align-items: stretch; flex-wrap: wrap; gap: 8px">${steps.map((s) => (s.length === 1 ? edge(s) : node(s))).join('')}</div>
${alts.length ? `<div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--mu)"><span>States ╌▸</span>${alts.map(([n, t]) => `<a class="node" style="min-width: 0" href="${ctx.href(n)}"><span>${esc(t)}</span><span style="color: var(--mu)">${esc(n)}</span></a>`).join('')}</div>` : ''}
</section>`).join('\n')}
</div>`;
}

// ---------------------------------------------------------------- widget states matrix

export function widgetStates(ctx) {
  return `<div style="display: flex; flex-direction: column; gap: 26px">
<div style="display: flex; flex-direction: column; gap: 6px"><h1 style="margin: 0; font-size: 24px; line-height: 30px">Data widgets · loading, empty and error</h1>
<p style="margin: 0; font-size: 13px; line-height: 20px; color: var(--mu); max-width: 1200px">Each data widget is wrapped in a ContentSwitcher (#x, #x-loading, #x-empty, #x-error). Panels are drawn at their real cell size (56×8) with the copy the app shows. Errors name the file and leave data untouched; empty states say what to do next.</p></div>
${WIDGET_STATES.map(({ widget, label, states }) => `<section class="sec"><h2>${esc(label)} · <code>${esc(widget)}</code></h2>
<div style="display: flex; gap: 28px">${states.map(([s, g]) => `<div style="display: flex; flex-direction: column; gap: 6px"><span class="cap"><b>${s}</b> · #${esc(widget.split('#')[1])}${s === 'Loading' ? '-loading' : s === 'Empty' ? '-empty' : '-error'}</span>${term(g, ctx)}</div>`).join('')}</div></section>`).join('\n')}
</div>`;
}
