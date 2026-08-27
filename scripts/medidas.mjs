import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--disable-dev-shm-usage'] });
for (const w of [1440, 1920]) {
  const p = await b.newPage({ viewport:{width:w,height:900} });
  await p.goto('http://localhost:4173/projetos/31-restaurante.html',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const q = (s)=>document.querySelector(s);
    const box = (el)=> el ? Math.round(el.getBoundingClientRect().width) : null;
    return {
      abertura: box(document.querySelector('.media--21-9')),
      corpo: box(document.querySelector('.project-body')),
      figuraLarga: box(document.querySelector('.project-body figure .media')),
      par: box(document.querySelector('.pair[style*="--n:2"] figure .media')),
      fileira: box(document.querySelector('.pair[style*="--n:3"] figure .media')),
    };
  });
  console.log(w, JSON.stringify(r));
  await p.goto('http://localhost:4173/projetos.html',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(300);
  const c = await p.evaluate(()=>Math.round(document.querySelector('.project-card__media').getBoundingClientRect().width));
  console.log(w, 'card:', c);
  await p.close();
}
await b.close();
