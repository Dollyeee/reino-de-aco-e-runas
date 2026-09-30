// Chão em pixel art 1× (T12): tiles de grama + caminho de terra, desenhados a partir dos MESMOS dados do
// mapa (src/data/map01.js) e do mesmo PathTrack do jogo — o traçado fica idêntico ao que os inimigos seguem.
//
// Camadas (de baixo para cima):
//   1. grama: tiles 32×32 (6 variações, todas com o mesmo tom de base → sem emenda visível), escolhidos por
//      semente fixa; variação de tom por região (rampas gramaSol/gramaSombra, manchas grandes e suaves) e
//      manchas pequenas de musgo (rampa própria, borda quebrada em blocos de pixel, folhinhas por dentro),
//      longe das curvas do caminho e do castelo;
//   2. caminho de terra: borda irregular (ruído ao longo do caminho + pixels soltos), caminho "afundado"
//      com a luz do canto superior esquerdo → borda de cima/esquerda na sombra do barranco (tons 0–1) e borda
//      de baixo/direita iluminada (tom 3); sulcos, pegadas, manchas de terra batida e pedrinhas;
//   3. transição grama→terra: capim avançando sobre a terra, pontas de grama e torrões soltos;
//   4. detalhes espalhados na grama: tufos, flores pequenas e pedrinhas;
//   5. circuitos rúnicos gravados no chão perto do castelo (sulco de pedra + linha ciano emissiva).
// Elementos do chão NÃO têm contorno externo nem sombra projetada: o volume vem do tom mais escuro do próprio
// material embaixo/à direita (contorno seletivo).

import { MATERIALS, SINGLE } from '../palette.js';
import { hash, seedOf } from '../lib/textures.js';
import { fbm, valueNoise, valueNoise1 } from '../lib/noise.js';
import PathTrack from '../../../src/world/PathTrack.js';

export const TILE = 32;
const G = MATERIALS.grama, T = MATERIALS.terra, P = MATERIALS.pedra, C = MATERIALS.ciano, M = MATERIALS.musgo;
const G_INDEX = Object.fromEntries(G.map((c, i) => [c, i]));

// ---------------------------------------------------------------------------------------- raster
// Imagem simples: uma cor '#rrggbb' (ou null = transparente) por pixel.
export class Raster {
    constructor (w, h, fill = null) {
        this.w = w;
        this.h = h;
        this.px = new Array(w * h).fill(fill);
    }

