// Besta Laser — 3 bases novas (T24), com a técnica da T22 (Grade + peças à mão de lib/materiais) e câmera 3/4 FRONTAL
// pura (topo recua reto para cima, lado da sombra = últimas colunas da frente mais escuras). A arma é a da Besta nova.
//   n1 — Torreão redondo de pedra (cilindro com ameias em volta, porta, seteira, estandarte)
//   n2 — Paliçada de troncos (muralha de troncos pontudos amarrados, plataforma atrás, tocha acesa)
//   n3 — Altar rúnico em degraus (3 degraus de pedra baixos e largos, runas e cristais)
// stage: 1 blocagem · 2 luz e volume · 3 materiais e detalhes · 4 limpeza. frame: quadro do idle (4).
// Coordenadas: (0, 0) = ponto de chão; quadro 112×104 com pivot (56, 96) nas três (src/config/towerArt.js).

import { Grade } from '../../lib/Grade.js';
import { hash } from '../../lib/textures.js';
import {
    pedraFrente, pedraTopo, tabuaTopo, tabuaH, poste, cintaH, rebite, corda, estandarte, runas,
    tronco, pontaTronco, porta, seteira, tocha, cristalPequeno, musgoFresta
} from '../../lib/materiais/index.js';
import { ellipse, ringCyan, groundContact, head } from './besta-nova.js';

const FRAME = [112, 104], PIVOT = [56, 96];
const flat = (m, t) => () => [m, t];
const grade = () => new Grade(FRAME[0], FRAME[1], [PIVOT[0], PIVOT[1] - 1]);

// pintor por face conforme o estágio: 1 = um tom por material; 2 = topo/frente/lado; 3+ = peças
function faces (stage) {
    return (m, which, piece) => {
        if (stage >= 3 && piece) { return piece; }
        if (stage < 2) { return flat(m, 2); }
        return flat(m, { top: 3, front: 2, side: 1 }[which]);
    };
}

// escurece/clareia um pintor pela posição x (volume de cilindro: luz à esquerda, sombra à direita)
function cylShade (painter, r) {
    return (x, y) => {
        const c = painter(x, y);
        if (!c) { return c; }
        const cell = Array.isArray(c) ? [...c] : [c.m, c.t];
        const nx = x / r;
        const d = nx < -0.72 ? 1 : (nx > 0.8 ? -2 : (nx > 0.4 ? -1 : 0));
        cell[1] = Math.max(0, Math.min(4, cell[1] + (cell[1] === 0 ? 0 : d)));
        return cell;
    };
}

function finish (g, stage) {
    if (stage >= 4) { g.cleanup(); }
    if (stage >= 2) { g.rim(); }
    g.outline();
    if (stage >= 2) { groundContact(g, stage >= 3); }
    return g;
}

// suporte giratório comum (pedestal curto + disco com anel rúnico); devolve o y do disco
function suporte (g, stage, y, lvl, h = 5) {
    g.box3q(-5, 5, y, y - h, 3, { top: flat('madeira', stage >= 2 ? 3 : 2), front: stage >= 3 ? g.tile(poste, -5, y - h) : flat('madeira', 2) }, 0);
    const sy = y - h - 4;
    g.fill({ rect: [-11, sy, 23, 3] }, flat('aco', stage >= 2 ? 1 : 2));
    ellipse(g, 0, sy, 11, 4, flat('aco', stage >= 2 ? 3 : 2));
    ellipse(g, 0, sy, 9, 3, flat('madeira', stage >= 2 ? 3 : 2));
    if (stage >= 3) { ringCyan(g, 0, sy, 10, 3.5, lvl); g.stamp(rebite, -10, sy); g.stamp(rebite, 9, sy); }
    return sy;
}

