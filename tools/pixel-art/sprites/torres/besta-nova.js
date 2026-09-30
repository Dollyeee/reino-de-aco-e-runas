// Besta Laser — nova técnica (T22): torre de vigia composta com peças desenhadas à mão (lib/materiais) numa Grade,
// em 4 etapas (1 blocagem → 2 luz e volume → 3 materiais e detalhes → 4 limpeza) + conceito (3 silhuetas).
//
// Coordenadas: (0, 0) = ponto de chão da base (y negativo para cima). Câmera 3/4 de FRENTE pura (igual ao orc e às
// árvores): o topo das caixas recua reto para cima (SKEW = 0) e mostra os TOPOS claros; o "lado da sombra" é o
// escurecimento das últimas colunas da frente (Grade.shadeRight). Revisão da besta-r3 ("ângulo meio estranho"): a
// versão oblíqua (topo deslocado para a direita + lateral) parecia torta ao lado dos personagens frontais.
const SKEW = 0;
// Encaixes e quadros em src/config/towerArt.js (TOWER_ART.laserCrossbow.n).

import { Grade } from '../../lib/Grade.js';
import { hash } from '../../lib/textures.js';
import { MATERIALS } from '../../palette.js';
import {
    pedraFrente, pedraTopo, pedraLado, ameia, tabuaV, tabuaH, tabuaTopo, poste, pontaTabua,
    cintaH, rebite, cantoneira, estandarte, janela, runas
} from '../../lib/materiais/index.js';
import { TOWER_ART } from '../../../../src/config/towerArt.js';
import { spinCanvas } from './comum.js';

const D = TOWER_ART.laserCrossbow.n;

// ------------------------------------------------------------------------------------------ geometria (blocagem)
// Tudo que as etapas seguintes vestem: caixas (frente x0..x1, base yb, topo yt, profundidade d).
// R2 (autocrítica da R1): pedra mais baixa, corpo mais alto e mais fundo, suporte sobre um pedestal (arma mais alta).
export const GEO = {
    pedra: { x0: -44, x1: 38, yb: 0, yt: -19, d: 10 },
    corpo: { x0: -31, x1: 29, yb: -23, yt: -58, d: 9 },
    piso: { x0: -41, x1: 37, yb: -58, yt: -64, d: 14 },
    postes: [-31, 23],                       // x dos postes da frente (6 px)
    cintas: [-36, -53],                      // y das cintas de ferro
    janela: { x: 9, y: -51 },
    estandarte: { x: -29, y: -58 },
    runas: [{ x: -31, y: -15 }, { x: -3, y: -15 }, { x: 23, y: -15 }],
    pedestal: { x: -5, w: 10, yb: -70, h: 9 },   // R3: pedestal mais alto (a arma não cobre mais o suporte)
    suporte: { x: 0, y: -83, rx: 11, ry: 4 }
};

// quadros do idle: nível das runas, janela forte/fraca, estandarte (balanço de 1 px)
export const IDLE = [
    { runa: 1, janela: 0, est: 0 },
    { runa: 2, janela: 1, est: 0 },
    { runa: 2, janela: 1, est: 1 },
    { runa: 1, janela: 0, est: 1 }
];

const flat = (m, t) => () => [m, t];

function newGrade () {
    const [w, h] = D.base.frame;
    return new Grade(w, h, [D.base.pivot[0], D.base.pivot[1] - 1]);
}

// ------------------------------------------------------------------------------------------ 0) conceito
// 3 silhuetas com proporções diferentes (2–3 tons: luz, meio, sombra) — só massas.
export const CONCEITOS = [
    { nome: 'baixa e larga', pedra: [-48, 44, 0, -18, 10], corpo: [-36, 34, -22, -44, 6], piso: [-46, 42, -44, -50, 14] },
    { nome: 'robusta (escolhida)', pedra: [-44, 38, 0, -22, 10], corpo: [-31, 29, -25, -55, 7], piso: [-41, 37, -55, -61, 16] },
    { nome: 'alta e estreita', pedra: [-34, 30, 0, -20, 8], corpo: [-24, 22, -22, -70, 6], piso: [-32, 30, -70, -76, 12] }
];

