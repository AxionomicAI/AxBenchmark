// Artboard catalogue for M01: one entry per frame, grouped into the flows of navigation.md.
// Each board names its Textual screen, the focus stops Tab moves through, and the annotation legend.
import { library, draftDiscard, template, newTemplate, revise, reviseConfirm, exportTemplate, importTemplate, importVerifying, importRejected, importDuplicate, launchCheck, launchMismatch, commandPalette } from './screens.mjs';

// ---------------------------------------------------------------- legends (shared per screen)

const LIB_TREE = `LibraryScreen(Screen)          AUTO_FOCUS = "#templates"
├─ Header
├─ Static #env-bar
├─ Horizontal #main
│  ├─ Vertical #library-pane .pane
│  │  ├─ Input #filter
│  │  ├─ Vertical #default-notice .notice   newer built-in
│  │  │  ├─ Button #default-changes
│  │  │  ├─ Button #make-default      → ConfirmScreen
│  │  │  └─ Button #dismiss-notice
│  │  ├─ ContentSwitcher #library-body
│  │  │  ├─ DataTable #templates
│  │  │  ├─ LoadingIndicator #templates-loading
│  │  │  ├─ Static #templates-empty .empty
│  │  │  └─ Vertical #templates-error .notice.-error
│  │  │     └─ Button #retry
│  │  └─ DataTable #drafts            planning drafts
│  └─ VerticalScroll #detail-pane .pane
│     ├─ Static #detail-fields .kv | #draft-fields .kv
│     ├─ ListView #saved-configs
│     ├─ Button #why-not-default    look-alike rows
│     └─ Horizontal .actions
│        ├─ Button #configure .-primary | #reopen .-primary
│        ├─ Button #open | #discard-draft
│        └─ Button #export
├─ Static #summary            .-compact only
└─ Footer`;

const LIB_SEL = [
  ['#env-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#main', 'height: 1fr;'],
  ['#library-pane', 'width: 3fr; border: solid $foreground 30%;'],
  ['#detail-pane', 'width: 2fr; border: solid $foreground 30%; padding: 0 1;'],
  ['.pane:focus-within', 'border: solid $primary; border-title-color: $primary;'],
  ['#filter', 'height: 1; background: $surface; border: none;'],
  ['#templates', 'height: auto; max-height: 1fr;  cursor_type = "row", zebra_stripes = False'],
  ['#drafts', 'height: auto; margin-top: 1;  cursor_type = "row"; hidden while filtering or loading'],
  ['#default-notice', 'height: auto; display: none; padding: 1 0;'],
  ['LibraryScreen.-newer-builtin #default-notice', 'display: block;  until dismissed'],
  ['#why-not-default', 'display: none;'],
  ['#detail-pane.-lookalike #why-not-default', 'display: block;'],
  ['#summary', 'display: none; height: 5; border: solid $foreground 30%;'],
  ['Screen.-compact #detail-pane', 'display: none;'],
  ['Screen.-compact #summary', 'display: block;'],
];

const LIB_KEYS = [
  ['enter', 'configure / reopen', 'Configure a run for the selected revision (Setup · M07); on a draft row, reopen the draft where it was left (M16)'],
  ['a', 'about', 'InventoryAboutScreen (M09). Enabled only on the built-in inventory row; dimmed via check_action otherwise'],
  ['?', 'app.help', 'App-wide Help (M15), never About'],
  ['delete', 'delete_revision / discard_draft', 'Revision row: M15 ConfirmScreen with templates.get effect/token, then templates.delete; draft row: confirm planning.discard. Engine refusal dims both binding and palette. Escape sends nothing.'],
  ['o', 'open_template', 'Open TemplateScreen'],
  ['n', 'new_template', 'Push NewTemplateScreen'],
  ['d / e', 'duplicate / revise', 'Push ReviseScreen with the mode preselected'],
  ['i / x', 'import / export', 'Push ImportScreen / ExportScreen'],
  ['/', 'focus("#filter")', 'Filter by name, type or source'],
  ['esc', 'clear_filter', 'Clear the filter (when #filter has text)'],
  ['ctrl+r', 'reconnect', 'Attach to the active run (Execution · M11)'],
  ['f2', 'environment', 'Environment view (M03)'],
  ['tab', 'focus_next', 'Next focus stop'],
  ['ctrl+p', 'command_palette', 'Textual command palette'],
  ['q', 'quit', 'Quit; active runs keep running'],
];

