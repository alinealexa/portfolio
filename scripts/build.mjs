/* ============================================================
   BUILD
   content/  →  dist/
   Lê site.yml e cada pasta de projeto, otimiza as imagens e gera
   o site estático pronto para o Netlify.
   ============================================================ */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { marked } from 'marked';

import { processImage, imgTag, isImage, isVideo } from './images.mjs';
import * as T from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const imgCache = new Map();

/* ---------- utilidades ---------- */

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function readDirSafe(p) {
  try { return await fs.readdir(p, { withFileTypes: true }); } catch { return []; }
}

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  return { data: yaml.load(m[1]) || {}, body: m[2] || '' };
}

/* ---------- projetos ---------- */

async function loadProject(dir, slugFromDir) {
  const mdPath = path.join(dir, 'projeto.md');
  if (!(await exists(mdPath))) return null;

  const raw = await fs.readFile(mdPath, 'utf8');
  const { data, body } = parseFrontMatter(raw);

  const slug = String(data.slug || slugFromDir)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const imagesDir = path.join(dir, 'images');
  const outDir = path.join(DIST, 'assets', 'img', slug);
  const publicBase = `../assets/img/${slug}`;

  // Índice de todas as imagens da pasta, pelo nome do arquivo.
  const files = (await readDirSafe(imagesDir)).filter((d) => d.isFile());
  const byName = new Map();
  for (const f of files) {
    if (!isImage(f.name)) continue;
    byName.set(f.name, path.join(imagesDir, f.name));
  }
  const ordered = [...byName.keys()].sort();

  const resolve = async (ref) => {
    if (!ref) return null;
    const name = path.basename(String(ref));
    const src = byName.get(name);
    if (!src) {
      console.warn(`  ! imagem não encontrada em ${slug}: ${name}`);
      return null;
    }
    /* SVG fica vetor: o arquivo entra inteiro no HTML. Não pixeliza em
       zoom nenhum e o fundo da página aparece por trás do desenho. */
    if (path.extname(src).toLowerCase() === '.svg') {
      let svg = (await fs.readFile(src, 'utf8'))
        .replace(/<\?xml[^>]*\?>/g, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();

      /* O Illustrator exporta classes genéricas (.st0, .st1…). Inline no
         HTML elas viram globais e um SVG pinta o outro. Cada arquivo ganha
         um prefixo próprio, derivado do nome. */
      const ns = 'v-' + name.replace(/[^a-z0-9]+/gi, '').toLowerCase().slice(0, 12) + '-';
      svg = svg.replace(/\.st(\d+)/g, `.${ns}st$1`)
               .replace(/class="([^"]+)"/g, (_, cls) =>
                 `class="${cls.split(/\s+/).map((c) => (/^st\d+$/.test(c) ? ns + c : c)).join(' ')}"`)
               .replace(/id="Layer_1"/g, `id="${ns}raiz"`);
      return { vetor: svg };
    }
    return processImage(src, outDir, publicBase, imgCache);
  };

  // Capa: a declarada no front matter, ou a primeira da pasta.
  let capaImg = (await resolve(data.capa)) || (ordered.length ? await resolve(ordered[0]) : null);
  if (capaImg?.vetor) { console.warn(`  ! ${slug}: capa em SVG não serve, precisa de imagem 3:4`); capaImg = null; }

  // Abertura: a faixa 21:9 no topo da página do projeto. Nem toda capa
  // sobrevive a esse corte — quando não sobreviver, declare `abertura:`.
  const aberturaImg = (await resolve(data.abertura)) || capaImg;

  /* --- corpo em markdown, com as imagens virando figuras responsivas ---
     Duas imagens na MESMA linha viram um par lado a lado. */
  const placeholders = [];
  let md = body;

  // duas ou mais imagens na MESMA linha viram uma fileira
  md = md.replace(/!\[[^\]]*\]\([^)]+\)(?:[ \t]+!\[[^\]]*\]\([^)]+\))+/g, (bloco) => {
    const itens = [...bloco.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((m) => ({ alt: m[1], src: m[2] }));
    placeholders.push({ kind: 'pair', items: itens });
    return `\n\n%%MEDIA${placeholders.length - 1}%%\n\n`;
  });

  // imagens soltas
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    placeholders.push({ kind: 'single', items: [{ alt, src }] });
    return `\n\n%%MEDIA${placeholders.length - 1}%%\n\n`;
  });

  let html = marked.parse(md, { mangle: false, headerIds: false });

  for (let i = 0; i < placeholders.length; i++) {
    const ph = placeholders[i];
    const resolved = [];
    for (const it of ph.items) {
      resolved.push({ alt: it.alt, img: await resolve(it.src) });
    }

    /* Arquivo chamado `marca-*` é peça de marca em fundo transparente:
       sem cartão, sem corte, sem cantos — ela se dissolve no fundo. */
    const ehMarca = (it) => /(^|\/)marca[-_]/i.test(it.src || '');
    const vetor = (r) => `<figure class="marca marca--vetor"><div class="marca__box">${r.img.vetor}</div></figure>`;

    let out;
    if (ph.kind === 'pair') {
      out = `<div class="pair" style="--n:${resolved.length}">${resolved.map((r, k) => r.img?.vetor ? vetor(r) : r.img
        ? (ehMarca(ph.items[k])
          ? `<figure class="marca${(r.img.ratio || 1) >= 1.6 ? ' marca--larga' : ''}"><div class="marca__box">${imgTag(r.img, { alt: r.alt, sizes: '(min-width:1000px) 32vw, 50vw' })}</div></figure>`
          : `<figure><div class="media media--${resolved.length > 2 ? '1-1' : '3-4'}">${imgTag(r.img, { alt: r.alt, sizes: '(min-width:1000px) 32vw, 50vw' })}</div>${r.alt ? `<figcaption class="meta">${r.alt}</figcaption>` : ''}</figure>`)
        : '').join('')}</div>`;
    } else {
      const r = resolved[0];
      out = r.img?.vetor ? vetor(r) : r.img
        ? (ehMarca(ph.items[0])
          ? `<figure class="marca${(r.img.ratio || 1) >= 1.6 ? ' marca--larga' : ''}"><div class="marca__box">${imgTag(r.img, { alt: r.alt, sizes: '(min-width:1000px) 66vw, 100vw' })}</div></figure>`
          : `<figure><div class="media">${imgTag(r.img, { alt: r.alt, sizes: '(min-width:1000px) 66vw, 100vw' })}</div>${r.alt ? `<figcaption class="meta">${r.alt}</figcaption>` : ''}</figure>`)
        : '';
    }

    html = html.replace(new RegExp(`<p>%%MEDIA${i}%%</p>`), out)
               .replace(`%%MEDIA${i}%%`, out);
  }

  return {
    slug,
    titulo: data.titulo || slugFromDir,
    tituloHome: data.titulo_home || '',
    cliente: data.cliente || '',
    ano: data.ano || '',
    servicos: data.servicos || [],
    creditos: data.creditos || {},
    resumo: data.resumo || '',
    link: data.link || '',
    destaque: Boolean(data.destaque),
    pai: data.pai || '',          // slug do case guarda-chuva, se for capítulo
    soCapa: data.so_capa === true, // aparece na grade, mas ainda não tem página
    filhos: [],
    ordem: typeof data.ordem === 'number' ? data.ordem : 999,
    capaImg,
    aberturaImg,
    html,
  };
}

