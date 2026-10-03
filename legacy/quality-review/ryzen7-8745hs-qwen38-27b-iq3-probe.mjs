import puppeteer from '/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs/promises';
const folder='ryzen7-8745hs-qwen38-27b-iq3';
const out=`/Users/mike-axionomic/Downloads/comparison/quality-review/${folder}`;
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:`/tmp/review-qwen38-${Date.now()}`});
let report={errors:[],dialogs:[]};
try {
 const p=await browser.newPage();await p.setViewport({width:1440,height:1000});p.on('pageerror',e=>report.errors.push(e.message));p.on('dialog',async d=>{report.dialogs.push(d.message());await d.accept()});
 await p.goto(`file:///Users/mike-axionomic/Downloads/comparison/${folder}/index.html`);
 const state=()=>p.evaluate(()=>({products:JSON.parse(localStorage.getItem('inventory.products')),cart:JSON.parse(localStorage.getItem('inventory.cart')),orders:JSON.parse(localStorage.getItem('inventory.orders')),checkoutHidden:document.querySelector('#checkout-button').hidden,visibleRows:document.querySelectorAll('#items-table tbody tr').length}));
 report.seed=await state();await p.screenshot({path:`${out}-desktop.png`,fullPage:true});
 await p.keyboard.press('Tab');report.firstFocus=await p.evaluate(()=>document.activeElement.outerHTML);
 await p.type('[name=name]','Review Widget');await p.$eval('[name=stock]',e=>e.value='5');await p.$eval('[name=price]',e=>e.value='12.34');await p.click('#form-submit');
 await p.type('#search-input','review WIDGET');report.search=await p.$eval('#items-table tbody',e=>e.innerText);
 await p.click('#items-table tbody tr button:nth-child(2)');report.editFocus=await p.evaluate(()=>document.activeElement.name);
 await p.$eval('[name=name]',e=>e.value='Review Widget Edited');await p.$eval('[name=price]',e=>e.value='15.50');await p.click('#form-submit');
 await p.click('#items-table tbody tr button:first-child');await p.$eval('#cart-table input',e=>{e.value='3';e.dispatchEvent(new Event('change',{bubbles:true}))});report.cartThree=await state();report.total=await p.$eval('#cart-total',e=>e.innerText);
 await p.reload();report.reloadCart=await state();await p.type('#search-input','Review');
 await p.click('#cart-table tbody button');report.remove=await state();await p.click('#items-table tbody tr button:first-child');
 report.checkoutVisibility=await p.$eval('#checkout-button',e=>({hidden:e.hidden,display:getComputedStyle(e).display,rect:e.getBoundingClientRect().toJSON()}));
 await p.screenshot({path:`${out}-cart-desktop.png`,fullPage:true});
 await p.setViewport({width:390,height:844});await p.click('#search-clear');await p.screenshot({path:`${out}-mobile.png`,fullPage:true});report.mobile=await p.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,cartRight:document.querySelector('#cart-table').getBoundingClientRect().right}));
 // Checkout is hidden and cannot be reached normally. This diagnostic dispatch is deliberately labelled synthetic.
 await p.evaluate(()=>document.querySelector('#checkout-button').click());report.syntheticCheckout=await state();await p.reload();report.syntheticCheckoutReload=await state();
 await p.setViewport({width:1440,height:1000});await p.screenshot({path:`${out}-orders-diagnostic.png`,fullPage:true});
 // Browser-native form validity still applies for ordinary submit clicks.
 await p.type('[name=name]','Fractional stock');await p.$eval('[name=stock]',e=>e.value='1.5');await p.click('#form-submit');report.fractionalStockValidity=await p.$eval('[name=stock]',e=>({valid:e.validity.valid,stepMismatch:e.validity.stepMismatch}));await p.evaluate(()=>document.querySelector('#product-form').reset());
 await p.type('#search-input','review');await p.click('#items-table tbody tr button:first-child');await p.$eval('#cart-table input',e=>{e.value='999';e.dispatchEvent(new Event('change',{bubbles:true}))});report.excessCart=await state();await p.evaluate(()=>document.querySelector('#checkout-button').click());report.syntheticExcessCheckout=await state();
 await p.$eval('#cart-table input',e=>{e.value='1.5';e.dispatchEvent(new Event('change',{bubbles:true}))});report.fractionalQuantity=await state();await p.click('#cart-table input');await p.keyboard.press('ArrowUp');report.keyboardQuantityFocus=await p.evaluate(()=>({tag:document.activeElement.tagName,name:document.activeElement.getAttribute('aria-label'),quantity:JSON.parse(localStorage.getItem('inventory.cart'))[0].quantity}));
 await p.$eval('#cart-table input',e=>{e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}))});report.zeroQuantity=await state();
 await p.click('#items-table tbody tr button:first-child');await p.click('#items-table tbody tr button:nth-child(2)');await p.$eval('[name=price]',e=>e.value='20');await p.click('#form-submit');report.cartPriceAfterEdit=await p.$eval('#cart-total',e=>e.innerText);await p.click('#items-table tbody tr button:nth-child(3)');report.deleteInCart=await state();
 await p.click('#search-clear');await p.type('#search-input','hdmi');await p.click('#items-table tbody tr button:first-child');report.zeroStockAdded=await state();
 // Snapshot writes then inject an order-write failure to prove checkout's partial persistence behavior.
 await p.evaluate(()=>{localStorage.setItem('inventory.cart',JSON.stringify([{id:1,quantity:1}]));const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='inventory.orders')throw new DOMException('review quota failure','QuotaExceededError');return old.call(this,k,v)};render()});await p.evaluate(()=>document.querySelector('#checkout-button').click());report.failedOrderWrite=await state();await p.reload();
 await p.evaluate(()=>localStorage.setItem('inventory.products','[null]'));await p.reload();report.corruptProductsText=await p.$eval('body',e=>e.innerText);
}finally{await fs.writeFile(`${out}-probe.json`,JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2));
