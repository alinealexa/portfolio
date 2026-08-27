/* Gera screenshots com cada região numerada, para revisão. */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const OUT = '/root/aa-creativestudio/.shots';
await fs.mkdir(OUT, { recursive: true });

const badgeCss = `
.rev-badge{position:absolute;z-index:9999;background:#E8451F;color:#fff;
  font:600 15px/1 ui-monospace,Menlo,monospace;padding:7px 9px;border-radius:6px;
  box-shadow:0 2px 10px rgba(0,0,0,.28);letter-spacing:.02em}
.rev-out{outline:1.5px dashed rgba(232,69,31,.55);outline-offset:5px}
`;

async function mark(page, pairs) {
  await page.addStyleTag({ content: badgeCss });
  await page.evaluate((pairs) => {
    document.documentElement.style.scrollBehavior = 'auto';
    for (const [n, sel, nth] of pairs) {
      const els = document.querySelectorAll(sel);
      const el = els[nth || 0];
      if (!el) continue;
      el.classList.add('rev-out');
      const r = el.getBoundingClientRect();
      const b = document.createElement('div');
      b.className = 'rev-badge';
      b.textContent = n;
      b.style.top = (r.top + window.scrollY - 6) + 'px';
      b.style.left = Math.max(4, r.left + window.scrollX - 6) + 'px';
      document.body.appendChild(b);
    }
  }, pairs);
}

async function shoot(browser, name, url, pairs, w = 1440) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise((r) => {
    document.documentElement.style.scrollBehavior = 'auto';
    let y = 0;
    const s = () => { y += 300; window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(s, 50); else { window.scrollTo(0, 0); setTimeout(r, 500); } };
    s();
  }));
  await page.waitForTimeout(500);
  await mark(page, pairs);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await page.close();
  console.log('mapa:', name);
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

await shoot(b, 'mapa-home', 'http://localhost:4173/index.html', [
  ['1', '.nav'],
  ['2', '.hero'],
  ['3', '.hero__foot'],
  ['4', '#trabalho .section-head'],
  ['5', '.project-card'],
  ['6', '#trabalho .btn'],
  ['7', '#estudio'],
  ['8', '.services'],
  ['9', '.method'],
  ['10', '.clients'],
  ['11', '#contato'],
  ['12', 'footer'],
]);

await shoot(b, 'mapa-projeto', 'http://localhost:4173/projetos/polar-grit-x2.html', [
  ['13', 'article > section', 0],
  ['14', '.media--21-9'],
  ['15', '.project-body'],
  ['16', '.project-panel'],
  ['17', '.pair'],
  ['18', '.btn--wide'],
]);

await shoot(b, 'mapa-projetos', 'http://localhost:4173/projetos.html', [
  ['19', 'main > section', 0],
  ['20', '.projects'],
  ['21', '.project-card__head'],
  ['22', '.project-card__sub'],
]);

await shoot(b, 'mapa-mobile', 'http://localhost:4173/index.html', [
  ['23', '.hero'],
  ['24', '.project-card'],
  ['25', '.method'],
  ['26', '#contato'],
], 390);

await b.close();
