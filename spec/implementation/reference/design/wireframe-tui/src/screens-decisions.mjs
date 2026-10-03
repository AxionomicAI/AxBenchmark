// M07.3 · Decision engines (DECISION-ENGINES.md, M12.4 profiles). DecisionEnginesScreen lists shared System One
// profiles, shows the selected profile's evidence and lets the user choose a profile for each role separately:
// context monitoring and grading. The editor saves a new immutable version; the test dialog binds an observation to
// that exact version. Widget states come from the engine (no_engine, configured_not_ready, ready_text_only,
// ready_vision, local_model_missing, auth_unsupported); the screen never decides readiness itself.
import { Grid, fit, len, header, footer, table, button, buttons, input, radios, para, kv, notice, modal, select, progress } from './lib.mjs';
import { step } from './screens.mjs';

export const PROFILES = [
  { id: 'typesafe-context', v: 3, dialect: 'TypeSafe', dest: 'api.typesafe.ai · remote', model: 'ts-choice-1.2-2026-08', inputs: 'text only', state: '✓ ready · text only', f: '', rows: [
    ['Profile', 'typesafe-context · v3 · sha256 7e1c0a94…3b2f'],
    ['Protocol', 'systemone/1 · POST https://api.typesafe.ai/v1/systemone'],
    ['Auth', 'bearer · keychain ref typesafe/api-key · never shown'],
    ['Model', 'ts-choice-1.2-2026-08 requested = resolved · pinned'],
    ['Locality', 'remote · declared · shown before any submission'],
    ['Questions', 'Choice ✓ up to 255 options · Score ✓ · Noul ✓'],
    ['Images', '✗ text only (Jev) · cannot inspect web screenshots', 'bd'],
    ['Confidence', 'native distribution + confidence · sum tolerance 1e-6'],
    ['Limits', '32 KiB state · 60 s timeout · 3 retries before dispatch'],
    ['Resources', 'remote · may run live within its frozen budget'],
    ['Tested', 'metadata 2026-10-02 09:14 · ✓ bound to the v3 digest'],
    ['Versions', 'v1 and v2 stay readable · runs that froze them keep them'],
  ] },
  { id: 'ollama-clef', v: 2, dialect: 'Ollama', dest: '127.0.0.1:11434 · local', model: 'clef:12b-q8_0', inputs: 'text + images', state: '✓ ready · vision', f: '', rows: [
    ['Profile', 'ollama-clef · v2 · sha256 9a2f61c0…d117'],
    ['Protocol', 'systemone/1 · POST http://127.0.0.1:11434/v1/systemone'],
    ['Server', 'Ollama 0.35.2 · keep_alive 5m · model resident now'],
    ['Auth', 'none (local default) · a TypeSafe key is never sent here'],
    ['Model', 'clef:12b-q8_0 · digest 4b9e…d01 · Q8_0 · context 8,192'],
    ['', 'a response model name is an echo, not proof of weights'],
    ['Locality', 'local · routing verified 10-02 · not a privacy claim'],
    ['Questions', 'Choice ✓ 2–26 options · Score ✓ · Noul ✓'],
    ['Images', '✓ PNG, JPEG, WebP · vision weights present'],
    ['Confidence', 'native distribution + confidence · sum tolerance 1e-3'],
    ['Limits', '64 KiB text · 32 MiB with images · never truncated'],
    ['Resources', '● deferred until no competitor is measured, in any run'],
    ['Tested', 'metadata 09:20 · digest matches the frozen binding'],
  ] },
  { id: 'ollama-clef-flash', v: 1, dialect: 'Ollama', dest: '127.0.0.1:11434 · local', model: 'clef-flash:4b-q4_K_M', inputs: '?', state: '✗ local model missing', f: 'bd', rows: [
    ['Profile', 'ollama-clef-flash · v1 · sha256 c03d5e72…8a40'],
    ['Protocol', 'systemone/1 · http://127.0.0.1:11434 · Ollama 0.35.2 ✓'],
    ['Model', '✗ clef-flash:4b-q4_K_M is not in /api/tags', 'bd'],
    ['', 'nothing is downloaded, started or stopped automatically'],
    ['Remedy', 'ollama pull clef-flash:4b-q4_K_M yourself, then r'],
    ['Images', '? unknown until the model is present'],
    ['Roles', 'cannot be chosen until a test passes'],
    ['Tested', 'metadata 09:21 · local_model_missing'],
  ] },
  { id: 'typesafe-lab', v: 1, dialect: 'TypeSafe', dest: 'api.typesafe.ai · remote', model: 'ts-choice-1.1-2026-07', inputs: '?', state: '✗ auth unsupported', f: 'bd', rows: [
    ['Profile', 'typesafe-lab · v1 · sha256 51be09d3…e6c2'],
    ['Auth', '✗ none · api.typesafe.ai answered 401', 'bd'],
    ['', 'TypeSafe needs a bearer credential reference'],
    ['Remedy', 'e Edit → choose a keychain reference → save v2 → t Test'],
    ['Roles', 'cannot be chosen until a test passes'],
    ['Tested', 'metadata 09:22 · auth_unsupported'],
  ] },
  { id: 'lab-ollama', v: 1, dialect: 'Ollama', dest: '10.0.4.12:11434 · unknown', model: 'clef:12b-q8_0', inputs: '?', state: '? not ready · untested', f: 'it', rows: [
    ['Profile', 'lab-ollama · v1 · sha256 e8f40b19…0c55'],
    ['Locality', '? unknown · a LAN address does not prove local inference', 'bd'],
    ['Tested', '? never · saved 2026-09-30, no observation since'],
    ['Scheduling', 'treated as local until routing is verified (conservative)'],
    ['Remedy', 't Test runs a metadata check · no inference, no download'],
  ] },
];