export function conceito (i) {
    const c = CONCEITOS[i];
    const g = newGrade();
    const faces = (m) => ({ top: flat(m, 3), front: flat(m, 2), side: flat(m, 1) });
    g.box3q(...c.pedra, faces('pedra'));
    g.box3q(...c.corpo, faces('madeira'));
    const piso = g.box3q(...c.piso, faces('madeira'));
    const topY = c.piso[3] - c.piso[4] / 2;
    g.fill({ rect: [Math.round((c.piso[0] + c.piso[1]) / 2 - 4 + piso.s / 2), Math.round(topY - 10), 8, 10] }, flat('aco', 2));
    g.fill({ rect: [Math.round((c.piso[0] + c.piso[1]) / 2 - 16 + piso.s / 2), Math.round(topY - 14), 32, 4] }, flat('aco', 3));
    return g.outline();
}

// ------------------------------------------------------------------------------------------ base (etapas 1–4)
// stage: 1 blocagem · 2 luz e volume · 3 materiais e detalhes · 4 limpeza (final). frame: quadro do idle.
export function base (frame = 0, stage = 4) {
    const G = GEO;
    const idle = IDLE[frame % IDLE.length];
    const g = newGrade();
    const lit = stage >= 2;
    const mat = stage >= 3;
    // pintor por face: com materiais usa as peças; sem, tons chapados (1: um tom; 2: topo/frente/lateral)
    const face = (m, which, tiles) => {
        if (mat && tiles && tiles[which]) { return tiles[which]; }
        if (!lit) { return flat(m, 2); }
        return flat(m, { top: 3, front: 2, side: 1 }[which]);
    };

    // --- pedra
    const P = G.pedra;
    g.box3q(P.x0, P.x1, P.yb, P.yt, P.d, {
        top: face('pedra', 'top', { top: g.tile(pedraTopo, P.x0 + 3, P.yt - P.d, { offsetRows: 6, pick: (c, r) => Math.floor(hash(c, r, 5) * 2) }) }),
        front: face('pedra', 'front', { front: g.tile(pedraFrente, P.x0, P.yt, { offsetRows: 6, pick: (c, r) => Math.floor(hash(c, r, 3) * 3) }) }),
        side: face('pedra', 'side', { side: g.tile(pedraLado, P.x1, P.yt) })
    }, SKEW);
    if (mat) {
        for (const [i, r] of G.runas.entries()) { g.stamp(runas[i % runas.length][idle.runa], r.x, r.y); }
    }

    // --- corpo de madeira: parede de tábuas verticais, postes grossos, cintas de ferro
    const C = G.corpo;
    g.box3q(C.x0, C.x1, C.yb, C.yt, C.d, {
        top: face('madeira', 'top'),
        front: face('madeira', 'front', { front: g.tile(tabuaV, C.x0, C.yt) }),
        side: face('madeira', 'side')
    }, SKEW);
    if (lit) {
        // oclusão: a parede "entra" na pedra (linha escura no pé) e fica sob a sombra do piso (2 linhas no topo)
        g.fill({ rect: [C.x0, C.yb - 1, C.x1 - C.x0, 1] }, flat('madeira', 0));
        g.fill({ rect: [C.x0, C.yt, C.x1 - C.x0 + 4, 2] }, flat('madeira', 0));
        g.fill({ rect: [C.x0, C.yt + 2, C.x1 - C.x0, 1] }, flat('madeira', 1));
    }
    if (mat) {
        for (const x of G.postes) { g.fill({ rect: [x, C.yt + 2, 6, C.yb - C.yt - 3] }, g.tile(poste, x, C.yt)); }
        for (const y of G.cintas) {
            g.fill({ rect: [C.x0, y, C.x1 - C.x0, 3] }, g.tile(cintaH, C.x0, y));
            for (const x of [...G.postes.map((p) => p + 2), -12, 8]) { g.stamp(rebite, x, y); }
        }
        g.stamp(janela[idle.janela], G.janela.x, G.janela.y);
        // (R3: a amarração de corda no poste virava um quadradinho sem forma no tamanho real — removida daqui)
    }

    // --- piso da plataforma: tábuas vistas de cima, viga da frente com pontas de tábua, cantoneiras
    const F = G.piso;
    g.box3q(F.x0, F.x1, F.yb, F.yt, F.d, {
        top: face('madeira', 'top', { top: g.tile(tabuaTopo, F.x0, F.yt - F.d) }),
        front: face('madeira', 'front', { front: g.tile(tabuaH, F.x0, F.yt + 1) }),
        side: face('madeira', 'side')
    }, SKEW);
    if (mat) {
        for (let x = F.x0 + 5; x < F.x1 - 6; x += 11) { g.stamp(pontaTabua, x, F.yt + 2); }
        g.stamp(cantoneira, F.x0, F.yt + 1);
        g.stamp(cantoneira, F.x1 - 4, F.yt + 1);
    }

    // --- ameias de pedra nos cantos (as de trás primeiro)
    const s = Math.round(F.d * SKEW);
    const merlons = [[F.x0 + s + 1, F.yt - F.d + 2], [F.x1 - 9 + s, F.yt - F.d + 2], [F.x0, F.yt], [F.x1 - 10, F.yt]];
    for (const [x, yBottom] of merlons) {
        if (mat) { g.stamp(ameia, x, yBottom - 11); } else {
            g.box3q(x, x + 8, yBottom, yBottom - 7, 4, { top: face('pedra', 'top'), front: face('pedra', 'front'), side: face('pedra', 'side') }, SKEW);
        }
    }

    // --- pedestal de madeira no centro do piso + suporte giratório (disco com aro de ferro e anel rúnico)
    const Pd = G.pedestal;
    g.box3q(Pd.x, Pd.x + Pd.w, Pd.yb, Pd.yb - Pd.h, 4, {
        top: face('madeira', 'top'), front: face('madeira', 'front', { front: g.tile(poste, Pd.x, Pd.yb - Pd.h) }), side: face('madeira', 'side')
    }, SKEW);
    if (mat) { g.fill({ rect: [Pd.x, Pd.yb - 2, Pd.w, 1] }, flat('aco', 2)); g.stamp(rebite, Pd.x + 1, Pd.yb - 3); g.stamp(rebite, Pd.x + Pd.w - 2, Pd.yb - 3); }
    const S = G.suporte;
    g.fill({ rect: [S.x - S.rx, S.y, S.rx * 2 + 1, 3] }, lit ? flat('aco', 1) : flat('aco', 2));
    ellipse(g, S.x, S.y, S.rx, S.ry, lit ? flat('aco', 3) : flat('aco', 2));
    ellipse(g, S.x, S.y, S.rx - 2, S.ry - 1, lit ? flat('madeira', 3) : flat('madeira', 2));
    if (mat) {
        ringCyan(g, S.x, S.y, S.rx - 1, S.ry - 0.5, idle.runa);
        g.stamp(rebite, S.x - S.rx + 1, S.y);
        g.stamp(rebite, S.x + S.rx - 2, S.y);
    }

    // --- estandarte azul pendurado na lateral iluminada (balança 1 px)
    if (mat) {
        g.stamp(estandarte[idle.est], G.estandarte.x, G.estandarte.y);
    } else {
        g.fill({ rect: [G.estandarte.x + 1, G.estandarte.y + 1, 10, 14] }, flat('azul', lit ? 2 : 2));
    }

    // lado da sombra: últimas colunas da frente um tom abaixo (sem lateral oblíqua)
    if (lit) { g.shadeRight(P.x1, P.yt, P.yb); g.shadeRight(C.x1, C.yt + 3, C.yb, 3); g.shadeRight(F.x1, F.yt, F.yb, 2); }
    if (stage >= 4) { g.cleanup(); }
    if (lit) { g.rim(); }
    g.outline();
    if (lit) { groundContact(g, stage >= 3); }
    return g;
}

