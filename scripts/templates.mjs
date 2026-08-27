/* ============================================================
   TEMPLATES — todo o HTML do site mora aqui.
   ============================================================ */

import { imgTag, escapeAttr } from './images.mjs';

const e = escapeAttr;

/* Contador no formato das referências: (01), (04/12) */
const pad = (n) => String(n).padStart(2, '0');
export const counter = (n, total) =>
  total ? `(${pad(n)}/${pad(total)})` : `(${pad(n)})`;

/* Texto com destaque: **assim** vira grifo na cor da marca.
   dotEnd troca o ponto final por um círculo laranja — o mesmo gesto do
   ponto azul do hero e do ponto do logotipo. */
function rich(txt, { dotEnd = false } = {}) {
  let out = e(txt || '').replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');
  if (dotEnd) out = out.replace(/\.\s*$/, '<span class="dot-end" aria-hidden="true"></span>');
  return out;
}

/* E-mail em escala grande: o @ ganha o azul da marca e o ponto do .com
   ganha o laranja. Só cor — o texto continua um endereço de verdade,
   selecionável e copiável. */
function emailRich(email) {
  const txt = String(email || '');
  const at = txt.indexOf('@');
  if (at < 0) return e(txt);

  const local = txt.slice(0, at);
  const dominio = txt.slice(at + 1);
  const ponto = dominio.lastIndexOf('.');
  if (ponto < 0) return `${e(local)}<span class="mail-at">@</span>${e(dominio)}`;

  return `${e(local)}<span class="mail-at">@</span>${e(dominio.slice(0, ponto))}` +
    `<span class="mail-dot">.</span>${e(dominio.slice(ponto + 1))}`;
}

/* ---------- CASCA ---------- */

export function layout({ site, title, description, body, page, depth = 0 }) {
  const up = '../'.repeat(depth);
  const marca = site.marca?.nome || '_aa.creativestudio';

  return `<!doctype html>
<html lang="${e(site.seo?.idioma || 'pt-BR')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#EFEFEC">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&display=swap">
<link rel="stylesheet" href="${up}assets/styles.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip-link" href="#main">Pular para o conteúdo</a>

${nav(site, page, up)}
${mobileMenu(site, up)}

<main id="main">
${body}
</main>

${footer(site, up)}

<script src="${up}assets/main.js" defer></script>
</body>
</html>`;
}

/* Logotipo oficial. Arquivos em static/brand/, quatro versões:
   horizontal e empilhado, em preto e em branco. */
function wordmark(site, up = '', variant = 'horiz-preto', h = 15) {
  const nome = site.marca?.nome || 'aa. creative studio';
  // h = 0 → o tamanho vem do CSS (usado no logotipo grande do rodapé)
  const style = h ? ` style="height:${h}px;width:auto"` : '';
  return `<img src="${up}brand/logo-${variant}.png" alt="${e(nome)}"${style}>`;
}

function nav(site, page, up) {
  const links = [
    { label: 'Projetos', href: `${up}projetos.html`, key: 'projetos' },
    { label: 'Studio', href: `${up}index.html#studio`, key: 'studio' },
    { label: 'Contato', href: `${up}contato.html`, key: 'contato' },
  ];
  return `<header class="nav" data-nav>
  <div class="wrap nav__inner">
    <a class="wordmark" href="${up}index.html" aria-label="${e(site.marca?.nome || '')} — início">${wordmark(site, up, 'horiz-preto', 15)}</a>
    <nav class="nav__links" aria-label="Principal">
      ${links.map((l) => `<a class="nav__link" href="${l.href}"${page === l.key ? ' aria-current="page"' : ''}>${l.label}</a>`).join('\n      ')}
    </nav>
    <button class="nav__toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="menu">
      <span data-menu-label>Menu</span>
    </button>
  </div>
</header>`;
}

function mobileMenu(site, up) {
  return `<div class="menu" id="menu" data-menu aria-hidden="true">
  <div class="row between">
    <a class="wordmark" href="${up}index.html">${wordmark(site, up, 'horiz-preto', 15)}</a>
    <button class="nav__toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="menu" style="display:inline-flex">Fechar</button>
  </div>
  <nav class="menu__list" aria-label="Principal (mobile)">
    <a class="menu__link" href="${up}index.html">Início</a>
    <a class="menu__link" href="${up}projetos.html">Projetos</a>
    <a class="menu__link" href="${up}index.html#studio">Studio</a>
    <a class="menu__link" href="${up}contato.html">Contato</a>
  </nav>
  <p class="meta">${e(site.contato?.email || '')}</p>
</div>`;
}

