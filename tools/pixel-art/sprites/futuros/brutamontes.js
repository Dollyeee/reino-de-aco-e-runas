// Brutamontes — ARTE PRONTA PARA UM INIMIGO FUTURO (pixel art 1×; ainda não entra no jogo).
// Nasceu como versão A do Orc Cibernético (T09). Candidato ao inimigo blindado e lento da Fase 2 (Golem de Sucata / afins).
// Muito largo e curvado, cabeça pequena e baixa entre os ombros, braços enormes, armadura pesada de placas
// com rebites, pele verde-oliva escura. Martelo de guerra de duas mãos, cabeça de plasma ciano, apoiado no ombro.
// Caminhada lenta e pesada: passo curto, o corpo afunda no apoio e balança de um lado para o outro
// (ombro do martelo sobe e desce, tronco desloca 2 px).
// Quadro 128×110, olhando para a DIREITA, pés na borda inferior. Coordenadas desenhadas numa grade 128×112
// e reenquadradas 2 px para cima (origin); a cabeça do martelo tem margem para subir na caminhada.

import { PixelCanvas } from '../../lib/PixelCanvas.js';

export const FRAME = { w: 128, h: 110 };
export const WALK_FRAMES = 8;
const ORIGIN = [0, -2];
export const EYE = { x: 104.5, y: 60 };

// t = 0 e 0.5 → CONTATO (corpo afunda 2 px); passada curta (pernas ±8 px, pé sobe até 4 px);
// "roll" alterna a cada passo: tronco 2 px para frente/trás e o ombro do martelo sobe/desce 2 px.
export function walkPose (t) {
    const c = Math.cos(t * Math.PI * 2);
    const s = Math.sin(t * Math.PI * 2);
    const front = 2 * Math.round(4 * c);
    const roll = c > 0.3 ? 1 : (c < -0.3 ? -1 : 0);
    return {
        frontLeg: { dx: front, lift: 2 * Math.round(2 * Math.max(0, -s)) },
        backLeg: { dx: -front, lift: 2 * Math.round(2 * Math.max(0, s)) },
        bob: Math.abs(c) > 0.7 ? 2 : 0,
        sx: 2 * roll,
        near: -2 * roll,
        farArm: -2 * Math.round(2 * c)
    };
}

export const IDLE_POSE = { frontLeg: { dx: 0, lift: 0 }, backLeg: { dx: 0, lift: 0 }, bob: 0, sx: 0, near: 0, farArm: 0 };

// Perna curta e maciça: coxote de aço, joelheira, greva, bota larga com rebites e sola.
function leg (cv, hipX, hipY, pose, name) {
    const fx = hipX + pose.dx;
    const kx = hipX + Math.round(pose.dx / 2);
    const lift = pose.lift;
    const knee = 98 - Math.round(lift / 2);
    const ank = 103 - lift;
    const g = 111 - lift;
    cv.part('aco', (m) => m.line(hipX, hipY, kx, knee, 15), { name: `${name}: coxote`, rust: 0.06 });
    cv.part('acoClaro', (m) => m.line(kx, knee, fx, ank, 12), { name: `${name}: greva` });
    cv.part('acoClaro', (m) => m.ellipse(kx, knee - 1, 5.5, 4.5), { name: `${name}: joelheira`, specular: 1 });
    cv.part('aco', (m) => m.poly([[fx - 11, ank - 3], [fx + 8, ank - 3], [fx + 15, ank + 2], [fx + 15, g], [fx - 11, g]]),
        { name: `${name}: bota`, rust: 0.1 });
    cv.part('couro', (m) => m.poly([[fx - 11, g - 3], [fx + 15, g - 3], [fx + 15, g], [fx - 11, g]]), { name: `${name}: sola` });
    cv.rivet(fx - 6, ank + 1, 'aco');
    cv.rivet(fx + 5, ank + 1, 'aco');
}