async function loadProjects() {
  const base = path.join(CONTENT, 'projects');
  const dirs = (await readDirSafe(base)).filter((d) => d.isDirectory());
  const out = [];
  for (const d of dirs) {
    if (d.name.startsWith('_') || d.name.startsWith('.')) continue;
    const p = await loadProject(path.join(base, d.name), d.name);
    if (p) { out.push(p); console.log(`  · projeto: ${p.slug}`); }
  }
  // Ordem manual primeiro; empate desempata pelo ano, mais novo antes.
  out.sort((a, b) => (a.ordem - b.ordem) || (Number(b.ano) - Number(a.ano)));

  /* Capítulos: projeto com `pai` sai do índice geral e passa a viver
     dentro da página do guarda-chuva, como projeto próprio. */
  const porSlug = new Map(out.map((p) => [p.slug, p]));
  for (const p of out) {
    if (!p.pai) continue;
    const mae = porSlug.get(p.pai);
    if (mae) mae.filhos.push(p);
    else console.warn(`  ! ${p.slug}: pai "${p.pai}" não existe`);
  }
  return out;
}

/* ---------- assets ---------- */

async function buildStyles() {
  const dir = path.join(SRC, 'css');
  const files = (await readDirSafe(dir)).filter((f) => f.isFile() && f.name.endsWith('.css'))
    .map((f) => f.name).sort();
  let css = '';
  for (const f of files) {
    css += `\n/* ==== ${f} ==== */\n` + await fs.readFile(path.join(dir, f), 'utf8');
  }
  await fs.mkdir(path.join(DIST, 'assets'), { recursive: true });
  await fs.writeFile(path.join(DIST, 'assets', 'styles.css'), css.trim() + '\n');
  console.log(`  · css: ${files.length} arquivo(s)`);
}

