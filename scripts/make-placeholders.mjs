/* Gera imagens de marcador de posição para o esqueleto.
   Some assim que as fotos reais entrarem. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sets = {
  'exemplo-identidade': { hues: [[18, 92, 52], [8, 78, 38], [0, 0, 12]], n: 6 },
  'exemplo-direcao-arte': { hues: [[210, 18, 72], [200, 12, 40], [0, 0, 92]], n: 5 },
  'exemplo-digital': { hues: [[28, 88, 58], [16, 72, 46], [0, 0, 96]], n: 5 },
};

const svg = (w, h, hsl, seed) => {
  const [a, b, c] = hsl;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="g" cx="${30 + (seed * 17) % 45}%" cy="${25 + (seed * 29) % 50}%" r="78%">
      <stop offset="0%" stop-color="hsl(${a[0]},${a[1]}%,${a[2]}%)"/>
      <stop offset="55%" stop-color="hsl(${b[0]},${b[1]}%,${b[2]}%)"/>
      <stop offset="100%" stop-color="hsl(${c[0]},${c[1]}%,${c[2]}%)"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <ellipse cx="${w * (0.3 + (seed % 5) * 0.1)}" cy="${h * (0.35 + (seed % 3) * 0.12)}"
           rx="${w * 0.2}" ry="${h * 0.3}" fill="hsl(${c[0]},${c[1]}%,${c[2]}%)" opacity="0.55"/>
</svg>`;
};

for (const [slug, cfg] of Object.entries(sets)) {
  const dir = path.join(process.cwd(), 'content', 'projects', slug, 'images');
  await fs.mkdir(dir, { recursive: true });
  for (let i = 1; i <= cfg.n; i++) {
    const portrait = i % 3 !== 0;
    const w = portrait ? 1800 : 2400;
    const h = portrait ? 2400 : 1350;
    await sharp(Buffer.from(svg(w, h, cfg.hues, i)))
      .blur(38)
      .jpeg({ quality: 88 })
      .toFile(path.join(dir, `${String(i).padStart(2, '0')}.jpg`));
  }
  console.log('placeholders:', slug, cfg.n);
}
