// Orc Cibernético — versão C "Ciborgue de guerra" (pixel art 1×, candidata; o jogo usa a versão escolhida em ORC_VARIANT).
// Mais máquina que orc: pernas mecânicas com articulação invertida (tipo pássaro), cabos expostos, reator ciano
// no peito, capacete cobrindo metade do rosto com visor vermelho horizontal, presas por baixo. O braço da frente
// é um canhão de plasma. Pele verde-acinzentada só nos ombros e no maxilar.
// Caminhada mecânica: pé anda em linha reta (sem curva senoidal), passos marcados e um "tranco" no pouso do pé
// (o corpo afunda 3 px no quadro do contato e o canhão atrasa 1 quadro).
// Quadro 128×106, olhando para a DIREITA, pés na borda inferior.

import { PixelCanvas } from '../lib/PixelCanvas.js';

export const FRAME = { w: 128, h: 106 };
export const WALK_FRAMES = 8;
export const EYE = { x: 106, y: 25.5 };

// Tabelas por quadro (pé da frente; o de trás é o mesmo deslocado meio ciclo).
const STEP_DX = [10, 5, 0, -5, -10, -4, 2, 8];        // apoio: recua em linha reta; balanço: volta rápido
const STEP_LIFT = [0, 0, 0, 0, 0, 6, 8, 4];           // pé sobe só no balanço
const JOLT = [3, 1, 0, 0, 3, 1, 0, 0];                // tranco: afunda no pouso (quadros 0 e 4)
const CANNON = [0, 2, 0, 0, 0, 2, 0, 0];              // canhão pesado atrasa e cai 1 quadro depois

export function walkPose (i) {
    const j = (i + 4) % WALK_FRAMES;
    return {
        frontLeg: { dx: STEP_DX[i], lift: STEP_LIFT[i] },
        backLeg: { dx: STEP_DX[j], lift: STEP_LIFT[j] },
        bob: JOLT[i] - 1,
        cannon: CANNON[i],
        farArm: STEP_DX[j] > 0 ? 2 : 0
    };
}

export const IDLE_POSE = { frontLeg: { dx: 0, lift: 0 }, backLeg: { dx: 0, lift: 0 }, bob: 0, cannon: 0, farArm: 0 };

// Perna digitígrada: coxa blindada → joelho para frente → canela fina para trás → calcanhar alto
// (jarrete) → pé com garras na frente e esporão atrás. Pistão entre coxa e canela, cabo pendurado.
function leg (cv, hipX, hipY, pose, name) {
    const fx = hipX + pose.dx;
    const lift = pose.lift;
    const g = 105 - lift;
    const knee = [hipX + Math.round(pose.dx / 2) + 10, 74 - Math.round(lift / 2)];
    const hock = [fx - 8, 88 - lift];
    const toe = [fx + 4, g - 3];
    cv.part('borracha', (m) => m.line(hipX - 4, hipY + 2, hock[0] - 2, hock[1] - 3, 2), { name: `${name}: cabo`, outline: false });
    cv.part('aco', (m) => m.line(hipX, hipY, knee[0], knee[1], 11), { name: `${name}: coxa`, rust: 0.06 });
    cv.part('acoClaro', (m) => m.line(knee[0], knee[1], hock[0], hock[1], 6), { name: `${name}: canela` });
    cv.part('acoClaro', (m) => m.line(hipX + 2, hipY + 6, Math.round((knee[0] + hock[0]) / 2) - 1, Math.round((knee[1] + hock[1]) / 2) - 1, 3),
        { name: `${name}: pistão`, outline: false, specular: 0 });
    cv.part('acoClaro', (m) => m.ellipse(knee[0], knee[1], 4.5, 4.5), { name: `${name}: joelho`, specular: 1 });
    cv.part('aco', (m) => m.line(hock[0], hock[1], toe[0], toe[1], 4), { name: `${name}: metatarso` });
    cv.part('aco', (m) => m.ellipse(hock[0], hock[1], 3.5, 3.5), { name: `${name}: jarrete`, specular: 1 });
    cv.part('aco', (m) => m.poly([[fx - 1, g - 5], [fx + 8, g - 5], [fx + 12, g - 2], [fx + 12, g], [fx - 3, g]]), { name: `${name}: pé` });
    cv.part('acoClaro', (m) => m.poly([[fx - 1, g - 3], [fx - 7, g], [fx - 1, g]]), { name: `${name}: esporão`, specular: 0 });
    cv.part('acoClaro', (m) => m.poly([[fx + 9, g - 3], [fx + 15, g - 1], [fx + 16, g], [fx + 9, g]]), { name: `${name}: garras`, specular: 1 });
}

