// Static specification/wireframe checks only. No Textual or engine runtime is exercised.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { Grid, SIZES } from './lib.mjs';
import { GROUPS, SYSTEM } from './boards.mjs';
import { MODULE_GROUPS } from './boards-modules.mjs';
import { LATER_GROUPS } from './boards-later.mjs';
import { REFINEMENT_GROUPS } from './boards-refinement.mjs';
import { boardContract } from './ownership.mjs';
import { CHECKS, CHECK_DETAILS, PHASE_COUNTS, PI_AT_TASK, PI_FINAL } from './checks-data.mjs';
import { RESULTS, TRIAL_CONFIGS, STATS, combined, rank8, planV2, pooled, validatePlan, rate } from './results-data.mjs';
import { GROK_GEN, GROK_TASKS } from './screens-results.mjs';
import { RATES } from './screens-readiness.mjs';
import { SHA } from './screens.mjs';
const groups=[...GROUPS,...MODULE_GROUPS,...LATER_GROUPS,...REFINEMENT_GROUPS];
const entries=[...SYSTEM.map(b=>({b,g:{id:'system'}})),...groups.flatMap(g=>g.boards.map(b=>({b,g})))];
const byName=Object.fromEntries(entries.map(({b})=>[b.name,b]));
const suffix=size=>size==='compact'?'-80x24':'';
const filename=(name,size)=>`${name==='NavMap'?'Main':name}${suffix(size)}.dc.html`;
const previewURL=name=>new URL('../preview/'+name,import.meta.url);
const href=(name,size)=>{const b=byName[name];assert(b,`Unknown board ${name}`);return filename(name,(b.sizes??['wide']).includes(size)?size:(b.sizes??['wide'])[0]);};
const ledger=readFileSync(new URL('../ownership-ledger.md', import.meta.url),'utf8');
const canvas=JSON.parse(readFileSync(previewURL('canvas.json'),'utf8'));
const flat=readFileSync(previewURL('preview.html'),'utf8');
let current='',renders=0,variants=0;const rawText=Grid.prototype.text;
Grid.prototype.text=function(x,y,s,...rest){if(String(s).trim())assert(x>=0&&y>=0&&y<this.h&&x+[...String(s)].length<=this.w,`${current} writes outside grid at ${x},${y}: ${s}`);return rawText.call(this,x,y,s,...rest)};
const textOf=g=>g.rows.map(r=>r.map(c=>c.c).join('')).join('\n');
const render=(name,size='wide',focus)=>byName[name].render(SIZES[size],focus??byName[name].focus?.[size]?.[0]?.[0]??'none');
for(const {b,g} of entries){
  assert(ledger.includes(`| ${b.name} |`),`Missing ledger ${b.name}`);
  assert(boardContract(b,g).api);
  for(const size of b.sizes??['wide']){
    variants++;const file=filename(b.name,size);assert(canvas.boards[file],`Missing canvas ${file}`);assert(existsSync(previewURL(file)));
    const html=readFileSync(previewURL(file),'utf8');
    if(!b.render)continue;
    for(const [focus] of b.focus?.[size]??[['none']]){
      current=`${b.name}/${size}/${focus}`;const grid=b.render(SIZES[size],focus);renders++;
      const expected=grid.html({live:true,href:name=>href(name,size)});assert(html.includes(expected),`Preview stale: ${current}`);
      assert.equal(grid.rows.length,SIZES[size].rows);assert(grid.rows.every(r=>r.length===SIZES[size].cols));
    }
    assert(flat.includes(`id="${b.name}-${size}"`),`Missing flat preview ${b.name}/${size}`);
  }
}
assert.equal(Object.keys(canvas.boards).length,variants);
const parent=readFileSync(new URL('../../../modules/09-default-inventory-benchmark.md', import.meta.url),'utf8');
const normative=[...parent.matchAll(/^\| `(T\d_\w+)` — (.*?) \| (R\d+) \| ([BH]) \/ ([RVDUQ]) \/ (.*?) \| (.*?) \|/gm)];
assert.deepEqual(CHECKS.map(c=>c[0]),normative.map(m=>m[1]));
CHECKS.forEach(([id,title])=>{const m=normative.find(m=>m[1]===id), d=CHECK_DETAILS[id];assert.equal(title,m[2]);assert.equal(d.requirement,m[3]);assert.equal(d.phase,m[4]);assert.equal(d.observation,m[7]);});
assert.deepEqual([1,2,3,4,5,6,7].map(n=>CHECKS.filter(([id])=>id.startsWith(`T${n}_`)).length),[6,4,5,2,6,4,3]);
assert.deepEqual(PHASE_COUNTS,{unique:30,at_task:30,final_regression:30,final_artifact:19,final_history:11});
assert.equal(Object.values(CHECK_DETAILS).filter(d=>d.phase==='H').length,11);
assert.deepEqual(Object.keys(PI_AT_TASK),['T5_remove','T5_persistence','T6_history']);
assert.deepEqual(Object.keys(PI_FINAL),['T4_lookup','T5_remove','T6_history']);
assert(RESULTS.every(r=>Object.values(r.checks).reduce((a,b)=>a+b,0)===30));
assert(TRIAL_CONFIGS.every(c=>c.trials.every(t=>Object.values(t.checks).reduce((a,b)=>a+b,0)===18)),'Separate Orders REST fixture remains 18 checks');
assert.equal(RATES.find(r=>r.cur==='COP').rate,'4000');
for(const size of ['wide','compact']){
  const billing=textOf(render('CatalogBilling',size));assert(billing.includes('personal'));for(const mode of ['Value','Inherit','Unknown'])assert(billing.includes(mode));
  const rates=textOf(render('CatalogRates',size));assert(rates.includes('4000'));assert(rates.includes('Units / USD'));assert(!rates.includes('0.000250'));assert(textOf(render('Catalog',size)).includes('Billing'));
  for(const state of ['Confirm','Builtin','ActiveRun','HasResults','Changed','Pending']){
    const b=byName[`RevisionDelete${state}`];assert.equal(b.focus[size][0][0],'cancel');const grid=render(b.name,size);const t=textOf(grid);assert(t.includes(state==='Builtin'?SHA.inv1:SHA.billing));assert(t.includes('Cancel'));
    if(!['Confirm','Changed'].includes(state))assert(!grid.rows.flat().some(c=>c.a==='go:Library'&&c.c==='D'&&!c.f.includes('dm')&&!c.d),'Blocked deletion has no active Delete link');
  }
  for(const name of ['PlanReview','PlanReopened'])assert(textOf(render(name,size)).includes('T4 snapshot'),`${name}/${size} snapshot must follow selected T4`);
}
const override=textOf(render('CatalogOverride'));assert(!override.includes('Billing kind'));assert(override.includes('Price currency'));
const exchange=entries.filter(({b,g})=>boardContract(b,g).owner==='M17');assert.equal(exchange.length,14);assert(exchange.every(({b})=>b.legend.file==='tui/screens/exchange.py'));
for(const [name,text] of [['CheckMissingCommit','same HEAD'],['CheckHistoryUnavailable','unreadable'],['CheckT2WithoutUI','no T3 UI'],['CheckMissingBrowser','Browser is not installed']])assert(textOf(render(name)).includes(text));
const animation=readFileSync(new URL('../animation.html', import.meta.url),'utf8');assert(animation.includes('30 acceptance checks'));assert(!animation.includes('21 acceptance checks'));
// R173–R176 statistics: fixture reconciliation, spec acceptance vectors and the rendered primary columns.
for(const j of ['A','B']){const rs=RESULTS.filter(r=>r.judge===j),a=combined(rs),b=rank8(rs,planV2());assert.deepEqual(b.rows.map(x=>x.r.id),a.rows.map(x=>x.r.id));b.rows.forEach((x,i)=>assert(Math.abs(x.score-a.rows[i].score)<1e-9,'all-zero statistics keep three-component scores'));}
assert(RESULTS.every(r=>STATS[r.id]),'Every result has statistics');
{const g=STATS['R-0928a-3'].gen;assert.equal(GROK_GEN.reduce((a,t)=>a+t.n,0),g.n);assert.equal(GROK_GEN.reduce((a,t)=>a+Number(t.d),0).toFixed(3),g.d);assert.equal(GROK_GEN.reduce((a,t)=>a+(t.full??t.n),0),g.full);assert.equal(GROK_TASKS.reduce((a,t)=>a+parseInt(t[5].split(' / ')[1],10),0),STATS['R-0928a-3'].out);}
{const p=pooled([{gen:{n:100,d:'2'}},{gen:{n:300,d:'3'}}]);assert.equal(p.x,80);assert.equal(p.meanOfRates,75);}
{const p=pooled([{gen:{n:100,d:'2'}},{gen:{n:900,d:'3'}}]);assert.equal(p.x,200);assert.equal(p.min,50);assert.equal(p.max,300);}
{const c=TRIAL_CONFIGS[0].trials,p=pooled(c);assert(Math.abs(p.x-p.meanOfRates)>1,'Fixture shows pooled ≠ mean of rates');}
{const mk=(id,cost,time,q)=>({id,status:'complete',checks:{p:30,f:0,u:0,n:0},cost,time,g:[q,q,q,q,q,q]});const A=mk('VA',2,20,4),B=mk('VB',4,10,5);
 const legacy=rank8([A,B],planV2());assert(Math.abs(legacy.rows.find(x=>x.r===A).score-230/3)<1e-9&&Math.abs(legacy.rows.find(x=>x.r===B).score-250/3)<1e-9,'acceptance 7');
 STATS.VA={gen:{n:40,d:'1',req:[1,1],basis:'proxy',state:'known',full:40}};STATS.VB={gen:{n:80,d:'1',req:[1,1],basis:'proxy',state:'known',full:80}};
 const p8=planV2([1,0,0],{generation_rate:1},{generation_rate:'higher'});const r8=rank8([A,B],p8);r8.rows.forEach(x=>assert(Math.abs(x.score-75)<1e-9,'acceptance 8'));
 STATS.VB.gen={...STATS.VB.gen,state:'partial'};const r9=rank8([A,B],p8);assert.equal(r9.rows.length,1);assert(Math.abs(r9.rows[0].score-100)<1e-9,'references from the remaining eligible roster');
 delete STATS.VA;delete STATS.VB;
 assert.match(validatePlan(planV2([1,1,1],{loc:1})),/LOC needs higher or lower/);const missing=planV2();delete missing.weights.input_tokens;assert.match(validatePlan(missing),/input_tokens is missing/);}
