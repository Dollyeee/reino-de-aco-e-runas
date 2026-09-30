// Cena de referência (T12): o mapa inteiro no tamanho real 1280×720 — chão novo + orc Saqueador em alguns
// pontos do caminho + retângulos placeholder no lugar das torres e do castelo (ainda são SVG no jogo).
// Serve para julgar contraste e escala entre personagens e cenário antes de refazer o resto da arte.

// mesmos valores do jogo (src/config/visual.js SHADOW, src/effects/Shadow.js, src/config/art.js SHADOWS)
const SHADOW = { offsetX: 7, offsetY: 4, alpha: 0.28, rgb: [30, 14, 40] };
const PLATFORM_OFFSET = 10;   // src/towers/Tower.js: a torre fica 10 px abaixo do centro da plataforma

// Torres de exemplo (pontos escolhidos pela simulação da T11) e castelo; tamanhos = arte atual em SVG.
const TOWERS = [
    { type: 'besta', x: 760, y: 370 }, { type: 'catapulta', x: 760, y: 460 },
    { type: 'besta', x: 190, y: 270 }, { type: 'catapulta', x: 450, y: 400 },
    { type: 'besta', x: 510, y: 470 }, { type: 'besta', x: 980, y: 430 }
];
const TOWER_BOX = {
    besta: { w: 88, h: 100, shadow: [84, 30], color: [63, 245, 255] },
    catapulta: { w: 128, h: 150, shadow: [124, 38], color: [255, 174, 60] }
};
const CASTLE_BOX = { w: 260, h: 272, shadow: [270, 60], color: [165, 161, 143] };
const PLATFORM = { w: 100, h: 60, pivot: [50, 25], shadow: [96, 34] };

// Orcs ao longo do caminho: distância percorrida e quadro da caminhada.
const ORCS = [[150, 0], [430, 2], [700, 5], [990, 1], [1260, 6], [1560, 3], [1830, 4], [2120, 7]];

function blend (buf, w, h, x, y, [r, g, b], a) {
    if (x < 0 || y < 0 || x >= w || y >= h) { return; }
    const i = (y * w + x) * 4;
    buf[i] = Math.round(buf[i] * (1 - a) + r * a);
    buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a);
    buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a);
}

// sombra = elipse de pixels duros, deslocada para baixo/direita (igual a ShadowLayer.addPixel)
function shadow (buf, w, h, x, y, sw, sh) {
    const cx = Math.round(x + SHADOW.offsetX), cy = Math.round(y + SHADOW.offsetY);
    for (let py = 0; py < sh; py++) {
        for (let px = 0; px < sw; px++) {
            const nx = (px + 0.5 - sw / 2) / (sw / 2), ny = (py + 0.5 - sh / 2) / (sh / 2);
            if (nx * nx + ny * ny <= 1) { blend(buf, w, h, cx - Math.floor(sw / 2) + px, cy - Math.floor(sh / 2) + py, SHADOW.rgb, SHADOW.alpha); }
        }
    }
}

function sprite (buf, w, h, rgba, fw, fh, x, y) {
    for (let j = 0; j < fh; j++) {
        for (let i = 0; i < fw; i++) {
            const s = (j * fw + i) * 4;
            if (rgba[s + 3] === 0) { continue; }
            blend(buf, w, h, x + i, y + j, [rgba[s], rgba[s + 1], rgba[s + 2]], 1);
        }
    }
}

// placeholder: retângulo translúcido com borda de 1 px e um "X" fraco (fica claro que não é arte)
function box (buf, w, h, x0, y0, bw, bh, color) {
    for (let j = 0; j < bh; j++) {
        for (let i = 0; i < bw; i++) {
            const edge = i === 0 || j === 0 || i === bw - 1 || j === bh - 1;
            const diag = Math.abs(i / bw - j / bh) < 0.006 || Math.abs(i / bw - (1 - j / bh)) < 0.006;
            blend(buf, w, h, x0 + i, y0 + j, color, edge ? 1 : (diag ? 0.5 : 0.22));
        }
    }
}

function ellipseOutline (buf, w, h, cx, cy, ew, eh, color) {
    for (let py = 0; py < eh; py++) {
        for (let px = 0; px < ew; px++) {
            const inside = (qx, qy) => {
                const nx = (qx + 0.5 - ew / 2) / (ew / 2), ny = (qy + 0.5 - eh / 2) / (eh / 2);
                return qx >= 0 && qy >= 0 && qx < ew && qy < eh && nx * nx + ny * ny <= 1;
            };
            if (!inside(px, py)) { continue; }
            const edge = !inside(px - 1, py) || !inside(px + 1, py) || !inside(px, py - 1) || !inside(px, py + 1);
            blend(buf, w, h, cx + px, cy + py, color, edge ? 0.9 : 0.12);
        }
    }
}

