// Gerador de pixel art: `npm run pixel`
// Desenha cada sprite de tools/pixel-art/sprites/ e exporta PNGs para public/assets/,
// além de tools/pixel-art/preview.html (animação em loop, ampliada 4× e no tamanho real do jogo) e
// tools/pixel-art/escolha-orc.html (comparação "B antes × B ajustado" do orc padrão).
// Cenário (T12): chão do mapa 1 (public/assets/chao-map01.png, a partir de src/data/map01.js) e
// tools/pixel-art/cena-referencia.png (mapa inteiro com orcs e placeholders de torres/castelo).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import orc from './sprites/orc.js';
import orcB, { drawOrcB, walkPose, IDLE_POSE, WALK_FRAMES, DESIGN } from './sprites/orc-b.js';
import brutamontes from './sprites/futuros/brutamontes.js';
import ciborgue from './sprites/futuros/ciborgue.js';
import { escolhaHtml } from './escolha.js';
import { ORC_VARIANTS } from '../../src/config/art.js';
import { BALANCE } from '../../src/config/balance.js';
import { V2_WALK, V2_FRAME } from './legacy/orc-v2.js';
import { MATERIALS, SINGLE, OUTLINE } from './palette.js';
import { MAP01 } from '../../src/data/map01.js';
import { drawGround, TILE } from './cenario/chao.js';
import { drawScene, drawDecorMap } from './cenario/cena.js';
import { DECOR_KITS, DECOR_ITEMS, decorItemFor } from '../../src/config/decor.js';
import { escolhaDecoracaoHtml } from './escolha-decoracao.js';
import kitA from './sprites/decoracao/kit-a.js';
import kitB from './sprites/decoracao/kit-b.js';
import kitC from './sprites/decoracao/kit-c.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const ASSETS = path.join(ROOT, 'public', 'assets');

// mesmo valor de src/config/visual.js; fundos do preview = tons de base do chão novo
const PIXEL_SCALE = 1;
const GRASS = MATERIALS.grama[2];
const DIRT = MATERIALS.terra[2];

// orc do jogo (atual da T08 e Saqueador padrão) + arte pronta para inimigos futuros (sprites/futuros/)
const SPRITES = [orc, orcB, brutamontes, ciborgue];

// Página escolha-orc.html: Saqueador na escala da T10 (grade 1, ~107 px) × escala da T13 (grade 0,75, ~80 px).
// A versão T10 é o mesmo desenho com escala 1, com os encaixes que ela usava no jogo.
const B_T10 = {
    frame: DESIGN,
    sheets: [{ frames: Array.from({ length: WALK_FRAMES }, (_, i) => drawOrcB(walkPose(i / WALK_FRAMES), 1)) }, { frames: [drawOrcB(IDLE_POSE, 1)] }]
};
const ORC_CHOICE = [
    { id: 'b', key: 't10', label: 'B na T10 (~107 px)', sprite: B_T10, pivot: [61, 110], shadow: [56, 15], walkCycle: 44,
      note: 'Escala anterior: grade 136×110.' },
    { id: 'b', key: 't13', label: 'B na T13 (~80 px) — padrão', sprite: orcB,
      note: 'Mesmo desenho redesenhado na grade 0,75 (quadro 102×83): contorno e detalhes continuam com 1 px.' }
];

// "Antes × depois" no preview (versões antigas congeladas; não vão para o jogo)
const COMPARE = [
    {
        title: 'Orc — 2× antigo (T06) × 1× novo',
        before: { label: '2× ANTIGO', frames: V2_WALK, frame: V2_FRAME, real: 2 },
        after: { label: '1× NOVO', frames: orc.sheets[0].frames, frame: orc.frame, real: 1 }
    }
];

function encodeRGBA (rgba, width, height) {
    const png = new PNG({ width, height });
    png.data.set(rgba);
    return PNG.sync.write(png);
}

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

