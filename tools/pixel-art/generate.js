// Gerador de pixel art: `npm run pixel`
// Desenha cada sprite de tools/pixel-art/sprites/ e exporta PNGs para public/assets/,
// além de tools/pixel-art/preview.html (animação em loop, ampliada 4× e no tamanho real do jogo).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import orc from './sprites/orc.js';
import { V1_WALK } from './sprites/orc-v1.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const ASSETS = path.join(ROOT, 'public', 'assets');

// mesmos valores de src/config/visual.js (PIXEL_SCALE e cores do chão)
const PIXEL_SCALE = 2;
const GRASS = '#677444';
const DIRT = '#96795a';

const SPRITES = [orc];

// "Antes × depois" no preview (versões antigas congeladas; não vão para o jogo)
const COMPARE = [
    { title: 'Orc — antes × depois', before: V1_WALK, after: orc.sheets[0].frames, frame: orc.frame }
];

function encodeSheet (frames, frame) {
    const n = frames.length;
    const png = new PNG({ width: frame.w * n, height: frame.h });
    frames.forEach((cv, f) => {
        const rgba = cv.toRGBA();
        for (let y = 0; y < frame.h; y++) {
            for (let x = 0; x < frame.w; x++) {
                const src = (y * frame.w + x) * 4;
                const dst = (y * png.width + f * frame.w + x) * 4;
                for (let k = 0; k < 4; k++) { png.data[dst + k] = rgba[src + k]; }
            }
        }
    });
    return PNG.sync.write(png);
}

// Confere o sombreamento: o tom escuro não deve passar de ~1/3 de cada parte (partes com 20+ px).
function checkShading (name, frames) {
    const worst = new Map();
    for (const cv of frames) {
        for (const st of cv.stats) {
            if (st.total < 20) { continue; }
            const ratio = st.dark / st.total;
            if (!worst.has(st.name) || ratio > worst.get(st.name)) { worst.set(st.name, ratio); }
        }
    }
    const over = [...worst].filter(([, r]) => r > 0.34);
    const max = Math.max(...worst.values());
    console.log(`  sombreamento de "${name}": maior fração escura por parte = ${(max * 100).toFixed(0)}%` +
        (over.length ? ` ⚠️ acima de 34%: ${over.map(([n, r]) => `${n} ${(r * 100).toFixed(0)}%`).join(', ')}` : ' ✓'));
}

// Teste da caminhada: nas linhas das pernas (terço de baixo do quadro), quantos pixels mudam entre quadros.
function checkLegs (file, frames, frame) {
    const y0 = Math.floor(frame.h * 0.68);
    const legs = frames.map((cv) => cv.color.slice(y0 * frame.w));
    let min = Infinity, pair = null;
    for (let i = 0; i < legs.length; i++) {
        for (let j = i + 1; j < legs.length; j++) {
            let d = 0;
            for (let k = 0; k < legs[i].length; k++) { if (legs[i][k] !== legs[j][k]) { d++; } }
            if (d < min) { min = d; pair = [i, j]; }
        }
    }
    console.log(`  pernas em ${file}: menor diferença entre dois quadros = ${min} px (quadros ${pair[0]} e ${pair[1]})` + (min >= 20 ? ' ✓' : ' ⚠️ pouco distintos'));
}

function writeSheet (sheet, frame) {
    const buf = encodeSheet(sheet.frames, frame);
    fs.writeFileSync(path.join(ASSETS, sheet.file), buf);
    if (sheet.meta) {
        // dados por quadro (ex.: posição do olho) para o jogo acompanhar a animação
        const json = { frame: [frame.w, frame.h], frames: sheet.frames.length, ...sheet.meta };
        fs.writeFileSync(path.join(ASSETS, sheet.file.replace(/\.png$/, '.json')), JSON.stringify(json, null, 2) + '\n');
    }
    return { file: sheet.file, frames: sheet.frames.length, width: frame.w * sheet.frames.length, height: frame.h, base64: buf.toString('base64') };
}

