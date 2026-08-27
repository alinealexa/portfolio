/* ============================================================
   PIPELINE DE IMAGEM
   Você joga a foto na pasta em qualquer tamanho. Isto aqui gera
   as versões WebP responsivas e devolve o <img srcset> pronto.
   Nada de exportar 6 tamanhos na mão.
   ============================================================ */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

export const WIDTHS = [640, 1024, 1600, 2400, 3200];
const QUALITY = 90;

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.gif', '.svg']);
export const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);

export function isImage(file) { return EXT.has(path.extname(file).toLowerCase()); }
export function isVideo(file) { return VIDEO_EXT.has(path.extname(file).toLowerCase()); }

async function fileHash(file) {
  const buf = await fs.readFile(file);
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
}

/**
 * Processa uma imagem de origem e devolve os dados necessários para
 * montar a tag <img> — incluindo a proporção real, que evita o
 * "pulo" de layout enquanto a foto carrega.
 */
export async function processImage(srcPath, outDir, publicBase, cache) {
  const name = path.basename(srcPath, path.extname(srcPath))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const hash = await fileHash(srcPath);
  const key = `${publicBase}/${name}-${hash}`;

  if (cache.has(key)) return cache.get(key);

  /* GIF animado: vira WebP animado, que pesa uma fração do GIF e roda
     em qualquer navegador. Sem som, é claro — GIF não tem áudio.
     Animação não aceita várias larguras: sai um arquivo só. */
  const ext = path.extname(srcPath).toLowerCase();
  const ehGif = ext === '.gif';
  /* SVG entra como vetor: rasteriza em alta para não sair serrilhado. */
  const ehSvg = ext === '.svg';
  const opcoes = { failOn: 'none', animated: ehGif, ...(ehSvg ? { density: 400 } : {}) };
  const image = sharp(srcPath, opcoes);
  const meta = await image.metadata();
  const quadros = ehGif ? (meta.pages || 1) : 1;
  const animado = quadros > 1;
  const srcWidth = meta.width || WIDTHS[WIDTHS.length - 1];
  const srcHeight = animado
    ? (meta.pageHeight || Math.round((meta.height || 0) / quadros))
    : (meta.height || Math.round(srcWidth * 0.75));

  if (animado) {
    await fs.mkdir(outDir, { recursive: true });
    const largura = Math.min(srcWidth, 1280);
    const file = `${name}-${hash}-anim.webp`;
    const outPath = path.join(outDir, file);
    try { await fs.access(outPath); }
    catch {
      await sharp(srcPath, { failOn: 'none', animated: true })
        .resize({ width: largura, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(outPath);
    }
    const url = `${publicBase}/${file}`;
    const r = {
      src: url, srcset: `${url} ${largura}w`,
      width: srcWidth, height: srcHeight,
      ratio: +(srcWidth / srcHeight).toFixed(4),
    };
    cache.set(key, r);
    return r;
  }

  await fs.mkdir(outDir, { recursive: true });

  // Nunca faz upscale: só gera larguras menores ou iguais à original.
  const widths = WIDTHS.filter((w) => w <= srcWidth);
  if (widths.length === 0) widths.push(srcWidth);

  const sources = [];
  for (const w of widths) {
    const file = `${name}-${hash}-${w}.webp`;
    const outPath = path.join(outDir, file);
    try {
      await fs.access(outPath);
    } catch {
      await sharp(srcPath, ehSvg ? { failOn: 'none', density: 400 } : { failOn: 'none' })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(outPath);
    }
    sources.push({ w, url: `${publicBase}/${file}` });
  }

  const result = {
    src: sources[sources.length - 1].url,
    srcset: sources.map((s) => `${s.url} ${s.w}w`).join(', '),
    width: srcWidth,
    height: srcHeight,
    ratio: +(srcWidth / srcHeight).toFixed(4),
  };

  cache.set(key, result);
  return result;
}

/** Monta a tag <img> completa a partir do resultado de processImage. */
export function imgTag(img, { alt = '', sizes = '100vw', loading = 'lazy', className = '' } = {}) {
  if (!img) return '';
  const cls = className ? ` class="${className}"` : '';
  return `<img${cls} src="${img.src}" srcset="${img.srcset}" sizes="${sizes}" ` +
    `width="${img.width}" height="${img.height}" alt="${escapeAttr(alt)}" ` +
    `loading="${loading}" decoding="async">`;
}

export function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
