// M13 · Standalone interactive HTML report.
// In the TUI: the generate dialog (what goes into the file) and generation progress; ReportReady (M02) shows the path.
// reportPage() is a low-fidelity wireframe of the generated HTML file itself, drawn with the same tokens.
// Every number on it is computed by results-data.mjs with the M06 contract, as on the Rankings frames.
import { fit, len, footer, table, buttons, para, kv, modal, progress, radios, check, input, esc } from './lib.mjs';
import { SHA, s8, step } from './screens.mjs';
import { results } from './screens-results.mjs';
import { RESULTS, JUDGES, QCATS, QW, quality, combined, shortlists, byCost, gates, dur, usd, f1, f2, checksText, cfgShort, basisText, costMissing, STATS, genText, inText, outText, filesLocText, FACTORS } from './results-data.mjs';

const ZERO = RESULTS.filter((r) => r.cost === 0).length;
const UNKNOWN = RESULTS.filter((r) => r.cost == null).length;
const LOCAL_UNKNOWN = RESULTS.filter((r) => r.cost == null && r.local).length;
// D13: within judge group B the frozen ranking weights differ (R-0919lab-1 froze cost ×2), so the original combined
// ranking of B uses the profile's default weights and says so; group A froze the same weights everywhere.
const B_WEIGHTS = { 'R-0924lab-1': '1 : 1 : 1', 'R-0924lab-2': '1 : 1 : 1', 'R-0924lab-3': '1 : 1 : 1', 'R-0919lab-1': '2 : 1 : 1' };
const SHOTS = RESULTS.length * 7 * 2;
const FILE = '~/.axbenchmark/reports/inventory-web-app-r1-3f9c2e71-2026-10-01.html';

// ---------------------------------------------------------------- generate dialog (over Results)