export function drawBrutamontes (pose = IDLE_POSE) {
    const cv = new PixelCanvas(FRAME.w, FRAME.h, { origin: ORIGIN });
    const b = pose.bob;
    const sx = pose.sx;
    const nd = b + pose.near;            // lado do martelo (ombro, braço, martelo)
    const hipY = 88 + b;

    // cabo do martelo: da mão (88,58) passando por cima do ombro até a cabeça do martelo atrás
    const hand = [88, 58];
    const d = [-0.777, -0.631];          // direção do cabo (mão → cabeça)
    const u = [0.631, -0.777];           // perpendicular (eixo da cabeça do martelo)
    const at = (k) => [hand[0] + d[0] * k, hand[1] + d[1] * k];
    const hc = at(50);                   // centro da cabeça do martelo
    const corner = (L, T) => [hc[0] + u[0] * L + d[0] * T, hc[1] + u[1] * L + d[1] * T];

    // 1) cabeça do martelo (atrás do corpo: o ombro cobre a parte de baixo)
    cv.part('aco', (m) => m.offset(sx, nd).poly([corner(16, 9), corner(16, -9), corner(-16, -9), corner(-16, 9)]),
        { name: 'cabeça do martelo', rust: 0.08, specular: 3 });
    cv.part('acoClaro', (m) => m.offset(sx, nd).poly([corner(17, 10), corner(17, -10), corner(12, -10), corner(12, 10)]),
        { name: 'face do martelo 1', specular: 1 });
    cv.part('acoClaro', (m) => m.offset(sx, nd).poly([corner(-12, 10), corner(-12, -10), corner(-17, -10), corner(-17, 10)]),
        { name: 'face do martelo 2', specular: 1 });
    cv.emissive('ciano', (m) => m.offset(sx, nd).poly([corner(6, 3.5), corner(6, -3.5), corner(-6, -3.5), corner(-6, 3.5)]), { halo: 2 });
    for (const L of [9.5, -9.5]) {
        cv.emissive('ciano', (m) => m.offset(sx, nd).line(...corner(L, 6), ...corner(L, -6)), { halo: 0, core: 3 });
    }

    // 2) braço de trás (enorme, pendurado à frente, balança oposto às pernas)
    const fa = sx + pose.farArm;
    cv.part('peleOliva', (m) => m.offset(fa, b).line(98, 46, 111, 68, 14).line(111, 68, 110, 82, 13), { name: 'braço de trás' });
    cv.paint({ mat: 'peleOliva', tone: 1 }, (m) => m.offset(fa, b).line(104, 56, 108, 64).line(108, 64, 108, 70));
    cv.part('acoClaro', (m) => m.offset(fa, b).poly([[103, 72], [117, 72], [117, 80], [103, 80]]), { name: 'bracelete de trás', specular: 1 });
    cv.rivet(106, 75, 'acoClaro', fa, b);
    cv.rivet(113, 75, 'acoClaro', fa, b);
    cv.part('peleOliva', (m) => m.offset(fa, b).ellipse(110, 88, 8, 7), { name: 'punho de trás' });
    cv.paint({ mat: 'peleOliva', tone: 1 }, (m) => m.offset(fa, b).px(106, 88).px(110, 90).px(114, 88));

    // 3) perna de trás
    leg(cv, 58, hipY, pose.backLeg, 'perna de trás');

    // 4) couraça de placas: corpo largo e curvado, faixas rebitadas na barriga, peitoral claro por cima
    cv.part('aco', (m) => m.offset(sx, b).poly([[34, 92], [29, 74], [32, 56], [42, 42], [58, 34], [78, 32], [94, 40], [104, 54], [106, 72], [100, 92]]),
        { name: 'couraça', rust: 0.1, specular: 2 });
    for (const y of [70, 80]) {
        cv.paint({ mat: 'aco', tone: 0 }, (m) => m.offset(sx, b).line(32, y, 62, y));
        cv.paint({ mat: 'aco', tone: 3 }, (m) => m.offset(sx, b).line(32, y + 1, 62, y + 1));
        for (let x = 36; x < 60; x += 8) { cv.rivet(x, y + 3, 'aco', sx, b); }
    }
    cv.part('peleOliva', (m) => m.offset(sx, b).poly([[62, 87], [63, 72], [76, 64], [98, 60], [105, 68], [104, 87]]), { name: 'barriga' });
    cv.paint({ mat: 'peleOliva', tone: 1 }, (m) => m.offset(sx, b).line(80, 72, 90, 70).line(78, 80, 92, 78).px(86, 83));
    cv.paint({ mat: 'peleOliva', tone: 3 }, (m) => m.offset(sx, b).line(80, 73, 88, 71).line(78, 81, 90, 79));
    cv.part('acoClaro', (m) => m.offset(sx, b).poly([[46, 64], [44, 50], [56, 40], [78, 38], [94, 44], [102, 56], [100, 64]]),
        { name: 'peitoral', specular: 3 });
    for (const [x, y] of [[50, 50], [60, 42], [96, 54], [90, 61], [50, 61]]) { cv.rivet(x, y, 'acoClaro', sx, b); }
    cv.paint({ mat: 'acoClaro', tone: 1 }, (m) => m.offset(sx, b).line(70, 46, 76, 52).line(84, 58, 88, 60));

    // 5) cinto largo com costura e fivela com runa; placas (tassets) na frente do quadril
    cv.part('couro', (m) => m.offset(sx, b).poly([[31, 86], [103, 86], [102, 92], [33, 92]]), { name: 'cinto' });
    cv.paint({ mat: 'couro', tone: 4 }, (m) => {
        m.offset(sx, b);
        for (let x = 34; x < 101; x += 3) { m.px(x, 87); m.px(x + 1, 91); }
    });
    cv.part('acoClaro', (m) => m.offset(sx, b).rect(62, 84, 12, 10), { name: 'fivela', specular: 1 });
    cv.emissive('ciano', (m) => m.offset(sx, b).rect(66, 87, 4, 4), { halo: 1, core: 3 });

    // 6) perna da frente
    leg(cv, 80, hipY, pose.frontLeg, 'perna da frente');
    cv.part('aco', (m) => m.offset(sx, b).poly([[44, 92], [58, 92], [58, 99], [51, 101], [44, 99]]), { name: 'placa do quadril', rust: 0.1 });
    cv.rivet(50, 95, 'aco', sx, b);

    // 7) cabeça pequena e baixa, entre os ombros: calota de aço, olho vermelho pequeno, mandíbula e presas
    cv.part('peleOliva', (m) => m.offset(sx, b).ellipse(99, 60, 10, 9), { name: 'crânio' });
    cv.part('peleOliva', (m) => m.offset(sx, b).poly([[90, 66], [110, 61], [115, 69], [109, 76], [94, 75]]), { name: 'mandíbula' });
    cv.part('presa', (m) => m.offset(sx, b).poly([[99, 67], [103, 57], [105, 66]]), { name: 'presa 1' });
    cv.part('presa', (m) => m.offset(sx, b).poly([[107, 65], [112, 57], [113, 64]]), { name: 'presa 2' });
    cv.part('acoClaro', (m) => m.offset(sx, b).poly([[88, 58], [90, 52], [97, 49], [106, 50], [110, 56], [102, 56], [94, 58]]),
        { name: 'calota', specular: 2 });
    cv.rivet(95, 53, 'acoClaro', sx, b);
    cv.paint({ mat: 'peleOliva', tone: 1 }, (m) => m.offset(sx, b).line(92, 72, 104, 74));
    cv.part('aco', (m) => m.offset(sx, b).ellipse(104, 60, 4, 3.6), { name: 'aro do olho', specular: 0 });
    cv.emissive('vermelho', (m) => m.offset(sx, b).ellipse(EYE.x, EYE.y, 2.4, 2.2), { halo: 1 });

    // 8) braço enorme do martelo: bíceps, antebraço com bracelete, punho no cabo
    cv.part('peleOliva', (m) => m.offset(sx, nd).line(58, 50, 64, 74, 17), { name: 'braço do martelo' });
    cv.paint({ mat: 'peleOliva', tone: 1 }, (m) => m.offset(sx, nd).line(56, 58, 59, 66).line(59, 66, 62, 70));
    cv.paint({ mat: 'peleOliva', tone: 3 }, (m) => m.offset(sx, nd).line(55, 58, 57, 64));
    cv.part('peleOliva', (m) => m.offset(sx, nd).line(64, 74, 84, 62, 15), { name: 'antebraço do martelo' });
    cv.part('acoClaro', (m) => m.offset(sx, nd).poly([[78.7, 74.4], [70.5, 60.6], [65.3, 63.6], [73.5, 77.4]]), { name: 'bracelete', specular: 1 });
    cv.rivet(70, 66, 'acoClaro', sx, nd);
    cv.rivet(73, 71, 'acoClaro', sx, nd);

    // 9) ombreira enorme em lâminas, com ferrugem e rebites
    cv.part('acoClaro', (m) => m.offset(sx, nd).poly([[40, 64], [36, 50], [42, 38], [56, 30], [72, 28], [82, 36], [82, 48], [72, 58], [56, 64]]),
        { name: 'ombreira', rust: 0.14, specular: 3 });
    cv.paint({ mat: 'acoClaro', tone: 0 }, (m) => m.offset(sx, nd).line(38, 52, 81, 44));
    cv.paint({ mat: 'acoClaro', tone: 3 }, (m) => m.offset(sx, nd).line(38, 53, 81, 45));
    for (const [x, y] of [[48, 36], [62, 32], [76, 36], [44, 58], [60, 59], [74, 52]]) { cv.rivet(x, y, 'acoClaro', sx, nd); }

    // 10) cabo do martelo por cima do ombro, com anéis de aço; punho fechado no cabo
    cv.part('couro', (m) => m.offset(sx, nd).line(...at(-6), ...at(40), 6), { name: 'cabo do martelo' });
    for (const k of [34]) {
        cv.part('acoClaro', (m) => m.offset(sx, nd).line(...at(k), ...at(k + 2), 6), { name: `anel ${k}`, specular: 0 });
    }
    cv.part('aco', (m) => m.offset(sx, nd).ellipse(...at(-7), 3.5, 3.5), { name: 'pomo', specular: 1 });
    cv.part('peleOliva', (m) => m.offset(sx, nd).ellipse(hand[0], hand[1], 8, 7.5), { name: 'punho do martelo' });
    cv.paint({ mat: 'peleOliva', tone: 1 }, (m) => m.offset(sx, nd).px(84, 58).px(88, 60).px(92, 58));

    return cv.finish();
}

// posição do olho em cada quadro (pixels do quadro, já com o reenquadramento)
export function eyeAt (pose) {
    return { x: EYE.x + pose.sx, y: EYE.y + pose.bob + ORIGIN[1] };
}

const walkPoses = Array.from({ length: WALK_FRAMES }, (_, i) => walkPose(i / WALK_FRAMES));

export default {
    name: 'brutamontes',
    frame: FRAME,
    sheets: [
        { file: 'brutamontes-walk.png', frames: walkPoses.map((p) => drawBrutamontes(p)), meta: { eye: walkPoses.map(eyeAt), idleEye: eyeAt(IDLE_POSE) } },
        { file: 'brutamontes.png', frames: [drawBrutamontes(IDLE_POSE)] }
    ]
};
