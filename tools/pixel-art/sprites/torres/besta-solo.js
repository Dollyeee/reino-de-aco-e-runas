// Besta Laser SOLO (T26): sem corpo de torre — a peça principal é a própria besta mecânica, grande e legível, sobre
// um apoio BAIXO (conjunto de ~64–72 px de largura, besta a no máximo ~60 px do chão, para não esconder orcs atrás).
// Técnica da T22 (Grade + peças à mão), câmera 3/4 frontal, 4 etapas + conceito (3 opções de apoio).
//   apoio (fixo, com idle do anel rúnico) + besta (gira para mirar: redesenhada pela grade em cada ângulo; 3 fases de
//   idle com as cordas de energia pulsando).
// Coordenadas: (0, 0) = ponto de chão; quadro do apoio 84×52 com pivot (42, 46) (src/config/towerArt.js, versão 's').

import { Grade } from '../../lib/Grade.js';
import { hash } from '../../lib/textures.js';
import { pedraFrente, pedraTopo, tabuaTopo, poste, rebite, corda, runas } from '../../lib/materiais/index.js';
import { ellipse, ringCyan, groundContact } from './besta-nova.js';
import { spinCanvas } from './comum.js';
import { TOWER_ART } from '../../../../src/config/towerArt.js';

const D = TOWER_ART.laserCrossbow.s;
const FRAME = D.base.frame, PIVOT = D.base.pivot;
const flat = (m, t) => () => [m, t];
const grade = () => new Grade(FRAME[0], FRAME[1], [PIVOT[0], PIVOT[1] - 1]);

function faces (stage) {
    return (m, which, piece) => {
        if (stage >= 3 && piece) { return piece; }
        if (stage < 2) { return flat(m, 2); }
        return flat(m, { top: 3, front: 2, side: 1 }[which]);
    };
}

function finish (g, stage) {
    if (stage >= 4) { g.cleanup(); }
    if (stage >= 2) { g.rim(); }
    g.outline();
    if (stage >= 2) { groundContact(g, stage >= 3); }
    return g;
}

// disco giratório onde a besta encaixa (aro de ferro, miolo de madeira, anel rúnico); devolve o y do eixo da besta
function disco (g, stage, y, lvl, rx = 11) {
    g.fill({ rect: [-rx, y, rx * 2 + 1, 3] }, flat('aco', stage >= 2 ? 1 : 2));
    ellipse(g, 0, y, rx, 4, flat('aco', stage >= 2 ? 3 : 2));
    ellipse(g, 0, y, rx - 2, 3, flat('madeira', stage >= 2 ? 3 : 2));
    if (stage >= 3) { ringCyan(g, 0, y, rx - 1, 3.5, lvl); g.stamp(rebite, -rx + 1, y); g.stamp(rebite, rx - 2, y); }
    return y - 3;
}

// ------------------------------------------------------------------------------------------ (a) tripé
function tripe (frame = 0, stage = 4) {
    const F = faces(stage), g = grade(), lvl = frame % 2 ? 2 : 1;
    const madeira = (t) => flat('madeira', stage >= 2 ? t : 2);
    g.fill({ poly: [[-2, -26], [2, -26], [3, -8], [-3, -8]] }, madeira(1));                  // perna de trás
    for (const [fx, sgn] of [[-22, -1], [22, 1]]) {                                          // pernas da frente
        const pts = [[-3 * sgn + 0, -26], [3 * sgn, -26], [fx + 3 * sgn, -1], [fx - 2 * sgn, -1]];
        g.fill({ poly: pts }, stage >= 3 ? g.tile(poste, fx - 3, -26) : madeira(sgn < 0 ? 3 : 2));
        g.fill({ rect: [fx - 3, -4, 6, 4] }, flat('aco', stage >= 2 ? (sgn < 0 ? 3 : 2) : 2));   // sapata de ferro
    }
    g.fill({ rect: [-8, -30, 16, 5] }, F('aco', 'front'));                                  // cubo de ferro
    if (stage >= 3) { g.stamp(corda, -12, -22); g.stamp(corda, 8, -22); g.stamp(rebite, -6, -29); g.stamp(rebite, 5, -29); }
    const eixo = disco(g, stage, -33, lvl);
    if (stage >= 2) { g.shadeRight(8, -30, -25, 2); }
    return { g: finish(g, stage), mountY: eixo };
}