function footer(site, up) {
  const redes = site.contato?.redes || [];
  return `<footer class="block block--night" style="margin:var(--gutter);margin-top:0;padding-bottom:var(--s-12)">
  <div class="wrap">
    <div class="footer__mark">${wordmark(site, up, 'horiz-branco', 0)}</div>

    <div class="footer__cols" style="margin-top:var(--s-16)">
      <div class="footer__col">
        <p class="meta" style="margin-bottom:var(--s-3)">Contato</p>
        <ul>
          <li><a class="link-slide" href="mailto:${e(site.contato?.email || '')}">${e(site.contato?.email || '')}</a></li>
          <li class="muted">${e(site.contato?.cidade || '')}</li>
        </ul>
      </div>
      <div class="footer__col">
        <p class="meta" style="margin-bottom:var(--s-3)">Navegação</p>
        <ul>
          <li><a class="link-slide" href="${up}index.html">Início</a></li>
          <li><a class="link-slide" href="${up}projetos.html">Projetos</a></li>
          <li><a class="link-slide" href="${up}contato.html">Contato</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <p class="meta" style="margin-bottom:var(--s-3)">Redes</p>
        <ul>
          ${redes.map((r) => `<li><a class="link-slide" href="${e(r.url)}" target="_blank" rel="noopener">${e(r.nome)}</a></li>`).join('\n          ')}
        </ul>
      </div>
    </div>

    <div class="row between" style="margin-top:var(--s-16);gap:var(--s-4);flex-wrap:wrap">
      <p class="meta">© <span data-year>2026</span> ${e(site.marca?.nome || '')}</p>
      <p class="meta">Todos os direitos reservados</p>
    </div>
  </div>
</footer>`;
}

/* ---------- CARTÃO DE PROJETO ---------- */

export function projectCard(p, {
  up = '',
  index = 1,
  usarTituloHome = false,
  comServicos = true,
  sizes = '(min-width:1100px) 33vw, (min-width:700px) 50vw, 100vw',
  span = null,
  ratio = '3-4',
} = {}) {
  const style = span ? ` style="--span:${span}"` : '';
  /* Projeto que ainda não tem página: o cartão aparece, mas não leva a
     lugar nenhum. Melhor mostrar a capa do que esconder o trabalho. */
  const tag = p.soCapa ? 'div' : 'a';
  const href = p.soCapa ? '' : ` href="${up}projetos/${e(p.slug)}.html"`;
  return `<${tag} class="project-card${p.soCapa ? ' project-card--sem-link' : ''}"${href}${style} data-reveal data-reveal-delay="${(index - 1) * 70}">
  <div class="project-card__head">
    <h3 class="project-card__title">${e(usarTituloHome && p.tituloHome ? p.tituloHome : p.titulo)}</h3>
    <span class="meta">${e(p.ano || '')}</span>
  </div>
  <div class="media media--${ratio} project-card__media">
    ${p.capaImg
      ? imgTag(p.capaImg, { alt: `${p.titulo} — ${p.cliente || ''}`, sizes })
      : `<span class="media__empty meta">Imagens em breve</span>`}
  </div>
  ${comServicos ? `<div class="project-card__sub">
    <span class="meta">${e((p.servicos || []).slice(0, 3).join(' / '))}</span>
  </div>` : ''}
</${tag}>`;
}


/* ---------- DUPLO DIAMANTE (vertical) ----------
   Vertical porque ele caminha ao lado do texto: o desenho fica fixo na
   tela enquanto as etapas rolam do lado. Quatro etapas — duas divergem
   (o diamante abre), duas convergem (fecha). Cada quadrante é um grupo
   próprio para acender sozinho quando a etapa é aberta.
   Sem rótulos dentro do desenho: o acordeão ao lado já nomeia tudo. */
