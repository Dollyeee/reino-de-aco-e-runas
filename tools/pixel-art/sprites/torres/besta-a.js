// Besta Laser versão A — "Torre de vigia" com a passada de acabamento da T20 (piloto da receita para as torres).
//   • Câmera 3/4 de verdade: topo da base de pedra, piso da plataforma e tampo da besta aparecem (não só a frente).
//   • Robusta: vigas de 5–6 px, estrutura mais baixa e larga, besta ~30% maior.
//   • Materiais: madeira com veio e pontas de tábua, pregos e cantoneiras de ferro; pedra em blocos com rejunte e musgo
//     nas frestas; metal com brilho especular de 1–2 px.
//   • Luz forte do canto superior esquerdo: topos no tom 3, faces da frente no 2 escurecendo para a direita, sombra de
//     oclusão sob o piso e sob a borda da pedra, rim light de 1 px (PixelCanvas.finish).
//   • Vida: corda amarrando as vigas, caixa de virotes, bandeira do reino, runa ciano na pedra; chão embutido (terra,
//     sombra de contato e capim, sem contorno).
//   • Idle: base com 4 quadros (bandeira balançando, runa pulsando); cabeça com 3 fases (brilho correndo pela corda).
// Coordenadas: base com (0, 0) no ponto de chão (y negativo para cima); cabeça com (0, 0) no eixo, apontando para a direita.

import { MATERIALS } from '../../palette.js';
import { hash } from '../../lib/textures.js';
import { TOWER_ART } from '../../../../src/config/towerArt.js';
import { baseCanvas, groundDecal, spinCanvas } from './comum.js';

const D = TOWER_ART.laserCrossbow.a;
const G = MATERIALS.grama, TR = MATERIALS.terra;

// veio da madeira: riscos na direção do comprimento (texturas variam só entre os tons 2 e 3)
const grainV = (p) => (p.lx % 3 === 1 && hash(p.lx, p.ly >> 2, p.seed) < 0.75 ? (p.tone === 3 ? -1 : 0) : 0);
const grainH = (p) => (p.ly % 3 === 1 && hash(p.lx >> 2, p.ly, p.seed) < 0.75 ? (p.tone === 3 ? -1 : 0) : 0);

// quadros do idle da base: pose da bandeira e brilho da runa
const IDLE = [{ flag: 0, rune: 0 }, { flag: 1, rune: 1 }, { flag: 2, rune: 2 }, { flag: 1, rune: 1 }];
const FLAGS = [
    [[27, -86], [41, -84], [39, -80], [42, -76], [27, -77]],
    [[27, -86], [40, -85], [42, -81], [40, -77], [27, -77]],
    [[27, -86], [41, -83], [40, -79], [43, -75], [27, -77]]
];