function ellipse (g, cx, cy, rx, ry, paint) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
            const nx = (x + 0.5 - cx - 0.5) / rx, ny = (y + 0.5 - cy - 0.5) / ry;
            if (nx * nx + ny * ny <= 1) { g.set(x, y, paint(x, y)); }
        }
    }
}

// anel rúnico: traços ciano curtos na borda do disco (nível do idle: 1 aceso, 2 forte)
function ringCyan (g, cx, cy, rx, ry, lvl) {
    for (let i = 0; i < 20; i++) {
        if (i % 3 === 2) { continue; }                       // falhas = runas separadas
        const a = (i / 20) * Math.PI * 2;
        const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
        g.set(x, y, ['ciano', lvl === 2 ? 3 : 2, { e: true, k: true }]);
    }
}

// sombra de contato + terra + capim em volta (depois do contorno, só em pixels vazios; sem contorno)
function groundContact (g, detail) {
    const T = MATERIALS.terra, Gm = MATERIALS.grama;
    const put = (x, y, hex) => { const i = g.idx(x, y); if (i >= 0 && !g.cells[i]) { g.cells[i] = { m: '#', hex }; } };
    for (let y = -5; y <= 6; y++) {
        for (let x = -52; x <= 52; x++) {
            const e = (x / 51) ** 2 + ((y - 1) / 5.5) ** 2 + (hash(x, y, 71) - 0.5) * 0.3;
            if (e > 1) { continue; }
            let t = 2;
            // sombra projetada: luz do canto superior esquerdo → cai para baixo e para a direita da base
            const cast = x > -40 && x < 50 && y >= 1 && y <= 4 - Math.max(0, Math.floor((-x) / 14));
            if (cast) { t = y <= 2 ? 0 : 1; }
            else if (detail && hash(x >> 1, y, 72) < 0.16) { t = 1; }
            else if (detail && hash(x, y, 73) < 0.1) { t = 3; }
            put(x, y, T[t]);
        }
    }
    if (!detail) { return; }
    const tuft = (x, y, f = 1) => { put(x, y, Gm[1]); put(x + f, y, Gm[0]); put(x, y - 1, Gm[3]); put(x - f, y - 2, Gm[3]); put(x + f, y - 2, Gm[4]); };
    tuft(-50, 3); tuft(-43, 6); tuft(49, 2, -1); tuft(41, 6, -1); tuft(-47, -3); tuft(51, -2, -1); tuft(10, 6); tuft(-18, 6, -1);
}

