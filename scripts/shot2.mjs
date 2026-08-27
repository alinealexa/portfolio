import { chromium } from 'playwright';
const map = {projetos:'projetos.html',home:'index.html',triwayz:'projetos/triwayz.html',ame:'projetos/ame-acessorios.html',afuera:'projetos/afuera.html',lbl:'projetos/los-burritos-de-leo.html',jf:'projetos/jf-pasqua.html',r31:'projetos/31-restaurante.html',blooms:'projetos/blooms.html',pudim:'projetos/doce-pudim.html',loop:'projetos/polar-loop.html',rtb:'projetos/polar-brasil.html'};
const name = process.argv[2];
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--disable-dev-shm-usage','--no-sandbox'] });
const p = await b.newPage({viewport:{width:1200,height:900}, deviceScaleFactor:1});
await p.goto('http://localhost:4173/'+map[name],{waitUntil:'domcontentloaded'});
await p.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
await p.waitForTimeout(700);
const h = await p.evaluate(()=>document.body.scrollHeight);
for (let y=0;y<h;y+=600){ await p.evaluate((v)=>window.scrollTo(0,v), y); await p.waitForTimeout(120); }
await p.waitForTimeout(500);
await p.evaluate(()=>window.scrollTo(0,0));
await p.waitForTimeout(400);
const broken = await p.evaluate(()=>Array.from(document.images).filter(i=>!i.complete||!i.naturalWidth).length);
await p.screenshot({path:`/tmp/s_${name}.png`, fullPage:true});
console.log(name,'h='+h,'imgs-pending='+broken);
await b.close();