const TPL_TREE = `TemplateScreen(Screen)         AUTO_FOCUS = "#tasks"
├─ Header
├─ Static #identity-bar
├─ Horizontal #body
│  ├─ Vertical #revisions-pane .pane    width: 30
│  │  ├─ Tree #revisions
│  │  ├─ Static #revision-facts .kv
│  │  └─ Button #rename .link        → PromptScreen (M15)
│  └─ TabbedContent #tabs             width: 1fr
│     ├─ TabPane #tab-tasks "Tasks"
│     │  ├─ DataTable #tasks .bordered
│     │  └─ VerticalScroll #task-prompt .bordered
│     │     └─ Markdown
│     ├─ TabPane #tab-identity "Identity"
│     │  ├─ Static #identity-summary
│     │  ├─ DataTable #manifest .bordered
│     │  ├─ Static #not-covered
│     │  └─ Horizontal .actions
│     ├─ TabPane #tab-configs "Configurations"
│     │  ├─ DataTable #configs .bordered
│     │  ├─ DataTable #config-entries .bordered
│     │  ├─ Static #config-summary .kv
│     │  └─ Horizontal .actions
│     └─ TabPane #tab-results "Results"
│        ├─ DataTable #results .bordered
│        ├─ Static #judge-groups
│        ├─ Static #scope-note .notice
│        └─ Horizontal .actions
└─ Footer`;

const TPL_SEL = [
  ['#identity-bar', 'height: 1; background: $surface; padding: 0 1;'],
  ['#revisions-pane', 'width: 30; border: solid $foreground 30%;'],
  ['#tabs', 'width: 1fr; padding: 0 1;'],
  ['.bordered', 'border: solid $foreground 30%;'],
  ['.bordered:focus', 'border: solid $primary;'],
  ['#tasks', 'height: 10;'],
  ['#task-prompt', 'height: 1fr;'],
  ['#manifest', 'height: 18; max-height: 1fr;'],
  ['Screen.-compact #revisions-pane', 'display: none;'],
  ['Toast.-success', 'border-left: outer $primary;'],
];

const TPL_KEYS = [
  ['esc', 'app.pop_screen', 'Back to the library (selection and filter kept)'],
  ['1 … 4', 'show_tab', 'Tasks · Identity · Configurations · Results'],
  ['e / d', 'revise / duplicate', 'Push ReviseScreen'],
  ['n', 'rename', 'Rename the lineage display name via PromptScreen (M15); identity unchanged. Dimmed for built-ins'],
  ['x', 'export', 'Push ExportScreen for this revision'],
  ['enter', 'configure', 'Configure a run (Setup · M07)'],
  ['c', 'copy_sha', 'Copy the full SHA-256 to the clipboard'],
  ['r', 'pick_revision', 'Compact only: OptionList of revisions'],
  ['tab', 'focus_next', 'Next focus stop'],
];

const modalSel = (id, w) => [
  [`${id.replace('#', '')}`.replace(/(^|-)(\w)/g, (_, a, b) => b.toUpperCase()) + 'Screen', 'align: center middle; background: $background 60%;'],
  [id, `width: ${w}; max-width: 100%; height: auto; border: round $primary; background: $surface; padding: 1 2;`],
  ['.dialog-actions', 'height: 1; align-horizontal: right; margin-top: 1;'],
  ['Button.-primary', 'background: $primary; color: $background; text-style: bold;'],
  ['Button:focus', 'text-style: reverse bold;'],
];

const NEW_TREE = `NewTemplateScreen(ModalScreen[TemplateDraft])
├─ Vertical #new-template .dialog
│  ├─ Label "Project prompt"
│  ├─ TextArea #prompt               soft_wrap = True
│  ├─ Horizontal .field
│  │  ├─ Label "Type"
│  │  └─ RadioSet #project-type
│  ├─ Horizontal .field
│  │  ├─ Label "Start"
│  │  └─ RadioSet #baseline-kind
│  ├─ Static #baseline-hint            empty project
│  ├─ Vertical #repo-fields            existing repository
│  │  ├─ Input #repo-path · Static #repo-status
│  │  ├─ Input #revision · Static #revision-resolved
│  │  └─ Static .notice.-warning
│  ├─ Static #planner-hint
│  └─ Horizontal .dialog-actions
│     ├─ Button #cancel
│     └─ Button #continue .-primary
└─ Footer`;

const REVISE_TREE = `ReviseScreen(ModalScreen[ReviseRequest])
├─ Vertical #revise .dialog
│  ├─ Static #revise-source
│  ├─ RadioSet #revise-mode
│  ├─ Horizontal .field
│  │  ├─ Label "Name"
│  │  └─ Input #revise-name
│  ├─ Grid #revise-scope              grid-size: 2
│  │  └─ Checkbox × 4
│  ├─ Static #revise-hint
│  ├─ Static #revise-active-run .notice.-warning   non-blocking
│  └─ Horizontal .dialog-actions
│     ├─ Button #cancel
│     └─ Button #open-editor .-primary
└─ Footer`;

const APPROVE_TREE = `ApproveRevisionScreen(ModalScreen[bool])
├─ Vertical #approve-revision .dialog
│  ├─ Static #revision-diff
│  ├─ Static #revision-digests
│  ├─ Static #revision-verdict       .notice.-error when identical
│  ├─ Checkbox #copy-configs         hidden when identical
│  └─ Horizontal .dialog-actions
│     ├─ Button #back
│     ├─ Button #open-existing       identical only (o)
│     └─ Button #approve .-primary   disabled when identical
└─ Footer`;

