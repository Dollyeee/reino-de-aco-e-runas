// Tela de pixel art desenhada em PARTES (de trás para frente), sem antialias.
//
// Cada parte é uma máscara (formas rasterizadas na grade) + um material (rampa de 3 tons).
// Ao desenhar uma parte:
//   1. contorno interno: pixels de partes JÁ desenhadas que encostam na parte nova viram contorno;
//   2. sombreamento automático (cel shading, luz do canto superior esquerdo):
//        borda de baixo/direita e metade inferior-direita → tom escuro;
//        borda de cima/esquerda → tom claro; resto → tom médio.
// No fim, contorno de 1 px em volta da silhueta inteira.
//
// Vizinhos são consultados com checagem de limites (fora da tela = vazio). Nunca se usa
// deslocamento circular de máscara, que criaria contornos falsos nas bordas do canvas.

import { MATERIALS, OUTLINE, DARK, MID, LIGHT } from '../palette.js';

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

    // pixel avulso
    px (x, y) {
        this.set(x + this.dx, y + this.dy);
        return this;
    }

    // retângulo de pixels inteiros: canto (x, y), tamanho w × h
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

    // elipse com centro (cx, cy) e raios (rx, ry)
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

    // linha grossa (cápsula). Espessura 1 usa Bresenham para ficar com 1 px exato.
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

export class PixelCanvas {
    constructor (w, h) {
        this.w = w;
        this.h = h;
        this.color = new Array(w * h).fill(null);      // '#rrggbb' ou null (transparente)
        this.owner = new Int32Array(w * h).fill(-1);   // índice da parte dona do pixel
        this.parts = 0;
    }

    mask () {
        return new Mask(this.w, this.h);
    }

    filled (x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h && this.owner[y * this.w + x] >= 0;
    }

    // Desenha uma parte com um material.
    //   opts.shade   (padrão true)  sombreamento automático; false = tom único (opts.tone)
    //   opts.outline (padrão true)  contorno onde a parte se sobrepõe a partes anteriores
    part (material, build, opts = {}) {
        const ramp = MATERIALS[material];
        if (!ramp) { throw new Error(`material desconhecido: ${material}`); }
        const m = this.mask();
        build(m);
        const id = this.parts++;
        const shade = opts.shade !== false;
        const tone = opts.tone ?? MID;

        // 1) contorno interno sobre as partes de trás que encostam na parte nova
        if (opts.outline !== false) {
            const edge = [];
            for (let y = 0; y < this.h; y++) {
                for (let x = 0; x < this.w; x++) {
                    if (m.has(x, y) || !this.filled(x, y)) { continue; }
                    if (m.has(x - 1, y) || m.has(x + 1, y) || m.has(x, y - 1) || m.has(x, y + 1)) { edge.push(y * this.w + x); }
                }
            }
            for (const i of edge) { this.color[i] = OUTLINE; }
        }

        // 2) preenchimento com sombreamento
        const b = m.bounds();
        const bw = Math.max(1, b.x1 - b.x0 + 1), bh = Math.max(1, b.y1 - b.y0 + 1);
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (!m.has(x, y)) { continue; }
                let t = tone;
                if (shade) {
                    const lowerRight = (x + 0.5 - b.x0) / bw + (y + 0.5 - b.y0) / bh > 1.1;
                    if (!m.has(x, y + 1) || !m.has(x + 1, y)) { t = DARK; }
                    else if (!m.has(x, y - 1) || !m.has(x - 1, y)) { t = LIGHT; }
                    else if (lowerRight) { t = DARK; }
                    else { t = MID; }
                }
                const i = y * this.w + x;
                this.color[i] = ramp[t];
                this.owner[i] = id;
            }
        }
        return this;
    }

    // Pinta pixels por cima SEM mudar partes nem contornos (runas, reflexos, detalhes).
    // Por padrão só pinta onde já existe algo desenhado.
    paint (hex, build, opts = {}) {
        const m = this.mask();
        build(m);
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (!m.has(x, y)) { continue; }
                if (opts.anywhere || this.filled(x, y)) { this.color[y * this.w + x] = hex; }
            }
        }
        return this;
    }

    // Contorno de 1 px em volta da silhueta inteira (vizinhança de 4, sem rotação de máscara).
    outlineSilhouette () {
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

    // RGBA (Uint8Array) para exportar
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