export function drawOrcC (pose = IDLE_POSE) {
    const cv = new PixelCanvas(FRAME.w, FRAME.h);
    const b = pose.bob;
    const cb = b + pose.cannon;
    const hipY = 62 + b;

    // 1) braço de trás: garra mecânica pendurada
    const fa = pose.farArm;
    cv.part('aco', (m) => m.offset(fa, b).line(86, 40, 94, 56, 7).line(94, 56, 90, 68, 6), { name: 'braço de trás' });
    cv.part('acoClaro', (m) => m.offset(fa, b).ellipse(94, 56, 3.5, 3.5), { name: 'cotovelo de trás' });
    cv.part('acoClaro', (m) => m.offset(fa, b).poly([[86, 67], [94, 67], [96, 74], [92, 72], [90, 76], [87, 72]]), { name: 'garra de trás' });

    // 2) perna de trás
    leg(cv, 50, hipY, pose.backLeg, 'perna de trás');

    // 3) cabos expostos atrás do tronco
    cv.part('borracha', (m) => m.offset(0, b).line(40, 36, 32, 50, 3).line(32, 50, 40, 62, 3), { name: 'cabo das costas', outline: true });
    cv.part('borracha', (m) => m.offset(0, b).line(46, 32, 38, 44, 2).line(38, 44, 44, 58, 2), { name: 'cabo das costas 2', outline: false });

    // 4) chassi do tronco: bloco de aço escuro, placas claras, reator ciano, grelha de ventilação
    cv.part('aco', (m) => m.offset(0, b).poly([[42, 66], [37, 48], [44, 34], [62, 28], [84, 30], [96, 40], [96, 56], [86, 66]]),
        { name: 'chassi', rust: 0.08, specular: 2 });
    cv.part('acoClaro', (m) => m.offset(0, b).poly([[50, 52], [48, 40], [60, 33], [82, 34], [92, 44], [90, 52]]), { name: 'placa do peito', specular: 3 });
    for (const [x, y] of [[52, 42], [62, 36], [86, 42], [88, 50], [52, 50]]) { cv.rivet(x, y, 'acoClaro', 0, b); }
    cv.paint({ mat: 'aco', tone: 0 }, (m) => {
        m.offset(0, b);
        for (let x = 52; x < 86; x += 3) { m.line(x, 56, x, 62); }
    });
    cv.part('aco', (m) => m.offset(0, b).ellipse(72, 44, 8.5, 7.5), { name: 'aro do reator', specular: 1 });
    cv.emissive('ciano', (m) => m.offset(0, b).ellipse(72, 44, 5, 4.5), { halo: 2 });
    // quadril mecânico
    cv.part('aco', (m) => m.offset(0, b).poly([[42, 58], [84, 58], [82, 68], [46, 68]]), { name: 'quadril' });
    cv.part('acoClaro', (m) => m.offset(0, b).rect(58, 60, 10, 6), { name: 'placa do quadril', specular: 1 });

    // 5) perna da frente
    leg(cv, 72, hipY, pose.frontLeg, 'perna da frente');

    // 6) ombro de trás (pele) aparecendo atrás do capacete
    cv.part('peleCinza', (m) => m.offset(0, b).ellipse(90, 36, 7, 6), { name: 'ombro de trás' });

    // 7) cabeça: pescoço mecânico, maxilar de pele com presas subindo, capacete com visor vermelho horizontal
    cv.part('borracha', (m) => m.offset(0, b).line(84, 36, 92, 30, 4), { name: 'pescoço' });
    cv.part('peleCinza', (m) => m.offset(0, b).poly([[88, 32], [114, 30], [118, 38], [110, 45], [92, 44]]), { name: 'maxilar' });
    cv.paint({ mat: 'peleCinza', tone: 1 }, (m) => m.offset(0, b).line(94, 41, 108, 42));
    cv.part('presa', (m) => m.offset(0, b).poly([[99, 38], [102, 29], [105, 37]]), { name: 'presa 1' });
    cv.part('presa', (m) => m.offset(0, b).poly([[109, 36], [113, 28], [114, 35]]), { name: 'presa 2' });
    cv.part('acoClaro', (m) => m.offset(0, b).poly([[86, 32], [87, 22], [96, 14], [110, 14], [117, 22], [117, 31], [98, 31]]),
        { name: 'capacete', specular: 3 });
    cv.rivet(92, 25, 'acoClaro', 0, b);
    cv.rivet(100, 18, 'acoClaro', 0, b);
    cv.part('aco', (m) => m.offset(0, b).rect(96, 23, 21, 5), { name: 'fenda do visor', specular: 0 });
    cv.emissive('vermelho', (m) => m.offset(0, b).line(98, 25, 115, 25, 2), { halo: 1 });
    cv.part('borracha', (m) => m.offset(0, b).line(86, 26, 80, 32, 2), { name: 'cabo do capacete', outline: false });

    // 8) ombro da frente: pele verde-acinzentada com cinta de aço
    cv.part('peleCinza', (m) => m.offset(0, cb).ellipse(56, 36, 11, 9), { name: 'ombro' });
    cv.paint({ mat: 'peleCinza', tone: 1 }, (m) => m.offset(0, cb).line(50, 40, 58, 42));
    cv.part('aco', (m) => m.offset(0, cb).poly([[46, 34], [66, 31], [67, 35], [47, 38]]), { name: 'cinta do ombro' });
    cv.rivet(56, 33, 'aco', 0, cb);

    // 9) braço-canhão: braço mecânico curto, cotovelo, cano grosso com bobinas ciano e boca de plasma
    cv.part('aco', (m) => m.offset(0, cb).line(56, 42, 60, 56, 8), { name: 'braço do canhão' });
    cv.part('borracha', (m) => m.offset(0, cb).line(48, 44, 52, 58, 3).line(52, 58, 62, 64, 3), { name: 'cabo do canhão', outline: false });
    cv.part('acoClaro', (m) => m.offset(0, cb).ellipse(61, 57, 5, 5), { name: 'cotovelo', specular: 1 });
    cv.part('aco', (m) => m.offset(0, cb).poly([[60, 52], [100, 52], [104, 54], [104, 63], [100, 65], [60, 65]]),
        { name: 'cano', rust: 0.05, specular: 3 });
    cv.paint({ mat: 'aco', tone: 3 }, (m) => m.offset(0, cb).line(64, 54, 98, 54));
    for (const x of [72, 80, 88]) {
        cv.part('acoClaro', (m) => m.offset(0, cb).rect(x - 2, 51, 5, 15), { name: `anel ${x}`, specular: 0 });
        cv.emissive('ciano', (m) => m.offset(0, cb).line(x, 53, x, 63), { halo: 0, core: 3 });
    }
    cv.part('acoClaro', (m) => m.offset(0, cb).poly([[102, 50], [109, 50], [109, 67], [102, 67]]), { name: 'boca', specular: 2 });
    cv.part('aco', (m) => m.offset(0, cb).ellipse(108, 58.5, 2.5, 5), { name: 'boca escura', specular: 0 });
    cv.emissive('ciano', (m) => m.offset(0, cb).ellipse(108.5, 58.5, 1.5, 3.5), { halo: 1 });

    return cv.finish();
}

export function eyeAt (pose) {
    return { x: EYE.x, y: EYE.y + pose.bob };
}

const walkPoses = Array.from({ length: WALK_FRAMES }, (_, i) => walkPose(i));

export default {
    name: 'orc-c',
    frame: FRAME,
    sheets: [
        { file: 'orc-c-walk.png', frames: walkPoses.map((p) => drawOrcC(p)), meta: { eye: walkPoses.map(eyeAt), idleEye: eyeAt(IDLE_POSE) } },
        { file: 'orc-c.png', frames: [drawOrcC(IDLE_POSE)] }
    ]
};
