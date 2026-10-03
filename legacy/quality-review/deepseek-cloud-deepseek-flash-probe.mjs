import puppeteer from '/Users/mike-axionomic/.npm/_npx/668c188756b835f3/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs';
const out='quality-review/deepseek-cloud-deepseek-flash';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,userDataDir:'/tmp/quality-deepseek-cloud-'+Date.now()});
const report={};
try{
const p=await browser.newPage(); await p.setViewport({width:1440,height:1000});
report.errors=[];p.on('pageerror',e=>report.errors.push(e.message));
await p.goto('file:///Users/mike-axionomic/Downloads/comparison/deepseek-cloud-deepseek-flash/index.html');
await p.screenshot({path:out+'-desktop.png',fullPage:true});
report.initial=await p.evaluate(()=>({items:Inventory.items.all().length,overflow:document.documentElement.scrollWidth>innerWidth}));
await p.keyboard.press('/');report.shortcut=await p.evaluate(()=>document.activeElement.id);
await p.type('#search-input','cable usb');report.search=await p.$$eval('#item-list .item-name',e=>e.map(n=>n.textContent));await p.keyboard.press('Escape');
await p.click('#add-item'); report.formFocus=await p.evaluate(()=>document.activeElement.id);
await p.type('#field-name','Audit Widget');
await p.evaluate(()=>{document.querySelector('#field-category').value='Audit';document.querySelector('#field-quantity').value='5';document.querySelector('#field-price').value='2.50';});
await p.click('#form-submit');
const id=await p.evaluate(()=>Inventory.items.all().find(i=>i.name==='Audit Widget').id);report.created=id;
const row=`#item-list [data-id="${id}"]`;
await p.click(row+' [data-action="edit"]');await p.evaluate(()=>{document.querySelector('#field-name').value='Audit Widget Revised';document.querySelector('#field-price').value='3.25';});await p.click('#form-submit');
report.edit=await p.evaluate(id=>Inventory.items.get(id),id);
await p.click(row+' [data-action="cart"]');await p.click(row+' [data-action="cart"]');
const cart=`#cart-list [data-id="${id}"]`;
await p.click(cart+' [data-action="increase"]');
report.quantity=await p.evaluate(id=>Inventory.cart.get(id),id);await p.reload();report.cartReload=await p.evaluate(id=>Inventory.cart.get(id),id);
await p.click(cart+' [data-action="remove"]');report.removed=await p.$$(cart).then(a=>a.length);
await p.click(row+' [data-action="cart"]');await p.click(cart+' [data-action="increase"]');await p.screenshot({path:out+'-cart.png',fullPage:true});
await p.click('#cart-checkout');report.confirm=await p.$eval('#confirm-message',e=>e.textContent);await p.click('#confirm-delete');
report.checkout=await p.evaluate(id=>({stock:Inventory.items.get(id).quantity,orders:Inventory.orders.all(),cart:Inventory.cart.all(),note:document.querySelector('#cart-note').textContent}),id);
await p.reload();report.persist=await p.evaluate(id=>({stock:Inventory.items.get(id).quantity,orders:Inventory.orders.all().length,cart:Inventory.cart.all()}),id);
await p.click(row+' [data-action="delete"]');await p.click('#confirm-delete');report.delete=await p.evaluate(id=>({item:Inventory.items.get(id),receipt:Inventory.orders.all()[0]}),id);
await p.setViewport({width:390,height:844});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:out+'-mobile.png',fullPage:true});report.mobileOverflow=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
await p.click('#add-item');await p.screenshot({path:out+'-mobile-form.png'});report.mobileForm=await p.evaluate(()=>({dialog:document.querySelector('#item-dialog').getBoundingClientRect().toJSON(),price:document.querySelector('#field-price').getBoundingClientRect().toJSON(),scroll:document.querySelector('#item-dialog').scrollWidth}));await p.keyboard.press('Escape');report.escape=await p.$eval('#item-dialog',e=>e.open);
// Scripted state setup, then genuine keyboard stepper activation at stock limit.
await p.evaluate(()=>{Inventory.items.update('sample-headphones',{quantity:2});Inventory.cart.add('sample-headphones',1);});
await p.focus('#cart-list [data-id="sample-headphones"] [data-action="increase"]');await p.keyboard.press('Enter');report.limitFocus=await p.evaluate(()=>({tag:document.activeElement.tagName,cls:document.activeElement.className,id:document.activeElement.id}));
await p.evaluate(()=>{const q=document.querySelector('.cart-quantity');q.value='1.9';q.dispatchEvent(new Event('change',{bubbles:true}));});report.fraction=await p.evaluate(()=>({lines:Inventory.cart.all(),field:document.querySelector('.cart-quantity').value,note:document.querySelector('#cart-note').textContent}));
await p.evaluate(()=>{const q=document.querySelector('.cart-quantity');q.value='99';q.dispatchEvent(new Event('change',{bubbles:true}));});report.excess=await p.evaluate(()=>({lines:Inventory.cart.all(),note:document.querySelector('#cart-note').textContent}));
await p.evaluate(()=>{const q=document.querySelector('.cart-quantity');q.value='0';q.dispatchEvent(new Event('change',{bubbles:true}));});report.zero=await p.evaluate(()=>({lines:Inventory.cart.all(),field:document.querySelector('.cart-quantity').value}));
await p.evaluate(()=>Inventory.items.update('sample-headphones',{quantity:1}));await p.click('#cart-checkout');report.reducedStock=await p.evaluate(()=>({open:document.querySelector('#confirm-dialog').open,note:document.querySelector('#cart-note').textContent,orders:Inventory.orders.all().length}));
await p.evaluate(()=>Inventory.items.remove('sample-headphones'));await p.click('#cart-checkout');report.deletedCart=await p.evaluate(()=>({open:document.querySelector('#confirm-dialog').open,note:document.querySelector('#cart-note').textContent}));
// Fault injection: reject only inventory writes; then unrelated cart write.
report.partialWrite=await p.evaluate(()=>{Inventory.cart.clear();Inventory.cart.add('sample-wireless-mouse',2);const before=Inventory.items.get('sample-wireless-mouse').quantity;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='inventory.items')throw new DOMException('Audit fault','QuotaExceededError');return original.call(this,k,v)};const result=Inventory.orders.checkout();const warningAfterCheckout=!document.querySelector('#save-warning').hidden;Inventory.cart.add('sample-usb-c-cable',1);const warningAfterCart=!document.querySelector('#save-warning').hidden;Storage.prototype.setItem=original;return {result:result.saved,before,memory:Inventory.items.get('sample-wireless-mouse').quantity,persisted:JSON.parse(localStorage.getItem('inventory.items')).items.find(i=>i.id==='sample-wireless-mouse').quantity,warningAfterCheckout,warningAfterCart};});
await p.reload();report.partialReload=await p.evaluate(()=>({stock:Inventory.items.get('sample-wireless-mouse').quantity,orders:Inventory.orders.all().length,warning:!document.querySelector('#save-warning').hidden}));
// Fault injection: corrupt collection remains preserved but no read failure UI.
await p.evaluate(()=>localStorage.setItem('inventory.items','{oops'));await p.reload();report.corrupt=await p.evaluate(()=>({items:Inventory.items.all().length,raw:localStorage.getItem('inventory.items'),warning:!document.querySelector('#save-warning').hidden}));
fs.writeFileSync(out+'-probe.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