function diamondSVG(etapas) {
  const cx = 110;
  const D = [
    { top: 30,  mid: 215, bot: 400 },   // diamante 1
    { top: 440, mid: 625, bot: 810 },   // diamante 2
  ];
  const L = (a, b) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`;

  const quad = [];
  D.forEach((d) => {
    // divergir: do vértice de cima abrindo para os lados
    quad.push([L([cx, d.top], [190, d.mid]), L([cx, d.top], [30, d.mid]), d.mid - 93]);
    // convergir: dos lados fechando no vértice de baixo
    quad.push([L([190, d.mid], [cx, d.bot]), L([30, d.mid], [cx, d.bot]), d.mid + 93]);
  });

  const grupos = quad.map(([a, b, y], i) => `<g class="dia__stage" data-stage="${i}">
      <path d="${a}"/><path d="${b}"/>
      <line class="dia__guide" x1="18" y1="${y}" x2="202" y2="${y}"/>
      <circle class="dia__dot" cx="${cx}" cy="${y}" r="5"/>
    </g>`).join('');

  return `<svg class="dia" viewBox="0 0 220 860" role="img"
    aria-label="Duplo diamante: ${e(etapas.map((x) => x.nome).join(', '))}" data-diamond>
    <line class="dia__axis" x1="${cx}" y1="30" x2="${cx}" y2="810"/>
    ${grupos}
  </svg>`;
}

/* ---------- HOME ---------- */

export function home({ site, projects }) {
  const hero = site.hero || {};
  const destaques = projects.filter((p) => p.destaque);
  const base = destaques.length ? destaques : projects;
  // Em colunas iguais, uma linha incompleta fica visivelmente torta.
  // Mostramos no máximo 6, sempre em múltiplo de 3 quando dá.
  const lista = base.length >= 6 ? base.slice(0, 6)
              : base.length >= 3 ? base.slice(0, 3)
              : base;

  const heroVideo = hero.video
    ? `<video src="assets/media/${e(hero.video)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
    : '';

  const body = `
<div class="topo-branco">
<section class="hero wrap" data-hero>
  <div class="hero__aura" aria-hidden="true"><i></i></div>

  <div class="hero__top">
    <span class="meta">Desde ${e(hero.desde || '')}</span>
    <span class="meta">${e(site.contato?.cidade || '')}</span>
  </div>

  <div class="hero__stage">
    ${heroVideo}
    <h1 class="hero__fill display-xl">${(hero.linhas || ['creative', 'studio'])
      .map((l, i, arr) => e(l) + (i === arr.length - 1 ? '<span class="hero__dot" aria-hidden="true"></span>' : ''))
      .join('<br>')}</h1>
  </div>

  <div class="hero__foot">
    <p class="lead" style="max-width:34ch">${e(hero.frase || '')}</p>
  </div>
</section>

<section class="block" id="trabalho" style="margin:var(--gutter)">
  <div class="wrap">
    <div class="projects">
      ${lista.map((p, i) => projectCard(p, { index: i + 1, usarTituloHome: true, comServicos: false })).join('\n      ')}
    </div>
    <div style="margin-top:var(--s-16);display:flex;justify-content:center">
      <a class="btn btn--ghost" href="projetos.html">Ver todos os projetos</a>
    </div>
  </div>
</section>
</div>

<section class="wrap" id="studio" style="padding-block:var(--section)">
  <div class="section-head" data-reveal>
    <h2 class="meta">Studio</h2>
  </div>

  <p class="display-m" data-reveal style="max-width:22ch">${rich(site.manifesto, { dotEnd: true })}</p>

</section>

<section class="wrap" id="clientes" style="padding-block:var(--s-12) var(--section)">
  <div class="section-head" data-reveal>
    <h2 class="meta">Clientes</h2>
  </div>
  <div class="clients" data-reveal>
    ${(site.clientes || []).map((c) => {
      const nome = typeof c === 'string' ? c : (c.nome || '');
      const logo = typeof c === 'string' ? null : c.logo;
      const escala = typeof c === 'string' ? null : c.escala;
      return `<div class="client">${logo
        ? `<img src="brand/clientes/${e(logo)}" alt="${e(nome)}" loading="lazy" decoding="async"${escala ? ` style="--escala:${escala}"` : ''}>`
        : `<span>${e(nome)}</span>`}</div>`;
    }).join('\n    ')}
  </div>
</section>

<section class="block" style="margin:var(--gutter)">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="meta">Áreas de atuação</h2>
    </div>
    ${site.areas_intro ? `<p class="lead muted" data-reveal style="max-width:52ch;margin-bottom:var(--s-16)">${e(site.areas_intro)}</p>` : ''}
    <div class="services">
      ${(site.areas || []).map((a, i) => `
      <div class="service" data-reveal data-reveal-delay="${i * 60}">
        <span class="meta">${pad(i + 1)}</span>
        <h3 class="service__name">${e(a.nome)}</h3>
        ${a.itens && a.itens.length
          ? `<ul class="service__list">${a.itens.map((it) => `<li>${e(it)}</li>`).join('')}</ul>`
          : `<p class="service__desc">${e(a.desc || '')}</p>`}
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="block" id="metodologia" style="margin:var(--gutter)">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="meta">Como trabalhamos</h2>
    </div>

    <div class="method__intro" data-reveal>
      <p class="lead">${e(site.metodologia?.intro || '')}</p>
      <p class="muted" style="font-size:var(--t-small)">${e(site.metodologia?.texto || '')}</p>
    </div>

    <div class="method__layout">
      <div class="dia__wrap" data-reveal>
        ${diamondSVG(site.metodologia?.etapas || [])}
      </div>

      <div class="method" data-method>
      ${(site.metodologia?.etapas || []).map((et, i) => `
      <div class="method__item" data-method-item data-reveal data-reveal-delay="${i * 60}">
        <button class="method__trigger" type="button" data-method-trigger aria-expanded="false" aria-controls="etapa-${i}">
          <span class="method__num">${pad(i + 1)}</span>
          <span class="method__name">${e(et.nome)}</span>
          <span class="method__sign" aria-hidden="true"></span>
        </button>
        <div class="method__panel" id="etapa-${i}" data-method-panel aria-hidden="true">
          <div>
            <div class="method__body">
              <p>${e(et.desc)}</p>
              <div>
                <p class="meta" style="margin-bottom:var(--s-2)">Você recebe</p>
                <p style="font-size:var(--t-small)">${e(et.entrega || '')}</p>
              </div>
            </div>
          </div>
        </div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>
`;

  return layout({
    site,
    title: site.seo?.titulo || site.marca?.nome,
    description: site.seo?.descricao || '',
    body,
    page: 'home',
  });
}

/* ---------- ÍNDICE DE PROJETOS ---------- */

export function projectsIndex({ site, projects }) {
  const body = `
<section class="wrap" style="padding-top:clamp(7rem,16vh,11rem);padding-bottom:var(--s-16)">
  <div class="row between" style="align-items:flex-end;gap:var(--s-8);flex-wrap:wrap">
    <h1 class="display-l">Projetos</h1>
    <div class="stack" style="gap:var(--s-2);text-align:right;max-width:26ch;margin-left:auto">
      <p class="muted" style="font-size:var(--t-small)">${e(site.seo?.descricao || '')}</p>
    </div>
  </div>
</section>

<section class="block" style="margin:var(--gutter);padding-top:var(--s-16)">
  <div class="wrap">
    <div class="projects">
      ${projects.map((p, i) => projectCard(p, { index: i + 1 })).join('\n      ')}
    </div>
  </div>
</section>
`;

  return layout({
    site,
    title: `Projetos — ${site.marca?.nome}`,
    description: site.seo?.descricao || '',
    body,
    page: 'projetos',
  });
}

/* ---------- PÁGINA DE PROJETO ---------- */

export function projectPage({ site, project: p, next, mae = null }) {
  const up = '../';

  const specs = [
    ['Cliente', e(p.cliente || '—')],
    ['Ano', e(String(p.ano || '—'))],
    ['Serviços', `<ul>${(p.servicos || []).map((s) => `<li>${e(s)}</li>`).join('')}</ul>`],
  ];
  for (const [k, v] of Object.entries(p.creditos || {})) {
    specs.push([k, e(String(v))]);
  }
  if (p.link) {
    specs.push(['Ao vivo', `<a class="link-slide" href="${e(p.link)}" target="_blank" rel="noopener">Ver projeto</a>`]);
  }

  const body = `
<article>
  <section class="wrap" style="padding-top:clamp(7rem,16vh,10rem);padding-bottom:var(--s-12)">
    ${mae
      ? `<a class="meta link-slide" href="${up}projetos/${e(mae.slug)}.html" style="display:inline-block;margin-bottom:var(--s-6)">← ${e(mae.titulo)}</a>`
      : `<p class="meta" style="margin-bottom:var(--s-6)">Projeto</p>`}
    <div class="row between" style="align-items:flex-end;gap:var(--s-8);flex-wrap:wrap">
      <h1 class="display-l">${e(p.titulo)}</h1>
      <span class="meta" style="margin-left:auto">(${e(String(p.ano || ''))})</span>
    </div>
    ${p.resumo ? `<p class="lead muted" style="max-width:40ch;margin-top:var(--s-8)">${e(p.resumo)}</p>` : ''}
  </section>

  ${p.aberturaImg ? `<section class="wrap" style="padding-bottom:var(--section)">
    <div class="media media--21-9" data-reveal>
      ${imgTag(p.aberturaImg, { alt: `${p.titulo} — imagem de abertura`, sizes: '100vw', loading: 'eager' })}
    </div>
  </section>` : ''}

  <section class="wrap" style="padding-bottom:var(--section)">
    <div class="project-layout">
      <div class="project-body">
        ${p.html}
      </div>

      <aside class="project-panel" aria-label="Ficha técnica">
        ${specs.map(([label, value]) => `
        <div class="spec">
          <p class="meta spec__label">${label}</p>
          <div class="spec__value">${value}</div>
        </div>`).join('')}
      </aside>
    </div>
  </section>

  ${p.filhos && p.filhos.length ? `<section class="block" style="margin:var(--gutter);padding-top:var(--s-16)">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <h2 class="meta">Campanhas</h2>
        <span class="meta">${String(p.filhos.length).padStart(2, '0')}</span>
      </div>
      <div class="projects">
        ${p.filhos.map((f, i) => projectCard(f, { up, index: i + 1 })).join('\n        ')}
      </div>
    </div>
  </section>` : ''}

  ${next ? `<section class="wrap" style="padding-bottom:var(--section)">
    <a class="btn btn--wide" href="${up}projetos/${e(next.slug)}.html">
      <span>${mae ? 'Próxima campanha' : 'Próximo projeto'} — ${e(next.titulo)}</span>
    </a>
  </section>` : ''}
</article>
`;

  return layout({
    site,
    title: `${p.titulo} — ${site.marca?.nome}`,
    description: p.resumo || site.seo?.descricao || '',
    body,
    page: 'projetos',
    depth: 1,
  });
}

/* ---------- CONTATO ---------- */

export function contactPage({ site }) {
  const c = site.contato || {};
  const so = site.sobre;

  const body = `
<section class="wrap" style="padding-top:clamp(7rem,16vh,11rem);padding-bottom:var(--section)">
  <div class="row between" style="align-items:flex-end;gap:var(--s-8);flex-wrap:wrap">
    <h1 class="display-l">Contato</h1>
    <span class="meta" style="margin-left:auto">${e(c.cidade || '')}</span>
  </div>

  <p class="lead muted" style="max-width:40ch;margin-top:var(--s-8)">${e(c.frase || '')}</p>

  <a class="contact__mail link-slide" href="mailto:${e(c.email || '')}"
     style="margin-top:var(--s-16)">${emailRich(c.email)}</a>

</section>

${so ? `
<section class="block" style="margin:var(--gutter)">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 class="meta">Quem faz</h2>
      <span class="meta">${e(site.marca?.nome || '')}</span>
    </div>

    <div class="about">
      <div data-reveal>
        <p class="lead muted">${e(so.texto || '')}</p>
      </div>
      <div data-reveal data-reveal-delay="80">
        <p class="meta" style="margin-bottom:var(--s-3)">À frente do studio</p>
        <p class="heading" style="margin-bottom:var(--s-4)">${e(so.pessoa?.nome || '')} <span class="faint">— ${e(so.pessoa?.cargo || '')}</span></p>
        <p class="muted" style="font-size:var(--t-small)">${e(so.pessoa?.bio || '')}</p>
        ${so.extra?.label ? `
        <div class="about__extra">
          <p class="meta" style="margin-bottom:var(--s-2)">Também nosso</p>
          ${so.extra.url
            ? `<a class="link-slide heading" href="${e(so.extra.url)}" target="_blank" rel="noopener">${e(so.extra.label)}</a>`
            : `<p class="heading">${e(so.extra.label)}</p>`}
          <p class="muted" style="font-size:var(--t-small);margin-top:var(--s-2)">${e(so.extra.desc || '')}</p>
        </div>` : ''}
      </div>
    </div>
  </div>
</section>` : ''}
`;

  return layout({
    site,
    title: `Contato — ${site.marca?.nome}`,
    description: c.frase || '',
    body,
    page: 'contato',
  });
}
