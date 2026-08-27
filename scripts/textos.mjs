/* ============================================================
   EXTRAÇÃO DE TEXTO
   Gera .txt com apenas o texto que aparece no site — sem imagem,
   sem marcação, sem HTML. Para revisão palavra por palavra.
   Sai de content/, a mesma fonte que gera o site: o que estiver
   aqui é exatamente o que está no ar.
   ============================================================ */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'textos');

const linha = (c = '─') => c.repeat(66);

/** Markdown → texto corrido. Tira imagens, marca os títulos. */
function limpar(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')              // imagens
    .replace(/^##\s+(.+)$/gm, (_, t) => `\n[ ${t.toUpperCase()} ]\n`)
    .replace(/^#\s+(.+)$/gm, (_, t) => `\n[ ${t.toUpperCase()} ]\n`)
    .replace(/\*\*(.+?)\*\*/g, '$1')                   // grifo azul
    .replace(/\*(.+?)\*/g, '$1')                       // itálico
    .replace(/^>\s?/gm, '')                            // citação
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')           // links
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Desdobra o texto em parágrafos de linhas curtas — mais fácil de
    revisar palavra por palavra do que um bloco corrido.
    Antes de quebrar, junta as linhas do arquivo-fonte: o markdown vem
    quebrado em 76 colunas e reaproveitar essas quebras deixaria
    palavras órfãs no meio da frase. */
function quebrar(txt, largura = 72) {
  const unido = String(txt)
    .replace(/\r/g, '')
    .split(/\n{2,}/)                       // parágrafos de verdade
    .map((par) => par
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => (l.startsWith('[') ? '\n' + l + '\n' : l))
      .join(' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim())
    .join('\n\n');

  return unido.split('\n').map((par) => {
    if (par.trim() === '' || par.startsWith('[')) return par;
    const palavras = par.trim().split(/\s+/);
    const linhas = [];
    let atual = '';
    for (const p of palavras) {
      if ((atual + ' ' + p).trim().length > largura) { linhas.push(atual.trim()); atual = p; }
      else atual += ' ' + p;
    }
    if (atual.trim()) linhas.push(atual.trim());
    return linhas.join('\n');
  }).join('\n');
}

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  return { data: yaml.load(m[1]) || {}, body: m[2] || '' };
}

/* ---------- HOME ---------- */

function textoHome(site) {
  const h = site.hero || {};
  const m = site.metodologia || {};
  const P = [];

  P.push('HOME', linha('═'), '');

  P.push('[ HERO ]', '');
  P.push('Título:', (h.linhas || []).join(' '), '');
  P.push('Frase de posicionamento:', quebrar(h.frase || ''), '');
  P.push(`Linha de topo:  Desde ${h.desde || ''}  ·  ${site.contato?.cidade || ''}`, '');
  P.push('Indicador de rolagem:  Role para ver', '');

  P.push(linha(), '[ TRABALHO SELECIONADO ]', '');
  P.push('Botão:  Ver todos os projetos', '');

  P.push(linha(), '[ STUDIO ]', '');
  P.push('Manifesto (as palavras "soluções criativas" e "marcas fortes e');
  P.push('consistentes" aparecem em azul; o ponto final é um círculo laranja):', '');
  P.push(quebrar(String(site.manifesto || '').replace(/\*\*/g, '')), '');

  P.push(linha(), '[ ÁREAS DE ATUAÇÃO ]', '');
  P.push('Introdução:', quebrar(site.areas_intro || ''), '');
  for (const [i, a] of (site.areas || []).entries()) {
    P.push(`${String(i + 1).padStart(2, '0')}  ${a.nome}`);
    for (const it of a.itens || []) P.push(`      · ${it}`);
    P.push('');
  }

  P.push(linha(), '[ CLIENTES ]', '');
  P.push('(a maioria aparece como logo; sem logo, aparece o nome em texto)', '');
  for (const c of site.clientes || []) {
    const nome = typeof c === 'string' ? c : c.nome;
    const tem = typeof c === 'string' ? false : Boolean(c.logo);
    P.push(`   ${tem ? 'logo ' : 'TEXTO'}  ${nome}`);
  }
  P.push('');

  P.push(linha(), '[ COMO TRABALHAMOS ]', '');
  P.push('Abertura:', quebrar(m.intro || ''), '');
  P.push('Texto de apoio:', quebrar(m.texto || ''), '');
  for (const [i, et] of (m.etapas || []).entries()) {
    P.push(`${String(i + 1).padStart(2, '0')}  ${et.nome}   (${et.movimento || ''})`);
    P.push(quebrar(et.desc || '').split('\n').map((l) => '    ' + l).join('\n'));
    P.push(`    Você recebe:  ${et.entrega || ''}`, '');
  }

  P.push(linha(), '[ RODAPÉ ]', '');
  P.push(`E-mail:     ${site.contato?.email || ''}`);
  P.push(`Cidade:     ${site.contato?.cidade || ''}`);
  P.push(`Navegação:  Início · Projetos · Contato`);
  P.push(`Redes:      ${(site.contato?.redes || []).map((r) => r.nome).join(' · ')}`);
  P.push(`Assinatura: © ${new Date().getFullYear()} ${site.marca?.nome || ''} — Todos os direitos reservados`, '');

  return P.join('\n');
}

/* ---------- CONTATO ---------- */

function textoContato(site) {
  const c = site.contato || {};
  const so = site.sobre || {};
  const P = [];

  P.push('PÁGINA DE CONTATO', linha('═'), '');
  P.push('Título:  Contato');
  P.push(`Cidade:  ${c.cidade || ''}`, '');
  P.push('Frase:', quebrar(c.frase || ''), '');
  P.push(`E-mail (o @ em azul, o ponto do .com em laranja):`, `  ${c.email || ''}`, '');

  P.push(linha(), '[ QUEM FAZ ]', '');
  P.push(quebrar(so.texto || ''), '');
  P.push('À frente do studio:');
  P.push(`  ${so.pessoa?.nome || ''} — ${so.pessoa?.cargo || ''}`, '');
  P.push(quebrar(so.pessoa?.bio || ''), '');
  if (so.extra?.label) {
    P.push('Também nosso:');
    P.push(`  ${so.extra.label}`);
    P.push(quebrar(so.extra.desc || ''), '');
  }
  return P.join('\n');
}

/* ---------- PROJETO ---------- */

function textoProjeto(data, body, slug) {
  const P = [];
  P.push(`PROJETO — ${data.titulo || slug}`, linha('═'), '');
  P.push('[ FICHA ]', '');
  P.push(`Título:        ${data.titulo || ''}`);
  if (data.titulo_home) P.push(`Nome na home:  ${data.titulo_home}`);
  P.push(`Cliente:       ${data.cliente || ''}`);
  P.push(`Ano:           ${data.ano || ''}`);
  P.push(`Serviços:      ${(data.servicos || []).join(' · ')}`);
  for (const [k, v] of Object.entries(data.creditos || {})) {
    P.push(`${(k + ':').padEnd(15)}${(k + ':').length >= 15 ? ' ' : ''}${v}`);
  }
  if (data.link) P.push(`Link:          ${data.link}`);
  P.push('');
  P.push('Resumo (aparece no topo e no compartilhamento):');
  P.push(quebrar(data.resumo || ''), '');
  P.push(linha(), '[ CASE ]', '');
  P.push(quebrar(limpar(body)), '');
  return P.join('\n');
}

/* ---------- main ---------- */

async function run() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const site = yaml.load(await fs.readFile(path.join(CONTENT, 'site.yml'), 'utf8')) || {};

  const arquivos = [];
  const push = async (nome, txt) => {
    await fs.writeFile(path.join(OUT, nome), txt.replace(/\n{3,}/g, '\n\n') + '\n');
    arquivos.push([nome, txt]);
    console.log('  ·', nome);
  };

  await push('00-home.txt', textoHome(site));
  await push('01-contato.txt', textoContato(site));

  // projetos, na mesma ordem em que aparecem no site
  const base = path.join(CONTENT, 'projects');
  const dirs = (await fs.readdir(base, { withFileTypes: true })).filter((d) => d.isDirectory());
  const projetos = [];
  for (const d of dirs) {
    const p = path.join(base, d.name, 'projeto.md');
    try {
      const { data, body } = parseFrontMatter(await fs.readFile(p, 'utf8'));
      projetos.push({ slug: d.name, data, body, ordem: typeof data.ordem === 'number' ? data.ordem : 999 });
    } catch {}
  }
  projetos.sort((a, b) => a.ordem - b.ordem);

  for (const [i, pr] of projetos.entries()) {
    await push(`${String(i + 2).padStart(2, '0')}-${pr.slug}.txt`,
      textoProjeto(pr.data, pr.body, pr.slug));
  }

  // um arquivo com tudo, para ler de cabo a rabo
  const tudo = arquivos.map(([, t]) => t).join('\n\n' + linha('━') + '\n\n');
  await fs.writeFile(path.join(OUT, 'TUDO.txt'),
    `TEXTOS DO SITE — aa. creative studio\nGerado em ${new Date().toISOString().slice(0, 10)}\n\n` +
    linha('━') + '\n\n' + tudo + '\n');
  console.log('  · TUDO.txt');

  console.log(`\n  ✓ ${arquivos.length + 1} arquivos → textos/\n`);
}

run().catch((e) => { console.error(e); process.exit(1); });
