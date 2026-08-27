import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--disable-dev-shm-usage','--no-sandbox'] });
const p = await b.newPage({viewport:{width:1440,height:900}});
p.on('crash',()=>console.log('*** PAGE CRASH'));
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,150)));
await p.goto('http://localhost:4173/projetos/triwayz.html',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(1500);
console.log('h',await p.evaluate(()=>document.body.scrollHeight));
try{
for (let i=0;i<40;i++){ await p.evaluate((y)=>window.scrollTo(0,y), i*600); await p.waitForTimeout(100); }
console.log('scroll ok');
}catch(e){console.log('ERR',e.message.slice(0,120));}
await b.close();