    inside (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get (x, y) { return this.inside(x, y) ? this.px[y * this.w + x] : null; }
    set (x, y, c) { if (c && this.inside(x, y)) { this.px[y * this.w + x] = c; } }

    // carimbo: linhas de texto; cada caractere → cor pela tabela `key` ('.' = nada)
    stamp (x, y, rows, key) {
        rows.forEach((row, j) => {
            for (let i = 0; i < row.length; i++) {
                const c = key[row[i]];
                if (c) { this.set(x + i, y + j, c); }
            }
        });
    }

    toRGBA () {
        const out = new Uint8Array(this.w * this.h * 4);
        this.px.forEach((c, i) => {
            if (!c) { return; }
            out[i * 4] = parseInt(c.slice(1, 3), 16);
            out[i * 4 + 1] = parseInt(c.slice(3, 5), 16);
            out[i * 4 + 2] = parseInt(c.slice(5, 7), 16);
            out[i * 4 + 3] = 255;
        });
        return out;
    }
}

const GKEY = { 0: G[0], 1: G[1], 2: G[2], 3: G[3], 4: G[4] };

// ------------------------------------------------------------------------------------ tiles de grama
// Marcas que formam a textura da grama (pixels relativos ao ponto; tons da rampa `grama`).
// Luz de cima/esquerda: pontas claras em cima, pixel escuro embaixo/à direita.
const MARKS = {
    folha: [[0, 0, 3], [0, 1, 3], [1, 1, 1]],                     // lâmina de 2 px: clara, pé escuro à direita
    folhaAlta: [[0, -1, 3], [0, 0, 3], [0, 1, 2], [1, 1, 1]],     // lâmina de 3 px
    torta: [[1, -1, 3], [0, 0, 3], [0, 1, 2], [1, 1, 1]],         // lâmina inclinada
    vezinho: [[-1, -1, 3], [1, -1, 3], [-1, 0, 3], [1, 0, 3], [0, 1, 1]],   // duas lâminas em V
    tufinho: [[-1, 0, 3], [0, -1, 4], [0, 0, 3], [1, 0, 3], [0, 1, 1], [1, 1, 1]],
    vao: [[0, 0, 1], [1, 0, 1]],                                  // vão escuro entre touceiras
    ponta: [[0, -1, 4], [0, 0, 3], [0, 1, 3], [1, 1, 1]],         // lâmina com ponta pegando sol (rara)
    trevo: [[0, -1, 3], [-1, 0, 3], [1, 0, 3], [0, 0, 2], [1, 1, 1]]
};

// 6 variações; cada uma = pares [marca, densidade por célula de 5×5]
const VARIANTS = [
    [['folha', 0.45], ['torta', 0.2], ['vao', 0.08]],
    [['folha', 0.4], ['vezinho', 0.3], ['vao', 0.1]],
    [['folhaAlta', 0.4], ['torta', 0.25], ['vao', 0.15]],
    [['vezinho', 0.3], ['trevo', 0.2], ['folha', 0.25]],
    [['folha', 0.3], ['torta', 0.15]],
    [['folhaAlta', 0.35], ['ponta', 0.15], ['tufinho', 0.18], ['vao', 0.1]]
];

// Tile 32×32 (padrão "embrulha" nas bordas → emenda com qualquer vizinho).
export function grassTile (v) {
    const tile = new Raster(TILE, TILE, G[2]);
    const seed = seedOf(`grama-${v}`);
    const CELL = 5;
    VARIANTS[v].forEach(([name, density], k) => {
        for (let cy = 0; cy < TILE; cy += CELL) {
            for (let cx = 0; cx < TILE; cx += CELL) {
                if (hash(cx, cy, seed + k * 101) >= density) { continue; }
                const x = cx + Math.floor(hash(cx, cy, seed + k * 101 + 1) * CELL);
                const y = cy + Math.floor(hash(cx, cy, seed + k * 101 + 2) * CELL);
                for (const [dx, dy, t] of MARKS[name]) {
                    tile.set((x + dx + TILE) % TILE, (y + dy + TILE) % TILE, G[t]);
                }
            }
        }
    });
    return tile;
}

export function grassTiles () {
    return VARIANTS.map((_, v) => grassTile(v));
}

// ------------------------------------------------------------------------------------ carimbos
// tufos: pontas no tom 4 (sol), lâminas 3, miolo 2, pé 1 e sombra de contato 0 embaixo/à direita
const TUFOS = [
    ['...4...', '.3.3.4.', '.3.33..', '..3232.', '.32223.', '..2121.', '...010.'],
    ['..4...4..', '..3.4.3..', '3..333..3', '.3.323.3.', '..22222..', '...1011..'],
    ['.4.4.', '.3.3.', '3.33.', '.323.', '..10.'],
    ['.4.', '3.3', '.32', '.10'],
    ['4...4..', '.3.3..4', '.3.33.3', '..3223.', '..2221.', '...110.']
];
const PEDRINHAS_GRAMA = [
    { rows: ['34.', '221', '.gg'] },
    { rows: ['.33.', '3221', '.211', '..gg'] },
    { rows: ['.43..', '33221', '32211', '.111g', '..gg.'] },
    { rows: ['..33...', '.34322.', '332221.', '.22211g', '..111gg'] }
];
const PEDRINHAS_TERRA = [
    { rows: ['32', '21'] },
    { rows: ['.3.', '321', '.1.'] },
    { rows: ['.43.', '3221', '.11.'] },
    { rows: ['.43.', '3221', '.11.'] },
    { rows: ['.33..', '34221', '32211', '.111.'] }
];
const FLORES = [
    { rows: ['.p.', 'pmp', '.p.', '.g.'] },
    { rows: ['p.p', '.m.', 'p.p', '.g.'] },
    { rows: ['p', 'g'] }
];
const PETALAS = [SINGLE.florCreme, SINGLE.florAmarela, SINGLE.florLilas];

// ------------------------------------------------------------------------------------ chão do mapa
// Mapa de distância ao caminho: para cada pixel perto do caminho guarda a distância até a linha central,
// a posição ao longo do caminho (s) e o lado (u com sinal) + normal (de onde o pixel está em relação ao centro).
function pathField (track, w, h, reach) {
    const n = w * h;
    const dist = new Float32Array(n).fill(Infinity);
    const along = new Float32Array(n);
    const side = new Float32Array(n);
    const nx = new Float32Array(n), ny = new Float32Array(n);
    const pts = track.points, cum = track.cumulative;
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const vx = b.x - a.x, vy = b.y - a.y;
        const len = Math.hypot(vx, vy) || 1;
        const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - reach)), x1 = Math.min(w - 1, Math.ceil(Math.max(a.x, b.x) + reach));
        const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - reach)), y1 = Math.min(h - 1, Math.ceil(Math.max(a.y, b.y) + reach));
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const px = x + 0.5, py = y + 0.5;
                const t = Math.max(0, Math.min(1, ((px - a.x) * vx + (py - a.y) * vy) / (len * len)));
                const cx = a.x + vx * t, cy = a.y + vy * t;
                const d = Math.hypot(px - cx, py - cy);
                const k = y * w + x;
                if (d < dist[k]) {
                    dist[k] = d;
                    along[k] = cum[i - 1] + t * len;
                    side[k] = (vx * (py - a.y) - vy * (px - a.x)) >= 0 ? 1 : -1;
                    nx[k] = d > 0 ? (px - cx) / d : 0;
                    ny[k] = d > 0 ? (py - cy) / d : 0;
                }
            }
        }
    }
    return { dist, along, side, nx, ny };
}

