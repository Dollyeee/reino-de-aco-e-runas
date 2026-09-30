// Renderização das rodadas da nova técnica (T22) — para a AUTOCRÍTICA do processo (não faz parte do `npm run pixel`).
//   node tools/pixel-art/rodadas/render.mjs conceitos          → rodadas/besta-conceitos.png
//   node tools/pixel-art/rodadas/render.mjs r1 2               → rodadas/besta-r1.png com a base no estágio 2
// Cada imagem: cena no tamanho real (chão do mapa 1, árvore do kit A, orc, a torre com a arma) + a torre ampliada 4×.
// As rodadas são fotos do processo: gerar de novo depois de mudar o desenho sobrescreve a foto.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { base, conceito, head, CONCEITOS } from '../sprites/torres/besta-nova.js';
import { BASES } from '../sprites/torres/besta-bases.js';
import { APOIOS, APOIO_ESCOLHIDO, head as headSolo } from '../sprites/torres/besta-solo.js';
import { TOWER_ART, headFrameFor } from '../../../src/config/towerArt.js';
import { DECOR_KITS } from '../../../src/config/decor.js';
import { ORC_VARIANTS } from '../../../src/config/art.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const A = (f) => PNG.sync.read(fs.readFileSync(path.join(ROOT, 'public', 'assets', f)));
const D = TOWER_ART.laserCrossbow.n;
const [mode, stageArg] = process.argv.slice(2);

const ground = A('chao-map01.png');
const orc = A('orc-b.png'), orcV = ORC_VARIANTS.b;
const tree = A('decor-a-arvore2.png'), treeD = DECOR_KITS.a.items.arvore2;

function canvas (w, h) { const p = new PNG({ width: w, height: h }); p.data.fill(0); return p; }
function blit (dst, src, sx, sy, sw, sh, dx, dy, scale = 1) {
    for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
            const s = ((sy + y) * src.width + sx + x) * 4;
            if (!src.data[s + 3]) { continue; }
            for (let yy = 0; yy < scale; yy++) {
                for (let xx = 0; xx < scale; xx++) {
                    const X = (dx + x) * scale + xx, Y = (dy + y) * scale + yy;
                    if (X < 0 || Y < 0 || X >= dst.width || Y >= dst.height) { continue; }
                    const d = (Y * dst.width + X) * 4;
                    for (let k = 0; k < 4; k++) { dst.data[d + k] = src.data[s + k]; }
                }
            }
        }
    }
}
const rgbaImg = (g) => ({ width: g.w, height: g.h, data: g.toRGBA() });

// cena 1×: recorte do chão (grama + caminho) com árvore, torre e orc
function scene (towerImgs, W = 300, H = 170) {
    const out = canvas(W, H);
    blit(out, ground, 330, 430, W, H, 0, 0);
    const items = [
        { y: 110, draw: () => blit(out, tree, 0, 0, tree.width, tree.height, 40 - treeD.pivot[0], 110 - treeD.pivot[1]) },
        { y: 150, draw: () => blit(out, orc, 0, 0, orc.width, orc.height, 250 - orcV.pivot[0], 150 - orcV.pivot[1]) },
        ...towerImgs.map((t) => ({ y: t.y, draw: t.draw(out) }))
    ];
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    return out;
}

function towerDraw (g, withHead, x, y) {
    const b = rgbaImg(g);
    return (out) => () => {
        blit(out, b, 0, 0, b.width, b.height, x - D.base.pivot[0], y - D.base.pivot[1]);
        if (withHead) {
            const hc = head(headFrameFor(-0.35).angle, 0);
            const h = { width: hc.w, height: hc.h, data: hc.toRGBA() };
            blit(out, h, 0, 0, h.width, h.height, x + D.headMount.x - D.head.pivot[0], y + D.headMount.y - D.head.pivot[1]);
        }
    };
}

function compose (panels, gap = 8) {
    const W = panels.reduce((a, p) => a + p.width + gap, gap), H = Math.max(...panels.map((p) => p.height)) + gap * 2;
    const out = canvas(W, H);
    for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 20; out.data[i + 1] = 16; out.data[i + 2] = 13; out.data[i + 3] = 255; }
    let x = gap;
    for (const p of panels) { blit(out, p, 0, 0, p.width, p.height, x, gap); x += p.width + gap; }
    return out;
}

function zoom (img, cx, cy, w, h, s) {
    const out = canvas(w * s, h * s);
    blit(out, img, Math.max(0, cx - w / 2), Math.max(0, cy - h), w, h, 0, 0, s);
    return out;
}