for(const size of ['wide','compact']){const t=textOf(render('ResultsStatistics',size));for(const l of ['Gen tok/s','In tok (cached)','Out tok (reasoning)','Files / LOC'])assert(t.includes(l),`ResultsStatistics/${size} lacks ${l}`);if(size==='wide')assert(t.indexOf('R-0921a-2')>t.indexOf('R-0928a-4'),'unknown Gen tok/s sorts last');}
{const t=textOf(render('RankingsFactors'));for(const w of ['metric_partial','metric_basis_incompatible','metric_unknown','Gen pts'])assert(t.includes(w),`RankingsFactors lacks ${w}`);}
assert(textOf(render('WeightsInvalid')).includes('LOC needs higher or lower'));
{const t=textOf(render('ThroughputDetail'));assert(t.includes('116.98')&&t.includes('122.71')&&t.includes('✗ 173,118'));}
assert(textOf(render('MeasurementsTrials')).includes('70.22 pooled'));
assert(textOf(render('ArtifactStats')).includes('final snapshot size (baseline included)'));
assert(textOf(render('JudgeHandoff')).includes('✗ Cost, token counts, Gen tok/s, Files / LOC'),'statistics are listed as never given to the judge (M12)');
// R161–R166 context window: live sub-window, ContextDetail scopes and the animated walkthrough.
for(const size of ['wide','compact'])assert(textOf(render('ContextDetail',size)).includes('84,213'),`ContextDetail/${size} shows the native reading`);
{const t=textOf(render('HarnessLive'));assert(t.includes('Context window')&&t.includes('? not exposed by Codex')&&t.includes('65.1%'));}
assert(textOf(render('HarnessLiveLimited')).includes('current input unavailable'));
assert(textOf(render('HarnessLiveContextOff')).includes('classification off · no engine configured'));
assert(textOf(render('ContextDetail')).includes('4,613 not allocated'));
assert(textOf(render('ContextDetailHistory')).includes('never summed'));
{const t=textOf(render('ContextDetailRetained'));assert(t.includes('engine_not_configured')&&t.includes('Configure decision engine'));}
assert(animation.includes('Context window analysis')&&animation.includes('Context window · main · w2'),'animation shows the context window');
// Decision engines (M07.3/M12.4) and the remaining context states.
{const t=textOf(render('DecisionEngines'));for(const w of ['✓ ready · text only','✓ ready · vision','✗ local model missing','✗ auth unsupported','? not ready'])assert(t.includes(w),`DecisionEngines lacks ${w}`);}
assert(textOf(render('DecisionEnginesEmpty')).includes('No decision engine configured'));
assert(textOf(render('DecisionEnginesLocal')).includes('echo, not proof of weights'));
assert(textOf(render('DecisionEngineEdit')).includes('Save v3'));
assert(textOf(render('DecisionEngineTested')).includes('ready_vision'));
assert(textOf(render('SetupNoEngine')).includes('engine_not_configured'));
{const t=textOf(render('SetupGradingTextOnly'));assert(t.includes('✗ vision for web v1')&&t.includes('1 issue blocks launch'));}
assert(textOf(render('ContextDetailDeferred')).includes('◷ deferred · local lease'));
assert(textOf(render('ContextDetailFailed')).includes('401 credential rejected'));
{const t=textOf(render('ContextDetailReset'));assert(t.includes('native reset')&&t.includes('capture gap'));}
assert(textOf(render('ContextDetailImported')).includes('a-21c0'));
for(const c of ['Decision engines','When analysis cannot run as planned','Context in retained and imported results'])assert(animation.includes(c),`animation lacks ${c}`);
console.log(`PASS: ${entries.length} named boards / ${variants} size variants; ${renders} focus renders; zero grid/table/footer errors; source-preview, ownership, M09 phases, F16/F17/F19, R173–R176 statistics, R161–R166 context, decision-engine and fixture checks passed.`);
