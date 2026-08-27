import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const OUT = '/root/aa-creativestudio/.shots';
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const targets = [
  ['home', 'http://localhost:4173/index.html', 1440, 900, true],
  ['projetos', 'http://localhost:4173/projetos.html', 1440, 900, true],
  ['projeto', 'http://localhost:4173/projetos/kura.html', 1440, 900, true],
  ['contato', 'http://localhost:4173/contato.html', 1440, 900, true],
  ['home-mobile', 'http://localhost:4173/index.html', 390, 844, true],
];

for (const [name, url, w, h, full] of targets) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto(url, { waitUntil: 'networkidle' });
  // dispara todos os reveals
  await page.evaluate(() => new Promise((r) => {
    document.documentElement.style.scrollBehavior = 'auto';
    let y = 0;
    const step = () => {
      y += 300;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(step, 60); else { window.scrollTo(0, 0); setTimeout(r, 500); }
    };
    step();
  }));
  // Antes do fullPage: força tudo a carregar. Em páginas longas o
  // lazy-loading não acompanha o screenshot e sobram caixas cinzas.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    imgs.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(imgs.map((i) => i.complete && i.naturalWidth
      ? Promise.resolve()
      : new Promise((res) => { i.addEventListener('load', res, { once: true });
                               i.addEventListener('error', res, { once: true }); })));
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  if (errors.length) console.log(`[${name}] erros:`, errors.slice(0, 4));
  else console.log(`[${name}] ok`);
  await page.close();
}

await browser.close();
