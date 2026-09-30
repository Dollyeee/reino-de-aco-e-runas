// Orc Cibernético — pixel art gerada por código (versão 2).
// Quadro 60×52, olhando para a DIREITA, câmera 3/4, pés na borda inferior (linha 51 = contorno do chão).
// Proporções: pernas ~1/3 da altura (coxas de pele, grevas, botas grandes), tronco ~40% curvado para frente,
// cabeça grande e projetada. Desenhado em partes, de trás para frente.
// Referências (pixels da arte): pivot (30, 52) · olho (48, 18.5) · peito/acerto (30, 26) · topo do espinho (12, 4)

import { PixelCanvas } from '../lib/PixelCanvas.js';
import { SINGLE, MATERIALS } from '../palette.js';

export const FRAME = { w: 60, h: 52 };
export const WALK_FRAMES = 8;
export const EYE = { x: 48, y: 18 };      // centro do olho robótico na pose parada

// Caminhada com poses-chave clássicas, parametrizada pela fase t (0..1). Só deslocamentos INTEIROS.
//   t = 0 e 0.5  → CONTATO: pernas bem abertas (±5 px), tronco inclina 1 px para frente;
//   t = 0.25/.75 → PASSAGEM: pernas juntas, corpo 1 px mais alto, pé que vem de trás levantado 3 px;
//   entre eles   → recuo/subida, pé de trás a 2 px do chão.
//   Braço de trás e clava balançam ±3 px em oposição às pernas.
export function walkPose (t) {
    const c = Math.cos(t * Math.PI * 2);
    const s = Math.sin(t * Math.PI * 2);
    const front = Math.round(5 * c);            // pé da perna da frente (+ = à frente)
    return {
        frontLeg: { dx: front, lift: Math.round(3 * Math.max(0, -s)) },
        backLeg: { dx: -front, lift: Math.round(3 * Math.max(0, s)) },
        bob: Math.abs(c) < 0.5 ? -1 : 0,        // passagem: corpo sobe 1 px
        lean: Math.abs(c) > 0.9 ? 1 : 0,        // contato: tronco 1 px para frente
        backArm: Math.round(3 * c),             // oposto à perna de trás
        club: -Math.round(3 * c)                // oposto à perna da frente
    };
}

export const IDLE_POSE = { frontLeg: { dx: 0, lift: 0 }, backLeg: { dx: 0, lift: 0 }, bob: 0, lean: 0, backArm: 0, club: 0 };

// Perna: coxa de pele, greva de aço claro e bota grande de aço.
function leg (cv, hipX, hipY, pose, name) {
    const fx = hipX + pose.dx;                  // tornozelo
    const kx = hipX + Math.round(pose.dx / 2);  // joelho
    const lift = pose.lift;
    const knee = 42 - Math.round(lift / 2);
    cv.part('pele', (m) => m.line(hipX, hipY, kx, knee, 5), { name: `${name}: coxa` });
    cv.part('acoClaro', (m) => m.line(kx, knee, fx, 46 - lift, 5), { name: `${name}: greva` });
    cv.part('aco', (m) => m.poly([[fx - 4, 45 - lift], [fx + 3, 45 - lift], [fx + 6, 48 - lift], [fx + 6, 51 - lift], [fx - 4, 51 - lift]]),
        { name: `${name}: bota` });
}

