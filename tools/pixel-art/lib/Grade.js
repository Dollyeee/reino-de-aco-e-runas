// Grade de pixel art "à mão" (T22): em vez de formas geométricas sombreadas automaticamente, a arte é COMPOSTA com
// peças desenhadas pixel a pixel (tools/pixel-art/lib/materiais/) — grades de caracteres mapeadas para a paleta.
//
// Cada célula guarda { m: material, t: tom 0–4, e: emissivo, k: protegido na limpeza }.
// Coordenadas do desenho com origem configurável (ex.: (0, 0) = ponto de chão da base).
//
// Ferramentas:
//   set / fill(pts ou rect, pintor) / stamp(peça) / tile(peça) → pintor que repete a peça num padrão
//   box3q(...)  caixa em 3/4 de frente com leve obliquidade: frente (médio), topo (claro, recua para cima e um pouco
//               para a direita) e lateral direita (escura) — cada face com o seu pintor
//   outline()   contorno externo #1e1512 na silhueta (contorno seletivo: os internos vêm das próprias peças)
//   rim()       rim light: 1 px um tom acima na borda direita da silhueta (não em emissivos)
//   cleanup()   limpeza: pixel órfão (diferente dos 4 vizinhos, sem par igual em 8 vizinhos) vira a cor da maioria;
//               células protegidas (k) e emissivas ficam
//   toRGBA()

import { MATERIALS, OUTLINE } from '../palette.js';

export class Grade {
    constructor (w, h, origin = [0, 0]) {
        this.w = w;
        this.h = h;
        this.origin = origin;
        this.cells = new Array(w * h).fill(null);
        this.stats = [];   // compatível com o conferidor de sombreamento do gerador (não se aplica aqui)
    }

    idx (x, y) {
        const X = Math.round(x) + this.origin[0], Y = Math.round(y) + this.origin[1];
        return X < 0 || Y < 0 || X >= this.w || Y >= this.h ? -1 : Y * this.w + X;
    }

    get (x, y) { const i = this.idx(x, y); return i < 0 ? null : this.cells[i]; }

    // cell = [material, tom, flags?] ou { m, t, e, k } ou null (não pinta)
    set (x, y, cell) {
        const i = this.idx(x, y);
        if (i < 0 || !cell) { return this; }
        this.cells[i] = Array.isArray(cell) ? { m: cell[0], t: cell[1], e: !!(cell[2] && cell[2].e), k: !!(cell[2] && cell[2].k) } : { ...cell };
        return this;
    }

    clear (x, y) { const i = this.idx(x, y); if (i >= 0) { this.cells[i] = null; } return this; }