function previewHtml (entries, compares) {
    const compareBlocks = compares.map((c) => `
    <section>
      <h2>${c.title}</h2>
      <div class="row">
        <figure><canvas data-src="${c.beforeId}" data-scale="4" data-bg="${GRASS}"></canvas><figcaption>ANTES · 4× · grama</figcaption></figure>
        <figure><canvas data-src="${c.afterId}" data-scale="4" data-bg="${GRASS}"></canvas><figcaption>DEPOIS · 4× · grama</figcaption></figure>
        <figure><canvas data-src="${c.beforeId}" data-scale="${PIXEL_SCALE}" data-bg="${DIRT}"></canvas><figcaption>ANTES · tamanho real · terra</figcaption></figure>
        <figure><canvas data-src="${c.afterId}" data-scale="${PIXEL_SCALE}" data-bg="${DIRT}"></canvas><figcaption>DEPOIS · tamanho real · terra</figcaption></figure>
      </div>
      <figure class="strip"><canvas data-src="${c.beforeId}" data-scale="4" data-bg="${GRASS}" data-strip="1"></canvas><figcaption>ANTES — 8 quadros (4×)</figcaption></figure>
      <figure class="strip"><canvas data-src="${c.afterId}" data-scale="4" data-bg="${GRASS}" data-strip="1"></canvas><figcaption>DEPOIS — 8 quadros (4×)</figcaption></figure>
    </section>`).join('\n');
    const blocks = entries.map((e) => `
    <section>
      <h2>${e.name} — ${e.file} (${e.frames} quadro${e.frames > 1 ? 's' : ''}, ${e.fw}×${e.fh} px)</h2>
      <div class="row">
        <figure><canvas data-src="${e.id}" data-scale="4" data-bg="${GRASS}"></canvas><figcaption>4× · grama</figcaption></figure>
        <figure><canvas data-src="${e.id}" data-scale="4" data-bg="${DIRT}"></canvas><figcaption>4× · terra do caminho</figcaption></figure>
        <figure><canvas data-src="${e.id}" data-scale="${PIXEL_SCALE}" data-bg="${GRASS}"></canvas><figcaption>tamanho real no jogo (${PIXEL_SCALE}×) · grama</figcaption></figure>
        <figure><canvas data-src="${e.id}" data-scale="${PIXEL_SCALE}" data-bg="${DIRT}"></canvas><figcaption>tamanho real no jogo (${PIXEL_SCALE}×) · terra</figcaption></figure>
      </div>
      ${e.frames > 1 ? `<figure class="strip"><canvas data-src="${e.id}" data-scale="4" data-bg="${GRASS}" data-strip="1"></canvas><figcaption>todos os quadros (4×)</figcaption></figure>` : ''}
    </section>`).join('\n');

    const all = [...entries, ...compares.flatMap((c) => [c.beforeData, c.afterData])];
    const data = Object.fromEntries(all.map((e) => [e.id, { src: `data:image/png;base64,${e.base64}`, frames: e.frames, fw: e.fw, fh: e.fh }]));

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Pixel art — preview</title>
<style>
  body { margin: 0; padding: 24px; background: #14100d; color: #f1e6cf; font: 14px/1.4 system-ui, sans-serif; }
  h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 24px 0 8px; color: #c8fdff; }
  p { margin: 0 0 12px; color: #b8a8a0; }
  .row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
  figure { margin: 0; } figcaption { font-size: 12px; color: #b8a8a0; margin-top: 4px; }
  canvas { image-rendering: pixelated; display: block; border: 1px solid #2a1f18; }
</style>
</head>
<body>
<h1>Pixel art — preview</h1>
<p>Gerado por <code>npm run pixel</code>. Animações em loop a 10 quadros/s. "Tamanho real" = ${PIXEL_SCALE} px de tela por pixel da arte (como no mundo 1280×720 do jogo).</p>
${compareBlocks}
${blocks}
<script>
const DATA = ${JSON.stringify(data)};
const images = {};
for (const [id, d] of Object.entries(DATA)) { const img = new Image(); img.src = d.src; images[id] = img; }
const canvases = [...document.querySelectorAll('canvas')];
function setup () {
  for (const cv of canvases) {
    const d = DATA[cv.dataset.src], s = +cv.dataset.scale, pad = 6;
    const strip = cv.dataset.strip === '1';
    cv.width = ((strip ? d.fw * d.frames + (d.frames - 1) * 4 : d.fw) + pad * 2) * s;
    cv.height = (d.fh + pad * 2) * s;
  }
}
function draw (tick) {
  for (const cv of canvases) {
    const d = DATA[cv.dataset.src], img = images[cv.dataset.src], s = +cv.dataset.scale, pad = 6;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = cv.dataset.bg;
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (cv.dataset.strip === '1') {
      for (let f = 0; f < d.frames; f++) {
        ctx.drawImage(img, f * d.fw, 0, d.fw, d.fh, (pad + f * (d.fw + 4)) * s, pad * s, d.fw * s, d.fh * s);
      }
    } else {
      const f = tick % d.frames;
      ctx.drawImage(img, f * d.fw, 0, d.fw, d.fh, pad * s, pad * s, d.fw * s, d.fh * s);
    }
  }
}
let tick = 0;
Promise.all(Object.values(images).map((i) => i.decode())).then(() => {
  setup(); draw(0);
  setInterval(() => draw(++tick), 100);
});
</script>
</body>
</html>
`;
}

const entries = [];
for (const sprite of SPRITES) {
    for (const sheet of sprite.sheets) {
        const out = writeSheet(sheet, sprite.frame);
        entries.push({ ...out, name: sprite.name, id: sheet.file.replace(/\W/g, '_'), fw: sprite.frame.w, fh: sprite.frame.h });
        console.log(`✓ public/assets/${out.file}  (${out.width}×${out.height}, ${out.frames} quadro${out.frames > 1 ? 's' : ''})`);
    }
}
for (const sprite of SPRITES) {
    checkShading(sprite.name, sprite.sheets.flatMap((sh) => sh.frames));
    for (const sh of sprite.sheets) { if (sh.frames.length > 1) { checkLegs(sh.file, sh.frames, sprite.frame); } }
}
const compares = COMPARE.map((c, i) => {
    const mk = (frames, tag) => ({ id: `cmp${i}_${tag}`, base64: encodeSheet(frames, c.frame).toString('base64'), frames: frames.length, fw: c.frame.w, fh: c.frame.h });
    const beforeData = mk(c.before, 'antes'), afterData = mk(c.after, 'depois');
    return { title: c.title, beforeId: beforeData.id, afterId: afterData.id, beforeData, afterData };
});
fs.writeFileSync(path.join(HERE, 'preview.html'), previewHtml(entries, compares));
console.log('✓ tools/pixel-art/preview.html');