// T26: Besta solo — node tools/pixel-art/rodadas/render.mjs solo apoios        (3 apoios, estágio 2, com a besta)
//                    node tools/pixel-art/rodadas/render.mjs solo r1 <estágio>  (apoio escolhido: rodada)
if (mode === 'solo') {
    const [rodada, st] = process.argv.slice(3);
    const S = TOWER_ART.laserCrossbow.s;
    const ids = rodada === 'apoios' ? Object.keys(APOIOS) : [APOIO_ESCOLHIDO];
    const stage = rodada === 'apoios' ? 2 : (+st || 4);
    const W = rodada === 'apoios' ? 360 : 260, H = 150;
    const out = canvas(W, H);
    blit(out, ground, 300, 440, W, H, 0, 0);
    blit(out, tree, 0, 0, tree.width, tree.height, 22 - treeD.pivot[0], 100 - treeD.pivot[1]);
    const items = [];
    ids.forEach((id, i) => {
        const x = 95 + i * 95, y = 120;
        const { g, mountY } = APOIOS[id].draw(1, stage);
        items.push({ y, draw: () => {
            blit(out, rgbaImg(g), 0, 0, g.w, g.h, x - S.base.pivot[0], y - S.base.pivot[1]);
            const hc = headSolo(headFrameFor(-0.35).angle, 0);
            blit(out, { width: hc.w, height: hc.h, data: hc.toRGBA() }, 0, 0, hc.w, hc.h, x - S.head.pivot[0], y + mountY - S.head.pivot[1]);
        } });
    });
    // orc logo atrás/ao lado, para conferir que a besta não o esconde
    items.push({ y: 112, draw: () => blit(out, orc, 0, 0, orc.width, orc.height, W - 40 - orcV.pivot[0], 112 - orcV.pivot[1]) });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    const big = zoom(out, W / 2, 140, W, 120, 3);
    const panels = [out, big];
    if (rodada !== 'apoios') {
        // tira de ângulos (cima → frente → baixo), cada um redesenhado pela grade, 3× sobre fundo de terra
        const angs = [-90, -45, 0, 45, 90].map((d) => d * Math.PI / 180), cw = 84, ch = 96;
        const strip = canvas(cw * angs.length, ch);
        blit(strip, ground, 330, 470, strip.width, ch, 0, 0);
        const { g, mountY } = APOIOS[APOIO_ESCOLHIDO].draw(1, stage);
        angs.forEach((ang, i) => {
            const x = cw * i + cw / 2, y = ch - 14;
            blit(strip, rgbaImg(g), 0, 0, g.w, g.h, x - S.base.pivot[0], y - S.base.pivot[1]);
            const hc = headSolo(ang, 1);
            blit(strip, { width: hc.w, height: hc.h, data: hc.toRGBA() }, 0, 0, hc.w, hc.h, x - S.head.pivot[0], y + mountY - S.head.pivot[1]);
        });
        panels.push(zoom(strip, strip.width / 2, ch, strip.width, ch, 2));
    }
    const nome = rodada === 'apoios' ? 'besta-solo-apoios' : `besta-solo-${rodada}`;
    fs.writeFileSync(path.join(HERE, `${nome}.png`), PNG.sync.write(compose(panels)));
    console.log(`✓ rodadas/${nome}.png  (estágio ${stage}: ${ids.map((i) => APOIOS[i].nome).join(' | ')})`);
    process.exit(0);
}

// T24: as 3 bases novas lado a lado — node tools/pixel-art/rodadas/render.mjs bases <rodada> <estágio>
// (rodada "conceitos" = estágio 1). Saída: rodadas/bases-<rodada>.png
if (mode === 'bases') {
    const [rodada, st] = process.argv.slice(3);
    const stage = rodada === 'conceitos' ? 1 : (+st || 4);
    const W = 460, H = 180;
    const out = canvas(W, H);
    blit(out, ground, 280, 420, W, H, 0, 0);
    blit(out, tree, 0, 0, tree.width, tree.height, 20 - treeD.pivot[0], 120 - treeD.pivot[1]);
    const items = [];
    Object.values(BASES).forEach((b, i) => {
        const x = 110 + i * 125, y = 150;
        const { g, mountY } = b.draw(1, stage);
        items.push({ y, draw: () => {
            blit(out, rgbaImg(g), 0, 0, g.w, g.h, x - D.base.pivot[0], y - D.base.pivot[1]);
            const hc = head(headFrameFor(-0.35).angle, 0);
            blit(out, { width: hc.w, height: hc.h, data: hc.toRGBA() }, 0, 0, hc.w, hc.h, x - D.head.pivot[0], y + mountY - D.head.pivot[1]);
        } });
    });
    items.push({ y: 165, draw: () => blit(out, orc, 0, 0, orc.width, orc.height, 445 - orcV.pivot[0], 165 - orcV.pivot[1]) });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    const big = zoom(out, 235, 170, 390, 150, 3);
    fs.writeFileSync(path.join(HERE, `bases-${rodada}.png`), PNG.sync.write(compose([out, big])));
    console.log(`✓ rodadas/bases-${rodada}.png  (estágio ${stage}: ${Object.values(BASES).map((b) => b.nome).join(' | ')})`);
    process.exit(0);
}

if (mode === 'conceitos') {
    const imgs = CONCEITOS.map((_, i) => conceito(i));
    const W = 420, H = 170;
    const out = canvas(W, H);
    blit(out, ground, 300, 430, W, H, 0, 0);
    imgs.forEach((g, i) => blit(out, rgbaImg(g), 0, 0, g.w, g.h, 70 + i * 130 - D.base.pivot[0], 135 - D.base.pivot[1]));
    blit(out, orc, 0, 0, orc.width, orc.height, 395 - orcV.pivot[0], 150 - orcV.pivot[1]);
    const big = zoom(out, W / 2, H, W, H, 2);
    fs.writeFileSync(path.join(HERE, 'besta-conceitos.png'), PNG.sync.write(compose([out, big])));
    console.log('✓ rodadas/besta-conceitos.png  (' + CONCEITOS.map((c) => c.nome).join(' | ') + ')');
} else {
    const stage = +stageArg || 4;
    const g = base(1, stage);
    const sc = scene([{ y: 140, draw: towerDraw(g, true, 150, 140) }]);
    const big = zoom(sc, 150, 146, 120, 118, 4);
    fs.writeFileSync(path.join(HERE, `besta-${mode}.png`), PNG.sync.write(compose([sc, big])));
    console.log(`✓ rodadas/besta-${mode}.png  (estágio ${stage})`);
}
