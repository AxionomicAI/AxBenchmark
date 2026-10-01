import puppeteer from '/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs/promises';
const dir='/Users/mike-axionomic/Downloads/comparison/quality-review/ryzen7-8745hs-qwen36-35b';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:await fs.mkdtemp('/tmp/qwen36-review-')});
const report={errors:[],dialogs:[]};
try{
const page=await browser.newPage(); await page.setViewport({width:1440,height:1000});
page.on('pageerror',e=>report.errors.push(e.message));page.on('dialog',async d=>{report.dialogs.push(d.message());await d.accept();});
await page.goto('file:///Users/mike-axionomic/Downloads/comparison/ryzen7-8745hs-qwen36-35b/index.html');
const state=()=>page.evaluate(()=>({items:JSON.parse(localStorage.getItem('inventory_items')),cart:JSON.parse(localStorage.getItem('inventory_cart')),orders:localStorage.getItem('inventory_orders')}));
report.initial=await state();await page.screenshot({path:dir+'-desktop.png'});
await page.click('#addItemBtn');await page.type('#itemName','Review Widget');await page.type('#itemCategory','Review');await page.type('#itemQuantity','4');await page.type('#itemDescription','Audit description');await page.click('#submitBtn');
report.created=(await state()).items.find(x=>x.name==='Review Widget');
await page.click('.edit-btn');await page.$eval('#itemName',e=>e.value='Review Edited');await page.$eval('#itemQuantity',e=>e.value='3');await page.click('#submitBtn');report.edited=(await state()).items.find(x=>x.name==='Review Edited');
await page.type('#searchInput','Review Edited');report.search=await page.$$eval('.item-card',els=>els.map(x=>x.innerText));
await page.click('.add-to-cart-btn');report.afterAdd=await state();
await page.click('.view-btn');await page.click('.quick-view-add-to-cart-btn');report.afterQuickAdd=await state();
await page.click('#cartToggleBtn');await page.screenshot({path:dir+'-cart.png'});report.cartVisible=await page.$eval('#cartModal',e=>e.innerText);await page.keyboard.press('Escape');report.cartEscapeDisplay=await page.$eval('#cartModal',e=>e.style.display);await page.click('#closeCartBtn');
await page.click('#orderHistoryBtn');report.ordersClick=await page.evaluate(()=>({itemModal:document.querySelector('#itemModal').style.display,title:document.querySelector('#modalTitle').innerText,name:document.querySelector('#itemName').value,ordersModal:document.querySelector('#orderHistoryModal').style.display}));await page.keyboard.press('Escape');
await page.click('#clearSearchBtn');await page.reload();report.reload=await state();
await page.click('#addItemBtn');report.focusOpened=await page.evaluate(()=>document.activeElement.id);await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.up('Shift');report.focusEscaped=await page.evaluate(()=>({id:document.activeElement.id,inside:!!document.activeElement.closest('#itemModal')}));
await page.$eval('#itemName',e=>e.value='Fraction');await page.$eval('#itemQuantity',e=>e.value='1.5');await page.click('#submitBtn');report.fraction=await page.$eval('#itemQuantity',e=>({stepMismatch:e.validity.stepMismatch,valid:e.validity.valid}));await page.keyboard.press('Escape');
await page.type('#searchInput','Review Edited');await page.click('.delete-btn');report.deleted=!(await state()).items.some(x=>x.name==='Review Edited');report.emptyCount=await page.evaluate(()=>({count:document.querySelector('#itemCount').innerText,empty:document.querySelector('#emptyState').innerText}));
await page.click('#clearSearchBtn');await page.setViewport({width:390,height:844});await page.screenshot({path:dir+'-mobile.png'});report.mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('button,.item-right')].filter(e=>e.getBoundingClientRect().right>innerWidth).slice(0,8).map(e=>({text:e.innerText,right:e.getBoundingClientRect().right}))}));
await page.click('#addItemBtn');await page.screenshot({path:dir+'-mobile-form.png'});await page.keyboard.press('Escape');
// Secondary diagnostic fixture: stored cart bypasses broken add button; not a normal-flow pass.
await page.evaluate(()=>{const i=JSON.parse(localStorage.getItem('inventory_items'))[0];localStorage.setItem('inventory_cart',JSON.stringify([{id:i.id,name:i.name,price:i.price,quantity:1}]));});await page.reload();report.injectedBefore=await state();await page.click('#cartToggleBtn');report.injectedCart=await page.evaluate(()=>({body:document.querySelector('#cartContent').innerText,qtyControls:document.querySelectorAll('.cart-qty-btn').length,checkoutDisplay:getComputedStyle(document.querySelector('#checkoutBtn')).display,footerDisplay:getComputedStyle(document.querySelector('#cartFooter')).display}));await page.evaluate(()=>document.querySelector('#checkoutBtn').click());report.injectedAfterCheckout=await state();
// Valid empty persisted inventory must stay empty, but this app reseeds.
await page.evaluate(()=>{localStorage.setItem('inventory_items','[]');localStorage.removeItem('inventory_cart');});await page.reload();report.emptyInventoryReload=(await state()).items.length;
await fs.writeFile(dir+'-probe.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
