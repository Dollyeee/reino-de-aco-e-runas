// Orc Cibernético — "Saqueador" (pixel art 1×): versão PADRÃO do jogo (escolhida na T09, ajustada na T10).
// Alto e magro, inclinado para frente como quem vai atacar, pouca armadura (colete de couro, faixas,
// uma ombreira pequena), moicano, pele verde mais clara. O braço da frente é INTEIRO mecânico, com uma
// lâmina de plasma ciano saindo do antebraço. Caminhada rápida e agressiva, passos longos.
// T10: ombros e peito ~15% mais largos, braço mecânico mais grosso com 2 linhas ciano, botas maiores,
// lâmina ~30% maior (núcleo de 4 px + brilho de 2 px no vazio) e placa de metal na cabeça.
// T13: redesenhado na grade 0,75 (SCALE) → ~80 px de altura no mundo. As coordenadas abaixo continuam sendo as do
// desenho original (grade 136×110); o PixelCanvas multiplica por SCALE antes de rasterizar (sem reamostrar imagem).
// Quadro 102×83, olhando para a DIREITA, pés na borda inferior.

import { PixelCanvas } from '../lib/PixelCanvas.js';

export const DESIGN = { w: 136, h: 110 };        // grade em que as coordenadas foram escritas
export const SCALE = 0.75;                         // grade do jogo (T13: ~80 px de altura)
export function frameFor (k) { return { w: Math.ceil(DESIGN.w * k), h: Math.round(DESIGN.h * k) }; }
export const FRAME = frameFor(SCALE);
export const WALK_FRAMES = 8;
export const EYE = { x: 94.5, y: 23.5 };

// Passada longa (pernas ±14 px, pé sobe até 8 px), joelhos dobrados; corpo sobe 2 px na passagem e
// dá um bote de 2 px para frente no contato; braço de carne balança ±8 px; lâmina firme, só acompanha o corpo.
export function walkPose (t) {
    const c = Math.cos(t * Math.PI * 2);
    const s = Math.sin(t * Math.PI * 2);
    const front = 2 * Math.round(7 * c);
    return {
        frontLeg: { dx: front, lift: 2 * Math.round(4 * Math.max(0, -s)) },
        backLeg: { dx: -front, lift: 2 * Math.round(4 * Math.max(0, s)) },
        bob: Math.abs(c) < 0.5 ? -2 : 0,
        lunge: Math.abs(c) > 0.9 ? 2 : 0,
        backArm: -2 * Math.round(4 * c)
    };
}

export const IDLE_POSE = { frontLeg: { dx: 0, lift: 0 }, backLeg: { dx: 0, lift: 0 }, bob: 0, lunge: 0, backArm: 0 };

// Perna longa: coxa de pele, canela enfaixada, bota de couro pontuda com biqueira de aço.
function leg (cv, hipX, hipY, pose, name) {
    const fx = hipX + pose.dx;
    const lift = pose.lift;
    const kx = hipX + Math.round(pose.dx / 2) + 5;     // joelho dobrado para frente
    const knee = 82 - Math.round(lift / 2);
    const ank = 100 - lift;
    const g = 109 - lift;
    cv.part('peleClara', (m) => m.line(hipX, hipY, kx, knee, 9), { name: `${name}: coxa` });
    cv.part('tecido', (m) => m.line(kx, knee, fx, ank, 8), { name: `${name}: canela` });
    // faixas da canela (trama clara/escura alternada)
    cv.paint({ mat: 'tecido', tone: 0 }, (m) => {
        for (let k = 1; k < 5; k++) {
            const y = Math.round(knee + (ank - knee) * k / 5);
            const x = Math.round(kx + (fx - kx) * k / 5);
            m.line(x - 3, y + 1, x + 3, y - 1);
        }
    });
    cv.part('couro', (m) => m.ellipse(kx, knee, 4.5, 4), { name: `${name}: joelho`, outline: true });
    cv.part('couro', (m) => m.poly([[fx - 7, ank - 4], [fx + 5, ank - 4], [fx + 16, g - 4], [fx + 17, g], [fx - 8, g]]),
        { name: `${name}: bota` });
    cv.part('couro', (m) => m.poly([[fx - 8, g - 2], [fx + 17, g - 2], [fx + 17, g], [fx - 8, g]]), { name: `${name}: sola`, texture: false });
    cv.part('acoClaro', (m) => m.poly([[fx + 8, g - 6], [fx + 16, g - 4], [fx + 17, g], [fx + 8, g]]), { name: `${name}: biqueira`, specular: 1 });
}