const EXPORT_TREE = `ExportScreen(ModalScreen[Path | None])
├─ Vertical #export .dialog
│  ├─ Static #export-identity
│  ├─ Horizontal .field
│  │  ├─ Label "Save as"
│  │  └─ Input #export-path
│  ├─ Static #export-contents
│  ├─ Static #export-hint
│  └─ Horizontal .dialog-actions
│     ├─ Button #cancel
│     └─ Button #export-zip .-primary
└─ Footer`;

const IMPORT_TREE = `ImportScreen(ModalScreen[ImportOutcome])
├─ Vertical #import .dialog
│  ├─ ContentSwitcher #import-body
│  │  ├─ Vertical #import-pick
│  │  │  ├─ Input #zip-path
│  │  │  └─ DirectoryTree #zip-browser   filter: *.zip
│  │  ├─ Vertical #import-steps
│  │  │  └─ ProgressBar #import-progress
│  │  ├─ Vertical #import-rejected .notice.-error
│  │  │  └─ ContentSwitcher #rejection-detail
│  │  │     ├─ Vertical #unsafe-detail      (M17)
│  │  │     ├─ Vertical #incomplete-detail  (M17)
│  │  │     ├─ Vertical #digest-detail
│  │  │     └─ Vertical #other-detail
│  │  └─ Vertical #import-duplicate .notice.-success
│  └─ Horizontal .dialog-actions
└─ Footer`;

const LAUNCH_TREE = `LaunchCheckScreen(ModalScreen[LaunchDecision])
├─ Vertical #launch-check .dialog
│  ├─ Static #launch-subject .kv
│  ├─ ContentSwitcher #launch-body
│  │  ├─ Vertical #launch-steps
│  │  │  └─ ProgressBar #launch-progress
│  │  └─ Vertical #launch-blocked .notice.-error
│  │     └─ Static #launch-digests
│  └─ Horizontal .dialog-actions
│     ├─ Button #cancel
│     ├─ Button #restore              blocked only
│     └─ Button #save-revision .-primary / #launch .-primary
└─ Footer`;

const PALETTE_TREE = `CommandPalette (Textual built-in, ctrl+p)
└─ provider: LibraryCommands(Provider)
   ├─ Revise template…
   ├─ Show revisions
   ├─ Reconnect to run
   ├─ Recheck environment
   └─ Export template revision…`;

const MODAL_KEYS = (extra) => [['esc', 'dismiss(None)', 'Close without changes'], ['tab / shift+tab', 'focus_next / previous', 'Move between fields'], ...extra];

// ---------------------------------------------------------------- boards

const S = (name, title, def) => ({ name, title, ...def });
const LIB_STATES = [['Delete revision', 'RevisionDeleteConfirm'], ['Built-in refusal', 'RevisionDeleteBuiltin'], ['Active-run refusal', 'RevisionDeleteActiveRun'], ['Results refusal', 'RevisionDeleteHasResults'], ['Changed plan', 'RevisionDeleteChanged'], ['Pending publication', 'RevisionDeletePending'], ['Default', 'Library'], ['Drafts', 'LibraryDrafts'], ['Discard draft', 'DraftDiscard'], ['Look-alike', 'LibraryLookAlike'], ['Newer built-in', 'LibraryUpgrade'], ['Loading', 'LibraryLoading'], ['Empty', 'LibraryEmpty'], ['Error', 'LibraryError'], ['No harness', 'LibraryNoHarness']];
const TPL_STATES = [['Tasks', 'TemplateTasks'], ['Identity', 'TemplateIdentity'], ['Configurations', 'TemplateConfigs'], ['Results', 'TemplateResults'], ['Empty · loading · error', 'WidgetStates']];
const libLegend = (notes) => ({ screen: 'LibraryScreen', file: 'tui/screens/library.py', tree: LIB_TREE, sel: LIB_SEL, keys: LIB_KEYS, states: LIB_STATES, notes });
const tplLegend = (notes) => ({ screen: 'TemplateScreen', file: 'tui/screens/template.py', tree: TPL_TREE, sel: TPL_SEL, keys: TPL_KEYS, states: TPL_STATES, notes });

const LIB_FOCUS = { wide: [['templates', 'DataTable #templates'], ['detail', 'Button #configure'], ['filter', 'Input #filter']], compact: [['templates', 'DataTable #templates'], ['filter', 'Input #filter']] };

