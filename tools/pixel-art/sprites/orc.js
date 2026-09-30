// Orc Cibernético — pixel art gerada por código.
// Quadro 60×52, olhando para a DIREITA, câmera 3/4, pés na borda inferior (linha 51 = contorno do chão).
// Desenhado em partes, de trás para frente. Pontos de referência (em pixels da arte):
//   pivot (30, 52) · olho robótico (48, 18) · peito/acerto (30, 30) · topo do espinho (15, 3)

import { PixelCanvas } from '../lib/PixelCanvas.js';
import { SINGLE, MATERIALS } from '../palette.js';

export const FRAME = { w: 60, h: 52 };
export const WALK_FRAMES = 8;

// Pose da caminhada a partir da fase t (0..1). Só deslocamentos INTEIROS.
//   pernas alternam ±3 px; o pé que está atrás levanta 1–2 px;
//   corpo/cabeça/ombreira sobem 1 px na passagem das pernas;
//   braços e clava balançam ±2 px em oposição às pernas.
export function walkPose (t) {
    const s = Math.sin(t * Math.PI * 2);
    const c = Math.cos(t * Math.PI * 2);
    const backDx = Math.round(3 * s);
    const frontDx = -backDx;
    const lift = (dx) => (dx < 0 ? Math.round(2 * Math.min(1, -dx / 3)) : 0);
    return {
        backLeg: { dx: backDx, dy: -lift(backDx) },
        frontLeg: { dx: frontDx, dy: -lift(frontDx) },
        bob: Math.abs(c) > 0.7 ? -1 : 0,
        frontArm: Math.round(2 * s),     // oposto à perna da frente
        backArm: Math.round(-2 * s)      // oposto à perna de trás
    };
}

export const IDLE_POSE = { backLeg: { dx: 0, dy: 0 }, frontLeg: { dx: 0, dy: 0 }, bob: 0, frontArm: 0, backArm: 0 };

