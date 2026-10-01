import puppeteer from '/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const base='/Users/mike-axionomic/Downloads/comparison';
const folder='openai-cloud-gpt-6-sol-medium';
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'quality-gpt6-'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:profile});
const out={errors:[],checks:{}};
try {
 const page=await browser.newPage();
 page.on('pageerror',e=>out.errors.push(e.message));
 await page.setViewport({width:1440,height:1000});
 await page.goto(`file://${base}/${folder}/index.html`);
 const state=()=>page.evaluate(()=>({products:InventoryStore.getProducts(),cart:InventoryStore.getCart(),orders:InventoryStore.getOrders(),message:document.querySelector('#checkout-message').textContent,total:document.querySelector('#cart-total').textContent,focus:document.activeElement?.outerHTML.slice(0,250)}));
 const fillForm=async(selector,values)=>page.evaluate((selector,values)=>{const f=document.querySelector(selector);for(const [key,value]of Object.entries(values)){f.elements[key].value=value;f.elements[key].dispatchEvent(new Event('input',{bubbles:true}));}f.requestSubmit();},selector,values);
 const clickText=async(selector,text)=>page.evaluate((selector,text)=>{const btn=[...document.querySelectorAll(selector)].find(b=>b.textContent===text);if(!btn)throw Error('No button '+text);btn.click();},selector,text);
 out.checks.seed=await state();
 await page.screenshot({path:`${base}/quality-review/${folder}-desktop.png`,fullPage:true});
 await page.keyboard.press('Tab'); out.checks.firstTab=await page.evaluate(()=>document.activeElement.id);
 await fillForm('#item-form',{name:'Audit Widget',quantity:'5',price:'2.50'});
 await page.type('#product-search','audit'); out.checks.search=await page.$eval('#item-list',e=>e.innerText);
 await clickText('#item-list button','Edit');out.checks.editFocus=await page.evaluate(()=>document.activeElement.name);
 await fillForm('.edit-form',{name:'Audit Widget Edited',quantity:'6',price:'3.25'});
 await clickText('#item-list button','Add to cart');
 await page.evaluate(()=>{const q=document.querySelector('#cart-list input');q.value='3';q.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.reload();out.checks.cartReload=await state();
 // Reprice and lower stock while cart holds three units.
 await page.type('#product-search','audit');await clickText('#item-list button','Edit');
 await fillForm('.edit-form',{name:'Audit Widget Edited',quantity:'2',price:'4.00'});
 out.checks.stockAndReprice=await state();
 out.checks.invalidQty=[];
 for(const value of ['0','1.5','99']) {await page.evaluate(value=>{const q=document.querySelector('#cart-list input');q.value=value;q.dispatchEvent(new Event('change',{bubbles:true}));},value);out.checks.invalidQty.push({value,state:await state()});}
 await clickText('#cart-list button','Remove');out.checks.remove=await state();
 // Actual keyboard action demonstrates focus behavior after rerender.
 const add=await page.$('#item-list button');await add.focus();await page.keyboard.press('Enter');
 out.checks.keyboardAddFocus=await page.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id}));
 await page.evaluate(()=>{const q=document.querySelector('#cart-list input');q.value='2';q.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.screenshot({path:`${base}/quality-review/${folder}-cart.png`,fullPage:true});
 await page.click('#checkout-button');out.checks.checkout=await state();
 await page.reload();out.checks.checkoutReload=await state();
 await page.type('#product-search','audit');await clickText('#item-list button','Delete');out.checks.deleted=await state();
 // Safe rendering and product removal from an active cart.
 const payload='<img src=x onerror=alert(1)>';
 await fillForm('#item-form',{name:payload,quantity:'3',price:'1.00'});
 await page.click('#clear-search');
 await page.evaluate(()=>{const r=[...document.querySelectorAll('#item-list .item-row')].at(-1);r.querySelector('button').click();});
 out.checks.safeText=await page.evaluate(()=>({images:document.querySelectorAll('#item-list img').length,text:document.querySelector('#item-list').innerText}));
 await page.evaluate(()=>{const r=[...document.querySelectorAll('#item-list .item-row')].at(-1);[...r.querySelectorAll('button')].find(b=>b.textContent==='Delete').click();});out.checks.deletedCart=await state();
 await page.setViewport({width:390,height:844});
 await page.screenshot({path:`${base}/quality-review/${folder}-mobile.png`,fullPage:true});
 out.checks.mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 // Unhandled ordinary CRUD failed write: keep submitted inputs, inventory unchanged.
 await page.evaluate(()=>{window.nativeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='inventory-products')throw new DOMException('Audit write failed','QuotaExceededError');return window.nativeSetItem.call(this,k,v);};});
 await fillForm('#item-form',{name:'Failed write product',quantity:'3',price:'1.00'});
 out.checks.failedCrudWrite=await page.evaluate(()=>({products:InventoryStore.getProducts(),input:document.querySelector('#item-name').value,message:document.querySelector('#checkout-message').textContent,body:document.body.innerText}));
 await page.evaluate(()=>Storage.prototype.setItem=window.nativeSetItem);
 await page.evaluate(()=>document.querySelector('#item-list button').click());
 const before=await state();
 // Failure happens on the third checkout write, after order and inventory persisted.
 await page.evaluate(()=>{Storage.prototype.setItem=function(k,v){if(k==='inventory-cart'&&v==='[]')throw new DOMException('Audit cart write failed','QuotaExceededError');return window.nativeSetItem.call(this,k,v);};});
 await page.click('#checkout-button');out.checks.failedCheckoutWrite={before,after:await state()};
 await page.evaluate(()=>Storage.prototype.setItem=window.nativeSetItem);
 await page.reload();out.checks.failedCheckoutReload=await state();
 // Keyboard Cancel returns focus to body.
 await page.evaluate(()=>[...document.querySelectorAll('#item-list button')].find(b=>b.textContent==='Edit').click());
 out.checks.mobileEdit=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 await page.screenshot({path:`${base}/quality-review/${folder}-mobile-edit.png`,fullPage:true});
 await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
 out.checks.cancelFocusBefore=await page.evaluate(()=>document.activeElement.textContent);await page.keyboard.press('Enter');out.checks.cancelFocusAfter=await page.evaluate(()=>document.activeElement.tagName);
 await fs.writeFile(`${base}/quality-review/${folder}-probe-results.json`,JSON.stringify(out,null,2));
 console.log(JSON.stringify(out,null,2));
} finally {await browser.close();await fs.rm(profile,{recursive:true,force:true});}