// ------------------------------------------------------------------------------------------ n1 — torreão
const IDLE1 = [{ luz: 0, est: 0 }, { luz: 1, est: 0 }, { luz: 1, est: 1 }, { luz: 0, est: 1 }];
function torreao (frame = 0, stage = 4) {
    const k = IDLE1[frame % 4], F = faces(stage), g = grade();
    const R = 30, TOP = -52, RY = 7;
    // plinto largo na base
    g.box3q(-34, 34, 0, -5, 6, { top: F('pedra', 'top'), front: F('pedra', 'front', g.tile(pedraFrente, -34, -5, { offsetRows: 6 })) }, 0);
    // corpo cilíndrico: frente com a borda de baixo curva (ameias e topo por cima)
    const wall = F('pedra', 'front', g.tile(pedraFrente, -R, TOP, { offsetRows: 6, pick: (c, r) => Math.floor(hash(c, r, 7) * 3) }));
    const wallShaded = stage >= 2 ? cylShade(wall, R) : wall;
    g.fill({ rect: [-R, TOP, R * 2, -5 - TOP] }, wallShaded);
    ellipse(g, 0, -6, R, 6, wallShaded);                         // R3: base do cilindro mais curva
    // topo: anel de pedra (claro) + piso de tábuas
    ellipse(g, 0, TOP, R, RY, F('pedra', 'top', flat('pedra', 3)));
    ellipse(g, 0, TOP - 1, R - 5, RY - 2, F('madeira', 'top', g.tile(tabuaTopo, -R, TOP - 8)));
    // ameias de trás (na borda do fundo) e da frente (na borda da frente)
    const merlon = (x, yb) => g.box3q(x, x + 7, yb, yb - 9, 3, {   // R2: ameias de 9 px (7 sumiam)
        top: F('pedra', 'top'), front: stage >= 2 ? cylShade(F('pedra', 'front', g.tile(pedraFrente, x, yb - 7)), R) : F('pedra', 'front')
    }, 0);
    for (const x of [-21, -9, 3, 15]) { merlon(x, Math.round(TOP - RY * Math.sqrt(1 - ((x + 3.5) / R) ** 2)) + 2); }
    if (stage >= 3) { ellipse(g, 0, TOP - 1, R - 5, RY - 2, g.tile(tabuaTopo, -R, TOP - 8)); }
    const sy = suporte(g, stage, TOP - 1, k.luz + 1, 15);       // R3: pedestal alto — a arma fica acima das ameias da frente
    for (const x of [-29, -17, -5, 7, 19]) { merlon(x, Math.round(TOP + RY * Math.sqrt(Math.max(0, 1 - ((x + 3.5) / R) ** 2))) + 1); }
    if (stage >= 2) { g.shadeRight(R, TOP + 8, -5, 2); }
    if (stage >= 3) {
        g.stamp(porta, -6, -20);
        g.stamp(seteira[k.luz], 13, -42);
        g.stamp(seteira[k.luz], -18, -40);
        g.stamp(estandarte[k.est], -27, TOP + 6);
        g.stamp(musgoFresta, 20, -8); g.stamp(musgoFresta, -31, -24); g.stamp(musgoFresta, 6, -33);
    }
    return { g: finish(g, stage), mountY: sy - 3 };
}

// ------------------------------------------------------------------------------------------ n2 — paliçada
const IDLE2 = [{ fogo: 0 }, { fogo: 1 }, { fogo: 2 }, { fogo: 1 }];
function palicada (frame = 0, stage = 4) {
    const k = IDLE2[frame % 4], F = faces(stage), g = grade();
    // plataforma de madeira atrás da muralha: R2 — mais baixa (só o piso aparece por cima das pontas) e apoiada em
    // dois postes grossos que sobem por trás dos troncos (antes parecia uma caixa flutuando)
    g.box3q(-32, 32, -42, -46, 12, { top: F('madeira', 'top', g.tile(tabuaTopo, -32, -58)), front: F('madeira', 'front', g.tile(tabuaH, -32, -45)) }, 0);
    // R3: postes de parapeito nos cantos de trás da plataforma (dão estrutura; antes parecia um caixote)
    for (const x of [-31, 27]) { g.box3q(x, x + 4, -56, -64, 2, { top: F('madeira', 'top'), front: F('madeira', 'front', g.tile(poste, x, -64)) }, 0); }
    if (stage >= 3) { g.stamp(corda, -31, -62); g.stamp(corda, 26, -62); }
    const sy = suporte(g, stage, -52, k.fogo === 1 ? 2 : 1, 7);
    // alicerce de pedra
    g.box3q(-44, 44, 0, -6, 5, { top: F('pedra', 'top'), front: F('pedra', 'front', g.tile(pedraFrente, -44, -6, { offsetRows: 6 })) }, 0);
    // troncos pontudos, alturas variadas
    for (let i = 0; i < 14; i++) {
        const x = -42 + i * 6;
        const top = -38 - Math.floor(hash(i, 0, 31) * 5) - (i % 2 ? 2 : 0);
        g.fill({ rect: [x, top, 6, -6 - top] }, stage >= 3 ? g.tile(tronco, x, top) : (stage >= 2 ? (xx) => ['casca', xx === x ? 3 : (xx === x + 5 ? 1 : 2)] : flat('casca', 2)));
        if (stage >= 3) { g.stamp(pontaTronco, x, top - 5); } else { g.fill({ poly: [[x, top], [x + 3, top - 5], [x + 6, top]] }, flat('casca', stage >= 2 ? 3 : 2)); }
    }
    if (stage >= 2) {
        // sombra de oclusão onde a muralha encosta no alicerce
        g.fill({ rect: [-42, -7, 84, 1] }, flat('casca', 0));
    }
    if (stage >= 3) {
        for (const y of [-16, -30]) {
            g.fill({ rect: [-42, y, 84, 3] }, g.tile(cintaH, -42, y));
            for (let x = -40; x < 42; x += 12) { g.stamp(rebite, x, y); }
        }
        g.stamp(corda, -43, -24);
        g.stamp(corda, 38, -24);
        g.stamp(tocha[k.fogo], -41, -47);             // R3: tocha presa à muralha (solta, parecia um pixel flutuando)
    }
    if (stage >= 2) { g.shadeRight(42, -40, -6, 2); }
    return { g: finish(g, stage), mountY: sy - 3 };
}