function base (frame = 0) {
    const pose = IDLE[frame % IDLE.length];
    const cv = baseCanvas(D);

    // --- alicerce de pedra: topo iluminado + frente em duas fiadas de blocos
    cv.part('pedra', (m) => m.rect(-35, -13, 70, 13), { name: 'pedra: frente', specular: 0 });
    cv.part('pedra', (m) => m.poly([[-35, -13], [35, -13], [31, -21], [-31, -21]]), { name: 'pedra: topo', specular: 2 });
    cv.paint({ mat: 'pedra', tone: 3 }, (m) => m.poly([[-33, -14], [33, -14], [30, -20], [-30, -20]]));
    cv.paint({ mat: 'pedra', tone: 4 }, (m) => m.line(-30, -20, -12, -20));
    cv.paint({ mat: 'pedra', tone: 1 }, (m) => {
        m.line(-32, -17, 32, -17);
        for (const x of [-18, 16]) { m.line(x, -20, x, -18); }
        for (const x of [-6, 26]) { m.line(x, -16, x, -14); }
    });
    cv.paint({ mat: 'pedra', tone: 0 }, (m) => {
        m.line(-35, -7, 34, -7);
        for (const x of [-22, -6, 10, 24]) { m.line(x, -12, x, -8); }
        for (const x of [-14, 2, 18]) { m.line(x, -6, x, -1); }
    });
    // luz forte: borda de cima de cada bloco um tom acima
    cv.paint({ mat: 'pedra', tone: 3 }, (m) => { m.line(-34, -12, 34, -12); m.line(-34, -6, 34, -6); });
    // musgo nas frestas
    cv.paint({ mat: 'musgo', tone: 2 }, (m) => m.px(-22, -9).px(-21, -8).px(10, -12).px(11, -12).px(2, -3).px(3, -4).px(-34, -6).px(-30, -19).px(-29, -19).px(24, -9));
    cv.paint({ mat: 'musgo', tone: 3 }, (m) => m.px(-21, -9).px(2, -4).px(-30, -20));
    // runa ciano gravada no bloco do meio (pulsa no idle)
    const rune = (m) => m.line(1, -12, 1, -8).line(1, -12, 4, -10).line(1, -10, 4, -8);
    if (pose.rune === 0) { cv.paint({ mat: 'ciano', tone: 1 }, rune); } else { cv.emissive('ciano', rune, { halo: pose.rune === 2 ? 1 : 0, core: 3 }); }

    // --- estrutura de madeira: pernas de trás (mais escuras, atrás), pernas da frente grossas, travessas
    cv.part('madeira', (m) => m.line(-17, -20, -15, -50, 5).line(17, -20, 15, -50, 5), { name: 'pernas de trás', texture: grainV });
    cv.paint({ mat: 'madeira', tone: 1 }, (m) => m.line(-17, -22, -15, -45, 3).line(17, -22, 15, -45, 3));
    cv.part('madeira', (m) => m.line(-27, -14, -23, -46, 6).line(27, -14, 23, -46, 6), { name: 'pernas da frente', texture: grainV });
    cv.part('madeira', (m) => m.line(-24, -19, 21, -41, 4).line(24, -19, -21, -41, 4), { name: 'travessas em X', texture: grainH });
    cv.part('madeira', (m) => m.line(-26, -30, 26, -30, 4), { name: 'travessa', texture: grainH });
    // corda amarrando as vigas (voltas claras e escuras)
    for (const x of [-24, 24]) {
        cv.paint({ mat: 'couro', tone: 3 }, (m) => m.rect(x - 2, -33, 4, 6));
        cv.paint({ mat: 'couro', tone: 1 }, (m) => m.line(x - 2, -31, x + 1, -31).line(x - 2, -29, x + 1, -29));
    }
    cv.paint({ mat: 'couro', tone: 3 }, (m) => m.rect(-2, -33, 4, 5));
    cv.paint({ mat: 'couro', tone: 1 }, (m) => m.line(-2, -31, 1, -31));
    // oclusão: sombra onde as pernas entram na pedra
    cv.paint({ mat: 'madeira', tone: 0 }, (m) => m.line(-30, -15, -24, -15).line(24, -15, 30, -15));

    // --- plataforma: piso visto de cima (tábuas), viga da frente com pontas de tábua, cantoneiras de ferro
    cv.part('madeira', (m) => m.poly([[-34, -46], [34, -46], [30, -58], [-30, -58]]), { name: 'piso', texture: false });
    cv.paint({ mat: 'madeira', tone: 3 }, (m) => m.poly([[-32, -47], [32, -47], [29, -57], [-29, -57]]));
    cv.paint({ mat: 'madeira', tone: 4 }, (m) => m.line(-29, -57, -10, -57));
    cv.paint({ mat: 'madeira', tone: 2 }, (m) => { for (const x of [-22, -11, 0, 11, 22]) { m.line(x, -47, Math.round(x * 0.88), -57); } });
    cv.paint({ mat: 'madeira', tone: 1 }, (m) => { for (const x of [-21, -10, 1, 12, 23]) { m.line(x, -47, Math.round(x * 0.88) + 1, -57); } });
    cv.part('madeira', (m) => m.rect(-35, -46, 70, 6), { name: 'viga da frente', texture: grainH });
    cv.paint({ mat: 'cerne', tone: 3 }, (m) => { for (const x of [-31, -20, -9, 2, 13, 24]) { m.rect(x, -45, 2, 2); } });
    cv.paint({ mat: 'cerne', tone: 1 }, (m) => { for (const x of [-31, -20, -9, 2, 13, 24]) { m.px(x + 1, -44); } });
    cv.part('aco', (m) => m.rect(-35, -46, 5, 6).rect(30, -46, 5, 6), { name: 'cantoneiras', specular: 1 });
    cv.rivet(-33, -44, 'aco'); cv.rivet(32, -44, 'aco');
    for (const x of [-16, 7, 19]) { cv.rivet(x, -50, 'aco'); }
    // oclusão: sombra logo abaixo da viga, sobre pernas e travessas
    cv.paint({ mat: 'madeira', tone: 0 }, (m) => m.line(-28, -39, 28, -39));

    // --- caixa de virotes no canto de trás, à esquerda
    cv.part('madeira', (m) => m.rect(-28, -63, 11, 6), { name: 'caixa de virotes', texture: grainH });
    cv.part('madeira', (m) => m.poly([[-28, -63], [-17, -63], [-18, -66], [-27, -66]]), { name: 'tampa da caixa', texture: false });
    cv.paint({ mat: 'madeira', tone: 3 }, (m) => m.line(-27, -65, -19, -65));
    cv.part('acoClaro', (m) => m.line(-25, -66, -26, -72).line(-22, -66, -22, -73).line(-19, -66, -18, -71), { name: 'virotes', outline: false, specular: 0 });
    cv.paint({ mat: 'acoClaro', tone: 4 }, (m) => m.px(-26, -72).px(-22, -73).px(-18, -71));

    // --- bandeira do reino no canto de trás, à direita (balança no idle)
    cv.part('madeira', (m) => m.line(26, -52, 26, -87, 2), { name: 'mastro', texture: false });
    cv.part('tecido', (m) => m.poly(FLAGS[pose.flag]), { name: 'bandeira' });
    cv.paint({ mat: 'presa', tone: 3 }, (m) => m.px(32, -82).px(33, -81).px(31, -81).px(32, -80));
    cv.paint({ mat: 'acoClaro', tone: 4 }, (m) => m.px(26, -87));

    cv.finish();

    // --- chão embutido: terra, sombra de contato e capim (sem contorno, atrás da torre)
    return groundDecal(cv, (set) => {
        for (let y = -5; y <= 6; y++) {
            for (let x = -46; x <= 46; x++) {
                const e = (x / 45) ** 2 + ((y - 1) / 5.5) ** 2 + (hash(x, y, 91) - 0.5) * 0.35;
                if (e > 1) { continue; }
                let t = hash(x >> 1, y, 92) < 0.18 ? 1 : (hash(x, y, 93) < 0.12 ? 3 : 2);
                if (y >= 1 && y <= 2 && Math.abs(x) <= 36) { t = y === 1 ? 0 : 1; }   // sombra de contato
                set(x, y, TR[t]);
            }
        }
        const tuft = (x, y, flip = 1) => {
            set(x, y, G[1]); set(x + flip, y, G[0]);
            set(x, y - 1, G[3]); set(x - flip, y - 2, G[3]); set(x + flip, y - 2, G[4]); set(x, y - 3, G[3]);
        };
        tuft(-43, 3); tuft(-37, 6); tuft(41, 2, -1); tuft(35, 6, -1); tuft(-40, -3); tuft(44, -2, -1); tuft(8, 6);
    });
}

