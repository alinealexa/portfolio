import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--disable-dev-shm-usage','--no-sandbox'] });
const p = await b.newPage({viewport:{width:1200,height:900}});
await p.goto('http://localhost:4173/projetos.html',{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('img').forEach(i=>{i.loading='eager';i.decoding='sync';});});
const h=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<h;y+=500){await p.evaluate(v=>window.scrollTo(0,v),y);await p.waitForTimeout(120);}
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(1500);
console.log('pending',await p.evaluate(()=>Array.from(document.images).filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src.split('/').pop())));
await p.setViewportSize({width:1200,height:Math.min(h,12000)}); await p.waitForTimeout(1200);
await p.screenshot({path:'/tmp/s_projetos.png'});
await b.close();