// Desenha o chão inteiro do mapa (w×h = mundo 1280×720, 1 pixel da arte = 1 pixel do mundo).
export function drawGround (map, w = 1280, h = 720) {
    const track = new PathTrack(map.path, map.cornerRadius);
    const half = map.pathWidth / 2;
    const seed = seedOf(`chao-${map.name}`);
    const img = new Raster(w, h);
    const F = pathField(track, w, h, half + 12);

    // borda do caminho (distância limite): ruído ao longo do caminho, diferente em cada lado, + pixel solto
    const edgeAt = (k, x, y) => {
        const s = F.along[k], sd = F.side[k] > 0 ? 1 : 2;
        const wobble = (valueNoise1(s, 11, seed + sd) - 0.5) * 4.4 + (valueNoise1(s, 4, seed + sd + 7) - 0.5) * 1.6;
        return half + wobble + (hash(x, y, seed + 3) - 0.5) * 1.2;
    };
    const isDirt = new Uint8Array(w * h);
    const inset = new Float32Array(w * h).fill(-99);   // quanto o pixel está para dentro da borda (px)
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const k = y * w + x;
            if (F.dist[k] > half + 10) { continue; }
            inset[k] = edgeAt(k, x, y) - F.dist[k];
            if (inset[k] >= 0) { isDirt[k] = 1; }
        }
    }
    const dirt = (x, y) => x >= 0 && y >= 0 && x < w && y < h && isDirt[y * w + x] === 1;

    // 1) grama: tiles + manchas de musgo
    const tiles = grassTiles();
    const WEIGHTS = [3, 3, 2, 2, 3, 1];
    const total = WEIGHTS.reduce((a, b) => a + b, 0);
    const pickTile = (tx, ty) => {
        let r = hash(tx, ty, seed + 11) * total;
        for (let v = 0; v < WEIGHTS.length; v++) { r -= WEIGHTS[v]; if (r < 0) { return v; } }
        return 0;
    };
    // onde o musgo NÃO pode aparecer: perto das curvas do caminho e embaixo/em volta do castelo
    const corners = map.path.slice(1, -1);
    const c0 = map.castle;
    const mossAllowed = (x, y) => {
        if (corners.some((p) => Math.hypot(p.x - x, p.y - y) < 120)) { return false; }
        if (c0 && x > c0.x - 170 && x < c0.x + 170 && y > c0.y - 290 && y < c0.y + 50) { return false; }
        return inset[y * w + x] === -99;   // nem colado na borda do caminho
    };
    const isMoss = new Uint8Array(w * h);
    for (let ty = 0; ty * TILE < h; ty++) {
        for (let tx = 0; tx * TILE < w; tx++) {
            const tile = tiles[pickTile(tx, ty)];
            for (let j = 0; j < TILE; j++) {
                for (let i = 0; i < TILE; i++) {
                    const x = tx * TILE + i, y = ty * TILE + j;
                    if (x >= w || y >= h) { continue; }
                    const t = G_INDEX[tile.px[j * TILE + i]];
                    // região: manchas grandes e suaves, ± um passo pequeno de tom (quase imperceptível)
                    const r = fbm(x, y, 260, seed + 25) + (hash(x, y, seed + 26) - 0.5) * 0.02;
                    const ramp = r > 0.58 ? MATERIALS.gramaSol : (r < 0.42 ? MATERIALS.gramaSombra : G);
                    // musgo: manchas pequenas; o ruído é lido em blocos de 2×2 px → borda quebrada em degraus,
                    // e cada bloco da borda ainda ganha um "dente" pixel a pixel
                    const bx = x >> 1, by = y >> 1;
                    const m = fbm(bx * 2, by * 2, 54, seed + 21) + (hash(bx, by, seed + 22) - 0.5) * 0.06 +
                        (hash(x, y, seed + 23) - 0.5) * 0.02;
                    if (m > 0.72 && mossAllowed(x, y)) {
                        isMoss[y * w + x] = 1;
                        img.set(x, y, M[Math.min(t, 3)]);
                    } else {
                        img.set(x, y, ramp[t]);
                    }
                }
            }
        }
    }
    // folhinhas dentro do musgo (2 px claros + 1 px de sombra embaixo/à direita)
    const LEAVES = [['33', '.1'], ['3.', '31'], ['.3', '31']];
    for (let y = 0; y < h - 2; y += 3) {
        for (let x = 0; x < w - 2; x += 3) {
            if (hash(x, y, seed + 27) > 0.3) { continue; }
            const lx = x + Math.floor(hash(x, y, seed + 28) * 3), ly = y + Math.floor(hash(x, y, seed + 29) * 3);
            const leaf = LEAVES[Math.floor(hash(x, y, seed + 30) * LEAVES.length)];
            const inside = leaf.every((row, j) => [...row].every((ch, i) => ch === '.' || isMoss[(ly + j) * w + lx + i]));
            if (inside) { img.stamp(lx, ly, leaf, { 1: M[1], 3: M[3] }); }
        }
    }

    // 2) caminho de terra
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const k = y * w + x;
            if (!isDirt[k]) { continue; }
            const e = inset[k];
            // lado da borda em relação à luz (cima/esquerda < 0 < baixo/direita)
            const facing = F.nx[k] + F.ny[k];
            let t = 2;
            // terra batida mais clara no miolo (manchas) e grãos escuros
            const patch = fbm(x, y, 46, seed + 31) + (hash(x, y, seed + 32) - 0.5) * 0.05;
            if (e > 5 && patch > 0.62) { t = 3; }
            if (hash(x >> 1, y >> 1, seed + 33) < 0.035 && hash(x, y, seed + 34) < 0.6) { t = 1; }
            // borda de cima/esquerda: sombra do barranco de grama (2–3 px)
            if (facing < -0.35) {
                if (e < 1.2) { t = 0; } else if (e < 2.6 || (e < 3.6 && hash(x, y, seed + 35) < 0.5)) { t = 1; }
            }
            // borda de baixo/direita: barranco iluminado
            if (facing > 0.35 && e < 1.4) { t = 3; }
            img.set(x, y, T[t]);
        }
    }

    // sulcos (duas trilhas contínuas com falhas) e pegadas
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const k = y * w + x;
            if (!isDirt[k] || inset[k] < 4) { continue; }
            const u = F.dist[k] * F.side[k];
            const s = F.along[k];
            for (const lane of [-13, 13]) {
                const off = u - lane;
                if (valueNoise1(s, 9, seed + 41 + lane) < 0.42) { continue; }
                // sulco gravado: parede de cima/esquerda escura (2 px), borda de baixo/direita iluminada
                const lit = (F.nx[k] + F.ny[k]) * F.side[k] >= 0 ? 1 : -1;   // +u aponta para baixo/direita?
                const o = off * lit;
                if (o > -0.5 && o < 0.5) { img.set(x, y, T[1]); }
                else if (o >= -1.5 && o <= -0.5 && hash(x, y, seed + 42) < 0.6) { img.set(x, y, T[1]); }
                else if (o >= 0.5 && o < 1.5) { img.set(x, y, T[3]); }
            }
        }
    }
    // pegadas: a cada ~12 px ao longo do caminho, alternando os lados
    const STEP_PX = 12;
    for (let s = 20, n = 0; s < track.length; s += STEP_PX, n++) {
        if (hash(n, 0, seed + 51) < 0.25) { continue; }
        const p = track.getPointAt(s);
        const nrm = { x: -p.dy, y: p.dx };
        const u = n % 2 ? 4 : -4;
        const x = Math.round(p.x + nrm.x * u), y = Math.round(p.y + nrm.y * u);
        if (!dirt(x, y)) { continue; }
        const vertical = Math.abs(p.dy) > Math.abs(p.dx);
        const rows = vertical ? ['11', '10', '11'] : ['110', '101'];
        img.stamp(x - 1, y - 1, rows, { 0: T[0], 1: T[1] });
    }
    // pedrinhas na terra
    for (let s = 10, n = 0; s < track.length; s += 8, n++) {
        if (hash(n, 1, seed + 61) > 0.5) { continue; }
        const p = track.getPointAt(s);
        const u = (hash(n, 2, seed + 61) - 0.5) * (half * 2 - 12);
        const x = Math.round(p.x - p.dy * u + (hash(n, 3, seed + 61) - 0.5) * 6);
        const y = Math.round(p.y + p.dx * u + (hash(n, 4, seed + 61) - 0.5) * 6);
        const pb = PEDRINHAS_TERRA[Math.floor(hash(n, 5, seed + 61) * PEDRINHAS_TERRA.length)];
        if (pb.rows.every((row, j) => [...row].every((ch, i) => ch === '.' || dirt(x + i, y + j)))) {
            img.stamp(x, y, pb.rows, { 1: P[1], 2: P[2], 3: P[3], 4: P[4] });
        }
    }

    // 3) transição grama→terra: capim avançando sobre a terra e torrões soltos na grama
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const k = y * w + x;
            if (inset[k] === -99) { continue; }
            const e = inset[k];
            const facing = F.nx[k] + F.ny[k];
            if (!isDirt[k] && e > -2.5 && e < -0.5) {
                // grama logo fora da terra: lado de baixo/direita pega luz (lábio claro); lado de cima fica escuro
                if (facing > 0.35 && hash(x, y, seed + 71) < 0.45) { img.set(x, y, G[3]); }
                if (facing < -0.35 && hash(x, y, seed + 72) < 0.3) { img.set(x, y, G[1]); }
                // torrão de terra solto na grama
                if (hash(x, y, seed + 73) < 0.025) { img.set(x, y, T[hash(x, y, seed + 74) < 0.5 ? 2 : 1]); }
            }
        }
    }
    // pontas de capim entrando na terra (2–3 px) ao longo das duas bordas
    for (let s = 0, n = 0; s < track.length; s += 5, n++) {
        const p = track.getPointAt(s);
        for (const sd of [-1, 1]) {
            if (hash(n, sd + 5, seed + 81) > 0.55) { continue; }
            const nrm = { x: -p.dy * sd, y: p.dx * sd };
            // procura o último pixel de grama saindo do centro para fora
            let bx = null, by = null;
            for (let r = half - 6; r < half + 8; r++) {
                const x = Math.round(p.x + nrm.x * r), y = Math.round(p.y + nrm.y * r);
                if (!dirt(x, y)) { bx = x; by = y; break; }
            }
            if (bx === null) { continue; }
            const len = 1 + Math.floor(hash(n, sd, seed + 82) * 3);
            for (let q = 1; q <= len; q++) {
                const x = Math.round(bx - nrm.x * q), y = Math.round(by - nrm.y * q);
                if (dirt(x, y)) { img.set(x, y, q === len ? G[3] : G[2]); }
            }
        }
    }

    // 4) detalhes na grama (longe da borda do caminho)
    const free = (x, y, rows, margin) => rows.every((row, j) => [...row].every((ch, i) => {
        if (ch === '.') { return true; }
        const xx = x + i, yy = y + j;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) { return false; }
        const k = yy * w + xx;
        return inset[k] === -99 || inset[k] < -margin;
    }));
    const scatter = (count, sd, pick) => {
        for (let n = 0; n < count; n++) {
            const x = Math.floor(hash(n, 0, sd) * w), y = Math.floor(hash(n, 1, sd) * h);
            pick(n, x, y);
        }
    };
    scatter(520, seed + 91, (n, x, y) => {
        const rows = TUFOS[Math.floor(hash(n, 2, seed + 91) * TUFOS.length)];
        if (free(x, y, rows, 3)) { img.stamp(x, y, rows, GKEY); }
    });
    scatter(110, seed + 92, (n, x, y) => {
        const f = FLORES[Math.floor(hash(n, 2, seed + 92) * FLORES.length)];
        const petal = PETALAS[Math.floor(hash(n, 3, seed + 92) * PETALAS.length)];
        // flores em pequenos grupos de 1–3
        const k = 1 + Math.floor(hash(n, 4, seed + 92) * 3);
        for (let q = 0; q < k; q++) {
            const fx = x + Math.round((hash(n, 10 + q, seed + 92) - 0.5) * 14);
            const fy = y + Math.round((hash(n, 20 + q, seed + 92) - 0.5) * 8);
            if (free(fx, fy, f.rows, 3)) { img.stamp(fx, fy, f.rows, { p: petal, m: SINGLE.florMiolo, g: G[1] }); }
        }
    });
    scatter(90, seed + 93, (n, x, y) => {
        const pb = PEDRINHAS_GRAMA[Math.floor(hash(n, 2, seed + 93) * PEDRINHAS_GRAMA.length)];
        if (free(x, y, pb.rows, 3)) { img.stamp(x, y, pb.rows, { 1: P[1], 2: P[2], 3: P[3], 4: P[4], g: G[0] }); }
    });

    // 5) circuitos rúnicos gravados no chão, levando energia ao castelo
    if (map.castle) { drawRuneTraces(img, map.castle); }

    return { img, track, tiles };
}