// ------------------------------------------------------------------------------------------ (b) pedestal de pedra
function pedestal (frame = 0, stage = 4) {
    const F = faces(stage), g = grade(), lvl = frame % 2 ? 2 : 1;
    g.box3q(-20, 20, 0, -6, 5, { top: F('pedra', 'top'), front: F('pedra', 'front', g.tile(pedraFrente, -20, -6, { offsetRows: 6 })) }, 0);
    // bloco de pedra: topo em −16 — com o eixo em −29, o braço do arco fica a ≤ 60 px do chão
    g.box3q(-14, 14, -8, -16, 5, {
        top: F('pedra', 'top', g.tile(pedraTopo, -14, -21)),
        front: F('pedra', 'front', g.tile(pedraFrente, -14, -16, { offsetRows: 6, pick: (c, r) => Math.floor(hash(c, r, 9) * 3) }))
    }, 0);
    if (stage >= 2) { g.fill({ rect: [-14, -9, 28, 1] }, flat('pedra', 0)); g.shadeRight(14, -16, -8, 2); g.shadeRight(20, -6, 0, 2); }
    if (stage >= 3) { g.stamp(runas[1][lvl], -1, -15); }
    // R2: disco giratório mais baixo (visível sob a arma) + pescoço de ferro que prende a besta ao apoio
    disco(g, stage, -20, lvl);
    g.box3q(-2, 3, -21, -30, 2, { top: F('aco', 'top'), front: flat('aco', stage >= 2 ? 2 : 2) }, 0);
    if (stage >= 2) { g.fill({ rect: [-2, -30, 1, 9] }, flat('aco', 3)); g.fill({ rect: [2, -30, 1, 9] }, flat('aco', 1)); }
    const eixo = -29;
    return { g: finish(g, stage), mountY: eixo };
}

// ------------------------------------------------------------------------------------------ (c) plataforma giratória
function plataforma (frame = 0, stage = 4) {
    const F = faces(stage), g = grade(), lvl = frame % 2 ? 2 : 1;
    // roda larga rente ao chão: aro de madeira (frente) + tampo de tábuas + cintas de ferro
    g.fill({ rect: [-30, -9, 61, 7] }, F('madeira', 'front', g.tile(poste, -30, -9)));
    ellipse(g, 0, -2, 30, 4, F('madeira', 'front'));
    ellipse(g, 0, -9, 30, 8, F('madeira', 'top', g.tile(tabuaTopo, -30, -17)));
    if (stage >= 2) {
        for (const x of [-24, -8, 8, 24]) { g.fill({ rect: [x, -8, 2, 7] }, flat('aco', 2)); }
        g.shadeRight(31, -9, -1, 3);
    }
    if (stage >= 3) { for (const x of [-24, -8, 8, 24]) { g.stamp(rebite, x, -6); } }
    // coluna curta no meio
    g.box3q(-6, 6, -9, -22, 3, { top: F('madeira', 'top'), front: F('madeira', 'front', g.tile(poste, -6, -22)) }, 0);
    const eixo = disco(g, stage, -25, lvl);
    return { g: finish(g, stage), mountY: eixo };
}

export const APOIOS = {
    a: { nome: 'tripé de madeira e ferro', draw: tripe },
    b: { nome: 'pedestal curto de pedra com runa', draw: pedestal },
    c: { nome: 'plataforma giratória rente ao chão', draw: plataforma }
};
// apoio escolhido (ver tools/pixel-art/rodadas/besta-solo-autocritica.md)
export const APOIO_ESCOLHIDO = 'b';