// ------------------------------------------------------------------------------------------ arma (gira na mira)
// Besta mecânica vista de cima, apontando para a direita: coronha de madeira escura, ferragens, arco de ferro com
// cordas de energia ciano, virote de aço. Redesenhada pela grade em cada ângulo (PixelCanvas.rotate).
export function head (angle, phase = 0) {
    const cv = spinCanvas(D.head, angle);
    cv.part('casca', (m) => m.poly([[-30, -5], [-22, -6], [-22, 6], [-30, 5]]), { name: 'coronha' });
    cv.part('casca', (m) => m.poly([[-24, -4], [18, -4], [22, 0], [18, 4], [-24, 4]]), { name: 'corpo' });
    cv.part('aco', (m) => m.rect(-18, -6, 10, 12), { name: 'mecanismo', specular: 2 });
    cv.rivet(-16, -4, 'aco'); cv.rivet(-11, 3, 'aco');
    cv.part('aco', (m) => m.rect(-2, -5, 2, 10).rect(10, -5, 2, 10), { name: 'cintas', specular: 1 });
    cv.part('aco', (m) => m.poly([[8, -4], [14, -12], [13, -21], [9, -24], [9, -13], [5, -4]]), { name: 'arco de cima', specular: 2 });
    cv.part('aco', (m) => m.poly([[8, 4], [14, 12], [13, 21], [9, 24], [9, 13], [5, 4]]), { name: 'arco de baixo', specular: 1 });
    cv.part('acoClaro', (m) => m.rect(-6, -1, 36, 2), { name: 'virote', specular: 1 });
    cv.emissive('ciano', (m) => m.line(9, -23, -8, 0).line(9, 23, -8, 0), { halo: 0, core: 3 });
    const t = (phase + 0.5) / 3;
    cv.emissive('ciano', (m) => { m.ellipse(9 - 17 * t, -23 + 23 * t, 1.2, 1.2); m.ellipse(9 - 17 * t, 23 - 23 * t, 1.2, 1.2); }, { halo: 1, core: 4 });
    cv.emissive('ciano', (m) => m.ellipse(-9, 0, 2.2, 2.2), { halo: 1 });
    cv.emissive('ciano', (m) => m.line(30, 0, 31, 0), { halo: 0, core: 3 });
    return cv.finish();
}

export default { base: (frame) => base(frame, 4), head };
