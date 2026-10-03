import { revisionDelete, DELETE_STATES } from './screens-refinement.mjs';
import { taskChecks } from './screens-verify.mjs';

const deleteRelated = DELETE_STATES.map(s => [s, `RevisionDelete${s}`]);
const deletion = DELETE_STATES.map(state => ({
  name: `RevisionDelete${state}`, title: `Revision deletion · ${state.toLowerCase()}`,
  sizes: ['wide', 'compact'],
  focus: { wide: [['cancel', 'Button #cancel'], ...(['Confirm', 'Changed'].includes(state) ? [['delete', 'Button #ok']] : [])], compact: [['cancel', 'Button #cancel'], ...(['Confirm', 'Changed'].includes(state) ? [['delete', 'Button #ok']] : [])] },
  render: (sz, f) => revisionDelete(sz, f, state),
  legend: { screen: 'ConfirmScreen', file: 'tui/screens/library.py (M01 caller); tui/screens/confirm.py (M15 shared shell)',
    tree: 'ConfirmScreen\n├─ Static #confirm-title\n├─ Static #confirm-message\n├─ Static #confirm-lines\n└─ Button #cancel · Button #ok',
    sel: [['#confirm', 'width: 86; max-width: 100% - 2;'], ['#cancel', 'initial focus'], ['#ok:disabled', 'engine ActionState reason also disables Delete/palette']],
    keys: [['escape', 'cancel', 'No mutation; restore selected Library row'], ['ctrl+s', 'delete_revision', 'Current confirmed plan only; disabled refusals send nothing']],
    states: [['Library', 'Library'], ['Draft action', 'DraftDiscard'], ...deleteRelated],
    notes: ['M01.4 owns the revision action; M15 owns ConfirmScreen. templates.get supplies effect, delete_plan_id and ActionState. Confirm calls templates.delete(sha256, delete_plan_id) once.', 'Builtin, active-run, results and publication-pending refusals never enable Delete or a palette mutation. Changed refreshes the effect/token and requires a fresh confirmation.', 'The preview link returns to Library; actual persistence, cancellation call counts, cleanup_pending and race behavior are contract-only future M01.4/M15.3 tests.'] },
}));
const fixtures = [
  ['CheckMissingCommit', 'Missing T4 commit · failed requirement', 'T4_commit', 'missing_commit'],
  ['CheckHistoryUnavailable', 'T4 history unavailable · unverified', 'T4_commit', 'unavailable_history'],
  ['CheckT2WithoutUI', 'T2 data without management UI · passed', 'T2_samples', 'data_only'],
  ['CheckMissingBrowser', 'T5 persistence · browser missing', 'T5_persistence', 'missing_browser'],
].map(([name, title, check, fixture]) => ({ name, title, sizes: ['wide'], focus: { wide: [['checks', 'DataTable #task-checks'], ['detail', 'VerticalScroll #check-detail']] }, render: (sz, f) => taskChecks(sz, f, {check, fixture}), legend: {
  screen: 'TaskChecksScreen', file: 'tui/screens/verification.py', tree: 'TaskChecksScreen\n├─ Static #result-bar\n├─ DataTable #task-checks\n└─ VerticalScroll #check-detail', sel: [['#task-checks', 'height: auto;'], ['#check-detail', 'height: 1fr;']], keys: [['escape', 'back', 'Return without running verification']], states: [['At task', 'TaskChecks'], ['Final', 'FinalRegression'], ['Coverage', 'InventoryChecks']], notes: ['M08.3 owns the evidence screen; M09 supplies the exact observation rules and these F11 acceptance fixtures.', 'Each fixture is an independent scenario, not an additional outcome in the shared Pi 27/30 fixture. TrialRef/result/phase scope remains explicit.', 'Missing commit is failed only with readable non-advancing history. Unavailable history is unverified. Supported T2 data observations pass without T3 UI. Missing-browser target is T5_persistence.']
} }));
export const REFINEMENT_GROUPS = [
  { id: 'revision-deletion', page: 'wide', title: 'M01 · Revision deletion', note: 'Contextual Delete differs from draft discard. Engine-supplied effects, refusal reasons and changed-plan confirmation preserve the selected revision.', boards: deletion },
  { id: 'm08-observation-fixtures', page: 'm08', title: 'M08 · M09 · Observation boundaries', note: 'Independent fixtures distinguish observed requirement failure from unavailable evidence and avoid requiring future-task UI.', boards: fixtures },
];