// ------------------------------------------------------------------------------------------ a besta (gira)
// Maior e mais detalhada que a da T22: coronha de madeira escura com chapa de ferro, mecanismo rebitado, tampo claro,
// braços do arco grossos com ponteiras, cordas de energia ciano (fase = brilho correndo), virote de aço com ponta acesa.
export function head (angle, phase = 0) {
    const cv = spinCanvas(D.head, angle);
    // R3: espessura — a besta deitada no plano do chão mostra a face de lado embaixo (3 px na tela, não gira: vem do
    // deslocamento da máscara depois do escorço); o que fica visível é só a faixa de baixo, escura
    const coronha = [[-34, -5], [-26, -7], [20, -5], [25, -2], [25, 2], [20, 5], [-26, 7], [-34, 5]];
    const lado = (mat, tone, build) => { cv.part(mat, build, { name: 'lado' }); cv.paint({ mat, tone }, build); };
    lado('casca', 1, (m) => m.offset(0, 3).poly(coronha).rect(-36, -6, 3, 12));
    lado('aco', 1, (m) => m.offset(0, 3).rect(-20, -8, 12, 16));
    lado('aco', 0, (m) => m.offset(0, 2).poly([[10, -4], [18, -14], [17, -25], [12, -29], [12, -16], [7, -4]]).poly([[10, 4], [18, 14], [17, 25], [12, 29], [12, 16], [7, 4]]));
    cv.part('casca', (m) => m.poly(coronha), { name: 'coronha' });
    cv.part('aco', (m) => m.rect(-36, -6, 3, 12), { name: 'chapa da coronha', specular: 1 });
    cv.part('acoClaro', (m) => m.poly([[-22, -9], [7, -9], [9, -6], [-24, -6]]), { name: 'tampo', specular: 2 });
    cv.part('aco', (m) => m.rect(-20, -8, 12, 16), { name: 'mecanismo', specular: 2 });
    cv.rivet(-18, -6, 'aco'); cv.rivet(-11, 5, 'aco'); cv.rivet(-18, 5, 'aco');
    cv.part('aco', (m) => m.rect(-2, -6, 2, 12).rect(13, -6, 2, 12), { name: 'cintas', specular: 1 });
    cv.part('aco', (m) => m.poly([[10, -4], [18, -14], [17, -25], [12, -29], [12, -16], [7, -4]]), { name: 'braço de cima', specular: 2 });
    cv.part('aco', (m) => m.poly([[10, 4], [18, 14], [17, 25], [12, 29], [12, 16], [7, 4]]), { name: 'braço de baixo', specular: 1 });
    cv.part('acoClaro', (m) => m.rect(11, -31, 3, 3).rect(11, 28, 3, 3), { name: 'ponteiras', specular: 1 });
    cv.paint({ mat: 'couro', tone: 3 }, (m) => m.rect(7, -5, 4, 10));
    cv.paint({ mat: 'couro', tone: 1 }, (m) => m.line(7, -2, 10, -2).line(7, 1, 10, 1));
    cv.part('acoClaro', (m) => m.rect(-6, -1, 40, 2), { name: 'virote', specular: 1 });   // conjunto ≤ 72 px
    cv.emissive('ciano', (m) => m.line(12, -28, -8, 0).line(12, 28, -8, 0), { halo: 0, core: 3 });
    const t = (phase + 0.5) / 3;
    cv.emissive('ciano', (m) => { m.ellipse(12 - 20 * t, -28 + 28 * t, 1.3, 1.3); m.ellipse(12 - 20 * t, 28 - 28 * t, 1.3, 1.3); }, { halo: 1, core: 4 });
    cv.emissive('ciano', (m) => m.ellipse(-10, 0, 2.4, 2.4), { halo: 1 });
    cv.emissive('ciano', (m) => m.line(34, 0, 35, 0), { halo: 0, core: 3 });
    return cv.finish();
}

export default { base: (frame) => APOIOS[APOIO_ESCOLHIDO].draw(frame, 4).g, head };