function head (angle, phase = 0) {
    const cv = spinCanvas(D.head, angle);
    cv.part('madeira', (m) => m.poly([[-37, -6], [-27, -6], [-27, 7], [-37, 8]]), { name: 'coronha', texture: grainH });
    cv.part('madeira', (m) => m.poly([[-30, -4], [20, -4], [25, 0], [20, 4], [-30, 4]]), { name: 'corpo', texture: grainH });
    // tampo (face de cima da besta, 3/4): chapa clara com brilho
    cv.part('acoClaro', (m) => m.poly([[-24, -7], [8, -7], [11, -4], [-26, -4]]), { name: 'tampo', specular: 2 });
    cv.part('aco', (m) => m.rect(-21, -8, 12, 15), { name: 'mecanismo', specular: 2 });
    cv.rivet(-19, -6, 'aco'); cv.rivet(-12, 4, 'aco');
    cv.part('aco', (m) => m.rect(-3, -5, 2, 10).rect(12, -5, 2, 10), { name: 'cintas', specular: 1 });
    cv.part('aco', (m) => m.poly([[9, -4], [16, -14], [15, -27], [10, -31], [10, -17], [6, -4]]), { name: 'arco de cima', specular: 2 });
    cv.part('aco', (m) => m.poly([[9, 4], [16, 14], [15, 27], [10, 31], [10, 17], [6, 4]]), { name: 'arco de baixo', specular: 1 });
    cv.paint({ mat: 'couro', tone: 3 }, (m) => m.rect(6, -5, 4, 10));
    cv.paint({ mat: 'couro', tone: 1 }, (m) => m.line(6, -3, 9, -3).line(6, 0, 9, 0).line(6, 3, 9, 3));
    cv.part('acoClaro', (m) => m.rect(-6, -1, 41, 2), { name: 'virote', specular: 1 });
    // cordas de energia + brilho que corre pela corda (fase do idle)
    cv.emissive('ciano', (m) => m.line(10, -30, -9, 0).line(10, 30, -9, 0), { halo: 0, core: 3 });
    const t = (phase + 0.5) / 3;
    cv.emissive('ciano', (m) => {
        m.ellipse(10 + (-19) * t, -30 + 30 * t, 1.3, 1.3);
        m.ellipse(10 + (-19) * t, 30 - 30 * t, 1.3, 1.3);
    }, { halo: 1, core: 4 });
    cv.emissive('ciano', (m) => m.ellipse(-10, 0, 2.6, 2.6), { halo: 1 });
    cv.emissive('ciano', (m) => m.line(35, 0, 36, 0), { halo: 0, core: 3 });
    return cv.finish();
}

export default { base, head };