// ------------------------------------------------------------------------------------------ n3 — altar rúnico
const IDLE3 = [{ runa: 1, cri: 0 }, { runa: 2, cri: 1 }, { runa: 2, cri: 0 }, { runa: 1, cri: 1 }];
function altar (frame = 0, stage = 4) {
    const k = IDLE3[frame % 4], F = faces(stage), g = grade();
    const step = (x0, x1, yb, yt, seed) => g.box3q(x0, x1, yb, yt, 8, {
        top: F('pedra', 'top', g.tile(pedraTopo, x0, yt - 8, { offsetRows: 6 })),
        front: F('pedra', 'front', g.tile(pedraFrente, x0, yt, { offsetRows: 6, pick: (c, r) => Math.floor(hash(c, r, seed) * 3) }))
    }, 0);
    step(-44, 44, 0, -10, 1);
    step(-33, 33, -13, -23, 2);
    step(-22, 22, -26, -36, 3);
    if (stage >= 2) {
        g.fill({ rect: [-33, -14, 66, 1] }, flat('pedra', 0));
        g.fill({ rect: [-22, -27, 44, 1] }, flat('pedra', 0));
        g.shadeRight(44, -10, 0, 2); g.shadeRight(33, -23, -13, 2); g.shadeRight(22, -36, -26, 2);
    }
    if (stage >= 3) {
        for (const [i, x] of [-37, -17, 13, 33].entries()) { g.stamp(runas[i % 3][k.runa], x, -8); }
        for (const [i, x] of [-24, 20].entries()) { g.stamp(runas[(i + 1) % 3][k.runa], x, -21); }
        g.stamp(runas[2][k.runa], -1, -34);
        g.stamp(cristalPequeno[k.cri], -31, -31);
        g.stamp(cristalPequeno[1 - k.cri], 27, -31);
        g.stamp(cristalPequeno[k.cri], -42, -18);
        g.stamp(cristalPequeno[1 - k.cri], 38, -18);
        g.stamp(musgoFresta, -40, -2); g.stamp(musgoFresta, 30, -15);
    }
    const sy = suporte(g, stage, -40, k.runa, 10);   // R2: pedestal alto sobre o último degrau
    return { g: finish(g, stage), mountY: sy - 3 };
}

export const BASES = {
    n1: { nome: 'Torreão redondo de pedra', draw: torreao },
    n2: { nome: 'Paliçada de troncos', draw: palicada },
    n3: { nome: 'Altar rúnico em degraus', draw: altar }
};

// módulos no formato do gerador (base(frame) + head(angle, phase))
export const bestaBases = Object.fromEntries(Object.entries(BASES).map(([id, b]) => [id, { base: (frame) => b.draw(frame, 4).g, head }]));