export const GROUPS = [
  { id: 'browse', title: '1 · Browse the library', note: 'Home view. The built-in seven-task inventory benchmark is the default selection; every row shows the required library fields, and unfinished planning drafts are listed below. Then the draft, look-alike and newer-built-in states, the loading, empty-filter, error and no-harness states, and the command palette.', boards: [
    S('Library', 'Library', { sizes: ['wide', 'compact'], focus: LIB_FOCUS, render: (sz, f) => library(sz, f), legend: libLegend([
      'Default selection: built-in Inventory web app r1, runnable with no planner call (R018, R030, R136). a About opens its frozen contract (M09); ? is the app-wide Help.',
      'Planning drafts are listed below the templates in #drafts, marked ◇ (W10).',
      'Every required field is visible: name, project type, tasks, revision, SHA-256, saved configurations and results; the description is in the detail pane.',
      'Below 100 columns or 30 rows the app sets Screen.-compact: the detail pane hides and #summary shows the selection (list/detail).',
      '#env-bar surfaces readiness (M03) and the active run so it can be reattached from home.',
    ]) }),
    S('LibraryDrafts', 'Library · planning drafts', { sizes: ['wide'], focus: { wide: [['drafts', 'DataTable #drafts'], ['detail', 'Button #reopen'], ['templates', 'DataTable #templates']] }, render: (sz, f) => library(sz, f, { sel: 'draft' }), legend: libLegend([
      'Unfinished planning drafts are rows marked ◇ draft with their state (planning, ready for review, failed) and last update (W10). They live in ~/.axbenchmark/drafts/ and survive app and engine exit (D10).',
      'enter reopens the draft where it was left: planning → PlanningProgress, ready for review → PlanReview, failed → PlanningFailed (M16).',
      'delete or Discard draft… asks through the shared ConfirmScreen (M15). A draft has no SHA-256, so nothing else can refer to it.',
      'a About is dimmed: it only applies to the built-in inventory row (D2).',
    ]) }),
    S('DraftDiscard', 'Discard draft · confirm', { sizes: ['wide'], focus: { wide: [['cancel', 'Button #cancel'], ['discard', 'Button #confirm']] }, render: (sz, f) => draftDiscard(sz, f), legend: { screen: 'ConfirmScreen (M15, shared)', file: 'tui/screens/confirm.py', tree: `ConfirmScreen(ModalScreen[bool])\n├─ Vertical #confirm .dialog\n│  ├─ Static #confirm-subject\n│  ├─ Static #confirm-body\n│  └─ Horizontal .dialog-actions\n│     ├─ Button #cancel          default focus\n│     └─ Button #confirm .-error\n└─ Footer`, sel: [...modalSel('#confirm', 72), ['Button.-error', 'text-style: bold underline;  destructive']], keys: MODAL_KEYS([['enter', 'choose', 'Activate the focused button; Cancel has focus first']]), states: LIB_STATES, notes: ['Instance of the shared ConfirmScreen drawn on the M15 page; the Library supplies subject and body.', 'Only the draft folder is deleted. Repository, templates, configurations and results are untouched.'] } }),
    S('LibraryLookAlike', 'Library · look-alike selected', { sizes: ['wide'], focus: { wide: [['templates', 'DataTable #templates'], ['why', 'Button #why-not-default'], ['detail', 'Button #configure']] }, render: (sz, f) => library(sz, f, { sel: 'lookalike' }), legend: libLegend([
      'Selecting a look-alike of the default (same name, different task count) shows Why not the default? (#why-not-default), which opens VariantScreen (M09, capability can_compare_default).',
      'a About is dimmed in the Footer: it is enabled only on the built-in inventory row (D2). ? stays the app-wide Help.',
    ]) }),
    S('LibraryUpgrade', 'Library · newer built-in revision', { sizes: ['wide'], focus: { wide: [['notice', 'Button #default-changes'], ['templates', 'DataTable #templates']] }, render: (sz, f) => library(sz, f, { upgrade: true }), legend: libLegend([
      'D16: an upgrade shipped a new built-in revision. With results on the current default, the default stays and #default-notice offers what changed (#default-changes), says results can’t be compared, and Make r3 the default… (#make-default → ConfirmScreen, M15).',
      'Without results on the current default, the default moves to the newest built-in revision silently and no notice is shown.',
      'The decision text names r2; here the user’s custom revision is already r2, so the shipped built-in revision is r3.',
      'All built-in revisions stay available and runnable.',
    ]) }),
    S('LibraryLoading', 'Library · loading', { sizes: ['wide'], render: (sz) => library(sz, 'none', { loading: true }), legend: libLegend([
      'ContentSwitcher #library-body shows #templates-loading while the index is read in a worker.',
      'Detail pane waits; no action that needs a selection is enabled.',
    ]) }),
    S('LibraryEmpty', 'Library · filter matches nothing', { sizes: ['wide'], focus: { wide: [['filter', 'Input #filter']] }, render: (sz) => library(sz, 'filter', { filter: 'graphql' }), legend: libLegend([
      'The library is never truly empty: built-in templates always exist. Empty means the filter matches nothing.',
      'esc clears the filter and returns focus to #templates.',
    ]) }),
    S('LibraryError', 'Library · index unreadable', { sizes: ['wide', 'compact'], focus: { wide: [['retry', 'Button #retry']], compact: [['retry', 'Button #retry']] }, render: (sz, f) => library(sz, f, { error: true }), legend: libLegend([
      'Failure to read user data never hides the built-in templates; they stay listed and runnable.',
      'The error names the path and the OS error; Retry re-reads in a worker. Nothing is modified or repaired automatically.',
    ]) }),
    S('LibraryNoHarness', 'Library · no supported harness', { sizes: ['wide'], focus: LIB_FOCUS, render: (sz, f) => library(sz, f, { noHarness: true }), legend: libLegend([
      'Actionable block: planning and runs are disabled (enter, n and Configure run are dimmed via check_action).',
      'Browsing, import/export and saved results stay available (R029, R040). F2 opens Environment for setup guidance and recheck.',
    ]) }),
    S('CommandPalette', 'Command palette', { sizes: ['wide'], render: (sz) => commandPalette(sz), legend: { screen: 'CommandPalette', file: 'tui/commands.py', tree: PALETTE_TREE, sel: [['CommandPalette', 'Textual default; only the theme variables apply.'], ['CommandPalette > .command-palette--highlight', 'text-style: bold underline;']], keys: [['ctrl+p', 'command_palette', 'Open from any screen'], ['↑ ↓', 'cursor', 'Move'], ['enter', 'run', 'Run the highlighted command'], ['esc', 'dismiss', 'Close']], states: LIB_STATES, notes: ['Every footer action is also a command, so compact layouts can drop bindings from the footer without losing them.', 'Fuzzy matches are bold and underlined.'] } }),
  ] },
  { id: 'inspect', title: '2 · Inspect a template revision', note: 'TemplateScreen shows one revision: its ordered tasks and prompts, the identity manifest that defines its SHA-256, the saved configurations scoped to it and the results bound to it. The last frame lists empty, loading and error states for every data widget.', boards: [
    S('TemplateTasks', 'Revision · tasks', { sizes: ['wide', 'compact'], focus: { wide: [['tasks', 'DataTable #tasks'], ['prompt', 'Markdown #task-prompt'], ['revisions', 'Tree #revisions']], compact: [['tasks', 'DataTable #tasks'], ['prompt', 'Markdown #task-prompt']] }, render: (sz, f) => template(sz, f, { tab: 0 }), legend: tplLegend([
      'Prompts are quoted verbatim from benchmark/tasks/; the shared specification is prepended to every task (R018).',
      'Acceptance checks are listed with their task but run outside the competitor workspace (M08).',
      'Revision tree: selecting a node reloads the screen for that revision; lineage is navigation only, identity comes from content.',
    ]) }),
    S('TemplateIdentity', 'Revision · identity', { sizes: ['wide', 'compact'], focus: { wide: [['manifest', 'DataTable #manifest'], ['copy', 'Button #copy-sha'], ['revisions', 'Tree #revisions']], compact: [['manifest', 'DataTable #manifest']] }, render: (sz, f) => template(sz, f, { tab: 1 }), legend: tplLegend([
      'Full 64-character SHA-256 always; abbreviations elsewhere are 8 characters plus the last 8 when space allows.',
      'The manifest lists exactly what the hash covers: metadata, spec, ordered prompts, checks, protocol, setup/start/stop, rubric, baseline, declared dependencies (R118, R119).',
      'Excluded settings are listed so users see that changing harness, machine or weights does not change identity (R141).',
      'The empty baseline digest is the SHA-256 of zero bytes (e3b0c442…).',
    ]) }),
    S('TemplateConfigs', 'Revision · configurations', { sizes: ['wide'], focus: { wide: [['configs', 'DataTable #configs'], ['entries', 'DataTable #config-entries'], ['run', 'Button #configure']] }, render: (sz, f) => template(sz, f, { tab: 2 }), legend: tplLegend([
      'Configurations belong to one revision (r1 · 3f9c2e71), never to the app globally (R019).',
      'Multiple entries per harness are allowed; editing opens Setup (M07) and never touches template content or results.',
    ]) }),
    S('TemplateResults', 'Revision · results', { sizes: ['wide'], focus: { wide: [['results', 'DataTable #results'], ['open', 'Button #open-result']] }, render: (sz, f) => template(sz, f, { tab: 3 }), legend: tplLegend([
      'Only results bound to this exact SHA-256 are listed; local and imported are labelled and judge groups stay separate (M02).',
      'Results of other revisions or look-alike templates are never listed here; #scope-note says so. Several trials of one configuration are grouped with their mean on Results (D7).',
    ]) }),
    S('WidgetStates', 'Data widgets · empty, loading, error', { sizes: ['wide'], special: 'states' }),
  ] },
  { id: 'create', title: '3 · Create a template', note: 'n opens a modal for the multiline project prompt, project type and baseline. An existing repository is snapshotted at a committed revision; uncommitted changes are excluded and the repository is untouched. Planning itself belongs to M16.', boards: [
    S('NewTemplate', 'New template · empty project', { sizes: ['wide', 'compact'], focus: { wide: [['prompt', 'TextArea #prompt'], ['type', 'RadioSet #project-type'], ['start', 'RadioSet #baseline-kind'], ['continue', 'Button #continue']], compact: [['prompt', 'TextArea #prompt'], ['type', 'RadioSet #project-type'], ['continue', 'Button #continue']] }, render: (sz, f) => newTemplate(sz, f), legend: { screen: 'NewTemplateScreen', file: 'tui/screens/new_template.py', tree: NEW_TREE, sel: [...modalSel('#new-template', 76), ['#prompt', 'height: 6; border: solid $foreground 30%;'], ['#prompt:focus', 'border: solid $primary;'], ['RadioSet', 'layout: horizontal; border: none; background: transparent;']], keys: MODAL_KEYS([['ctrl+s', 'submit', 'Continue to planning (M16)'], ['enter', 'newline', 'Inside #prompt: new line, not submit']]), states: [['Empty project', 'NewTemplate'], ['Existing repository', 'NewTemplateRepo'], ['Invalid repository', 'NewTemplateInvalid']], notes: ['Multiline prompt + frontend/backend/fullstack + empty or existing repository (R030).', 'The planner shown is the preselected valid choice; changing it happens in planning (M16).'] } }),
    S('NewTemplateRepo', 'New template · existing repository', { sizes: ['wide', 'compact'], focus: { wide: [['repo', 'Input #repo-path'], ['revision', 'Input #revision'], ['continue', 'Button #continue']], compact: [['repo', 'Input #repo-path'], ['revision', 'Input #revision'], ['continue', 'Button #continue']] }, render: (sz, f) => newTemplate(sz, f, { repo: 'ok' }), legend: { screen: 'NewTemplateScreen', file: 'tui/screens/new_template.py', tree: NEW_TREE, sel: [...modalSel('#new-template', 76), ['#repo-fields', 'height: auto; display: none;'], ['.-existing #repo-fields', 'display: block;']], keys: MODAL_KEYS([['ctrl+s', 'submit', 'Continue to planning (M16)']]), states: [['Empty project', 'NewTemplate'], ['Existing repository', 'NewTemplateRepo'], ['Invalid repository', 'NewTemplateInvalid']], notes: ['Revision defaults to HEAD and is resolved immediately to a commit, which the template pins forever.', 'Uncommitted changes are counted and explicitly excluded; the source repository is only read (R030, R067).'] } }),
    S('NewTemplateInvalid', 'New template · not a Git repository', { sizes: ['wide'], focus: { wide: [['repo', 'Input #repo-path']] }, render: (sz, f) => newTemplate(sz, f, { repo: 'invalid' }), legend: { screen: 'NewTemplateScreen', file: 'tui/screens/new_template.py', tree: NEW_TREE, sel: [...modalSel('#new-template', 76), ['Input.-invalid', 'border: none; background: $surface; text-style: bold;']], keys: MODAL_KEYS([]), states: [['Empty project', 'NewTemplate'], ['Existing repository', 'NewTemplateRepo'], ['Invalid repository', 'NewTemplateInvalid']], notes: ['Validation runs on Input.Changed (debounced); Continue stays disabled until the path is a Git repository with a resolvable revision.'] } }),
  ] },
  { id: 'revise', title: '4 · Duplicate and revise', note: 'e or d opens one modal with the mode preselected; a run active on the revision adds a non-blocking warning. Approval compares content: changed content gets a new SHA-256 and revision, identical content is blocked, and the original stays approved with its configurations and results.', boards: [
    S('Revise', 'Duplicate or revise', { sizes: ['wide'], focus: { wide: [['mode', 'RadioSet #revise-mode'], ['name', 'Input #revise-name'], ['changes', 'Checkbox #scope-prompts'], ['editor', 'Button #open-editor']] }, render: (sz, f) => revise(sz, f), legend: { screen: 'ReviseScreen', file: 'tui/screens/revise.py', tree: REVISE_TREE, sel: [...modalSel('#revise', 76), ['#revise-scope', 'grid-size: 2; grid-gutter: 0 2; height: 2;']], keys: MODAL_KEYS([['enter', 'open_editor', 'Open the template editor (M16)']]), states: [['Choose', 'Revise'], ['Run active', 'ReviseActiveRun'], ['Approve', 'ReviseConfirm'], ['Identical', 'ReviseIdentical'], ['Saved', 'RevisionSaved']], notes: ['The scope checkboxes are a guide for the editor; the actual new identity is computed from content at approval.', 'Renaming alone never changes identity (display-only naming, R118).'] } }),
    S('ReviseActiveRun', 'Duplicate or revise · run active', { sizes: ['wide'], focus: { wide: [['mode', 'RadioSet #revise-mode'], ['editor', 'Button #open-editor']] }, render: (sz, f) => revise(sz, f, { activeRun: true }), legend: { screen: 'ReviseScreen', file: 'tui/screens/revise.py', tree: REVISE_TREE, sel: [...modalSel('#revise', 76), ['#revise-active-run', 'height: auto; display: none;'], ['ReviseScreen.-active-run #revise-active-run', 'display: block;']], keys: MODAL_KEYS([['enter', 'open_editor', 'Continue; the warning never blocks']]), states: [['Choose', 'Revise'], ['Run active', 'ReviseActiveRun'], ['Approve', 'ReviseConfirm'], ['Identical', 'ReviseIdentical'], ['Saved', 'RevisionSaved']], notes: ['D9: choosing duplicate or revise while a run uses this revision shows #revise-active-run. It is a warning, not a block.', 'Approved revision files are written read-only; if r1 changed on disk anyway, the run halts (Results · halted run, M02).'] } }),
    S('ReviseConfirm', 'Approve revision r2', { sizes: ['wide', 'compact'], focus: { wide: [['approve', 'Button #approve'], ['copy', 'Checkbox #copy-configs']], compact: [['approve', 'Button #approve'], ['copy', 'Checkbox #copy-configs']] }, render: (sz, f) => reviseConfirm(sz, f), legend: { screen: 'ApproveRevisionScreen', file: 'tui/screens/revise.py', tree: APPROVE_TREE, sel: [...modalSel('#approve-revision', 86), ['#revision-digests', 'height: 2; text-wrap: nowrap;']], keys: MODAL_KEYS([['ctrl+s', 'approve', 'Approve r2']]), states: [['Choose', 'Revise'], ['Run active', 'ReviseActiveRun'], ['Approve', 'ReviseConfirm'], ['Identical', 'ReviseIdentical'], ['Saved', 'RevisionSaved']], notes: ['Task-order changes alone produce a new digest (R067, R118).', 'Configurations do not carry over silently; copying is an explicit choice that creates new r2 configurations.'] } }),
    S('ReviseIdentical', 'Approve · identical to r1', { sizes: ['wide', 'compact'], focus: { wide: [['open', 'Button #open-existing'], ['back', 'Button #back']], compact: [['open', 'Button #open-existing'], ['back', 'Button #back']] }, render: (sz, f) => reviseConfirm(sz, f, { identical: true }), legend: { screen: 'ApproveRevisionScreen', file: 'tui/screens/revise.py', tree: APPROVE_TREE, sel: [...modalSel('#approve-revision', 86), ['#approve:disabled', 'background: $panel; color: $foreground 50%;'], ['#open-existing', 'display: none;'], ['.-identical #open-existing', 'display: block;']], keys: MODAL_KEYS([['o', 'open_existing', 'Open the existing revision (r1)'], ['ctrl+s', 'approve', 'Disabled: nothing to approve']]), states: [['Choose', 'Revise'], ['Run active', 'ReviseActiveRun'], ['Approve', 'ReviseConfirm'], ['Identical', 'ReviseIdentical'], ['Saved', 'RevisionSaved']], notes: ['D6: when the computed SHA-256 equals an existing revision, Approve is disabled with “Identical to r1 — nothing to approve” and #open-existing opens it.', 'Renaming is done on the lineage display name (n on TemplateScreen), which never touches identity.'] } }),
    S('RevisionSaved', 'Revision r2 saved', { sizes: ['wide'], focus: { wide: [['revisions', 'Tree #revisions'], ['tasks', 'DataTable #tasks']] }, render: (sz, f) => template(sz, f, { tab: 0, rev: 'r2', toast: true }), legend: tplLegend([
      'After approval the screen reloads on r2; the tree keeps r1 selectable and unchanged.',
      'app.notify(..., severity="information", timeout=6) confirms with the new short digest.',
      'n Rename (#rename) is enabled here because r2 is custom: it edits the lineage display name through PromptScreen (M15) and never changes identity.',
    ]) }),
  ] },
  { id: 'exchange', title: '5 · Exchange templates', note: 'Export writes the exact revision with its manifest; import validates paths, size, format and the recomputed SHA-256 before anything is added. Mismatches add nothing; identical re-imports change nothing. Package rules belong to M17.', boards: [
    S('ExportTemplate', 'Export template', { sizes: ['wide'], focus: { wide: [['destination', 'Input #export-path'], ['export', 'Button #export-zip']] }, render: (sz, f) => exportTemplate(sz, f), legend: { screen: 'ExportScreen', file: 'tui/screens/exchange.py', tree: EXPORT_TREE, sel: modalSel('#export', 84), keys: MODAL_KEYS([['ctrl+s', 'export', 'Write the ZIP; the path is shown on success']]), states: [['Export', 'ExportTemplate'], ['Import', 'ImportTemplate']], notes: ['Contents mirror the identity manifest plus declared dependencies; installed dependency folders and credentials are never packed (R115).'] } }),
    S('ImportTemplate', 'Import template · choose ZIP', { sizes: ['wide'], focus: { wide: [['files', 'DirectoryTree #zip-browser'], ['path', 'Input #zip-path'], ['import', 'Button #import']] }, render: (sz, f) => importTemplate(sz, f), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: IMPORT_TREE, sel: [...modalSel('#import', 80), ['#zip-browser', 'height: 9; border: solid $foreground 30%; background: $background;'], ['#zip-browser:focus', 'border: solid $primary;']], keys: MODAL_KEYS([['enter', 'validate', 'Validate and import the selected ZIP']]), states: [['Choose', 'ImportTemplate'], ['Validating', 'ImportVerifying'], ['Rejected · digest', 'ImportRejected'], ['Rejected · unsafe', 'ImportUnsafe'], ['Rejected · incomplete', 'ImportIncomplete'], ['Already present', 'ImportDuplicate']], notes: ['DirectoryTree icons are replaced by ▸ ▾ glyphs; result ZIPs are labelled and routed to Results › Import.'] } }),
    S('ImportVerifying', 'Import · validating', { sizes: ['wide'], render: (sz) => importVerifying(sz), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: IMPORT_TREE, sel: [...modalSel('#import', 80), ['#import-progress', 'width: 1fr;  show_eta = False']], keys: [['esc', 'cancel_import', 'Cancel; nothing has been added']], states: [['Choose', 'ImportTemplate'], ['Validating', 'ImportVerifying'], ['Rejected · digest', 'ImportRejected'], ['Rejected · unsafe', 'ImportUnsafe'], ['Rejected · incomplete', 'ImportIncomplete'], ['Already present', 'ImportDuplicate']], notes: ['Steps run in a thread worker and post messages; the list is the loading state of this flow.'] } }),
    S('ImportRejected', 'Import · SHA-256 mismatch', { sizes: ['wide', 'compact'], focus: { wide: [['close', 'Button #close'], ['digests', 'Button #show-digests']], compact: [['close', 'Button #close'], ['digests', 'Button #show-digests']] }, render: (sz, f) => importRejected(sz, f), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: IMPORT_TREE, sel: modalSel('#import', 86), keys: MODAL_KEYS([]), states: [['Choose', 'ImportTemplate'], ['Validating', 'ImportVerifying'], ['Rejected · digest', 'ImportRejected'], ['Rejected · unsafe', 'ImportUnsafe'], ['Rejected · incomplete', 'ImportIncomplete'], ['Already present', 'ImportDuplicate']], notes: ['W7: #import-rejected holds ContentSwitcher #rejection-detail (#unsafe-detail, #incomplete-detail, #digest-detail, #other-detail), shared with M17; this frame shows #digest-detail.', 'Shows expected and received identities in full; nothing is partially added (R118, R141).', 'On 80 columns the labels stack above each 64-character digest so nothing is truncated.'] } }),
    S('ImportDuplicate', 'Import · already in the library', { sizes: ['wide'], render: (sz) => importDuplicate(sz), legend: { screen: 'ImportScreen', file: 'tui/screens/exchange.py', tree: IMPORT_TREE, sel: modalSel('#import', 72), keys: [['esc', 'dismiss', 'Close'], ['o', 'open', 'Open the existing template']], states: [['Choose', 'ImportTemplate'], ['Validating', 'ImportVerifying'], ['Rejected · digest', 'ImportRejected'], ['Rejected · unsafe', 'ImportUnsafe'], ['Rejected · incomplete', 'ImportIncomplete'], ['Already present', 'ImportDuplicate']], notes: ['Re-importing identical content is idempotent: no new row, no new revision.'] } }),
  ] },
  { id: 'launch', title: '6 · Launch identity check', note: 'Right before execution the app recomputes the template SHA-256, freezes the run configuration and original weights separately, and binds results to that identity. Changed inputs block the launch instead of relabelling it.', boards: [
    S('LaunchCheck', 'Before launch · freezing', { sizes: ['wide'], render: (sz) => launchCheck(sz), legend: { screen: 'LaunchCheckScreen', file: 'tui/screens/launch_check.py', tree: LAUNCH_TREE, sel: [...modalSel('#launch-check', 86), ['#launch-progress', 'width: 1fr;  show_eta = False'], ['Button:disabled', 'background: $panel; color: $foreground 50%;']], keys: [['esc', 'dismiss(None)', 'Cancel before launch']], states: [['Freezing', 'LaunchCheck'], ['Blocked', 'LaunchMismatch']], notes: ['Opened by Setup (M07) on Launch; the prototype opens it from Configure run.', 'Template, configuration and original weights are frozen separately (R037, R067).'] } }),
    S('LaunchMismatch', 'Launch blocked · inputs changed', { sizes: ['wide', 'compact'], focus: { wide: [['save', 'Button #save-revision'], ['restore', 'Button #restore'], ['cancel', 'Button #cancel']], compact: [['save', 'Button #save-revision'], ['restore', 'Button #restore'], ['cancel', 'Button #cancel']] }, render: (sz, f) => launchMismatch(sz, f), legend: { screen: 'LaunchCheckScreen', file: 'tui/screens/launch_check.py', tree: LAUNCH_TREE, sel: modalSel('#launch-check', 86), keys: MODAL_KEYS([]), states: [['Freezing', 'LaunchCheck'], ['Blocked', 'LaunchMismatch']], notes: ['A run never claims r1 when its inputs differ, and is never silently relabelled (R067).', 'Restore copies the frozen r1 files back; Save as new revision opens the revise flow with the edit.'] } }),
  ] },
];

export const SYSTEM = [
  { name: 'DesignSystem', title: 'TUI design system', special: 'system' },
  { name: 'NavMap', title: 'Navigation map', special: 'navmap' },
];