// Sulco de pedra (3 px) com a linha ciano de 1 px no meio; nós nas pontas (losango de pedra + núcleo ciano).
function drawRuneTraces (img, c) {
    const traces = [
        [[c.x - 150, c.y - 250], [c.x - 150, c.y - 200], [c.x - 110, c.y - 200]],
        [[c.x + 40, c.y + 70], [c.x + 40, c.y + 160], [c.x - 40, c.y + 160]],
        [[c.x - 250, c.y - 60], [c.x - 200, c.y - 60], [c.x - 200, c.y - 20]]
    ];
    const line = (a, b, fn) => {
        const [x0, y0] = a, [x1, y1] = b;
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 0; i <= n; i++) { fn(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)); }
    };
    for (const tr of traces) {
        for (let i = 1; i < tr.length; i++) {
            // sulco: borda de cima/esquerda escura, de baixo/direita clara (gravado no chão)
            line(tr[i - 1], tr[i], (x, y) => {
                img.set(x - 1, y - 1, P[0]); img.set(x, y - 1, P[0]); img.set(x - 1, y, P[0]);
                img.set(x + 1, y + 1, P[3]); img.set(x + 1, y, P[1]); img.set(x, y + 1, P[1]);
            });
        }
        for (let i = 1; i < tr.length; i++) { line(tr[i - 1], tr[i], (x, y) => img.set(x, y, C[2])); }
        for (const [x, y] of [tr[0], tr[tr.length - 1]]) {
            // anel em losango (raio 2): cima/esquerda escuro, baixo/direita claro; miolo em cruz ciano
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const r = Math.abs(dx) + Math.abs(dy);
                    if (r === 2) { img.set(x + dx, y + dy, dx + dy < 0 ? P[0] : (dx + dy > 0 ? P[3] : P[1])); }
                    if (r <= 1) { img.set(x + dx, y + dy, r === 0 ? C[4] : C[2]); }
                }
            }
        }
    }
}