const ROLES = {
  configured: [
    ['Context monitoring', 'bd'], ['● typesafe-context v3 · text · ✓ ready', ''], ['accept ≥ 0.80 confidence · 1,000 calls', 'mu'],
    ['for config Four harnesses · defaults', 'mu'], [null, 'Choose for context…'],
    ['Grading', 'bd'], ['● harness review · Claude Code opus-5-5 high', ''], ['○ decision rubric · web v1 needs vision', 'mu'],
    ['   ollama-clef ✓ · typesafe-context ✗ text', 'mu'], [null, 'Choose for grading…'],
  ],
  empty: [
    ['Context monitoring', 'bd'], ['○ off · no decision engine configured', 'bd'], ['native capture and counts continue', 'mu'],
    ['labels stay native; ambiguous = unclassified', 'mu'], [null, 'Choose for context…', true],
    ['Grading', 'bd'], ['● harness review (default) · unchanged', ''], ['○ decision rubric · ✗ no_engine', 'mu'],
    ['   needs a ready profile with vision for web', 'mu'], [null, 'Choose for grading…', true],
  ],
};

function chrome(g, sz) {
  const compact = sz.id === 'compact';
  header(g, 'AxBenchmark', 'Decision engines');
  g.fill(0, 1, g.w, 1, 'B1');
  g.text(1, 1, fit(compact ? '◆ Shared System One profiles · roles chosen separately · no model is called here' : '◆ Shared System One profiles for context monitoring and grading · roles are chosen separately · listing calls no model', g.w - 2), 'mu');
  g.region(0, 1, g.w, 1, 'Static', '#engines-bar');
}

