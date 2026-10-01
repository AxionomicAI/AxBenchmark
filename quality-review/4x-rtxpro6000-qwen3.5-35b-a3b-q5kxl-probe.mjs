import puppeteer from '/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs/promises';
const folder='4x-rtxpro6000-qwen3.5-35b-a3b-q5kxl';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:await fs.mkdtemp('/tmp/quality-qwen-')});
const result={errors:[],dialogs:[]};
try {
const page=await browser.newPage();
page.on('pageerror',e=>result.errors.push(e.message));
page.on('dialog',async d=>{result.dialogs.push(d.message());await d.accept();});
await page.setViewport({width:1440,height:1000});
await page.goto('file:///Users/mike-axionomic/Downloads/comparison/'+folder+'/index.html');
result.initial=await page.evaluate(()=>({items:JSON.parse(localStorage.inventory_items).length,rows:document.querySelectorAll('#inventory-body tr').length,scrollWidth:document.documentElement.scrollWidth}));
await page.screenshot({path:`quality-review/${folder}-desktop.png`,fullPage:true});
await page.setViewport({width:390,height:844});
result.mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,table:document.querySelector('#inventory-table').getBoundingClientRect().toJSON(),cart:document.querySelector('#cart-table').getBoundingClientRect().toJSON()}));
await page.screenshot({path:`quality-review/${folder}-mobile.png`,fullPage:true});
await page.setViewport({width:1440,height:1000});
await page.click('#item-name');await page.type('#item-name','Review Widget');await page.keyboard.press('Tab');
result.keyboardNext=await page.evaluate(()=>document.activeElement.id);
await page.type('#item-quantity','10');await page.type('#item-price','2.50');await page.type('#item-category','Audit');
await page.click('#submit-btn');
result.created=await page.evaluate(()=>JSON.parse(localStorage.inventory_items).find(x=>x.name==='Review Widget'));
await page.type('#search-input','  review WIDGET  ');
result.search=await page.$eval('#inventory-body',e=>e.innerText);
await page.click('#inventory-body .btn-edit');
result.editFocus=await page.evaluate(()=>document.activeElement.outerHTML);
await page.$eval('#item-name',e=>e.value='Review Widget Edited');await page.click('#submit-btn');
result.afterEdit=await page.evaluate(()=>({rows:document.querySelectorAll('#inventory-body tr').length,search:document.querySelector('#search-input').value,item:JSON.parse(localStorage.inventory_items).find(x=>x.name==='Review Widget Edited')}));
await page.$eval('#search-input',e=>{e.value='Review Widget Edited';e.dispatchEvent(new Event('input'));});
await page.click('#inventory-body .btn-add-to-cart');
await page.click('#cart-body .cart-qty-btn:last-child');
result.cartQty=await page.evaluate(()=>({focus:document.activeElement.tagName,cart:JSON.parse(localStorage.shopping_cart),total:document.querySelector('#cart-total').textContent}));
await page.reload();
result.cartReload=await page.evaluate(()=>({cart:JSON.parse(localStorage.shopping_cart),visible:document.querySelector('#cart-body').innerText}));
await page.click('#cart-body .btn-delete');result.removed=await page.$eval('#cart-body',e=>e.innerText);
await page.$eval('#search-input',e=>{e.value='Review Widget Edited';e.dispatchEvent(new Event('input'));});
await page.click('#inventory-body .btn-add-to-cart');
await page.$eval('.cart-qty-input',e=>{e.value='2';e.dispatchEvent(new Event('change'));});
await page.screenshot({path:`quality-review/${folder}-cart.png`,fullPage:true});
await page.click('#checkout-btn');
result.checkout=await page.evaluate(()=>({item:JSON.parse(localStorage.inventory_items).find(x=>x.name==='Review Widget Edited'),cart:JSON.parse(localStorage.shopping_cart),orders:JSON.parse(localStorage.order_history),history:document.querySelector('#orders-body').innerText}));
await page.screenshot({path:`quality-review/${folder}-order.png`,fullPage:true});await page.click('.btn-view-order');
await page.reload();result.historyReload=await page.evaluate(()=>({stored:JSON.parse(localStorage.order_history).length,rows:document.querySelectorAll('#orders-body tr').length,message:document.querySelector('#no-orders-message').innerText}));
await page.click('#view-all-orders');result.historyClick=await page.$eval('#orders-body',e=>e.innerText);
// Cart after a price edit: only ordinary form and cart controls.
await page.$eval('#search-input',e=>{e.value='Review Widget Edited';e.dispatchEvent(new Event('input'));});await page.click('#inventory-body .btn-add-to-cart');await page.click('#inventory-body .btn-edit');await page.$eval('#item-price',e=>e.value='7');await page.click('#submit-btn');
result.cartAfterReprice=await page.$eval('#cart-total',e=>e.textContent);await page.click('#checkout-btn');result.repricedOrder=await page.evaluate(()=>JSON.parse(localStorage.order_history)[0]);
await page.$eval('#search-input',e=>{e.value='Review Widget Edited';e.dispatchEvent(new Event('input'));});await page.click('#inventory-body .btn-add-to-cart');
await page.$eval('.cart-qty-input',e=>{e.value='0';e.dispatchEvent(new Event('change'));});result.zeroQuantity=await page.evaluate(()=>({shown:document.querySelector('.cart-qty-input').value,saved:JSON.parse(localStorage.shopping_cart)[0].quantity,total:document.querySelector('#cart-total').textContent}));
await page.$eval('.cart-qty-input',e=>{e.value='1.7';e.dispatchEvent(new Event('change'));});result.fractionQuantity=await page.evaluate(()=>({shown:document.querySelector('.cart-qty-input').value,saved:JSON.parse(localStorage.shopping_cart)[0].quantity}));
await page.$eval('.cart-qty-input',e=>{e.value='999';e.dispatchEvent(new Event('change'));});await page.click('#checkout-btn');result.excess=await page.evaluate(()=>({stock:JSON.parse(localStorage.inventory_items).find(x=>x.name==='Review Widget Edited').quantity,orders:JSON.parse(localStorage.order_history).length}));
await page.$eval('.cart-qty-input',e=>{e.value='1';e.dispatchEvent(new Event('change'));});await page.click('#inventory-body .btn-delete');result.deleted=await page.evaluate(()=>({exists:JSON.parse(localStorage.inventory_items).some(x=>x.name==='Review Widget Edited'),cart:JSON.parse(localStorage.shopping_cart)}));await page.click('#checkout-btn');
// Empty inventory reload by genuinely invoking delete controls on every remaining item.
await page.click('#clear-search');while(await page.$('#inventory-body .btn-delete'))await page.click('#inventory-body .btn-delete');result.emptyBefore=await page.evaluate(()=>JSON.parse(localStorage.inventory_items).length);await page.reload();result.emptyAfter=await page.evaluate(()=>JSON.parse(localStorage.inventory_items).length);
// Attribute-decoding edge from a user-entered name; harmless marker only.
await page.type('#item-name','&quot;+(window.__reviewMarker=1)+&quot;');await page.type('#item-quantity','1');await page.type('#item-price','1');await page.type('#item-category','Audit');await page.click('#submit-btn');await page.click('#inventory-body tr:last-child .btn-add-to-cart');result.attributeInjection=await page.evaluate(()=>({marker:window.__reviewMarker??null,lastHandler:document.querySelector('#inventory-body tr:last-child .btn-add-to-cart').getAttribute('onclick')}));
// Failure simulation after normal workflows; fresh isolated data for checkout persistence fault.
await page.evaluate(()=>{localStorage.clear();});await page.reload();await page.click('#inventory-body .btn-add-to-cart');await page.evaluate(()=>{const real=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='order_history')throw new DOMException('Review forced quota failure','QuotaExceededError');return real.call(this,k,v);};});await page.click('#checkout-btn');result.failedOrderWrite=await page.evaluate(()=>({stock:JSON.parse(localStorage.inventory_items)[0].quantity,cart:JSON.parse(localStorage.shopping_cart),orders:localStorage.order_history??null}));
await page.reload();await page.evaluate(()=>{localStorage.setItem('inventory_items','{');});await page.reload();result.corrupt=await page.evaluate(()=>({inventory:document.querySelector('#inventory-body').innerText,cart:document.querySelector('#cart-body').innerText}));
console.log(JSON.stringify(result,null,2));await fs.writeFile(`quality-review/${folder}-probe.json`,JSON.stringify(result,null,2));
}finally{await browser.close();}
