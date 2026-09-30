// Tela de pixel art 1× desenhada em PARTES (de trás para frente), sem antialias.
//
// Cada parte é uma máscara (formas rasterizadas na grade) + um material (rampa de 5 tons com hue shift).
// Ao desenhar uma parte:
//   1. contorno interno SELETIVO: onde a parte nova encosta em partes já desenhadas, a borda é pintada
//      com o tom mais escuro do material da parte nova (não preto);
//   2. sombreamento (luz do canto superior esquerdo): os pixels mais de baixo/direita (bordas primeiro)
//      recebem os tons 0–1, no máximo ~30% da parte; borda de cima/esquerda e canto iluminado → tom 3;
//      resto → tom 2. O tom 4 fica para brilhos especulares e rim light;
//   3. textura do material (semente fixa, coordenadas locais → não "ferve" na animação) e ferrugem opcional;
//   4. brilho especular: 1–3 pixels no tom 4 no canto iluminado das placas de metal.
// Emissivos (olho, runas, plasma): núcleo claro + halo de 1–2 px nos tons da rampa, sem contorno.
// No fim: rim light de 1 px na borda direita da silhueta e contorno externo #1e1512.
//
// Vizinhos são consultados com checagem de limites (fora da tela = vazio). Nunca se usa deslocamento
// circular de máscara, que criaria contornos falsos nas bordas do canvas.

import { MATERIALS, OUTLINE } from '../palette.js';
import { TEXTURES, rust, seedOf } from './textures.js';

// ------------------------------------------------------------------ máscaras

export class Mask {
    constructor (w, h) {
        this.w = w;
        this.h = h;
        this.data = new Uint8Array(w * h);
        this.dx = 0;
        this.dy = 0;
    }

    // deslocamento inteiro aplicado às formas seguintes (usado na animação)
    offset (dx, dy) {
        this.dx = Math.round(dx);
        this.dy = Math.round(dy);
        return this;
    }

    has (x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h && this.data[y * this.w + x] === 1;
    }

    set (x, y) {
        if (x >= 0 && y >= 0 && x < this.w && y < this.h) { this.data[y * this.w + x] = 1; }
    }

    px (x, y) {
        this.set(x + this.dx, y + this.dy);
        return this;
    }

    rect (x, y, w, h) {
        for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) { this.px(x + i, y + j); }
        }
        return this;
    }

    // polígono (coordenadas contínuas); preenche os pixels cujo centro está dentro
    poly (points) {
        const pts = points.map(([x, y]) => [x + this.dx, y + this.dy]);
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs));
        const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                if (pointInPolygon(x + 0.5, y + 0.5, pts)) { this.set(x, y); }
            }
        }
        return this;
    }

    ellipse (cx, cy, rx, ry = rx) {
        cx += this.dx; cy += this.dy;
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
            for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
                const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
                if (nx * nx + ny * ny <= 1) { this.set(x, y); }
            }
        }
        return this;
    }

    // linha grossa (cápsula); espessura 1 usa Bresenham
    line (x0, y0, x1, y1, thickness = 1) {
        if (thickness <= 1) {
            let ax = Math.round(x0), ay = Math.round(y0);
            const bx = Math.round(x1), by = Math.round(y1);
            const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
            const dx = Math.abs(bx - ax), dy = -Math.abs(by - ay);
            let err = dx + dy;
            for (;;) {
                this.px(ax, ay);
                if (ax === bx && ay === by) { break; }
                const e2 = 2 * err;
                if (e2 >= dy) { err += dy; ax += sx; }
                if (e2 <= dx) { err += dx; ay += sy; }
            }
            return this;
        }
        const r = thickness / 2;
        const ax = x0 + this.dx, ay = y0 + this.dy, bx = x1 + this.dx, by = y1 + this.dy;
        for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++) {
            for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++) {
                if (distToSegment(x + 0.5, y + 0.5, ax, ay, bx, by) <= r) { this.set(x, y); }
            }
        }
        return this;
    }

    bounds () {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (this.data[y * this.w + x]) {
                    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
                    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
                }
            }
        }
        return { x0, y0, x1, y1 };
    }

    // distância (em px, até 3) do pixel até a borda da máscara
    edgeDistance (x, y) {
        for (let d = 1; d <= 3; d++) {
            if (!this.has(x - d, y) || !this.has(x + d, y) || !this.has(x, y - d) || !this.has(x, y + d)) { return d - 1; }
        }
        return 3;
    }
}

function pointInPolygon (x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) { inside = !inside; }
    }
    return inside;
}

function distToSegment (px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay;
    const len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2));
    return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

// ------------------------------------------------------------------ tela

