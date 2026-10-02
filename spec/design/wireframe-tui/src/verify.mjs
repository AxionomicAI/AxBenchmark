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
import { RESULTS, TRIAL_CONFIGS } from './results-data.mjs';
import { RATES } from './screens-readiness.mjs';
import { SHA } from './screens.mjs';
const groups=[...GROUPS,...MODULE_GROUPS,...LATER_GROUPS,...REFINEMENT_GROUPS];
const entries=[...SYSTEM.map(b=>({b,g:{id:'system'}})),...groups.flatMap(g=>g.boards.map(b=>({b,g})))];
const byName=Object.fromEntries(entries.map(({b})=>[b.name,b]));
const suffix=size=>size==='compact'?'-80x24':'';
const filename=(name,size)=>`${name==='NavMap'?'Main':name}${suffix(size)}.dc.html`;
const previewURL=name=>new URL('../preview/'+name,import.meta.url);
const href=(name,size)=>{const b=byName[name];assert(b,`Unknown board ${name}`);return filename(name,(b.sizes??['wide']).includes(size)?size:(b.sizes??['wide'])[0]);};
const ledger=readFileSync(new URL('../ownership-ledger.md',import.meta.url),'utf8');
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
const parent=readFileSync(new URL('../../../modules/09-default-inventory-benchmark.md',import.meta.url),'utf8');
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
const animation=readFileSync(new URL('../animation.html',import.meta.url),'utf8');assert(animation.includes('30 acceptance checks'));assert(!animation.includes('21 acceptance checks'));
console.log(`PASS: ${entries.length} named boards / ${variants} size variants; ${renders} focus renders; zero grid/table/footer errors; source-preview, ownership, M09 phases, F16/F17/F19 and fixture checks passed.`);