export function drawOrc (pose = IDLE_POSE) {
    const cv = new PixelCanvas(FRAME.w, FRAME.h);
    const b = pose.bob;

    // 1) braço de trás, pendurado, punho fechado
    cv.part('pele', (m) => m.offset(pose.backArm, b)
        .line(39, 20, 42, 29, 5).line(42, 29, 43, 33, 4).ellipse(43.5, 34.5, 3, 3));

    // 2) perna de trás: calça de couro + bota de aço
    const bl = pose.backLeg;
    cv.part('couro', (m) => m.offset(bl.dx, bl.dy).poly([[21, 37], [28, 37], [28, 45], [21, 45]]));
    cv.part('aco', (m) => m.offset(bl.dx, bl.dy).poly([[20, 44], [29, 44], [31, 47], [31, 51], [20, 51]]));

    // 3) tronco curvado em armadura de aço escuro + chevron ciano no peito
    cv.part('aco', (m) => m.offset(0, b).poly([[17, 39], [15, 30], [17, 21], [24, 15], [34, 14], [41, 18], [44, 26], [43, 33], [41, 39]]));
    cv.paint(MATERIALS.ciano[1], (m) => m.offset(0, b).line(34, 24, 36, 27).line(36, 27, 38, 24));
    cv.paint(SINGLE.acoDestaque, (m) => m.offset(0, b).px(24, 16).px(25, 16));

    // 4) perna da frente
    const fl = pose.frontLeg;
    cv.part('couro', (m) => m.offset(fl.dx, fl.dy).poly([[31, 37], [38, 37], [38, 45], [31, 45]]));
    cv.part('aco', (m) => m.offset(fl.dx, fl.dy).poly([[30, 44], [39, 44], [41, 47], [41, 51], [30, 51]]));

    // 5) tanga vermelho-escura
    cv.part('tecido', (m) => m.offset(0, b).poly([[23, 37], [39, 37], [37, 46], [33, 43], [29, 47], [25, 44]]));

    // 6) cinto de couro (só na largura do tronco) com disco rúnico ciano
    cv.part('couro', (m) => m.offset(0, b).poly([[16, 35], [42, 35], [42, 39], [16, 39]]));
    cv.part('ciano', (m) => m.offset(0, b).ellipse(29.5, 37, 2.3, 2), { shade: false });
    cv.paint(MATERIALS.ciano[2], (m) => m.offset(0, b).px(29, 36));

    // 7) cabeça baixa e projetada: orelha, crânio, mandíbula grande, 2 presas, sobrancelha pesada
    cv.part('pele', (m) => m.offset(0, b).poly([[40, 16], [34, 10], [42, 20]]));
    cv.part('pele', (m) => m.offset(0, b).ellipse(46.5, 19, 8.5, 7));
    cv.part('pele', (m) => m.offset(0, b).poly([[40, 22], [54, 19], [56, 24], [52, 29], [42, 28]]));
    cv.part('presa', (m) => m.offset(0, b).poly([[45.5, 24], [47, 18.5], [49.5, 23.5]]));
    cv.part('presa', (m) => m.offset(0, b).poly([[51.5, 23], [54.5, 16.5], [55.5, 22]]));
    // sobrancelha pesada: saliência sem contorno interno (não corta a cabeça em faixas)
    cv.part('pele', (m) => m.offset(0, b).line(40, 14.5, 52, 14.5, 2.4), { outline: false });

    // 8) implante ocular vermelho grande, aro de aço e antena
    cv.part('aco', (m) => m.offset(0, b).ellipse(48, 18, 3.3, 3.3).line(50, 15, 53, 9, 1));
    cv.part('vermelho', (m) => m.offset(0, b).ellipse(48.3, 18, 1.9, 1.9), { shade: false });
    cv.paint(MATERIALS.vermelho[2], (m) => m.offset(0, b).px(47, 17));
    cv.paint(MATERIALS.vermelho[1], (m) => m.offset(0, b).px(53, 8), { anywhere: true });

    // 9) ombreira grande com UM espinho e runas ciano
    cv.part('aco', (m) => m.offset(0, b).poly([[17, 13], [13, 3], [23, 11]]));
    cv.part('aco', (m) => m.offset(0, b).poly([[13, 24], [13, 17], [18, 12], [27, 11], [32, 14], [31, 20], [24, 24]]));
    cv.paint(MATERIALS.ciano[1], (m) => m.offset(0, b).px(23, 14).px(22, 15).px(24, 15).px(21, 16).px(25, 16).px(22, 17).px(24, 17).px(23, 18));
    cv.paint(SINGLE.acoDestaque, (m) => m.offset(0, b).line(15, 17, 18, 13).line(19, 12, 26, 12));
    cv.paint(SINGLE.ferrugem, (m) => m.offset(0, b).px(27, 21).px(28, 20));

    // 10) clava de ferro com núcleo ciano, na mão da frente, apontando para baixo/trás (esquerda)
    const fa = pose.frontArm;
    cv.part('aco', (m) => m.offset(fa, b).line(19, 33, 11, 44, 2));
    cv.part('aco', (m) => m.offset(fa, b).poly([[5, 41], [11, 39], [14, 44], [11, 50], [6, 49], [4, 45]]));
    cv.part('ciano', (m) => m.offset(fa, b).line(7, 43, 10, 47, 2), { shade: false });
    cv.paint(MATERIALS.ciano[2], (m) => m.offset(fa, b).px(8, 44));

    // 11) braço da frente com bracelete e punho por cima do cabo
    cv.part('pele', (m) => m.offset(fa, b).line(20, 21, 21, 29, 5));
    cv.part('aco', (m) => m.offset(fa, b).poly([[17, 27], [24, 27], [24, 31], [17, 31]]));
    cv.part('pele', (m) => m.offset(fa, b).ellipse(20, 33, 3.2, 3));

    return cv.outlineSilhouette();
}

// Quadros exportados pelo gerador
export default {
    name: 'orc',
    frame: FRAME,
    sheets: [
        { file: 'orc-walk.png', frames: Array.from({ length: WALK_FRAMES }, (_, i) => drawOrc(walkPose(i / WALK_FRAMES))) },
        { file: 'orc.png', frames: [drawOrc(IDLE_POSE)] }
    ]
};
