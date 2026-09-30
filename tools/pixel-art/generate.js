// Gerador de pixel art: `npm run pixel`
// Desenha cada sprite de tools/pixel-art/sprites/ e exporta PNGs para public/assets/,
// além de tools/pixel-art/preview.html (animação em loop, ampliada 4× e no tamanho real do jogo) e
// tools/pixel-art/escolha-orc.html (comparação "B antes × B ajustado" do orc padrão).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import orc from './sprites/orc.js';
import orcB from './sprites/orc-b.js';
import brutamontes from './sprites/futuros/brutamontes.js';
import ciborgue from './sprites/futuros/ciborgue.js';
import { B1_WALK, B1_IDLE, B1_FRAME } from './legacy/orc-b-v1.js';
import { escolhaHtml } from './escolha.js';
import { ORC_VARIANTS } from '../../src/config/art.js';
import { BALANCE } from '../../src/config/balance.js';
import { V2_WALK, V2_FRAME } from './legacy/orc-v2.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const ASSETS = path.join(ROOT, 'public', 'assets');

// mesmos valores de src/config/visual.js (PIXEL_SCALE e cores do chão)
const PIXEL_SCALE = 1;
const GRASS = '#677444';
const DIRT = '#96795a';

// orc do jogo (atual da T08 e Saqueador padrão) + arte pronta para inimigos futuros (sprites/futuros/)
const SPRITES = [orc, orcB, brutamontes, ciborgue];

// Página escolha-orc.html: Saqueador como estava na T09 × ajustado na T10 (mesmos pivot, sombra e walkCycle)
const B_BEFORE = { frame: B1_FRAME, sheets: [{ frames: B1_WALK }, { frames: [B1_IDLE] }] };
const ORC_CHOICE = [
    { id: 'b', key: 'antes', label: 'B antes (T09)', sprite: B_BEFORE,
      note: 'Como foi escolhido: magro, lâmina fina, braço mecânico estreito.' },
    { id: 'b', key: 'ajustado', label: 'B ajustado (T10) — padrão', sprite: orcB,
      note: 'Ombros e peito ~15% mais largos, braço mecânico mais grosso com 2 linhas ciano, botas maiores, lâmina ~30% maior com brilho, placa na cabeça.' }
];

// "Antes × depois" no preview (versões antigas congeladas; não vão para o jogo)
const COMPARE = [
    {
        title: 'Orc — 2× antigo (T06) × 1× novo',
        before: { label: '2× ANTIGO', frames: V2_WALK, frame: V2_FRAME, real: 2 },
        after: { label: '1× NOVO', frames: orc.sheets[0].frames, frame: orc.frame, real: 1 }
    }
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
        <figure><canvas data-src="${c.beforeId}" data-scale="${c.beforeReal}" data-bg="${GRASS}"></canvas><figcaption>${c.beforeLabel} · tamanho real · grama</figcaption></figure>
        <figure><canvas data-src="${c.afterId}" data-scale="${c.afterReal}" data-bg="${GRASS}"></canvas><figcaption>${c.afterLabel} · tamanho real · grama</figcaption></figure>
        <figure><canvas data-src="${c.beforeId}" data-scale="${c.beforeReal}" data-bg="${DIRT}"></canvas><figcaption>${c.beforeLabel} · tamanho real · terra</figcaption></figure>
        <figure><canvas data-src="${c.afterId}" data-scale="${c.afterReal}" data-bg="${DIRT}"></canvas><figcaption>${c.afterLabel} · tamanho real · terra</figcaption></figure>
      </div>
      <div class="row">
        <figure><canvas data-src="${c.beforeId}" data-scale="${c.beforeReal * 4}" data-bg="${GRASS}"></canvas><figcaption>${c.beforeLabel} · ampliado 4×</figcaption></figure>
        <figure><canvas data-src="${c.afterId}" data-scale="${c.afterReal * 4}" data-bg="${GRASS}"></canvas><figcaption>${c.afterLabel} · ampliado 4×</figcaption></figure>
      </div>
      <figure class="strip"><canvas data-src="${c.afterId}" data-scale="${c.afterReal * 2}" data-bg="${GRASS}" data-strip="1"></canvas><figcaption>${c.afterLabel} — 8 quadros (2×)</figcaption></figure>
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
    const mk = (side, tag) => ({ id: `cmp${i}_${tag}`, base64: encodeSheet(side.frames, side.frame).toString('base64'), frames: side.frames.length, fw: side.frame.w, fh: side.frame.h });
    const beforeData = mk(c.before, 'antes'), afterData = mk(c.after, 'depois');
    return {
        title: c.title, beforeId: beforeData.id, afterId: afterData.id, beforeData, afterData,
        beforeLabel: c.before.label, afterLabel: c.after.label, beforeReal: c.before.real, afterReal: c.after.real
    };
});
fs.writeFileSync(path.join(HERE, 'preview.html'), previewHtml(entries, compares));
console.log('✓ tools/pixel-art/preview.html');

for (const [id, V] of Object.entries(ORC_VARIANTS)) {
    const sprite = { atual: orc, b: orcB }[id];
    if (sprite && (V.frame[0] !== sprite.frame.w || V.frame[1] !== sprite.frame.h)) {
        console.log(`  ⚠️ ORC_VARIANTS.${id}.frame (${V.frame}) difere do sprite (${sprite.frame.w}×${sprite.frame.h})`);
    }
}
const choice = ORC_CHOICE.map((c) => {
    const V = ORC_VARIANTS[c.id];
    const [walk, idle] = c.sprite.sheets;
    return {
        id: c.key, label: c.label, note: c.note, fw: c.sprite.frame.w, fh: c.sprite.frame.h,
        pivot: V.pivot, walkCycle: V.walkCycle, shadow: V.shadow,
        walk: { base64: encodeSheet(walk.frames, c.sprite.frame).toString('base64'), frames: walk.frames.length },
        idle: { base64: encodeSheet(idle.frames, c.sprite.frame).toString('base64') }
    };
});
fs.writeFileSync(path.join(HERE, 'escolha-orc.html'), escolhaHtml({
    title: 'Orc Cibernético — B antes × B ajustado', variants: choice,
    intro: 'O Saqueador (versão B) é o Orc Cibernético padrão do jogo (<code>ORC_VARIANT = \'b\'</code> em <code>src/config/art.js</code>; ' +
        '<code>?orc=atual</code> na URL mostra o orc da T08). A e C viraram arte para inimigos futuros em <code>sprites/futuros/</code>.',
    speed: BALANCE.enemies.cyberOrc.speed, grass: GRASS, dirt: DIRT
}));
console.log('✓ tools/pixel-art/escolha-orc.html');
