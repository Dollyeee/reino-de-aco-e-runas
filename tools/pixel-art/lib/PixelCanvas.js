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
//
// Escala de grade (opts.scale, padrão 1): as coordenadas do desenho são multiplicadas por `scale` ANTES de
// rasterizar — o sprite é redesenhado numa grade menor (contorno de 1 px, sem reamostrar imagem). Deslocamentos
// da animação também são escalados e arredondados (continuam inteiros); `dot` e `rivet` mantêm 1 px de detalhe.
//
// Rotação de grade (opts.rotate = { angle, cx, cy }, T19): as coordenadas do desenho giram em volta de (cx, cy) ANTES
// de rasterizar — peças que giram no jogo (cabeça da besta, braço da catapulta) são redesenhadas em cada ângulo, com
// contorno de 1 px e luz do canto superior esquerdo aplicada depois (a luz não gira junto). Nunca se gira a imagem pronta.
// rotate.sy (T26, opcional): escorço 3/4 — a peça deitada no plano do chão tem o eixo vertical da tela achatado por sy
// DEPOIS de girar (apontando para cima/baixo ela encurta, como vista de cima em 3/4).

import { MATERIALS, OUTLINE } from '../palette.js';
import { TEXTURES, rust, seedOf } from './textures.js';

// ------------------------------------------------------------------ máscaras

export class Mask {
    // origin: deslocamento base de todas as formas (permite reenquadrar um sprite sem mudar coordenadas)
    // k: escala de grade (coordenadas do desenho × k); rot: { angle, cx, cy } (rotação de grade, opcional)
    constructor (w, h, origin = [0, 0], k = 1, rot = null) {
        this.w = w;
        this.h = h;
        this.k = k;
        const sy = rot?.sy ?? 1;
        this.rot = rot && (rot.angle || sy !== 1) ? { c: Math.cos(rot.angle), s: Math.sin(rot.angle), cx: rot.cx || 0, cy: rot.cy || 0, sy } : null;
        this.data = new Uint8Array(w * h);
        this.ox = origin[0];
        this.oy = origin[1];
        this.dx = this.ox;
        this.dy = this.oy;
    }

    // deslocamento inteiro aplicado às formas seguintes (usado na animação)
    offset (dx, dy) {
        this.dx = Math.round(dx * this.k) + this.ox;
        this.dy = Math.round(dy * this.k) + this.oy;
        return this;
    }

    // ponto do desenho → posição contínua no canvas (rotação de grade, escala, deslocamentos)
    tp (x, y) {
        const r = this.rot;
        if (r) {
            const dx = x - r.cx, dy = y - r.cy;
            x = r.cx + dx * r.c - dy * r.s;
            y = r.cy + (dx * r.s + dy * r.c) * r.sy;
        }
        return [x * this.k + this.dx, y * this.k + this.dy];
    }

    has (x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h && this.data[y * this.w + x] === 1;
    }

    set (x, y) {
        if (x >= 0 && y >= 0 && x < this.w && y < this.h) { this.data[y * this.w + x] = 1; }
    }

    px (x, y) {
        if (this.rot) { const [X, Y] = this.tp(x, y); this.set(Math.round(X), Math.round(Y)); return this; }
        this.set(Math.round(x * this.k) + this.dx, Math.round(y * this.k) + this.dy);
        return this;
    }

    // 1 px no ponto escalado + deslocamento em pixels FINAIS (detalhes que não podem sumir nem engordar)
    dot (x, y, fx = 0, fy = 0) {
        if (this.rot) { const [X, Y] = this.tp(x, y); this.set(Math.round(X) + fx, Math.round(Y) + fy); return this; }
        this.set(Math.round(x * this.k) + fx + this.dx, Math.round(y * this.k) + fy + this.dy);
        return this;
    }