// st: { sel: index into PROFILES, empty: true for no_engine }
export function decisionEngines(sz, focus = 'profiles', st = {}) {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h, compact = sz.id === 'compact';
  chrome(g, sz);
  const empty = !!st.empty, sel = st.sel ?? 0, P = PROFILES[sel];
  const pf = focus === 'profiles';
  if (compact) {
    g.box(0, 2, W, 8, { f: pf ? 'ac' : 'ln', title: `Profiles · ${PROFILES.length}`, sub: 'n new · e edit · t test' });
    table(g, 1, 3, W - 2, [{ l: 'Profile', w: 21 }, { l: 'Dialect', w: 10 }, { l: 'Inputs', w: 15 }, { l: 'State', w: W - 48 }],
      PROFILES.map((p) => ({ v: [`${p.id} v${p.v}`, p.dialect, p.inputs, { t: p.state, f: p.f }] })), { cursor: sel, focused: pf });
    g.region(1, 3, W - 2, 6, 'DataTable', '#profiles');
    kv(g, 1, 10, 11, W - 2, [P.rows[1], P.rows[3], P.rows[6]].map(([k, v, f]) => [k, v, f]));
    g.hline(1, 14, W - 2);
    kv(g, 1, 15, 11, W - 2, [['Context', '● typesafe-context v3 · ≥ 0.80 · ✓ ready'], ['Grading', '● harness review · decision rubric needs vision']]);
    para(g, 1, 18, W - 2, 'Roles are chosen separately; choosing one never enables the other.', 'mu');
    footer(g, [{ k: 'esc', d: 'Back', go: 'Setup' }, { k: 'n', d: 'New', go: 'DecisionEngineEdit' }, { k: 't', d: 'Test', go: 'DecisionEngineTest' }, { k: 'enter', d: 'Choose role' }]);
    return g;
  }

  g.box(0, 2, W, 9, { f: pf ? 'ac' : 'ln', title: empty ? 'Profiles · none' : `Profiles · ${PROFILES.length}`, sub: 'n new · e edit = new version · t test · r recheck' });
  g.region(0, 2, W, 9, 'DataTable', '#profiles');
  if (empty) {
    const c = (y, t, f = '') => g.text(Math.floor((W - len(t)) / 2), y, t, f);
    c(4, 'No decision engine configured', 'bd');
    c(5, 'Context classification and decision grading stay off. Native capture, harness grading and rankings work without one.', 'mu');
    const bx = buttons(g, Math.floor(W / 2) + 32, 8, [{ label: 'New TypeSafe profile · remote', go: 'DecisionEngineEdit', focus: pf }, { label: 'New Ollama profile · local', go: 'DecisionEngineEdit' }]);
    g.region(bx, 8, 64, 1, 'Horizontal', '#presets');
  } else {
    table(g, 1, 3, W - 2, [{ l: 'Profile', w: 21 }, { l: 'Dialect · destination', w: 36 }, { l: 'Model', w: 23 }, { l: 'Inputs', w: 14 }, { l: 'State', w: W - 96 }],
      PROFILES.map((p) => ({ v: [`${p.id} v${p.v}`, `${p.dialect} · ${p.dest}`, p.model, p.inputs, { t: p.state, f: p.f }] })), { cursor: sel, focused: pf });
  }

  const df = focus === 'detail';
  g.box(0, 11, 72, 22, { f: df ? 'ac' : 'ln', title: empty ? 'Presets · one System One adapter, two dialects' : `${P.id} · v${P.v}`, sub: empty ? '' : 'evidence for this exact version' });
  g.region(0, 11, 72, 22, 'VerticalScroll', '#profile-detail.pane');
  if (empty) {
    let y = kv(g, 2, 12, 11, 68, [
      ['TypeSafe', 'remote api.typesafe.ai · bearer credential by reference'],
      ['', 'a pinned model version; moving aliases are refused'],
      ['Ollama', 'a local server you run · no auth by default'],
      ['', 'model bound to its digest; nothing is downloaded for you'],
      ['Both', 'POST {endpoint}/v1/systemone · Choice, Score, Noul'],
      ['', 'capabilities are tested, never assumed from a name or URL'],
    ]);
    para(g, 2, y + 1, 68, 'Generic chat endpoints (OpenAI-compatible, LM Studio chat) are not System One and are not offered. A profile is only configuration: saving or listing it calls no model.', 'mu');
  } else {
    kv(g, 2, 12, 12, 68, P.rows);
  }

  const rf = focus === 'roles';
  g.box(72, 11, 48, 22, { f: rf ? 'ac' : 'ln', title: 'Roles · chosen separately' });
  g.region(72, 11, 48, 22, 'Vertical', '#roles.pane');
  let y = 12;
  for (const [t, f, off] of ROLES[empty ? 'empty' : 'configured']) {
    if (t == null) { button(g, 74, y, f, { off, go: off ? undefined : 'Setup', focus: rf && f.includes('context') && !off }); y += 2; continue; }
    g.text(74, y++, fit(t, 44), f);
  }
  para(g, 74, 30, 44, 'Choosing one role never enables the other.', 'mu');

  para(g, 1, 34, W - 2, empty
    ? 'Start from a preset. Saving creates version 1; t then tests metadata and connectivity without inference before any role can use it.'
    : 'Editing never changes a version in place: Save creates the next version and earlier ones stay readable. Tests bind an observation to one exact version; recheck refreshes observations without touching another role.', 'mu');
  buttons(g, W - 1, H - 2, empty
    ? [{ label: 'Back to setup', go: 'SetupNoEngine' }]
    : [{ label: 'New…', go: 'DecisionEngineEdit' }, { label: 'Edit · new version…', go: 'DecisionEngineEdit' }, { label: 'Test…', go: 'DecisionEngineTest', focus: focus === 'test' }, { label: 'Back to setup', go: 'Setup' }]);
  footer(g, [{ k: 'esc', d: 'Back', go: 'Setup' }, { k: 'n', d: 'New', go: 'DecisionEngineEdit' }, { k: 'e', d: 'Edit', go: 'DecisionEngineEdit', off: empty }, { k: 't', d: 'Test', go: 'DecisionEngineTest', off: empty }, { k: 'r', d: 'Recheck', off: empty }, { k: 'enter', d: 'Choose for a role', off: empty }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- profile editor (saves a new version)

export function decisionEngineEdit(sz, focus = 'endpoint') {
  const g = decisionEngines(sz, 'none', { sel: 1 });
  const m = modal(g, 104, 25, 'Edit profile · ollama-clef · Save creates v3', { sel: '#profile-editor' });
  let y = m.y;
  const L = 14, fw = 40;
  const row = (label, w, value, key, note, o = {}) => {
    g.text(m.x, y, fit(label, L), 'mu');
    if (o.select) select(g, m.x + L, y, w, value, { focus: focus === key });
    else input(g, m.x + L, y, w, value, { focus: focus === key });
    g.region(m.x + L, y, w, 1, o.select ? 'Select' : 'Input', `#${key}`);
    if (note) g.text(m.x + L + w + 2, y, fit(note, m.w - L - w - 2), 'mu');
    y++;
  };
  g.text(m.x, y, fit('Preset', L), 'mu'); radios(g, m.x + L, y, ['TypeSafe · remote', 'Ollama · local'], 1, { focus: focus === 'preset' }); g.region(m.x + L, y, 40, 1, 'RadioSet', '#preset'); y += 2;
  row('Name', fw, 'ollama-clef', 'name', 'id stays; the version increments');
  row('Endpoint', fw, 'http://127.0.0.1:11434', 'endpoint', '/v1/systemone is joined once · no /v1 here');
  row('Auth', 24, 'none (local default)', 'auth', 'credentials by reference only', { select: true });
  row('Model', fw, 'clef:12b-q8_0', 'model', 'from /api/tags 09:20', { select: true });
  g.text(m.x + L, y++, fit('digest sha256:4b9e…d01 · Q8_0 · 12.2B · vision weights present · bound at save', m.w - L), 'mu');
  y++;
  row('Keep alive', 10, '5m', 'keepalive', 'residency is recorded with every call');
  row('Timeout', 10, '60 s', 'timeout', 'per call · retries only before dispatch: 3');
  row('Run budget', 24, '1,000 calls · 8 MiB', 'budget', 'per run · frozen at launch');
  y++;
  g.text(m.x, y, fit('Resources', L), 'mu');
  g.text(m.x + L, y++, '● Deferred until no competitor is measured, in any run (default)', focus === 'resources' ? 'bd' : '', focus === 'resources' ? { b: 'BT' } : {});
  g.text(m.x + L, y++, '○ Live overlap · runs beside competitors; their measurements are marked', 'mu');
  g.text(m.x + L, y++, '  contaminated and filterable in reports', 'mu');
  g.region(m.x + L, y - 3, 70, 3, 'RadioSet', '#resource-policy');
  y++;
  para(g, m.x, y, m.w, 'There are no effort or generation controls: System One has none. Saving creates v3 with its own digest; v2 stays readable and every run that froze v2 keeps it. Capabilities are only recorded by a test, never assumed from the model name or URL.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'DecisionEngines' }, { label: 'Save v3 and test…', v: 'primary', go: 'DecisionEngineTest', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'DecisionEngines' }, { k: 'tab', d: 'Next field', do: 'next' }, { k: '^s', d: 'Save v3', go: 'DecisionEngineTest' }], '');
  return g;
}

// ---------------------------------------------------------------- test dialog (metadata or explicit smoke check)

const TEST_STEPS = [
  ['Reachable · Ollama 0.35.2 · 11 ms', 'http://127.0.0.1:11434'],
  ['systemone/1 present · POST /v1/systemone', ''],
  ['clef:12b-q8_0 listed · digest 4b9e…d01 matches v3', ''],
  ['Images supported · PNG, JPEG, WebP · vision weights', ''],
  ['Choice 2–26 · Score · Noul · native confidence', ''],
  ['Observation bound to v3 sha256 3c88e1f0…', ''],
];

// st.done: steps finished (0–6); st.pct: progress of the current step
export function decisionEngineTest(sz, focus = 'mode', st = {}) {
  const g = decisionEngines(sz, 'none', { sel: 1 });
  const done = st.done ?? 3, pct = st.pct ?? 60, finished = done >= TEST_STEPS.length;
  const m = modal(g, 92, 20, finished ? 'Test ollama-clef v3 · ✓ ready · vision' : 'Test ollama-clef v3 · metadata and connectivity', { sel: '#profile-test' });
  let y = m.y;
  g.text(m.x, y, fit('Mode', 8), 'mu');
  g.text(m.x + 8, y++, '● Metadata and connectivity · no inference, nothing billed', focus === 'mode' ? 'bd' : '', focus === 'mode' ? { b: 'BT' } : {});
  g.text(m.x + 8, y++, '○ Inference smoke check · 1 call · budget 1 · cancellable', 'mu');
  g.region(m.x + 8, y - 2, 70, 2, 'RadioSet', '#test-mode');
  y++;
  TEST_STEPS.forEach(([t], i) => {
    step(g, m.x, y++, m.w, i < done ? 'done' : i === done ? 'now' : 'todo', t);
    if (i === done && !finished) progress(g, m.x + 2, y++, m.w - 2, pct);
  });
  y++;
  y = para(g, m.x, y, m.w, finished
    ? 'ready_vision: this version can be chosen for context monitoring and for web grading. The observation belongs to v3 only; v2 keeps its own.'
    : 'A metadata test never loads weights, downloads a model or starts a server. Cancelling stops the check; no role changes until it finishes.', 'mu');
  buttons(g, m.right, m.bottom, finished
    ? [{ label: 'Close', go: 'DecisionEnginesLocal', v: 'primary', focus: true }]
    : [{ label: 'Cancel test', focus: focus === 'cancel' }]);
  footer(g, [{ k: 'esc', d: finished ? 'Close' : 'Cancel test', go: 'DecisionEngines' }], '');
  return g;
}
