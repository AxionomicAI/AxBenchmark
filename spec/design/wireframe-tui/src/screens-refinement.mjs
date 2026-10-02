// F17 deletion states share the M15 ConfirmScreen shell; M01 owns the action/DTO mapping.
import { Grid, fit, header, footer, modal, para, buttons, kv } from './lib.mjs';
import { library, SHA } from './screens.mjs';

export const DELETE_STATES = ['Confirm', 'Builtin', 'ActiveRun', 'HasResults', 'Changed', 'Pending'];
const refusal = {
  Builtin: ['Built-in revision is read only', 'Built-in revisions cannot be deleted. Duplicate it to create a custom revision.'],
  ActiveRun: ['Revision is used by an active run', '2026-10-01-a · UID run_mbp_20261001a · origin mike-mbp-m4. Stop and finish retaining the run before retrying.'],
  HasResults: ['Revision has 2 retained results', 'This revision is needed to inspect its retained results. Deletion is unavailable.'],
  Changed: ['Deletion details changed', 'The saved-configuration count changed from 1 to 2. Review the refreshed details and confirm again. Nothing was deleted.'],
  Pending: ['Publication is pending', 'This revision is reserved by an unfinished publication. Wait for recovery, then refresh. Nothing was deleted.'],
};
export function revisionDelete(sz, focus = 'cancel', state = 'Confirm') {
  const g = library(sz, 'none', { sel: 'custom' }), compact = sz.id === 'compact';
  const m = modal(g, compact ? 78 : 86, compact ? 21 : 28, 'Delete selected revision', { sel: '#confirm' });
  const isBuiltin = state === 'Builtin', blocked = !['Confirm', 'Changed'].includes(state);
  let y = m.y;
  g.text(m.x, y++, fit(isBuiltin ? 'Inventory web app · r1 · built-in' : 'Billing service refactor · r1 · custom', m.w), 'bd');
  g.text(m.x, y++, 'SHA-256', 'mu');
  g.text(m.x, y++, isBuiltin ? SHA.inv1 : SHA.billing);
  if (!SHA.billing) throw new Error('Missing custom deletion SHA fixture');
  y++;
  if (state !== 'Confirm') {
    y = para(g, m.x, y, m.w, refusal[state][0], 'bd');
    y = para(g, m.x, y, m.w, refusal[state][1], 'mu') + 1;
  }
  if (!blocked) {
    y = para(g, m.x, y, m.w, 'Deletes this revision and its 2 saved configurations. The template leaves the library. Results: none. This cannot be undone.', 'bd');
    y++;
    if (!compact) para(g, m.x, y, m.w, 'Only this selected revision is affected. Cancel returns to the same Library row.', 'mu');
  }
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Library', focus: focus === 'cancel' }, { label: state === 'Changed' ? 'Confirm new details' : 'Delete revision', v: 'error', off: blocked, focus: focus === 'delete', go: blocked ? undefined : 'Library' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Library' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Delete', off: blocked, go: blocked ? undefined : 'Library' }], '');
  return g;
}