export function drawOrc (pose = IDLE_POSE) {
    const cv = new PixelCanvas(FRAME.w, FRAME.h);
    const b = pose.bob;
    const up = pose.lean;         // deslocamento da parte de cima (inclinação para frente)
    const hipY = 34 + b;

    // 1) braço de trás: grosso, pendurado, punho fechado visível do lado direito
    cv.part('pele', (m) => m.offset(up + pose.backArm, b).line(38, 20, 41, 29, 5).line(41, 29, 42, 32, 5), { name: 'braço de trás' });
    cv.part('pele', (m) => m.offset(up + pose.backArm, b).ellipse(42.5, 33.5, 3.3, 3), { name: 'punho de trás' });

    // 2) perna de trás
    leg(cv, 24, hipY + 1, pose.backLeg, 'perna de trás');

    // 3) tronco em placas, curvado: barriga (malha de aço escuro) + peitoral (aço claro), com contorno entre as placas
    cv.part('aco', (m) => m.offset(0, b).poly([[18, 35], [17, 28], [21, 25], [37, 25], [40, 29], [39, 35]]), { name: 'barriga' });
    cv.paint(MATERIALS.aco[0], (m) => {
        m.offset(0, b);
        for (let y = 27; y < 34; y += 2) {
            for (let x = 20 + (y % 4 === 1 ? 1 : 0); x < 38; x += 2) { m.px(x, y); }
        }
    });
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[19, 27], [18, 21], [23, 16], [33, 15], [40, 18], [42, 24], [39, 28], [29, 29.5], [22, 29]]),
        { name: 'peitoral' });
    cv.paint(MATERIALS.ciano[1], (m) => m.offset(up, b).line(32, 21, 34, 24).line(34, 24, 36, 21));

    // 4) perna da frente
    leg(cv, 34, hipY + 1, pose.frontLeg, 'perna da frente');

    // 5) tanga curta (não esconde as pernas) + cinto com disco rúnico
    cv.part('tecido', (m) => m.offset(0, b).poly([[26.5, 35], [31.5, 35], [31.5, 39], [29, 38], [26.5, 39]]), { name: 'tanga' });
    cv.part('couro', (m) => m.offset(0, b).poly([[18, 33], [39, 33], [39, 35.5], [18, 35.5]]), { name: 'cinto' });
    cv.part('ciano', (m) => m.offset(0, b).ellipse(28.5, 34.5, 2.2, 1.8), { shade: false });
    cv.paint(MATERIALS.ciano[2], (m) => m.offset(0, b).px(28, 34));

    // 6) cabeça grande, baixa e projetada: orelha bem para fora, crânio, mandíbula saliente, 2 presas, sobrancelha de 2 px
    cv.part('pele', (m) => m.offset(up, b).poly([[39, 15], [31, 7], [40, 20]]), { name: 'orelha' });
    cv.part('pele', (m) => m.offset(up, b).ellipse(45, 19, 9.5, 8.5), { name: 'crânio' });
    cv.part('pele', (m) => m.offset(up, b).poly([[39, 23], [53, 20], [56, 25], [52, 30], [42, 29]]), { name: 'mandíbula' });
    cv.part('presa', (m) => m.offset(up, b).poly([[45.5, 24.5], [47.5, 19], [50, 24]]), { name: 'presa 1' });
    cv.part('presa', (m) => m.offset(up, b).poly([[51.5, 23.5], [54.5, 17.5], [55.5, 22.5]]), { name: 'presa 2' });
    cv.part('pele', (m) => m.offset(up, b).rect(37, 13, 15, 2), { outline: false, name: 'sobrancelha' });

    // 7) implante ocular vermelho grande, aro de aço e antena (acompanham o sobe-desce da cabeça)
    cv.part('aco', (m) => m.offset(up, b).ellipse(EYE.x, EYE.y + 0.5, 3.5, 3.5).line(50, 15, 53, 9, 1), { name: 'aro do olho' });
    cv.part('vermelho', (m) => m.offset(up, b).ellipse(EYE.x + 0.3, EYE.y + 0.5, 2, 2), { shade: false });
    cv.paint(MATERIALS.vermelho[2], (m) => m.offset(up, b).px(47, 17));
    cv.paint(MATERIALS.vermelho[1], (m) => m.offset(up, b).px(53, 8), { anywhere: true });

    // 8) ombreira em aço escuro (tom diferente do peitoral) com UM espinho, runa ciano e ferrugem nas bordas
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[16, 15], [12, 4], [22, 13]]), { name: 'espinho' });
    cv.part('aco', (m) => m.offset(up, b).poly([[13, 24], [13, 18], [17, 13], [26, 12], [31, 15], [30, 20], [23, 24]]), { name: 'ombreira' });
    cv.paint(MATERIALS.ciano[1], (m) => m.offset(up, b).px(22, 15).px(21, 16).px(23, 16).px(20, 17).px(24, 17).px(21, 18).px(23, 18).px(22, 19));
    cv.paint(SINGLE.acoDestaque, (m) => m.offset(up, b).line(15, 17, 17, 14).line(18, 13, 24, 13));
    cv.paint(SINGLE.ferrugem, (m) => m.offset(up, b).px(14, 23).px(16, 23).px(19, 24).px(26, 22).px(28, 21).px(30, 18));

    // 9) clava de ferro ~30% maior, com núcleo ciano bem visível, apontando para baixo/trás
    const cl = up + pose.club;
    cv.part('couro', (m) => m.offset(cl, b).line(12, 34, 9, 41, 2), { name: 'cabo' });
    cv.part('aco', (m) => m.offset(cl, b).poly([[5, 40], [12, 38], [16, 43], [14, 51], [7, 51], [4, 46]]), { name: 'cabeça da clava' });
    cv.part('ciano', (m) => m.offset(cl, b).poly([[8, 42], [12, 41], [13, 46], [10, 48], [7, 46]]), { shade: false });
    cv.paint(MATERIALS.ciano[2], (m) => m.offset(cl, b).px(9, 43).px(10, 43).px(9, 44));
    cv.paint(SINGLE.acoDestaque, (m) => m.offset(cl, b).px(7, 40).px(8, 39));

    // 10) braço da frente GROSSO: sai da ombreira em diagonal para baixo e para trás, bracelete, punho no cabo
    cv.part('pele', (m) => m.offset(cl, b).line(21, 20, 16, 27, 5).line(16, 27, 12, 32, 5), { name: 'braço da frente' });
    cv.part('acoClaro', (m) => m.offset(cl, b).poly([[12, 26], [18, 27], [16, 31], [10, 30]]), { name: 'bracelete' });
    cv.part('pele', (m) => m.offset(cl, b).ellipse(11.5, 34, 3.3, 3), { name: 'punho da frente' });

    return cv.outlineSilhouette();
}

// posição do olho em cada quadro (o brilho do olho no jogo acompanha o sobe-desce)
export function eyeAt (pose) {
    return { x: EYE.x + 0.3 + pose.lean, y: EYE.y + 0.5 + pose.bob };
}

const walkPoses = Array.from({ length: WALK_FRAMES }, (_, i) => walkPose(i / WALK_FRAMES));

// Quadros exportados pelo gerador
export default {
    name: 'orc',
    frame: FRAME,
    sheets: [
        { file: 'orc-walk.png', frames: walkPoses.map((p) => drawOrc(p)), meta: { eye: walkPoses.map(eyeAt) } },
        { file: 'orc.png', frames: [drawOrc(IDLE_POSE)] }
    ]
};
