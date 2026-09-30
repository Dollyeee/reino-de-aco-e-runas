import { BALANCE } from '../config/balance.js';
import { HUD, TOWER_BAR, WORLD } from '../config/visual.js';
import { DECOR } from '../config/art.js';
import { decorItemFor } from '../config/decor.js';

// Retângulo ocupado pela barra de torres (usado pela UI e pelas regras).
export function towerBarRect () {
    const b = TOWER_BAR;
    const w = b.cardW * 2 + b.gap + b.pad * 2;
    const h = b.cardH + b.pad * 2;
    return { x: b.x - w / 2, y: b.y - h / 2, w, h };
}

// Áreas de interface onde não se pode construir.
function uiRects () {
    const p = HUD.panel;
    const btn = HUD.waveButton;
    return [
        { x: p.x - 4, y: p.y - 4, w: p.w + 8, h: p.h + 14 },
        { x: btn.x - btn.w / 2 - 4, y: btn.y - btn.h / 2 - 4, w: btn.w + 8, h: btn.h + 14 },
        towerBarRect()
    ];
}

function rectsOverlap (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Raio de bloqueio de uma decoração: kit de pixel art → tamanho real do item (src/config/decor.js);
// arte atual (SVG) → BALANCE.placement.decorationRadius × escala (entradas `kitOnly` não existem).
function decorationRadius (d) {
    if (DECOR) {
        const item = decorItemFor(d);
        return item ? DECOR.items[item].block : 0;
    }
    if (d.kitOnly) { return 0; }
    return (BALANCE.placement.decorationRadius[d.type] || 0) * (d.scale || 1);
}

// Decide se uma torre pode ser construída num ponto (x, y) do chão.
// Devolve { ok: true } ou { ok: false, reason: 'texto para o jogador' }.
export default class PlacementRules {
    constructor (map, track) {
        this.map = map;
        this.track = track;
        this.ui = uiRects();
    }

    check (type, x, y, towers) {
        const P = BALANCE.placement;
        const r = BALANCE.towers[type].footprintRadius;

        // dentro do mundo, com margem
        const m = P.worldMargin;
        if (x - r < m || x + r > WORLD.width - m || y - P.towerHeight < m || y + r * 0.5 > WORLD.height - m) {
            return { ok: false, reason: 'Fora do mapa' };
        }

        // fora do HUD e da barra de torres (a torre ocupa do chão até a sua altura)
        const pad = P.uiPadding;
        const box = { x: x - r - pad, y: y - P.towerHeight - pad, w: (r + pad) * 2, h: P.towerHeight + r * 0.5 + pad * 2 };
        if (this.ui.some((u) => rectsOverlap(box, u))) {
            return { ok: false, reason: 'Área da interface' };
        }

        // longe do caminho
        if (this.track.distanceTo(x, y) <= this.map.pathWidth / 2 + r + P.pathClearance) {
            return { ok: false, reason: 'Em cima do caminho' };
        }

        // longe do castelo
        const c = this.map.castle, cb = P.castle;
        if (x + r > c.x - cb.halfWidth && x - r < c.x + cb.halfWidth && y + r * 0.5 > c.y - cb.above && y - r * 0.5 < c.y + cb.below) {
            return { ok: false, reason: 'Muito perto do castelo' };
        }

        // sem sobrepor outras torres
        for (const t of towers) {
            if (Math.hypot(t.placeX - x, t.placeY - y) < r + t.footprint) {
                return { ok: false, reason: 'Em cima de outra torre' };
            }
        }

        // sem sobrepor decorações
        for (const d of this.map.decorations) {
            const dr = decorationRadius(d);
            if (dr > 0 && Math.hypot(d.x - x, d.y - y) < r + dr) {
                const names = { tree: 'uma árvore', rock: 'uma pedra', 'crystal-cluster': 'um cristal', bush: 'um arbusto' };
                return { ok: false, reason: `Bloqueado por ${names[d.type] || 'decoração'}` };
            }
        }

        return { ok: true };
    }
}