// Seção do cenário no preview: paleta completa, tiles de grama (sozinhos e emendados) e um recorte do chão.
function groundHtml (g) {
    const swatches = Object.entries(MATERIALS).map(([name, ramp]) => `
      <div class="ramp"><b>${name}</b>${ramp.map((c, i) => `<span style="background:${c}" title="${name}[${i}] ${c}"></span>`).join('')}<code>${ramp.join(' ')}</code></div>`).join('');
    const singles = Object.entries({ contorno: OUTLINE, ...SINGLE }).map(([n, c]) => `<span class="one" style="background:${c}" title="${n} ${c}"></span><code>${n} ${c}</code>`).join(' ');
    return `
    <section>
      <h2>Paleta completa (rampas de 5 tons: 0 mais escuro → 4 mais claro)</h2>
      ${swatches}
      <div class="ramp">${singles}</div>
    </section>
    <section>
      <h2>Chão — ${g.tiles} tiles de grama ${TILE}×${TILE} (4×) e emendados em mosaico (2×)</h2>
      <div class="row">
        <figure><img src="data:image/png;base64,${g.tilesB64}" style="width:${g.tilesW * 4}px"><figcaption>variações 0–${g.tiles - 1} (4×)</figcaption></figure>
        <figure><img src="data:image/png;base64,${g.mosaicB64}" style="width:${g.mosaicW * 2}px"><figcaption>mosaico sorteado (2×)</figcaption></figure>
      </div>
      <h2>Chão do mapa 1 — recorte (3×) e inteiro (1×)</h2>
      <figure><img src="data:image/png;base64,${g.cropB64}" style="width:${g.cropW * 3}px"><figcaption>curva em U: borda irregular, sulcos, pegadas, pedrinhas, tufos e flores</figcaption></figure>
      <figure><img src="data:image/png;base64,${g.fullB64}" style="width:${g.fullW}px"><figcaption>public/assets/chao-map01.png (1280×720, tamanho real)</figcaption></figure>
    </section>`;
}