    rect (x, y, w, h) {
        if (this.rot) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); }
        const k = this.k;
        const x0 = Math.round(x * k), y0 = Math.round(y * k);
        const x1 = Math.max(x0 + 1, Math.round((x + w) * k)), y1 = Math.max(y0 + 1, Math.round((y + h) * k));
        for (let j = y0; j < y1; j++) {
            for (let i = x0; i < x1; i++) { this.set(i + this.dx, j + this.dy); }
        }
        return this;
    }

    // polígono (coordenadas contínuas); preenche os pixels cujo centro está dentro
    poly (points) {
        const pts = points.map(([x, y]) => this.tp(x, y));
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
        if (this.rot) {
            // girada: vira polígono de 32 lados (no desenho) antes de girar
            const pts = [];
            for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
            return this.poly(pts);
        }
        cx = cx * this.k + this.dx; cy = cy * this.k + this.dy;
        rx *= this.k; ry *= this.k;
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
        const k = this.k;
        if (thickness * k <= 1) {
            const [p0x, p0y] = this.tp(x0, y0), [p1x, p1y] = this.tp(x1, y1);
            let ax = Math.round(p0x - this.dx), ay = Math.round(p0y - this.dy);
            const bx = Math.round(p1x - this.dx), by = Math.round(p1y - this.dy);
            const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
            const dx = Math.abs(bx - ax), dy = -Math.abs(by - ay);
            let err = dx + dy;
            for (;;) {
                this.set(ax + this.dx, ay + this.dy);
                if (ax === bx && ay === by) { break; }
                const e2 = 2 * err;
                if (e2 >= dy) { err += dy; ax += sx; }
                if (e2 <= dx) { err += dx; ay += sy; }
            }
            return this;
        }
        const r = thickness * k / 2;
        const [ax, ay] = this.tp(x0, y0), [bx, by] = this.tp(x1, y1);
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
    // opts.origin [x, y]: deslocamento base de todas as formas.
    // opts.scale: escala de grade (redesenha o sprite numa grade menor; ver o topo do arquivo).
    // opts.rotate: { angle, cx, cy } rotação de grade (peças que giram no jogo).
    constructor (w, h, opts = {}) {
        this.w = w;
        this.h = h;
        this.k = opts.scale ?? 1;
        this.rotate = opts.rotate || null;
        this.darkRatio = opts.darkRatio ?? 0.3;
        this.origin = opts.origin || [0, 0];
        this.color = new Array(w * h).fill(null);      // '#rrggbb' ou null
        this.owner = new Int32Array(w * h).fill(-1);   // parte dona do pixel
        this.mat = new Array(w * h).fill(null);        // material do pixel (para rim light)
        this.tone = new Int8Array(w * h).fill(-1);
        this.emit = new Uint8Array(w * h);             // pixel emissivo (sem rim light)
        this.glow = new Uint8Array(w * h);             // halo de brilho no vazio (sem contorno externo em volta)
        this.parts = 0;
        this.stats = [];                               // { name, total, dark }
    }

    mask () {
        return new Mask(this.w, this.h, this.origin, this.k, this.rotate);
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
    //   opts.texture  (padrão true) textura do material; false = sem textura; função = textura própria (mesma assinatura)
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
        const texFn = opts.texture === false ? null : (typeof opts.texture === 'function' ? opts.texture : TEXTURES[material]);
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
    //   opts.glow: o halo também se espalha no vazio (lâminas, projéteis de energia), sem contorno em volta.
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
                    if (m.has(x, y) || (!opts.glow && !this.filled(x, y))) { continue; }
                    let near = false;
                    for (let dy = -ring; dy <= ring && !near; dy++) {
                        for (let dx = -ring; dx <= ring && !near; dx++) {
                            if (Math.abs(dx) + Math.abs(dy) <= ring && m.has(x + dx, y + dy)) { near = true; }
                        }
                    }
                    if (near) {
                        const i = y * this.w + x;
                        if (this.owner[i] < 0) { this.owner[i] = id; this.mat[i] = material; this.glow[i] = 1; }
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
                this.glow[i] = 0;
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
        this.paint({ mat, tone: 4 }, (m) => m.offset(dx, dy).dot(x, y));
        this.paint({ mat, tone: 0 }, (m) => m.offset(dx, dy).dot(x, y, 1, 1));
        return this;
    }

    // Rim light de 1 px na borda direita da silhueta + contorno externo de 1 px
    // (o halo de brilho no vazio não ganha contorno: o brilho se desfaz no fundo).
    finish () {
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                const i = y * this.w + x;
                if (!this.filled(x, y) || this.emit[i] || !this.mat[i] || this.filled(x + 1, y)) { continue; }
                this.color[i] = MATERIALS[this.mat[i]][3];
            }
        }
        const solid = (x, y) => this.filled(x, y) && !this.glow[y * this.w + x];
        const add = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (this.filled(x, y)) { continue; }
                if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
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