// Mapa inteiro com um kit de decoração (T15): chão + decoração nas posições de map01.js + orcs no caminho +
// castelo placeholder. decor = [{ x, y, rgba, def }] (def = item de src/config/decor.js).
export function drawDecorMap (ground, track, map, orc, decor) {
    const w = ground.w, h = ground.h;
    const buf = ground.toRGBA();
    const objs = decor.map((d) => ({
        y: d.y,
        shadow: () => shadow(buf, w, h, d.x, d.y, d.def.shadow[0], d.def.shadow[1]),
        draw: () => sprite(buf, w, h, d.rgba, d.def.frame[0], d.def.frame[1], d.x - d.def.pivot[0], d.y - d.def.pivot[1])
    }));
    const c = map.castle;
    objs.push({
        y: c.y,
        shadow: () => shadow(buf, w, h, c.x, c.y, CASTLE_BOX.shadow[0], CASTLE_BOX.shadow[1]),
        draw: () => box(buf, w, h, c.x - CASTLE_BOX.w / 2, c.y - CASTLE_BOX.h, CASTLE_BOX.w, CASTLE_BOX.h, CASTLE_BOX.color)
    });
    for (const [dist, f] of ORCS) {
        const p = track.getPointAt(dist);
        const x = Math.round(p.x), y = Math.round(p.y);
        const rgba = orc.frames[f % orc.frames.length].toRGBA();
        objs.push({
            y,
            shadow: () => shadow(buf, w, h, x, y, orc.shadow[0], orc.shadow[1]),
            draw: () => sprite(buf, w, h, rgba, orc.frame.w, orc.frame.h, x - orc.pivot[0], y - orc.pivot[1])
        });
    }
    for (const o of objs) { o.shadow(); }
    objs.sort((a, b) => a.y - b.y);
    for (const o of objs) { o.draw(); }
    return buf;
}

// ground = Raster do chão; orc = { frames: [PixelCanvas], frame: {w,h}, pivot: [x,y], shadow: [w,h] }
export function drawScene (ground, track, map, orc) {
    const w = ground.w, h = ground.h;
    const buf = ground.toRGBA();

    const objs = [];
    for (const t of TOWERS) {
        const B = TOWER_BOX[t.type];
        objs.push({
            y: t.y + PLATFORM_OFFSET,
            shadow: () => { shadow(buf, w, h, t.x, t.y + PLATFORM_OFFSET - 4, B.shadow[0], B.shadow[1]); },
            draw: () => {
                ellipseOutline(buf, w, h, t.x - PLATFORM.pivot[0], t.y - PLATFORM.pivot[1] + 8, PLATFORM.w, PLATFORM.h - 18, B.color);
                box(buf, w, h, t.x - B.w / 2, t.y + PLATFORM_OFFSET - B.h, B.w, B.h, B.color);
            }
        });
    }
    const c = map.castle;
    objs.push({
        y: c.y,
        shadow: () => shadow(buf, w, h, c.x, c.y, CASTLE_BOX.shadow[0], CASTLE_BOX.shadow[1]),
        draw: () => box(buf, w, h, c.x - CASTLE_BOX.w / 2, c.y - CASTLE_BOX.h, CASTLE_BOX.w, CASTLE_BOX.h, CASTLE_BOX.color)
    });
    for (const [d, f] of ORCS) {
        const p = track.getPointAt(d);
        const x = Math.round(p.x), y = Math.round(p.y);
        const rgba = orc.frames[f % orc.frames.length].toRGBA();
        objs.push({
            y,
            shadow: () => shadow(buf, w, h, x, y, orc.shadow[0], orc.shadow[1]),
            draw: () => sprite(buf, w, h, rgba, orc.frame.w, orc.frame.h, x - orc.pivot[0], y - orc.pivot[1])
        });
    }

    // sombras numa camada abaixo de tudo; objetos por profundidade (y do chão), como no jogo
    for (const o of objs) { o.shadow(); }
    objs.sort((a, b) => a.y - b.y);
    for (const o of objs) { o.draw(); }
    return buf;
}