function previewHtml (entries, compares, ground) {
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
  canvas, img { image-rendering: pixelated; display: block; border: 1px solid #2a1f18; }
  .ramp { display: flex; align-items: center; gap: 2px; margin: 3px 0; } .ramp b { width: 90px; font-weight: 600; }
  .ramp span { width: 26px; height: 18px; display: inline-block; } .ramp span.one { width: 18px; }
  .ramp code { margin: 0 10px 0 8px; color: #8a7a70; font-size: 11px; }
</style>
</head>
<body>
<h1>Pixel art — preview</h1>
<p>Gerado por <code>npm run pixel</code>. Animações em loop a 10 quadros/s. "Tamanho real" = ${PIXEL_SCALE} px de tela por pixel da arte (como no mundo 1280×720 do jogo).</p>
${ground}
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

// Pontos de ancoragem precisam cair DENTRO do quadro (0..largura, 0..altura). Um ponto fora é bug do gerador
// (ex.: T13, olho por quadro calculado com a escala errada) e faz o jogo desenhar brilhos longe do sprite.
function checkPoint (where, p, fw, fh) {
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0 || p.x > fw || p.y > fh) {
        throw new Error(`[pixel] ponto de ancoragem fora do quadro ${fw}×${fh}: ${where} = ${JSON.stringify(p)}`);
    }
}
for (const sprite of SPRITES) {
    for (const sheet of sprite.sheets) {
        for (const [key, val] of Object.entries(sheet.meta || {})) {
            const list = Array.isArray(val) ? val : [val];
            list.forEach((p, i) => checkPoint(`${sheet.file.replace(/\.png$/, '.json')} ${key}${Array.isArray(val) ? `[${i}]` : ''}`, p, sprite.frame.w, sprite.frame.h));
        }
    }
}
// encaixes do manifesto do jogo (px a partir do pivot) também precisam cair dentro do quadro
for (const [id, V] of Object.entries(ORC_VARIANTS)) {
    const [fw, fh] = V.frame, [px, py] = V.pivot;
    checkPoint(`ORC_VARIANTS.${id}.pivot`, { x: px, y: py }, fw, fh);
    for (const name of ['eye', 'hit']) { checkPoint(`ORC_VARIANTS.${id}.${name}`, { x: px + V[name].x, y: py + V[name].y }, fw, fh); }
    checkPoint(`ORC_VARIANTS.${id}.top`, { x: px, y: py + V.top }, fw, fh);
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
// ---------------------------------------------------------------- decoração (T15)
// 3 kits × 10 itens → public/assets/decor-<kit>-<item>.png. Quadro e encaixes vêm de src/config/decor.js.
const KIT_DRAW = { a: kitA, b: kitB, c: kitC };
const decor = {};
for (const [kit, draw] of Object.entries(KIT_DRAW)) {
    decor[kit] = {};
    for (const item of DECOR_ITEMS) {
        const def = DECOR_KITS[kit].items[item];
        const cv = draw[item]();
        if (cv.w !== def.frame[0] || cv.h !== def.frame[1]) {
            throw new Error(`[pixel] decor ${kit}/${item}: desenho ${cv.w}×${cv.h} ≠ frame ${def.frame} de src/config/decor.js`);
        }
        const [fw, fh] = def.frame;
        checkPoint(`DECOR_KITS.${kit}.${item}.pivot`, { x: def.pivot[0], y: def.pivot[1] }, fw, fh);
        if (def.glow) { checkPoint(`DECOR_KITS.${kit}.${item}.glow`, { x: def.pivot[0] + def.glow.x, y: def.pivot[1] + def.glow.y }, fw, fh); }
        // a arte precisa encostar no chão (contorno na última linha) e ter 1 px livre nas laterais e em cima
        const rgba = cv.toRGBA();
        const rowHas = (y) => { for (let x = 0; x < fw; x++) { if (rgba[(y * fw + x) * 4 + 3]) { return true; } } return false; };
        const colHas = (x) => { for (let y = 0; y < fh; y++) { if (rgba[(y * fw + x) * 4 + 3]) { return true; } } return false; };
        if (!rowHas(fh - 1)) { console.log(`  ⚠️ decor ${kit}/${item}: a base não encosta na borda de baixo do quadro`); }
        if (rowHas(0) || colHas(0) || colHas(fw - 1)) { console.log(`  ⚠️ decor ${kit}/${item}: arte encostando na borda do quadro (cortada?)`); }
        fs.writeFileSync(path.join(ASSETS, `decor-${kit}-${item}.png`), encodeRGBA(rgba, fw, fh));
        decor[kit][item] = { cv, rgba, def };
    }
    checkShading(`decoração ${kit}`, Object.values(decor[kit]).map((d) => d.cv));
    console.log(`✓ public/assets/decor-${kit}-*.png  (kit ${kit.toUpperCase()} "${DECOR_KITS[kit].name}", ${DECOR_ITEMS.length} itens)`);
}

// ---------------------------------------------------------------- cenário (T12)
const { img: ground, track, tiles } = drawGround(MAP01);
fs.writeFileSync(path.join(ASSETS, 'chao-map01.png'), encodeRGBA(ground.toRGBA(), ground.w, ground.h));
// dados do mapa usados no desenho: o jogo avisa no console se map01.js mudar sem rodar `npm run pixel`
const groundMeta = { map: MAP01.name, path: MAP01.path, pathWidth: MAP01.pathWidth, cornerRadius: MAP01.cornerRadius };
fs.writeFileSync(path.join(ASSETS, 'chao-map01.json'), JSON.stringify(groundMeta, null, 2) + '\n');
console.log(`✓ public/assets/chao-map01.png  (${ground.w}×${ground.h}, chão do mapa "${MAP01.name}")`);

const orcV = ORC_VARIANTS.b;
const orcRef = { frames: orcB.sheets[0].frames, frame: orcB.frame, pivot: orcV.pivot, shadow: orcV.shadow };
const scene = drawScene(ground, track, MAP01, orcRef);
fs.writeFileSync(path.join(HERE, 'cena-referencia.png'), encodeRGBA(scene, ground.w, ground.h));
console.log('✓ tools/pixel-art/cena-referencia.png  (1280×720)');

// escolha-decoracao.html: cada kit aplicado no mapa inteiro (mesmas posições de map01.js) + itens soltos
fs.mkdirSync(path.join(HERE, 'decoracao'), { recursive: true });
for (const kit of Object.keys(KIT_DRAW)) {
    const placed = MAP01.decorations.map((d) => {
        const item = decorItemFor(d);
        return { x: d.x, y: d.y, rgba: decor[kit][item].rgba, def: decor[kit][item].def };
    });
    fs.writeFileSync(path.join(HERE, 'decoracao', `mapa-${kit}.png`), encodeRGBA(drawDecorMap(ground, track, MAP01, orcRef, placed), ground.w, ground.h));
}
fs.writeFileSync(path.join(HERE, 'escolha-decoracao.html'), escolhaDecoracaoHtml({
    kits: Object.keys(KIT_DRAW).map((id) => ({ id, ...DECOR_KITS[id] })), items: DECOR_ITEMS, grass: GRASS
}));
console.log('✓ tools/pixel-art/escolha-decoracao.html  (+ decoracao/mapa-a|b|c.png)');

// preview: tiles lado a lado, mosaico 8×5 sorteado e recorte do mapa
const tileStrip = new Uint8Array(tiles.length * TILE * TILE * 4);
tiles.forEach((t, v) => {
    const rgba = t.toRGBA();
    for (let y = 0; y < TILE; y++) { tileStrip.set(rgba.subarray(y * TILE * 4, (y + 1) * TILE * 4), (y * tiles.length * TILE + v * TILE) * 4); }
});
const MW = 8 * TILE, MH = 5 * TILE;
const mosaic = new Uint8Array(MW * MH * 4);
for (let ty = 0; ty < 5; ty++) {
    for (let tx = 0; tx < 8; tx++) {
        const rgba = tiles[(tx * 7 + ty * 3 + tx * ty) % tiles.length].toRGBA();
        for (let y = 0; y < TILE; y++) { mosaic.set(rgba.subarray(y * TILE * 4, (y + 1) * TILE * 4), ((ty * TILE + y) * MW + tx * TILE) * 4); }
    }
}
const CROP = { x: 250, y: 380, w: 420, h: 230 };
const full = ground.toRGBA();
const crop = new Uint8Array(CROP.w * CROP.h * 4);
for (let y = 0; y < CROP.h; y++) { crop.set(full.subarray(((CROP.y + y) * ground.w + CROP.x) * 4, ((CROP.y + y) * ground.w + CROP.x + CROP.w) * 4), y * CROP.w * 4); }
const groundSection = groundHtml({
    tiles: tiles.length, tilesW: tiles.length * TILE, tilesB64: encodeRGBA(tileStrip, tiles.length * TILE, TILE).toString('base64'),
    mosaicW: MW, mosaicB64: encodeRGBA(mosaic, MW, MH).toString('base64'),
    cropW: CROP.w, cropB64: encodeRGBA(crop, CROP.w, CROP.h).toString('base64'),
    fullW: ground.w, fullB64: encodeRGBA(full, ground.w, ground.h).toString('base64')
});

fs.writeFileSync(path.join(HERE, 'preview.html'), previewHtml(entries, compares, groundSection));
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
        pivot: c.pivot || V.pivot, walkCycle: c.walkCycle || V.walkCycle, shadow: c.shadow || V.shadow,
        walk: { base64: encodeSheet(walk.frames, c.sprite.frame).toString('base64'), frames: walk.frames.length },
        idle: { base64: encodeSheet(idle.frames, c.sprite.frame).toString('base64') }
    };
});
fs.writeFileSync(path.join(HERE, 'escolha-orc.html'), escolhaHtml({
    title: 'Orc Cibernético — escala T10 × T13', variants: choice,
    intro: 'O Saqueador (versão B) é o Orc Cibernético padrão do jogo (<code>ORC_VARIANT = \'b\'</code> em <code>src/config/art.js</code>; ' +
        '<code>?orc=atual</code> na URL mostra o orc da T08). A e C viraram arte para inimigos futuros em <code>sprites/futuros/</code>.',
    speed: BALANCE.enemies.cyberOrc.speed, grass: GRASS, dirt: DIRT
}));
console.log('✓ tools/pixel-art/escolha-orc.html');
