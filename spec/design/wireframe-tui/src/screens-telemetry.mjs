// M18 · Optional CPU and GPU monitoring.
// Monitoring settings (Setup), collector guidance (Environment), the telemetry of one experiment, how its energy was
// derived, and energy per execution window in a sequential run. Telemetry is from lab-linux-4090 (imported results
// of run 2026-09-24-lab, 3 configurations at once). All data is fictional.
import { Grid, fit, len, header, footer, table, buttons, para, kv, notice, modal, radios, input } from './lib.mjs';
import { environment } from './screens-readiness.mjs';
import { setup } from './screens-setup.mjs';
import { byId, dur } from './results-data.mjs';

const BARS = '▁▂▃▄▅▆▇█';
// Deterministic series in 0..1, one value per column.
const series = (n, f) => Array.from({ length: n }, (_, i) => Math.max(0, Math.min(1, f(i / (n - 1), i))));
const spark = (g, x, y, vals, fl = 'ac', gaps = []) => vals.forEach((v, i) => g.text(x + i, y, gaps.includes(i) ? '·' : BARS[Math.round(v * 7)], gaps.includes(i) ? 'mu' : fl));

const LAB = ['R-0924lab-1', 'R-0924lab-3', 'R-0924lab-2'].map((id) => byId[id]);
const WINDOW = 2465; // seconds of telemetry: launch to the last verification

// ---------------------------------------------------------------- monitoring settings (Setup)

