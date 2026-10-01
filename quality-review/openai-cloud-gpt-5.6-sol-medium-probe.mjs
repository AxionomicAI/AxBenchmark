import puppeteer from '/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs/promises';
const base='/Users/mike-axionomic/Downloads/comparison';
const out=base+'/quality-review/openai-cloud-gpt-5.6-sol-medium';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:'/tmp/quality-gpt56-'+Date.now()});
const results={};
try {
 const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('dialog',async d=>await d.accept());
 await page.setViewport({width:1440,height:1000}); await page.goto('file://'+base+'/openai-cloud-gpt-5.6-sol-medium/index.html');
 const state=()=>page.evaluate(()=>({items:InventoryStore.getAll(),cart:CartStore.getAll(),orders:OrderStore.getAll(),total:document.querySelector('#cart-total').textContent,status:document.querySelector('#app-status').textContent}));
 results.seed=await state(); await page.screenshot({path:out+'-desktop.png',fullPage:true});
 await page.click('#add-product-button'); results.dialogFocus=await page.evaluate(()=>document.activeElement.id); await page.keyboard.press('Escape'); results.escapeFocus=await page.evaluate(()=>({open:document.querySelector('dialog').open,focus:document.activeElement.id}));
 await page.click('#add-product-button'); await page.screenshot({path:out+'-form.png'});
 await page.evaluate(()=>{for(const [id,v] of Object.entries({'product-name':'Review Product','product-sku':'REV-01','product-category':'Review','product-price':'10.25','product-stock':'5'}))document.getElementById(id).value=v;document.querySelector('#product-form').requestSubmit();});
 let id=(await state()).items.find(p=>p.sku==='REV-01').id; results.create=await state();
 await page.click(`[data-action="edit"][data-id="${id}"]`);await page.evaluate(()=>{document.querySelector('#product-name').value='Review Edited';document.querySelector('#product-form').requestSubmit();});
 await page.type('#inventory-search','rev edited');results.search=await page.$$eval('.inventory-item',els=>els.map(e=>e.innerText));await page.click('#clear-search-button');
 await page.click(`[data-action="add-to-cart"][data-id="${id}"]`);await page.evaluate(id=>{const e=document.querySelector(`[data-product-id="${id}"]`);e.value='3';e.dispatchEvent(new Event('change',{bubbles:true}));},id);
 await page.click('[data-action="add-to-cart"][data-id="product-001"]');await page.click('[data-remove-product-id="product-001"]');results.cart=await state();
 await page.reload();results.cartReload=await state();
 for (const q of ['0','99','1.5']) {await page.evaluate(({id,q})=>{const e=document.querySelector(`[data-product-id="${id}"]`);e.focus();e.value=q;e.dispatchEvent(new Event('change',{bubbles:true}));},{id,q});await new Promise(r=>setTimeout(r,30));results['quantity'+q]=await page.evaluate(()=>({cart:CartStore.getAll(),focus:document.activeElement.tagName,status:document.querySelector('#app-status').textContent,hidden:getComputedStyle(document.querySelector('#app-status')).clip}));}
 await page.click(`[data-action="edit"][data-id="${id}"]`);await page.evaluate(()=>{document.querySelector('#product-price').value='12.00';document.querySelector('#product-stock').value='2';document.querySelector('#product-form').requestSubmit();});results.cartAfterEdit=await state();await page.screenshot({path:out+'-cart.png',fullPage:true});
 await page.click('#checkout-button');results.checkout=await state();await page.reload();results.checkoutReload=await state();await page.screenshot({path:out+'-history.png',fullPage:true});
 await page.click(`[data-action="edit"][data-id="${id}"]`);await page.evaluate(()=>{document.querySelector('#product-price').value='22';document.querySelector('#product-stock').value='3';document.querySelector('#product-form').requestSubmit();});await page.click(`[data-action="add-to-cart"][data-id="${id}"]`);await page.click(`[data-action="delete"][data-id="${id}"]`);results.deleteCartAndHistory=await state();
 await page.setViewport({width:390,height:844}); await page.screenshot({path:out+'-mobile.png',fullPage:true});results.mobile=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cartY:document.querySelector('.cart-panel').getBoundingClientRect().top+scrollY}));
 await page.click('#add-product-button');await page.screenshot({path:out+'-mobile-form.png',fullPage:true});await page.keyboard.press('Escape');
 // Genuine keyboard quantity edit tests focus retention.
 await page.click('[data-action="add-to-cart"][data-id="product-001"]');await page.focus('#cart-quantity-product-001');await page.keyboard.press('ArrowUp');results.keyboardAfterArrow=await page.evaluate(()=>({focus:document.activeElement.tagName,id:document.activeElement.id,cart:CartStore.getAll()}));await page.keyboard.press('Tab');results.keyboardQuantity=await page.evaluate(()=>({focus:document.activeElement.tagName,id:document.activeElement.id,cart:CartStore.getAll()}));
 // A single failed order write should roll the earlier inventory write back.
 results.failureBefore=await state();await page.evaluate(()=>{const original=Storage.prototype.setItem;window.restoreWrites=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k==='inventory.orders')throw new DOMException('Probe quota','QuotaExceededError');return original.call(this,k,v);};});await page.click('#checkout-button');results.failedWrite=await state();results.failedWrite.error=await page.$eval('#checkout-error',e=>({hidden:e.hidden,text:e.textContent}));await page.evaluate(()=>restoreWrites());
 // Product text must be inert markup.
 await page.evaluate(()=>{InventoryStore.add({name:'<img src=x onerror="window.auditXss=1">',sku:'XSS',stock:1,price:1});refreshInventory();});results.safeRendering=await page.evaluate(()=>({executed:window.auditXss||false,images:document.querySelectorAll('#inventory-list img').length,text:document.querySelector('#inventory-list').textContent.includes('<img')}));
 // Malformed-but-array inventory entries lack schema validation on load.
 await page.evaluate(()=>localStorage.setItem('inventory.items',JSON.stringify([{id:'bad',name:'Bad item',stock:'5',price:1},{id:'bad2',name:'Bad item 2',stock:'6',price:2}])));await page.reload();results.malformed=await page.evaluate(()=>({summary:document.querySelector('#inventory-summary').textContent,items:InventoryStore.getAll()}));results.pageErrors=errors;
 await fs.writeFile(out+'-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