export function drawOrcB (pose = IDLE_POSE, k = SCALE) {
    const F = frameFor(k);
    const cv = new PixelCanvas(F.w, F.h, { scale: k });
    const b = pose.bob;
    const up = pose.lunge;
    const hipY = 60 + b;

    // 1) braço de carne (de trás): fino, balança oposto às pernas, punho fechado
    const ba = up + pose.backArm;
    cv.part('peleClara', (m) => m.offset(ba, b).line(79, 36, 85, 56, 8).line(85, 56, 91, 68, 7), { name: 'braço de trás' });
    cv.part('tecido', (m) => m.offset(ba, b).line(89, 64, 90, 65, 8), { name: 'faixa do pulso' });
    cv.part('peleClara', (m) => m.offset(ba, b).ellipse(92, 71, 5, 5), { name: 'punho de trás' });

    // 2) perna de trás
    leg(cv, 52, hipY, pose.backLeg, 'perna de trás');

    // 3) tronco magro e inclinado: pele por baixo, colete de couro por cima, alça cruzada
    cv.part('peleClara', (m) => m.offset(up, b).poly([[43, 62], [39, 50], [50, 35], [67, 25], [84, 26], [91, 37], [83, 53], [67, 63]]),
        { name: 'tronco' });
    cv.paint({ mat: 'peleClara', tone: 1 }, (m) => m.offset(up, b).line(78, 42, 82, 48).line(71, 51, 77, 55));
    cv.paint({ mat: 'peleClara', tone: 3 }, (m) => m.offset(up, b).line(82, 34, 87, 39));
    cv.part('couro', (m) => m.offset(up, b).poly([[43, 60], [40, 50], [50, 37], [59, 32], [62, 44], [58, 60]]),
        { name: 'colete' });
    cv.paint({ mat: 'couro', tone: 4 }, (m) => {
        m.offset(up, b);
        for (let y = 40; y < 58; y += 3) { m.px(58 - Math.round((y - 40) / 6), y); }
    });
    cv.part('tecido', (m) => m.offset(up, b).line(57, 33, 77, 57, 3), { name: 'alça' });

    // 4) cinto com bolsa e faixas compridas penduradas
    cv.part('couro', (m) => m.offset(0, b).poly([[41, 57], [68, 57], [68, 63], [41, 63]]), { name: 'cinto' });
    cv.part('couro', (m) => m.offset(0, b).rect(42, 61, 7, 7), { name: 'bolsa' });
    cv.part('acoClaro', (m) => m.offset(0, b).rect(56, 57, 6, 6), { name: 'fivela', specular: 1 });
    cv.part('tecido', (m) => m.offset(0, b).poly([[52, 63], [60, 63], [62, 80], [57, 76], [52, 82]]), { name: 'faixas' });

    // 5) perna da frente
    leg(cv, 62, hipY, pose.frontLeg, 'perna da frente');

    // 6) cabeça projetada para frente: orelha longa para trás, crânio estreito, mandíbula comprida,
    //    presa pequena, moicano espetado, implante vermelho pequeno (monóculo)
    cv.part('peleClara', (m) => m.offset(up, b).poly([[84, 24], [64, 16], [84, 30]]), { name: 'orelha' });
    cv.part('peleClara', (m) => m.offset(up, b).ellipse(89, 24, 9, 9), { name: 'crânio' });
    cv.part('peleClara', (m) => m.offset(up, b).poly([[82, 28], [100, 23], [106, 31], [99, 38], [86, 36]]), { name: 'mandíbula' });
    cv.part('presa', (m) => m.offset(up, b).poly([[98, 31], [101, 23], [103, 30]]), { name: 'presa' });
    cv.part('tecido', (m) => m.offset(up, b).poly([
        [76, 21], [73, 10], [79, 16], [80, 4], [85, 13], [88, 2], [91, 13], [96, 6], [95, 16], [90, 17], [80, 20]
    ]), { name: 'moicano' });
    cv.paint({ mat: 'peleClara', tone: 1 }, (m) => m.offset(up, b).line(86, 33, 96, 35).line(90, 20, 98, 20));
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[81, 18], [88, 17], [89, 24], [82, 26]]), { name: 'placa da cabeça', specular: 1 });
    cv.rivet(83, 19, 'acoClaro', up, b);
    cv.rivet(86, 22, 'acoClaro', up, b);
    cv.part('aco', (m) => m.offset(up, b).ellipse(94, 23, 4, 4).line(92, 20, 84, 22, 2), { name: 'monóculo', specular: 1 });
    cv.emissive('vermelho', (m) => m.offset(up, b).ellipse(EYE.x, EYE.y, 2.3, 2.3), { halo: 1 });

    // 7) ombreira pequena de aço com rebites e tira de couro
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[61, 41], [59, 32], [67, 25], [78, 26], [81, 34], [73, 41]]),
        { name: 'ombreira', rust: 0.1, specular: 2 });
    cv.rivet(65, 34, 'acoClaro', up, b);
    cv.rivet(74, 30, 'acoClaro', up, b);

    // 8) braço da frente INTEIRO mecânico: braço de aço com pistão e cabos, cotovelo, antebraço-emissor
    cv.part('borracha', (m) => m.offset(up, b).line(64, 42, 70, 54, 3).line(70, 54, 76, 58, 3), { name: 'cabo 1', outline: false });
    cv.part('aco', (m) => m.offset(up, b).line(70, 38, 76, 52, 10), { name: 'braço mecânico' });
    cv.part('acoClaro', (m) => m.offset(up, b).line(73, 39, 78, 49, 2), { name: 'pistão', outline: false, specular: 0 });
    cv.emissive('ciano', (m) => m.offset(up, b).line(68, 42, 71, 49), { halo: 0, core: 3 });
    cv.part('acoClaro', (m) => m.offset(up, b).ellipse(77, 54, 5.5, 5.5), { name: 'cotovelo', specular: 1 });
    cv.part('aco', (m) => m.offset(up, b).poly([[75, 48], [97, 44], [99, 54], [77, 61]]), { name: 'antebraço mecânico', rust: 0.06, specular: 2 });
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[81, 45], [97, 42], [98, 46], [82, 49]]), { name: 'placa do antebraço', specular: 1 });
    cv.rivet(86, 46, 'acoClaro', up, b);
    cv.emissive('ciano', (m) => m.offset(up, b).line(83, 55, 94, 52), { halo: 0, core: 3 });
    // garra (mão mecânica) fechada por baixo do emissor
    cv.part('aco', (m) => m.offset(up, b).poly([[92, 54], [100, 53], [101, 60], [95, 62], [92, 58]]), { name: 'garra' });
    cv.part('borracha', (m) => m.offset(up, b).line(60, 44, 66, 40, 3), { name: 'cabo 2', outline: false });

    // 9) lâmina de plasma saindo do antebraço
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[95, 42], [103, 42], [103, 53], [95, 53]]), { name: 'emissor', specular: 1 });
    cv.emissive('ciano', (m) => m.offset(up, b).poly([[103, 45.5], [123, 47.5], [130, 49.5], [123, 51], [103, 50]]), { halo: 2, glow: true });

    return cv.finish();
}

// posição do olho em pixels do quadro (escala do jogo)
export function eyeAt (pose, k = SCALE) {
    return { x: EYE.x * k + Math.round(pose.lunge * k), y: EYE.y * k + Math.round(pose.bob * k) };
}

const walkPoses = Array.from({ length: WALK_FRAMES }, (_, i) => walkPose(i / WALK_FRAMES));

export default {
    name: 'orc-b',
    frame: FRAME,
    sheets: [
        { file: 'orc-b-walk.png', frames: walkPoses.map((p) => drawOrcB(p)), meta: { eye: walkPoses.map(eyeAt), idleEye: eyeAt(IDLE_POSE) } },
        { file: 'orc-b.png', frames: [drawOrcB(IDLE_POSE)] }
    ]
};