    // Preenche um polígono (centro do pixel dentro) ou retângulo com um pintor: função (x, y) → cell, ou cell fixa.
    fill (shape, painter) {
        const paint = typeof painter === 'function' ? painter : () => painter;
        if (shape.rect) {
            const [x0, y0, w, h] = shape.rect;
            for (let y = y0; y < y0 + h; y++) { for (let x = x0; x < x0 + w; x++) { this.set(x, y, paint(x, y)); } }
            return this;
        }
        const pts = shape.poly;
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
            for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
                if (inside(x + 0.5, y + 0.5, pts)) { this.set(x, y, paint(x, y)); }
            }
        }
        return this;
    }

    // Carimba uma peça (grade de caracteres) com o canto superior esquerdo em (x, y). flip = espelho horizontal.
    stamp (piece, x, y, opts = {}) {
        const rows = piece.rows;
        rows.forEach((row, j) => {
            for (let i = 0; i < row.length; i++) {
                const ch = row[opts.flip ? row.length - 1 - i : i];
                const c = piece.key[ch];
                if (c) { this.set(x + i, y + j, c); }
            }
        });
        return this;
    }

    // Pintor que repete uma peça a partir de (x0, y0); offsetRows desloca linhas alternadas (fiadas de pedra).
    // pick(col, row) escolhe a variante da peça em cada repetição (peça ou lista de peças).
    tile (pieces, x0, y0, opts = {}) {
        const list = Array.isArray(pieces) ? pieces : [pieces];
        const pw = list[0].rows[0].length, ph = list[0].rows.length;
        return (x, y) => {
            const ry = Math.floor((y - y0) / ph);
            const shift = opts.offsetRows ? (((ry % 2) + 2) % 2) * opts.offsetRows : 0;
            const rx = Math.floor((x - x0 + shift) / pw);
            const lx = (((x - x0 + shift) % pw) + pw) % pw, ly = (((y - y0) % ph) + ph) % ph;
            const piece = list[opts.pick ? opts.pick(rx, ry) % list.length : 0];
            return piece.key[piece.rows[ly][lx]] || null;
        };
    }

    // Caixa em 3/4 de frente: frente de (x0..x1) × (yb..yt), profundidade d (topo recua d px para cima e d/2 para a
    // direita). faces = { front, top, side } pintores. Devolve os polígonos das faces.
    box3q (x0, x1, yb, yt, d, faces) {
        const s = Math.round(d / 2);
        const front = { rect: [x0, yt, x1 - x0, yb - yt] };
        const top = { poly: [[x0, yt], [x1, yt], [x1 + s, yt - d], [x0 + s, yt - d]] };
        const side = { poly: [[x1, yb], [x1, yt], [x1 + s, yt - d], [x1 + s, yb - d]] };
        if (faces.side) { this.fill(side, faces.side); }
        if (faces.top) { this.fill(top, faces.top); }
        if (faces.front) { this.fill(front, faces.front); }
        return { front, top, side, s };
    }

    filled (X, Y) { return X >= 0 && Y >= 0 && X < this.w && Y < this.h && !!this.cells[Y * this.w + X]; }

    // Limpeza: remove pixels órfãos (ruído de 1 px) que não sejam protegidos nem emissivos.
    cleanup () {
        const key = (c) => (c ? `${c.m}:${c.t}` : '');
        const changes = [];
        for (let Y = 1; Y < this.h - 1; Y++) {
            for (let X = 1; X < this.w - 1; X++) {
                const c = this.cells[Y * this.w + X];
                if (!c || c.k || c.e) { continue; }
                const n4 = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => this.cells[(Y + dy) * this.w + X + dx]);
                if (n4.some((n) => !n)) { continue; }                                  // borda da silhueta: não mexe
                const n8 = [...n4, ...[[1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => this.cells[(Y + dy) * this.w + X + dx])];
                if (n8.some((n) => n && key(n) === key(c))) { continue; }            // tem par: não é órfão
                const count = {};
                for (const n of n4) { count[key(n)] = (count[key(n)] || 0) + 1; }
                const [best, times] = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
                if (times >= 3) { changes.push([Y * this.w + X, n4.find((n) => key(n) === best)]); }
            }
        }
        for (const [i, n] of changes) { this.cells[i] = { ...n }; }
        return changes.length;
    }

    // Rim light: 1 px um tom acima na borda direita da silhueta.
    rim () {
        for (let Y = 0; Y < this.h; Y++) {
            for (let X = 0; X < this.w; X++) {
                const c = this.cells[Y * this.w + X];
                if (!c || c.e || c.m === OUTLINE_M || this.filled(X + 1, Y)) { continue; }
                c.t = Math.min(4, Math.max(c.t, 2) + 1);
            }
        }
        return this;
    }

    // Contorno externo de 1 px na silhueta.
    outline () {
        const add = [];
        for (let Y = 0; Y < this.h; Y++) {
            for (let X = 0; X < this.w; X++) {
                if (this.filled(X, Y)) { continue; }
                if (this.filled(X - 1, Y) || this.filled(X + 1, Y) || this.filled(X, Y - 1) || this.filled(X, Y + 1)) { add.push(Y * this.w + X); }
            }
        }
        for (const i of add) { this.cells[i] = { m: OUTLINE_M, t: 0 }; }
        return this;
    }

    color (c) {
        if (!c) { return null; }
        if (c.m === OUTLINE_M) { return OUTLINE; }
        if (c.m === '#') { return c.hex; }
        return MATERIALS[c.m][c.t];
    }

    toRGBA () {
        const out = new Uint8Array(this.w * this.h * 4);
        this.cells.forEach((c, i) => {
            const hex = this.color(c);
            if (!hex) { return; }
            out[i * 4] = parseInt(hex.slice(1, 3), 16);
            out[i * 4 + 1] = parseInt(hex.slice(3, 5), 16);
            out[i * 4 + 2] = parseInt(hex.slice(5, 7), 16);
            out[i * 4 + 3] = 255;
        });
        return out;
    }
}

export const OUTLINE_M = '__contorno';

function inside (x, y, pts) {
    let r = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) { r = !r; }
    }
    return r;
}
