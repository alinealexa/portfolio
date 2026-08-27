/* ============================================================
   PREVIEW
   Empacota o dist/ inteiro num único arquivo HTML navegável —
   CSS, JS e imagens embutidos — para revisão em qualquer tela.
   Não é o site: é a maquete do site.
   ============================================================ */

import fs from 'node:fs/promises';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

/* A maquete é um HTML único e tem teto de tamanho, então as imagens são
   reencodadas. Estes dois números são o compromisso: acima disso o arquivo
   não sobe. O site de verdade continua servindo o original em alta. */
const LARGURA = Number(process.env.PREVIEW_W || 1600);
const QUALIDADE = Number(process.env.PREVIEW_Q || 78);

const read = (p) => fs.readFile(path.join(DIST, p), 'utf8');

/* --- imagens: troca srcset por um data: URI de 1024px --- */
const dataCache = new Map();
async function toDataUri(rel) {
  if (dataCache.has(rel)) return dataCache.get(rel);
  const abs = path.join(DIST, rel);
  const ext = path.extname(rel).toLowerCase();
  let mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.svg' ? 'image/svg+xml' : 'image/webp';
  let buf = await fs.readFile(abs);
  // A maquete é um arquivo só: reencoda leve, senão não cabe.
  if (ext !== '.svg') {
    try {
      buf = await sharp(buf).resize({ width: LARGURA, withoutEnlargement: true })
        .webp({ quality: QUALIDADE, effort: 4 }).toBuffer();
      mime = 'image/webp';
    } catch {}
  }
  const uri = `data:${mime};base64,${buf.toString('base64')}`;
  dataCache.set(rel, uri);
  return uri;
}

async function inlineImages(html) {
  const tags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  for (const tag of new Set(tags)) {
    const srcM = tag.match(/\bsrc="([^"]+)"/);
    if (!srcM) continue;
    // usa a variante de 1024px para manter o arquivo leve
    const rel = srcM[1].replace(/^(\.\.\/)+/, '').replace(/-(640|1024|2400|3200)\.webp$/, '-1600.webp');
    let uri;
    try { uri = await toDataUri(rel); }
    catch { try { uri = await toDataUri(srcM[1].replace(/^(\.\.\/)+/, '')); } catch { continue; } }
    const replaced = tag
      .replace(/\bsrcset="[^"]*"\s*/, '')
      .replace(/\bsizes="[^"]*"\s*/, '')
      .replace(/\bsrc="[^"]+"/, `src="${uri}"`)
      .replace(/\bloading="lazy"/, 'loading="eager"');
    html = html.split(tag).join(replaced);
  }
  return html;
}

/* --- extrai as partes de uma página --- */
function slice(html, tag) {
  const open = new RegExp(`<${tag}\\b[^>]*>`);
  const m = html.match(open);
  if (!m) return '';
  const start = m.index;
  const end = html.lastIndexOf(`</${tag}>`);
  return html.slice(start, end + tag.length + 3);
}

/* --- reescreve links de arquivo para rotas de hash --- */
function rewriteLinks(html) {
  return html
    .replace(/href="(?:\.\.\/)*index\.html#([^"]+)"/g, 'href="#home" data-jump="$1"')
    .replace(/href="(?:\.\.\/)*index\.html"/g, 'href="#home"')
    .replace(/href="(?:\.\.\/)*projetos\.html"/g, 'href="#projetos"')
    .replace(/href="(?:\.\.\/)*contato\.html"/g, 'href="#contato"')
    .replace(/href="(?:\.\.\/)*projetos\/([^".]+)\.html"/g, 'href="#p-$1"')
    .replace(/href="#trabalho"/g, 'href="#home" data-jump="trabalho"');
}

const views = [
  { id: 'home', file: 'index.html' },
  { id: 'projetos', file: 'projetos.html' },
  { id: 'contato', file: 'contato.html' },
];

const projectFiles = (await fs.readdir(path.join(DIST, 'projetos')))
  .filter((f) => f.endsWith('.html'));
for (const f of projectFiles) {
  views.push({ id: `p-${f.replace(/\.html$/, '')}`, file: `projetos/${f}` });
}

const css = await read('assets/styles.css');
const js = await read('assets/main.js');

let navHtml = '';
let footerHtml = '';
const sections = [];

for (const v of views) {
  let html = await read(v.file);
  html = await inlineImages(html);
  html = rewriteLinks(html);

  if (!navHtml) {
    navHtml = slice(html, 'header') + slice(html, 'div').startsWith('<div class="menu"')
      ? slice(html, 'header')
      : slice(html, 'header');
    const menuM = html.match(/<div class="menu"[\s\S]*?<\/div>\s*(?=<main)/);
    if (menuM) navHtml += menuM[0];
  }
  if (!footerHtml) footerHtml = slice(html, 'footer');

  const main = slice(html, 'main').replace(/^<main[^>]*>/, '').replace(/<\/main>$/, '');
  sections.push(`<section class="view" id="${v.id}" hidden>${main}</section>`);
}

const out = `<title>aa. creative studio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&family=JetBrains+Mono:wght@400&display=swap">
<style>
${css}
/* --- só do preview --- */
:root { color-scheme: light; }
body { background: var(--paper); }
.view[hidden] { display: none; }
.proto {
  position: fixed; left: var(--pad); bottom: var(--s-4); z-index: 300;
  display: inline-flex; align-items: center; gap: var(--s-2);
  padding: 0.5rem 0.85rem; border-radius: var(--r-sm);
  background: color-mix(in srgb, var(--night) 88%, transparent);
  color: var(--ink-inv);
  backdrop-filter: blur(10px);
  font-family: var(--font-mono); font-size: var(--t-meta);
  letter-spacing: var(--tr-meta); text-transform: uppercase;
}
.proto__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
</style>

${navHtml}
<main id="main">
${sections.join('\n')}
</main>
${footerHtml}

<div class="proto"><span class="proto__dot" aria-hidden="true"></span>Protótipo · conteúdo de exemplo</div>

<script>
(function () {
  var views = Array.prototype.slice.call(document.querySelectorAll('.view'));
  function show(id, jump) {
    var target = document.getElementById(id) || views[0];
    views.forEach(function (v) { v.hidden = v !== target; });
    // reinicia as animações de entrada da vista que entrou
    target.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.remove('is-in'); });
    window.dispatchEvent(new Event('view:change'));
    if (jump) {
      var anchor = target.querySelector('#' + jump);
      if (anchor) { anchor.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo(0, 0);
  }
  function route() {
    var id = (location.hash || '#home').slice(1);
    show(id);
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    var jump = a.getAttribute('data-jump');
    if (jump) { ev.preventDefault(); location.hash = a.getAttribute('href'); show('home', jump); }
  });
  window.addEventListener('hashchange', route);
  route();
})();
</script>
<script>
${js}
</script>
<script>
// Reobserva os elementos quando a vista muda.
window.addEventListener('view:change', function () {
  var els = document.querySelectorAll('.view:not([hidden]) [data-reveal]');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var d = parseInt(e.target.getAttribute('data-reveal-delay') || '0', 10);
      setTimeout(function () { e.target.classList.add('is-in'); }, d);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
  els.forEach(function (el) { io.observe(el); });
});
</script>
`;

await fs.writeFile(path.join(ROOT, 'preview.html'), out);
const kb = Math.round(Buffer.byteLength(out) / 1024);
console.log(`  ✓ preview.html — ${views.length} vistas, ${kb} KB`);