export function monitoringSettings(sz, focus = 'mode') {
  const g = setup(sz, 'none');
  const m = modal(g, 86, 27, 'Hardware monitoring · optional', { sel: '#monitoring' });
  let y = m.y;
  radios(g, m.x, y++, ['Automatic · detect what this machine can measure', 'Off'], 0, { focus: focus === 'mode' });
  g.region(m.x, y - 1, m.w, 1, 'RadioSet', '#monitoring-mode');
  g.text(m.x, y, 'Interval', 'mu'); input(g, m.x + 12, y, 8, '0.5', { focus: focus === 'interval' }); g.text(m.x + 21, y++, fit('s · requested · 0.5–10 s, default 1 s · frozen at launch', m.w - 21), 'mu');
  g.region(m.x + 12, y - 1, 8, 1, 'Input', '#sampling-interval');
  g.text(m.x + 12, y++, fit('One host collection per experiment · not part of the template identity', m.w - 12), 'mu');
  y++;
  g.text(m.x, y++, 'Detected on mike-mbp-m4 · macOS 26.0 · Apple M4 Pro', 'bd');
  table(g, m.x, y, m.w, [{ l: 'Metric', w: 18 }, { l: 'Source', w: 13 }, { l: 'Scope', w: 20 }, { l: 'Interval', w: 15 }, { l: 'Status', w: m.w - 66 }], [
    { v: ['CPU utilization', 'psutil 6.1', 'host + processes', '0.5 s', '✓ on'] },
    { v: ['Memory', 'psutil 6.1', 'process trees (RSS)', '0.5 s', '✓ on'] },
    { v: ['GPU utilization', 'IOReport', 'whole GPU', { t: '1 s · minimum', f: 'bd' }, '✓ on'] },
    { v: ['CPU and GPU power', 'powermetrics', 'SoC domains', '—', { t: '▲ no access', f: 'bd' }] },
    { v: ['SoC temperature', '—', '—', '—', { t: '✗ unsupported', f: 'bd' }] },
  ], { cursor: focus === 'table' ? 2 : -1, focused: focus === 'table' });
  g.region(m.x, y, m.w, 6, 'DataTable', '#detected');
  y += 7;
  y = para(g, m.x, y, m.w, 'IOReport cannot sample faster than 1 s, so it uses its own minimum. Each collector’s actual interval is recorded and shown with its data, never presented as the 0.5 s requested.', 'mu');
  y++;
  y = kv(g, m.x, y, 12, m.w, [
    ['Energy', 'unavailable here · power is needed to derive it'],
    ['Never', 'blocks a run, installs a tool or changes permissions'],
    ['Results', 'every missing metric is stored with its cause'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Turning monitoring off records “monitoring off” in results instead of empty values. A value outside 0.5–10 s is rejected.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Guidance…', go: 'CollectorGuide' }, { label: 'Cancel', go: 'Setup' }, { label: 'Save', v: 'primary', go: 'Setup', focus: focus === 'save' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Setup' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Save', go: 'Setup' }], '');
  return g;
}

// ---------------------------------------------------------------- collector guidance (Environment, Linux)

export function collectorGuide(sz, focus = 'recheck') {
  const g = environment(sz, 'none', { linux: true });
  const m = modal(g, 86, 26, 'CPU package power · insufficient permission', { sel: '#collector-guide' });
  let y = m.y;
  y = kv(g, m.x, y, 12, m.w, [
    ['Host', 'lab-linux-02 · Ubuntu 24.04 · Intel Core i7-13700'],
    ['Source', 'powercap / RAPL · intel-rapl:0 (package)'],
    ['Found', '/sys/class/powercap/intel-rapl:0/energy_uj · mode 0400 root'],
    ['Cause', 'insufficient permission · the counter exists and works'],
  ]);
  g.region(m.x, m.y, m.w, 4, 'Static', '#collector-cause.kv');
  y++;
  g.text(m.x, y++, 'Guidance · verified for Ubuntu 24.04 · you run it, AxBenchmark does not', 'bd');
  g.box(m.x, y, m.w, 6, { fill: 'B0', f: 'ln' });
  ['# allow your user to read the package energy counter until reboot', 'sudo chmod o+r /sys/class/powercap/intel-rapl:0/energy_uj', '# to keep it after reboot, see the udev rule in the guide below'].forEach((l, i) => g.text(m.x + 2, y + 1 + i, fit(l, m.w - 4), l.startsWith('#') ? 'mu' : '', { b: 'B0' }));
  g.region(m.x, y, m.w, 6, 'TextArea', '#guide-commands  read_only=True');
  y += 7;
  y = kv(g, m.x, y, 14, m.w, [
    ['Guide', 'docs/collectors/linux-rapl.md'],
    ['Reference', 'kernel.org · powercap framework documentation'],
    ['Other distros', 'see the guide · no package command is assumed'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Running without it is fine: CPU package power and energy stay “unavailable · insufficient permission” in results. Recheck after changing the permission.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Copy commands', focus: focus === 'copy' }, { label: 'Open guide' }, { label: 'Recheck', v: 'primary', go: 'EnvironmentCollectors', focus: focus === 'recheck' }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'EnvironmentCollectors' }, { k: 'c', d: 'Copy' }, { k: 'f5', d: 'Recheck', go: 'EnvironmentCollectors' }], '');
  return g;
}

// ---------------------------------------------------------------- TelemetryScreen

export function telemetry(sz, focus = 'charts') {
  const g = new Grid(sz.cols, sz.rows), W = g.w, H = g.h;
  header(g, 'AxBenchmark', 'Run 2026-09-24-lab · hardware telemetry');
  g.fill(0, 1, W, 1, 'B1');
  g.text(1, 1, fit(`↓ Imported · lab-linux-4090 · Ubuntu 24.04 · Ryzen 9 7950X · RTX 4090 · 3 at once · 1 s requested · ${dur(WINDOW)}`, W - 2));
  g.region(0, 1, W, 1, 'Static', '#telemetry-bar');

  const cf = focus === 'charts';
  g.box(0, 2, W, 13, { f: cf ? 'ac' : 'ln', title: 'Host · one collection for the whole experiment · source · actual interval', sub: '· gap in samples' });
  g.region(0, 2, W, 13, 'Static', '#charts');
  const CW = W - 46, gaps = [57, 58];
  const rows = [
    ['CPU utilization', 'psutil · 1 s', series(CW, (t) => 0.35 + 0.25 * Math.sin(t * 19) ** 2 + (t > 0.86 ? -0.25 : 0)), '38% avg · 96% peak'],
    ['GPU utilization', 'NVML · 1 s', series(CW, (t, i) => (t < 0.7 ? 0.55 + 0.4 * Math.abs(Math.sin(i * 0.7)) : 0.05)), '61% avg · model server'],
    ['CPU package', 'RAPL · 1 s', series(CW, (t) => 0.3 + 0.3 * Math.sin(t * 19) ** 2), '56 W avg · counter'],
    ['GPU board', 'NVML · 1 s', series(CW, (t, i) => (t < 0.7 ? 0.5 + 0.45 * Math.abs(Math.sin(i * 0.7)) : 0.08)), '164 W avg · sampled'],
    ['CPU temperature', 'k10temp · 2 s', series(CW, (t) => 0.35 + 0.3 * Math.sin(t * 19) ** 2), '78 °C peak · 2 s minimum'],
  ];
  rows.forEach(([l, s, v, sum], i) => {
    const y = 3 + i * 2;
    g.text(2, y, fit(l, 16), 'bd'); g.text(2, y + 1, fit(s, 16), 'mu');
    spark(g, 19, y, v, 'ac', i === 1 || i === 3 ? gaps : []);
    g.text(19 + CW + 2, y, fit(sum, W - CW - 23), 'mu');
  });
  const px = 19 + Math.round(CW * 1720 / WINDOW);
  g.text(19, 13, '0:00', 'mu'); const pl = `Pi done · ${dur(1720)} ↑`; g.text(px - len(pl) + 1, 13, pl, 'mu'); g.text(19 + CW - len(dur(WINDOW)), 13, dur(WINDOW), 'mu');

  const pf = focus === 'process';
  g.box(0, 15, 66, 12, { f: pf ? 'ac' : 'ln', title: 'Process trees · per configuration' });
  table(g, 1, 16, 64, [{ l: 'Configuration', w: 26 }, { l: 'CPU time', w: 10, al: 'right' }, { l: 'Peak RSS', w: 10, al: 'right' }, { l: 'Note', w: 18 }], [
    { v: ['Claude Code · sonnet-5-5', '6:12', '412 MB', 'cloud model'] },
    { v: ['Codex · gpt-6-sol · low', '4:48', '388 MB', 'cloud model'] },
    { v: ['Pi · qwen3.5-35b-a3b', '2:05', '236 MB', 'harness only'] },
    { v: [{ t: 'llama-server · pid 2210', f: 'bd' }, '18:40', '21.3 GB', { t: 'separate server', f: 'bd' }] },
  ], { cursor: 3, focused: pf });
  g.region(1, 16, 64, 5, 'DataTable', '#process-trees');
  para(g, 2, 21, 62, 'llama-server serves Pi’s model but was started outside Pi’s process tree, so it is not counted as Pi’s. Cloud configurations are measured on this client only; the provider’s inference hardware is not measured.', 'mu');

  const ef = focus === 'energy';
  g.box(66, 15, 54, 12, { f: ef ? 'ac' : 'ln', title: 'Energy · shared by the experiment' });
  g.region(66, 15, 54, 12, 'Static', '#energy.kv');
  let y = kv(g, 68, 16, 13, 50, [
    ['CPU package', '38.6 Wh · counter delta · 100%'],
    ['GPU board', '112.4 Wh · estimate ▲ 97% cover'],
    ['Scope', 'CPU package + GPU · not system'],
    ['Per config', 'not split · ran at the same time'],
    ['Electricity', '$0.03 at 0.18 USD/kWh · estimate'],
  ]);
  para(g, 68, y + 1, 50, 'Parallel run: never divided, so Pi’s cost stays unknown in rankings (M10). Never added to an API charge.', 'mu');
  para(g, 1, 28, W - 2, 'Every value keeps its source, scope, actual interval and coverage when it is exported or shown in the report. Requested 1 s; a collector that cannot sample that fast shows its own minimum. Missing samples stay gaps, never zero.', 'mu');
  const bx = buttons(g, W - 1, H - 2, [{ label: 'How energy was derived', go: 'EnergyDetail', focus: focus === 'detail' }, { label: 'Export CSV…', go: 'PromptExportCsv', focus: focus === 'csv' }]);
  g.region(W - 1 - 13, H - 2, 13, 1, 'Button', '#export-csv');
  footer(g, [{ k: 'esc', d: 'Back', go: 'ResultOrigin' }, { k: 'e', d: 'Energy detail', go: 'EnergyDetail' }, { k: 'w', d: 'Sequential windows', go: 'SequentialEnergy' }, { k: 'x', d: 'Export CSV', go: 'PromptExportCsv' }, { k: 'tab', d: 'Focus', do: 'next' }]);
  return g;
}

// ---------------------------------------------------------------- energy derivation (over Telemetry)

export function energyDetail(sz, focus = 'table') {
  const g = telemetry(sz, 'none');
  const m = modal(g, 86, 22, 'How energy was derived · run 2026-09-24-lab', { sel: '#energy-detail' });
  let y = m.y;
  table(g, m.x, y, m.w, [{ l: 'Domain', w: 15 }, { l: 'Method', w: 25 }, { l: 'Events', w: 19 }, { l: 'Result', w: m.w - 59 }], [
    { v: ['CPU package', 'RAPL counter delta', '1 wrap · continuity proven', '38.6 Wh · 100%'] },
    { v: ['CPU cores', 'RAPL · inside package', 'not added again', { t: '○ shown, not summed', f: 'mu' }] },
    { v: ['GPU board', 'NVML power × 1 s', { t: '74 s gap at 30:40', f: 'bd' }, { t: '112.4 Wh ▲ estimate', f: 'bd' }] },
    { v: ['Rest of host', 'no sensor', '—', { t: 'unknown', f: 'it' }] },
  ], { cursor: 2, focused: focus === 'table' });
  g.region(m.x, y, m.w, 5, 'DataTable', '#energy-domains');
  y += 6;
  y = kv(g, m.x, y, 14, m.w, [
    ['Source choice', 'one selected source per physical domain; rejected duplicates retained'],
    ['Reset / gap', 'ambiguous decrease or gap stays uncovered; known range alone proves no wrap'],
    ['Overlap', 'package already includes cores · never package + cores'],
    ['Label', 'estimated from power · never a wall-socket measurement'],
    ['Allocation', 'none · 3 configurations ran concurrently'],
  ]);
  y++;
  para(g, m.x, y, m.w, 'The tariff estimate keeps this scope and coverage: it is the cost of CPU package and GPU energy only, partial for the GPU, and not the electricity cost of the machine.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', go: 'Telemetry', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Telemetry' }], '');
  return g;
}

// ---------------------------------------------------------------- sequential execution windows (over Telemetry)

export function sequentialEnergy(sz, focus = 'table') {
  const g = telemetry(sz, 'none');
  const r = byId['R-0919lab-1'];
  const m = modal(g, 86, 26, 'Energy during execution windows · run 2026-09-19-lab', { sel: '#windows' });
  let y = m.y;
  g.text(m.x, y++, fit(`Sequential (jobs 1) · ${r.h} · ${r.model} · ${dur(r.time)} of task processes`, m.w), 'bd');
  y++;
  const T = [['T1', 190, 2.1, 6.4], ['T2', 205, 2.3, 7.9], ['T3', 330, 3.6, 13.5], ['T4', 160, 1.8, 5.2], ['T5', 290, 3.2, 11.8], ['T6', 245, 2.7, 9.6], ['T7', 230, 2.5, 8.1]];
  if (T.reduce((n, t) => n + t[1], 0) !== r.time) throw new Error('Windows disagree with R-0919lab-1');
  table(g, m.x, y, m.w, [{ l: 'Window', w: 10 }, { l: 'Duration', w: 10, al: 'right' }, { l: 'CPU package', w: 14, al: 'right' }, { l: 'GPU board', w: 14, al: 'right' }, { l: 'Includes', w: m.w - 48 }],
    [...T.map(([id, s, c, gp]) => ({ v: [id, dur(s), `${c.toFixed(1)} Wh`, `${gp.toFixed(1)} Wh`, 'background activity'] })),
      { v: ['Σ windows', dur(r.time), `${T.reduce((n, t) => n + t[2], 0).toFixed(1)} Wh`, `${T.reduce((n, t) => n + t[3], 0).toFixed(1)} Wh`, 'not exclusive to Pi'], f: 'bd' }], { cursor: 2, focused: focus === 'table' });
  g.region(m.x, y, m.w, 9, 'DataTable', '#window-energy');
  y += 10;
  y = kv(g, m.x, y, 16, m.w, [
    ['Energy estimate', [`${(T.reduce((n, t) => n + t[2] + t[3], 0)).toFixed(1)} Wh × $0.18/kWh = $0.01 · CPU package + GPU`, 'counts as Pi’s cost in rankings, labelled as such (M10)']],
  ]);
  y++;
  para(g, m.x, y, m.w, 'Only one configuration ran at a time, so energy can be shown per window. It still includes the operating system, the idle model server and anything else running: sequential scheduling does not isolate electricity use, so the estimate keeps this scope and is never called Pi’s own consumption.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Close', v: 'primary', go: 'Telemetry', focus: true }]);
  footer(g, [{ k: 'esc', d: 'Close', go: 'Telemetry' }], '');
  return g;
}