const METALS = new Set(['aco', 'acoClaro']);

export class PixelCanvas {
    // opts.darkRatio (padrão 0.3): fração máxima de cada parte nos tons escuros (0 e 1).
    constructor (w, h, opts = {}) {
        this.w = w;
        this.h = h;
        this.darkRatio = opts.darkRatio ?? 0.3;
        this.color = new Array(w * h).fill(null);      // '#rrggbb' ou null
        this.owner = new Int32Array(w * h).fill(-1);   // parte dona do pixel
        this.mat = new Array(w * h).fill(null);        // material do pixel (para rim light)
        this.tone = new Int8Array(w * h).fill(-1);
        this.emit = new Uint8Array(w * h);             // pixel emissivo (sem rim light)
        this.parts = 0;
        this.stats = [];                               // { name, total, dark }
    }

    mask () {
        return new Mask(this.w, this.h);
    }

    filled (x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h && this.owner[y * this.w + x] >= 0;
    }

    setPixel (i, mat, tone, id) {
        this.color[i] = MATERIALS[mat][tone];
        this.mat[i] = mat;
        this.tone[i] = tone;
        this.owner[i] = id;
        this.emit[i] = 0;
    }

    // Desenha uma parte com um material.
    //   opts.name     nome (relatórios e semente da textura)
    //   opts.outline  (padrão true) contorno interno seletivo sobre as partes de trás
    //   opts.texture  (padrão true) textura do material
    //   opts.rust     fração de manchas de ferrugem nas bordas (metais), ex.: 0.12
    //   opts.specular número de pixels especulares (padrão 2 em metais, 0 no resto)
    part (material, build, opts = {}) {
        const ramp = MATERIALS[material];
        if (!ramp) { throw new Error(`material desconhecido: ${material}`); }
        const m = this.mask();
        build(m);
        const id = this.parts++;
        const name = opts.name || `${material}#${id}`;
        const seed = seedOf(name);

        // 1) contorno interno seletivo (cor mais escura do material da parte nova)
        if (opts.outline !== false) {
            const edge = [];
            for (let y = 0; y < this.h; y++) {
                for (let x = 0; x < this.w; x++) {
                    if (m.has(x, y) || !this.filled(x, y)) { continue; }
                    if (m.has(x - 1, y) || m.has(x + 1, y) || m.has(x, y - 1) || m.has(x, y + 1)) { edge.push(y * this.w + x); }
                }
            }
            for (const i of edge) { this.color[i] = ramp[0]; this.tone[i] = 0; this.mat[i] = material; this.emit[i] = 0; }
        }

        // 2) sombreamento por ranking
        const b = m.bounds();
        const bw = Math.max(1, b.x1 - b.x0 + 1), bh = Math.max(1, b.y1 - b.y0 + 1);
        const diag = (x, y) => (x + 0.5 - b.x0) / bw + (y + 0.5 - b.y0) / bh;
        const edgeDR = (x, y) => !m.has(x, y + 1) || !m.has(x + 1, y);
        const edgeUL = (x, y) => !m.has(x, y - 1) || !m.has(x - 1, y);
        const pixels = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (m.has(x, y)) { pixels.push({ x, y, score: diag(x, y) + (edgeDR(x, y) ? 0.6 : 0) }); }
            }
        }
        const n = pixels.length;
        const byScore = [...pixels].sort((p, q) => q.score - p.score);
        const nDarkest = Math.floor(n * this.darkRatio * 0.35);
        const nDark = Math.floor(n * this.darkRatio);
        const tones = new Map();
        byScore.forEach((p, k) => {
            if (k < nDarkest && (edgeDR(p.x, p.y) || diag(p.x, p.y) > 1.2)) { tones.set(p, 0); }
            else if (k < nDark && (edgeDR(p.x, p.y) || diag(p.x, p.y) > 1)) { tones.set(p, 1); }
        });

        let dark = 0;
        const texFn = opts.texture === false ? null : TEXTURES[material];
        for (const p of pixels) {
            let t = tones.has(p) ? tones.get(p) : (edgeUL(p.x, p.y) || diag(p.x, p.y) < 0.4 ? 3 : 2);
            const lx = p.x - b.x0, ly = p.y - b.y0;
            const ctx = { lx, ly, tone: t, edge: m.edgeDistance(p.x, p.y), seed };
            // textura varia só entre os tons 2 e 3 (não cria sombra nova além do limite de ~30%)
            if (texFn) { const base = t; t = Math.min(3, t + texFn(ctx)); if (base >= 2) { t = Math.max(2, t); } }
            const i = p.y * this.w + p.x;
            this.setPixel(i, material, t, id);
            if (opts.rust && METALS.has(material)) {
                const r = rust(ctx, opts.rust);
                if (r) { this.color[i] = r.color; }
            }
            if (t <= 1) { dark++; }
        }

        // 4) brilho especular no canto iluminado (metais)
        const spec = opts.specular ?? (METALS.has(material) ? 2 : 0);
        if (spec > 0) {
            const cand = pixels.filter((p) => !edgeUL(p.x, p.y) && m.has(p.x - 2, p.y) && m.has(p.x, p.y - 2))
                .sort((p, q) => diag(p.x, p.y) - diag(q.x, q.y))
                .slice(0, spec);
            for (const p of cand) { this.setPixel(p.y * this.w + p.x, material, 4, id); }
        }

        this.stats.push({ name, total: n, dark });
        return this;
    }

    // Emissivo: núcleo claro (tom 4 por dentro, tom 3 na borda) + halo de 1–2 px (tons 2 e 1)
    // pintado só sobre o que já existe. Sem contorno e sem rim light.
    emissive (material, build, opts = {}) {
        const m = this.mask();
        build(m);
        const id = this.parts++;
        const halo = opts.halo ?? 2;
        const core = opts.core ?? 4;
        // halo primeiro (anéis em volta da máscara, sobre pixels já desenhados)
        for (let ring = halo; ring >= 1; ring--) {
            const tone = ring === 1 ? 2 : 1;
            for (let y = 0; y < this.h; y++) {
                for (let x = 0; x < this.w; x++) {
                    if (m.has(x, y) || !this.filled(x, y)) { continue; }
                    let near = false;
                    for (let dy = -ring; dy <= ring && !near; dy++) {
                        for (let dx = -ring; dx <= ring && !near; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) <= ring && m.has(x + dx, y + dy)) { near = true; }
                        }
                    }
                    if (near) {
                        const i = y * this.w + x;
                        this.color[i] = MATERIALS[material][tone];
                        this.emit[i] = 1;
                    }
                }
            }
        }
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (!m.has(x, y)) { continue; }
                const inner = m.has(x - 1, y) && m.has(x + 1, y) && m.has(x, y - 1) && m.has(x, y + 1);
                const i = y * this.w + x;
                this.setPixel(i, material, inner ? core : 3, id);
                this.emit[i] = 1;
            }
        }
        return this;
    }

    // Pinta pixels por cima SEM mudar partes nem contornos (rebites, riscos, costuras).
    //   paint('#hex', build) ou paint({ mat, tone }, build). Por padrão só onde já existe algo.
    paint (what, build, opts = {}) {
        const m = this.mask();
        build(m);
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (!m.has(x, y)) { continue; }
                if (!opts.anywhere && !this.filled(x, y)) { continue; }
                const i = y * this.w + x;
                if (typeof what === 'string') { this.color[i] = what; } else {
                    this.color[i] = MATERIALS[what.mat][what.tone];
                    this.mat[i] = what.mat;
                    this.tone[i] = what.tone;
                }
                if (opts.anywhere && this.owner[i] < 0) { this.owner[i] = this.parts; }
            }
        }
        return this;
    }

    // Rebite: 1 px claro com 1 px escuro embaixo/direita (volume).
    rivet (x, y, mat = 'aco', dx = 0, dy = 0) {
        this.paint({ mat, tone: 4 }, (m) => m.offset(dx, dy).px(x, y));
        this.paint({ mat, tone: 0 }, (m) => m.offset(dx, dy).px(x + 1, y + 1));
        return this;
    }

    // Rim light de 1 px na borda direita da silhueta + contorno externo de 1 px.
    finish () {
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const i = y * this.w + x;
                if (!this.filled(x, y) || this.emit[i] || !this.mat[i] || this.filled(x + 1, y)) { continue; }
                this.color[i] = MATERIALS[this.mat[i]][3];
            }
        }
        const add = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (this.filled(x, y)) { continue; }
                if (this.filled(x - 1, y) || this.filled(x + 1, y) || this.filled(x, y - 1) || this.filled(x, y + 1)) {
                    add.push(y * this.w + x);
                }
            }
        }
        for (const i of add) { this.color[i] = OUTLINE; }
        return this;
    }

    toRGBA () {
        const out = new Uint8Array(this.w * this.h * 4);
        for (let i = 0; i < this.w * this.h; i++) {
            const c = this.color[i];
            if (!c) { continue; }
            out[i * 4] = parseInt(c.slice(1, 3), 16);
            out[i * 4 + 1] = parseInt(c.slice(3, 5), 16);
            out[i * 4 + 2] = parseInt(c.slice(5, 7), 16);
            out[i * 4 + 3] = 255;
        }
        return out;
    }
}