async function buildScripts() {
  await fs.mkdir(path.join(DIST, 'assets'), { recursive: true });
  await fs.copyFile(path.join(SRC, 'js', 'main.js'), path.join(DIST, 'assets', 'main.js'));
}

async function copyMedia() {
  const from = path.join(CONTENT, 'media');
  if (!(await exists(from))) return;
  const to = path.join(DIST, 'assets', 'media');
  await fs.mkdir(to, { recursive: true });
  for (const f of await readDirSafe(from)) {
    if (!f.isFile()) continue;
    if (!isVideo(f.name) && !isImage(f.name)) continue;
    await fs.copyFile(path.join(from, f.name), path.join(to, f.name));
  }
}

async function copyStatic() {
  const from = path.join(ROOT, 'static');
  if (!(await exists(from))) return;
  await fs.cp(from, DIST, { recursive: true });
}

/* ---------- main ---------- */

async function build() {
  console.log('\n_aa.creativestudio — build\n');

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  const site = yaml.load(await fs.readFile(path.join(CONTENT, 'site.yml'), 'utf8')) || {};

  await buildStyles();
  await buildScripts();
  await copyMedia();

  const projects = await loadProjects();
  if (!projects.length) console.warn('  ! nenhum projeto encontrado em content/projects/');

  const raiz = projects.filter((p) => !p.pai);

  await fs.writeFile(path.join(DIST, 'index.html'), T.home({ site, projects: raiz }));
  await fs.writeFile(path.join(DIST, 'projetos.html'), T.projectsIndex({ site, projects: raiz })); 
  await fs.writeFile(path.join(DIST, 'contato.html'), T.contactPage({ site }));

  await fs.mkdir(path.join(DIST, 'projetos'), { recursive: true });
  for (const p of projects) {
    if (p.soCapa) continue;   // só capa: sem página
    // O "próximo" anda entre irmãos: capítulo puxa capítulo, projeto puxa projeto.
    const irmaos = (p.pai
      ? (projects.find((x) => x.slug === p.pai)?.filhos || [p])
      : raiz).filter((x) => !x.soCapa);
    const i = irmaos.findIndex((x) => x.slug === p.slug);
    const next = irmaos.length > 1 ? irmaos[(i + 1) % irmaos.length] : null;
    const mae = p.pai ? projects.find((x) => x.slug === p.pai) : null;
    await fs.writeFile(
      path.join(DIST, 'projetos', `${p.slug}.html`),
      T.projectPage({ site, project: p, next, mae })
    );
  }

  /* Sitemap: a lista de páginas para os buscadores. Sai do próprio build,
     então nunca fica desatualizada. */
  const base = (site.marca?.dominio || '').replace(/\/$/, '');
  if (base) {
    const hoje = new Date().toISOString().slice(0, 10);
    const urls = [
      '', 'projetos.html', 'contato.html',
      ...projects.filter((p) => !p.soCapa).map((p) => `projetos/${p.slug}.html`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>https://${base}/${u}</loc><lastmod>${hoje}</lastmod></url>`).join('\n')}
</urlset>
`;
    await fs.writeFile(path.join(DIST, 'sitemap.xml'), xml);
    console.log(`  · sitemap: ${urls.length} páginas`);
  }

  await copyStatic();

  const comPagina = projects.filter((p) => !p.soCapa).length;
  console.log(`\n  ✓ ${projects.length} projeto(s), ${comPagina} com página, ${comPagina + 3} página(s) → dist/\n`);
}

build().catch((err) => { console.error(err); process.exit(1); });