export function reportGenerate(sz, focus = 'weights', st = {}) {
  const g = results(sz, 'none');
  const m = modal(g, 86, st.differ ? 35 : 31, 'Generate HTML report', { sel: '#report-generate' });
  let y = m.y;
  g.text(m.x, y++, fit('★ Inventory web app r1 · built-in · printed in full in the report', m.w), 'bd');
  g.text(m.x, y++, SHA.inv1, 'mu');
  y++;
  y = kv(g, m.x, y, 13, m.w, [
    ['Results', '12 · 8 local · 4 imported · all with this SHA-256'],
    ['Filters', 'none · machine, configuration and judge filters stay in the report'],
    ['Judges', '2 groups · A ' + JUDGES.A.short + ' · B ' + JUDGES.B.short + ' · never merged'],
  ]);
  y++;
  g.text(m.x, y++, 'Weights shown first', 'bd');
  radios(g, m.x, y++, ['Original · frozen with each result', 'Current alternative · cost ×2'], 0, { focus: focus === 'weights' });
  g.region(m.x, y - 1, m.w, 1, 'RadioSet', '#report-weights');
  g.text(m.x + 2, y++, fit('Both are in the file; an alternative is labelled and resets to the original.', m.w - 2), 'mu');
  if (st.differ) {
    y = kv(g, m.x + 2, y, 10, m.w - 2, [
      ['Group A', 'original · all 8 results froze ranking 1 : 1 : 1'],
      ['Group B', 'Profile defaults: original weights differ across results'],
      ['', '3 froze 1 : 1 : 1, R-0919lab-1 2 : 1 : 1 → web v1 defaults used'],
      ['', 'each result’s own weights stay selectable in the file'],
    ]);
    g.region(m.x + 2, y - 4, m.w - 2, 4, 'Static', '#weights-origin.kv');
  }
  y++;
  g.text(m.x, y++, 'Contents', 'bd');
  [
    ['Measured comparison table · cost basis, price source and coverage per row', true],
    ['Quality table · per judge group, highest unrounded quality first', true],
    ['Top five · lowest cost, shortest time, highest quality', true],
    [`Cost / time / quality scatter · log cost · ${UNKNOWN} unknown cost listed apart`, true],
    ['Combined ranking · stacked cost, time and quality contributions', true],
    [`Task screenshots · ${SHOTS} embedded so the file works alone`, true],
    ['Hardware timelines · where collected, with scope and coverage', true],
  ].forEach(([t, on], i) => check(g, m.x, y++, fit(t, m.w - 2), on, { focus: focus === 'contents' && i === 5 }));
  g.region(m.x, y - 7, m.w, 7, 'SelectionList', '#report-contents');
  y++;
  g.text(m.x, y, 'Save to', 'mu'); input(g, m.x + 9, y++, m.w - 9, FILE, { focus: focus === 'path' });
  g.region(m.x + 9, y - 1, m.w - 9, 1, 'Input', '#report-path');
  y++;
  para(g, m.x, y, m.w, 'One HTML file: no server, CDN, external fonts or frameworks; it opens offline by double-click. Built from retained results only — no planner, competitor or judge is called.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }, { label: 'Generate', v: 'primary', go: 'ReportProgress', focus: focus === 'generate' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }, { k: 'tab', d: 'Next', do: 'next' }, { k: '^s', d: 'Generate', go: 'ReportProgress' }], '');
  return g;
}

export function reportProgress(sz) {
  const g = results(sz, 'none');
  const m = modal(g, 84, 21, 'Generating HTML report', { sel: '#report-progress' });
  let y = m.y;
  step(g, m.x, y++, m.w, 'done', 'Read 12 retained results · 0 excluded for another SHA-256');
  step(g, m.x, y++, m.w, 'done', 'Scores per judge group with the M06 contract · original weights kept');
  step(g, m.x, y++, m.w, 'done', 'Escaped prompts, logs, reviews and imported labels as plain text');
  step(g, m.x, y++, m.w, 'now', `Embedding review screenshots · 104 of ${SHOTS}`);
  progress(g, m.x + 2, y++, m.w - 2, Math.round(104 / SHOTS * 100));
  step(g, m.x, y++, m.w, 'todo', 'Write one file · inline CSS, JavaScript and data');
  step(g, m.x, y++, m.w, 'todo', 'Try to open it in the browser · the path is shown either way');
  g.region(m.x, m.y, m.w, 7, 'Vertical', '#report-steps');
  y++;
  para(g, m.x, y, m.w, 'Original measurements, grades and weights are only read. Competitor text is never executed or rendered as HTML, even when it contains markup or scripts.', 'mu');
  buttons(g, m.right, m.bottom, [{ label: 'Cancel', go: 'Results' }]);
  footer(g, [{ k: 'esc', d: 'Cancel', go: 'Results' }], '');
  return g;
}

// ---------------------------------------------------------------- the generated HTML file (wireframe)

const basis = (r) => basisText(r);
const cell = (t, cls = '') => `<td${cls ? ` class="${cls}"` : ''}>${esc(t)}</td>`;

const bars = (title, rows, fmt, max, note) => `<div class="rp-card"><h4>${esc(title)}</h4>
${rows.map(([label, v], i) => `<div class="rp-bar"><span class="rp-n">${i + 1}</span><span class="rp-l">${esc(label)}</span><span class="rp-track"><i style="width: ${Math.max(2, Math.round(v / max * 100))}%"></i></span><span class="rp-v">${esc(fmt(v))}</span></div>`).join('')}
${note ? `<p class="rp-note">${esc(note)}</p>` : ''}</div>`;

function scatter(rs) {
  const W = 620, H = 300, L = 56, B = 40, T = 14, R = 16;
  const pts = rs.filter((r) => r.cost > 0 && r.g && !r.partial);
  const lx = (c) => L + (Math.log10(c) - Math.log10(0.01)) / (Math.log10(10) - Math.log10(0.01)) * (W - L - R);
  const ty = (t) => H - B - (t - 1500) / (3300 - 1500) * (H - B - T);
  const xt = [0.01, 0.1, 1, 10].map((c) => `<line x1="${lx(c)}" x2="${lx(c)}" y1="${T}" y2="${H - B}" class="rp-grid"/><text x="${lx(c)}" y="${H - B + 16}" text-anchor="middle">$${c}</text>`).join('');
  const yt = [1800, 2400, 3000].map((t) => `<line x1="${L}" x2="${W - R}" y1="${ty(t)}" y2="${ty(t)}" class="rp-grid"/><text x="${L - 8}" y="${ty(t) + 4}" text-anchor="end">${dur(t)}</text>`).join('');
  const dots = pts.map((r) => {
    const q = quality(r.g), x = lx(r.cost), y = ty(r.time), mix = Math.round((q - 3) / 2 * 100);
    const fill = `color-mix(in srgb, var(--ac) ${mix}%, var(--ln))`;
    const shape = r.env === 'clean' ? `<circle cx="${x}" cy="${y}" r="7" style="fill: ${fill}"/>` : `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" transform="rotate(45 ${x} ${y})" style="fill: ${fill}"/>`;
    return `${shape}<text x="${x + 11}" y="${y + 4}">${esc(r.id)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="rp-svg" role="img" aria-label="Cost against elapsed time, colored by quality">
<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="rp-axis"/><line x1="${L}" x2="${L}" y1="${T}" y2="${H - B}" class="rp-axis"/>${xt}${yt}${dots}
<text x="${(W + L) / 2}" y="${H - 4}" text-anchor="middle" class="rp-al">cost, USD · logarithmic</text><text x="14" y="${(H - B) / 2}" transform="rotate(-90 14 ${(H - B) / 2})" text-anchor="middle" class="rp-al">elapsed</text></svg>`;
}

export function reportPage() {
  const A = RESULTS.filter((r) => r.judge === 'A');
  const sl = shortlists(A), cb = combined(A);
  const maxC = Math.max(...sl.cost.map((r) => r.cost), 0.01);
  const measured = byCost(RESULTS);
  const groups = ['A', 'B'].map((j) => ({ j, rs: RESULTS.filter((r) => r.judge === j) }));
  const stacked = cb.rows.map((x) => `<div class="rp-stack"><span class="rp-l">${esc(x.r.id)} · ${esc(cfgShort(x.r))}</span><span class="rp-track rp-wide"><i class="c" style="width: ${x.c}%"></i><i class="t" style="width: ${x.t}%"></i><i class="q" style="width: ${x.qq}%"></i></span><span class="rp-v">${f1(x.score)}</span></div>`).join('');
  const excluded = A.filter((r) => !cb.rows.some((x) => x.r === r)).map((r) => `<li><b>${esc(r.id)}</b> · ${esc(cb.why(r).join(', '))}</li>`).join('');
  return `<div class="rp">
<div class="rp-chrome"><span>●  ●  ●</span><span class="rp-url">file://${esc(FILE.replace('~', '/Users/mike'))}</span><span>offline · no network requests</span></div>
<div class="rp-page">
<header class="rp-head"><div><p class="rp-eyebrow">AxBenchmark report · M13 · wireframe of the generated file</p><h1>Inventory web app r1</h1>
<p class="rp-sha">SHA-256 <code>${SHA.inv1}</code></p>
<p class="rp-mu">Generated 2026-10-01 22:31 from 12 retained results (8 local, 4 imported) · 2 judge groups · no model calls · one standalone HTML file</p>
<p class="rp-mu">Costs in USD, the display currency frozen with all four runs · computed and ranked in USD with each run’s frozen rates</p></div>
<div class="rp-badge">● Original weights</div></header>

<section class="rp-controls">
<div class="rp-ctl"><h4>Filters</h4><label>Machine <span class="rp-sel">all ▾</span></label><label>Configuration <span class="rp-sel">all ▾</span></label><label>Judge group <span class="rp-sel">A · ${esc(JUDGES.A.short)} ▾</span></label></div>
<div class="rp-ctl"><h4>Quality weights</h4>${QCATS.map(([, , s], i) => `<label>${esc(s)} <span class="rp-in">${QW[i]}</span></label>`).join('')}</div>
<div class="rp-ctl"><h4>Ranking weights · eight, normalized together</h4>${FACTORS.map(([, n, fixed], i) => `<label>${esc(n)} <span class="rp-in">${i < 3 ? 1 : 0}</span>${fixed ? '' : ' <span class="rp-sel">— ▾</span>'}</label>`).join('')}<label>Timing basis <span class="rp-sel">proxy stream window v1 ▾</span></label></div>
<div class="rp-ctl"><h4>Analysis setting</h4><label>Electricity tariff <span class="rp-in">0.18</span> USD/kWh</label><span class="rp-mu" style="font-size: 12px">frozen with each run · a changed value is labelled “alternative” and recalculates energy estimates only</span></div>
<div class="rp-ctl rp-act"><span class="rp-btn rp-pri">Apply as alternative</span><span class="rp-btn">Reset to original</span><span class="rp-btn">Export alternative report</span></div>
<p class="rp-note">Each set must be finite and ≥ 0 with a positive total; unknown categories are rejected, and a statistic needs higher or lower before its weight can be positive (M06). Direction is your priority, never a grade; more output, files or lines never means better quality. Applying relabels the page “Alternative weights” and updates tables, rankings, colors and stacks together. A changed tariff is an alternative too. Original records never change.</p>
</section>

<section><h2>Direct top five · judge group A</h2><div class="rp-row3">
${bars('Lowest cost', sl.cost.map((r) => [`${r.id} · ${cfgShort(r)}`, r.cost]), usd, maxC, `Only ${sl.cost.length} eligible entries have a complete, known cost. ${A.filter((r) => !gates(r).length && costMissing(r)).map((r) => `${r.id} (${costMissing(r)})`).join('; ')}: listed below, not ranked.`)}
${bars('Shortest elapsed time', sl.time.map((r) => [`${r.id} · ${cfgShort(r)}`, r.time]), dur, Math.max(...sl.time.map((r) => r.time)), null)}
${bars('Highest quality', sl.quality.map((x) => [`${x.r.id} · ${cfgShort(x.r)}`, x.q]), f2, 5, 'Unrounded quality decides order; ties break by result id.')}
</div><p class="rp-note">Eligible: complete, every check passed, graded, specification ≥ 4 (M06). ${A.length - cb.eligible.length} of ${A.length} entries in group A are not eligible; their reasons are in the tables.</p></section>

<section class="rp-row2"><div><h2>Cost · time · quality</h2>${scatter(RESULTS)}
<div class="rp-legend"><span><svg width="14" height="14"><circle cx="7" cy="7" r="6" style="fill: var(--ac)"/></svg> clean environment</span><span><svg width="14" height="14"><rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" style="fill: var(--ac)"/></svg> current environment</span><span><i class="rp-ramp"></i> quality 3 → 5</span></div>
<p class="rp-note">Left out of the logarithmic axis and listed: ${UNKNOWN} results with unknown cost (${LOCAL_UNKNOWN} local endpoints in parallel runs, whose shared energy is never divided) and R-0925b-2, whose cost covers 5 of 7 tasks. R-0919lab-1 at $0.01 is an energy estimate (CPU package + GPU, sequential run). No result here is a verified $0. Ungraded results have no quality color.</p></div>
<div><h2>Combined ranking · judge group A</h2><div class="rp-legend"><span><i class="rp-k c"></i> cost</span><span><i class="rp-k t"></i> time</span><span><i class="rp-k q"></i> quality</span><span>weights ${cb.w.map((w) => f2(w)).join(' : ')} · the 5 statistics weigh 0, so no stack is drawn for them</span></div>${stacked}
<p class="rp-note">Not ranked:</p><ul class="rp-ul">${excluded}</ul>
<p class="rp-note">Judge group B is ranked separately with its own judge; the two are never merged. Its original ranking is labelled “Profile defaults: original weights differ across results”: ${Object.entries(B_WEIGHTS).filter(([, w]) => w !== '1 : 1 : 1').map(([id, w]) => `${id} froze ${w}`).join(', ')}, the others 1 : 1 : 1, so the web v1 default weights apply; each result’s own weights stay selectable.</p></div></section>

<section><h2>Measured comparison · highest known cost first, unknown last</h2>
<table class="rp-t"><thead><tr><th>Result</th><th>Trial</th><th>Configuration</th><th>Machine</th><th>Environment</th><th>Checks</th><th class="n">Elapsed</th><th class="n">Gen tok/s</th><th class="n">In tok (cached)</th><th class="n">Out tok (reasoning)</th><th class="n">Files / LOC</th><th class="n">Cost</th><th>Basis</th><th>Status</th></tr></thead><tbody>
${measured.map((r) => `<tr>${cell(r.id)}${cell('1 of 1')}${cell(cfgShort(r))}${cell(`${r.src === 'imported' ? '↓ ' : ''}${r.machine}`)}${cell(`${r.env} · jobs ${r.jobs}`)}${cell(checksText(r.checks))}${cell(dur(r.time), 'n')}${cell(`${genText(STATS[r.id])} ${STATS[r.id].gen.state === 'unknown' ? 'unknown' : STATS[r.id].gen.basis}`, 'n')}${cell(inText(STATS[r.id]), 'n')}${cell(outText(STATS[r.id]), 'n')}${cell(filesLocText(STATS[r.id]), 'n')}${cell(`${usd(r.cost)}${r.partial ? ' ▲' : ''}`, 'n')}${cell(basis(r))}${cell(r.status === 'complete' ? '✓ complete' : `✗ failed ${r.failedAt}`)}</tr>`).join('')}
</tbody></table><p class="rp-note">Sortable by any column; unknown sorts last, never as 0. Rows open task details and evidence. ↓ marks imported results. Gen tok/s is per-request generation throughput (paired output ÷ summed request windows, labelled with its proxy or native basis), not wall-clock speed; cached ⊂ input and reasoning ⊂ output show ? when not exposed; Files / LOC is the final snapshot size, baseline included, in physical text lines. Hardware details appear where collected (8 of 12). Estimates name their price table and its date; ▲ marks partial values, which never rank where they carry weight. Every result here is trial 1 of 1, the default; with several trials each trial is a row, followed by the configuration’s mean and min–max, and rankings use the means.</p></section>

<section><h2>Quality · raw grades by judge group</h2>${groups.map(({ j, rs }) => `<h3>Judge group ${j} · ${esc(JUDGES[j].long)}</h3>
<table class="rp-t"><thead><tr><th>Result</th><th>Configuration</th>${QCATS.map(([, , s]) => `<th class="n">${esc(s)}</th>`).join('')}<th class="n">Quality</th><th>Evidence</th><th>Limitations</th></tr></thead><tbody>
${[...rs].sort((a, b) => (b.g ? quality(b.g) : -1) - (a.g ? quality(a.g) : -1) || (a.id < b.id ? -1 : 1)).map((r) => `<tr>${cell(r.id)}${cell(cfgShort(r))}${r.g ? r.g.map((v) => cell(v.toFixed(1), 'n')).join('') + cell(f2(quality(r.g)), 'n b') : `<td colspan="7" class="mu">not graded · ${esc(gates(r).join(', '))}</td>`}${cell(r.g ? '14 final-regression shots' : '—')}${cell(r.g ? (r.id === 'R-0928a-1' ? 'no screen reader' : 'none') : '—')}</tr>`).join('')}
</tbody></table>`).join('')}</section>

<section class="rp-row2"><div><h2>Task detail · R-0928a-3</h2><div class="rp-tasks">${['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((t, i) => `<div class="rp-task${i === 6 ? ' on' : ''}"><b>${t}</b><span>${i === 6 ? '1? unverified' : '✓ passed'}</span></div>`).join('')}</div>
<div class="rp-shots"><div class="rp-shot d">T5 · desktop 1440×1000</div><div class="rp-shot m">390×844</div><div class="rp-ev"><p><b>T5_persistence</b> · ? unverified — the browser was not installed; never counted as passed.</p><p class="rp-mu">Evidence: checks/T5_persistence.log · snapshot 4e7a1c9 · review excerpt shown as text.</p></div></div></div>
<div><h2>Hardware · R-0928a-3</h2><div class="rp-spark"><i style="height: 30%"></i><i style="height: 55%"></i><i style="height: 72%"></i><i style="height: 64%"></i><i style="height: 80%"></i><i style="height: 58%"></i><i style="height: 47%"></i><i style="height: 69%"></i><i style="height: 75%"></i><i style="height: 40%"></i></div>
<p class="rp-note">CPU utilisation · client machine mike-mbp-m4 · psutil, 1 s samples, 100% coverage. GPU and power: unavailable (insufficient permission). Cloud inference hardware is not measured. Shared experiment energy is shown once for the run, never split per configuration.</p></div></section>

<footer class="rp-foot"><p>Without JavaScript both tables stay readable; charts, filters and weight controls need it. Prompts, logs, reviews and imported labels are inserted as text, so markup or scripts inside them never run.</p></footer>
</div></div>`;
}

export const REPORT_CSS = `
.rp{display:flex;flex-direction:column;border:1px solid var(--ln);background:var(--bg);font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--fg)}
.rp-chrome{display:flex;gap:24px;align-items:center;padding:8px 14px;background:var(--pn);font-size:12px;color:var(--mu);font-family:inherit}
.rp-url{flex:1;padding:3px 10px;background:var(--sf);color:var(--fg)}
.rp-page{display:flex;flex-direction:column;gap:36px;padding:32px 40px 40px}
.rp h1{margin:0;font-size:30px;line-height:36px}.rp h2{margin:0 0 12px;font-size:17px;line-height:22px}.rp h3{margin:18px 0 8px;font-size:13px;color:var(--mu)}
.rp h4{margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu)}
.rp p{margin:0}.rp-mu,.rp .mu{color:var(--mu)}
.rp-eyebrow{font-size:12px;color:var(--mu);margin-bottom:6px!important}
.rp-sha{margin:8px 0 4px!important;font-size:13px}.rp-sha code{font-family:${"'JetBrains Mono', ui-monospace, monospace"};font-size:12.5px}
.rp-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:20px;border-bottom:1px solid var(--ln)}
.rp-badge{padding:6px 12px;border:1px solid var(--ac);font-size:13px;white-space:nowrap}
.rp-controls{display:grid;grid-template-columns:1.1fr 1.4fr .9fr 1.1fr 1fr;gap:16px 24px;padding:16px;background:var(--sf)}
.rp-controls .rp-note{grid-column:1 / -1}
.rp-ctl{display:flex;flex-wrap:wrap;gap:8px 14px;align-content:flex-start}.rp-ctl h4{width:100%}
.rp-ctl label{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--mu)}
.rp-sel,.rp-in{padding:3px 8px;border:1px solid var(--ln);background:var(--bg);color:var(--fg);font-size:13px}.rp-in{min-width:38px;text-align:right}
.rp-act{align-content:center;gap:8px}
.rp-btn{padding:6px 12px;border:1px solid var(--ln);font-size:13px;min-height:32px}.rp-pri{background:var(--ac);color:var(--on);border-color:var(--ac);font-weight:700}
.rp-note{font-size:12.5px;line-height:18px;color:var(--mu);margin-top:8px!important}
.rp-row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.rp-row2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px}
.rp-card{padding:14px;border:1px solid var(--ln)}
.rp-bar,.rp-stack{display:grid;grid-template-columns:18px minmax(0,1fr) 120px 62px;gap:8px;align-items:center;font-size:12.5px;line-height:24px}
.rp-stack{grid-template-columns:minmax(0,1fr) 320px 48px}
.rp-n{color:var(--mu)}.rp-l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rp-v{text-align:right;font-variant-numeric:tabular-nums}
.rp-track{display:flex;height:12px;background:var(--sf)}.rp-track i{display:block;height:100%;background:var(--ac)}
.rp-wide i.c{background:var(--ln)}.rp-wide i.t{background:var(--mu)}.rp-wide i.q{background:var(--ac)}
.rp-legend{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;font-size:12px;color:var(--mu);margin:8px 0 10px}.rp-legend span{display:flex;gap:6px;align-items:center}
.rp-k{display:inline-block;width:12px;height:12px}.rp-k.c{background:var(--ln)}.rp-k.t{background:var(--mu)}.rp-k.q{background:var(--ac)}
.rp-ramp{display:inline-block;width:60px;height:10px;background:linear-gradient(90deg,var(--ln),var(--ac))}
.rp-svg{display:block;max-width:100%;height:auto;font-size:11px}.rp-svg text{fill:var(--mu)}.rp-svg .rp-al{fill:var(--fg)}
.rp-grid{stroke:var(--ln);stroke-opacity:.35}.rp-axis{stroke:var(--ln)}
.rp-ul{margin:4px 0 0;padding-left:18px;font-size:12.5px;line-height:19px}
.rp-t{width:100%;border-collapse:collapse;font-size:12.5px;line-height:18px}
.rp-t th{text-align:left;padding:6px 8px;background:var(--pn);font-weight:700;white-space:nowrap}
.rp-t td{padding:5px 8px;border-bottom:1px solid color-mix(in srgb,var(--ln) 45%,transparent);white-space:nowrap}
.rp-t .n{text-align:right;font-variant-numeric:tabular-nums}.rp-t .b{font-weight:700}
.rp-tasks{display:flex;gap:6px;margin-bottom:12px}.rp-task{display:flex;flex-direction:column;gap:2px;padding:6px 10px;border:1px solid var(--ln);font-size:12px}.rp-task span{color:var(--mu)}.rp-task.on{border-color:var(--ac)}
.rp-shots{display:grid;grid-template-columns:240px 72px minmax(0,1fr);gap:12px;align-items:start}
.rp-shot{display:flex;align-items:center;justify-content:center;border:1px dashed var(--ln);color:var(--mu);font-size:11px;text-align:center}.rp-shot.d{height:166px}.rp-shot.m{height:156px}
.rp-ev{display:flex;flex-direction:column;gap:6px;font-size:12.5px;line-height:18px}
.rp-spark{display:flex;align-items:flex-end;gap:6px;height:110px;padding:8px;border:1px solid var(--ln)}.rp-spark i{flex:1;background:var(--ac);opacity:.75}
.rp-foot{padding-top:16px;border-top:1px solid var(--ln);font-size:12.5px;color:var(--mu)}
`;
