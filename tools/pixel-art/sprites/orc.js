// Orc Cibernético — pixel art 1× gerada por código (versão 3).
// Quadro 116×104 (1 pixel da arte = 1 pixel do mundo), olhando para a DIREITA, câmera 3/4,
// pés na borda inferior (linha 103 = contorno do chão). Personagem com ~96 px de altura.
// Proporções da versão 2 (pernas ~1/3, tronco ~40% curvado, cabeça grande), redesenhadas na grade 1×
// com detalhes: rebites e riscos nas placas, costura e fivela no cinto, dentes e presas com volume,
// veias nos braços, bota com sola e cadarço, espinhos e runas na clava.
// Referências (px da arte): pivot (58, 104) · olho (96.5, 38) · peito/acerto (58, 50) · topo do espinho (24, 9)

import { PixelCanvas } from '../lib/PixelCanvas.js';

export const FRAME = { w: 116, h: 104 };
export const WALK_FRAMES = 8;
export const EYE = { x: 96.5, y: 38 };

// Caminhada: mesmo ritmo e poses-chave da versão 2, com os deslocamentos dobrados (pixels 1×).
//   t = 0 e 0.5  → CONTATO: pernas ±10 px, tronco 2 px para frente;
//   t = 0.25/.75 → PASSAGEM: pernas juntas, corpo 2 px acima, pé de trás a 6 px do chão;
//   braço de trás e clava ±6 px em oposição às pernas.
export function walkPose (t) {
    const c = Math.cos(t * Math.PI * 2);
    const s = Math.sin(t * Math.PI * 2);
    const front = 2 * Math.round(5 * c);
    return {
        frontLeg: { dx: front, lift: 2 * Math.round(3 * Math.max(0, -s)) },
        backLeg: { dx: -front, lift: 2 * Math.round(3 * Math.max(0, s)) },
        bob: Math.abs(c) < 0.5 ? -2 : 0,
        lean: Math.abs(c) > 0.9 ? 2 : 0,
        backArm: 2 * Math.round(3 * c),
        club: -2 * Math.round(3 * c)
    };
}

export const IDLE_POSE = { frontLeg: { dx: 0, lift: 0 }, backLeg: { dx: 0, lift: 0 }, bob: 0, lean: 0, backArm: 0, club: 0 };

// Perna: coxa de pele, greva de aço claro com rebites, bota grande com sola e cadarço de couro.
function leg (cv, hipX, hipY, pose, name) {
    const fx = hipX + pose.dx;
    const kx = hipX + Math.round(pose.dx / 2);
    const lift = pose.lift;
    const knee = 85 - Math.round(lift / 2);
    const ank = 93 - lift;
    const g = 103 - lift;          // linha do chão da bota (borda da máscara)
    cv.part('pele', (m) => m.line(hipX, hipY, kx, knee, 10), { name: `${name}: coxa` });
    cv.part('acoClaro', (m) => m.line(kx, knee, fx, ank, 10), { name: `${name}: greva` });
    cv.rivet(kx - 2, knee + 1, 'acoClaro');
    cv.part('aco', (m) => m.poly([[fx - 8, ank - 2], [fx + 6, ank - 2], [fx + 12, ank + 4], [fx + 12, g], [fx - 8, g]]),
        { name: `${name}: bota`, rust: 0.08 });
    // sola de couro escuro e cadarço cruzado na frente
    cv.part('couro', (m) => m.poly([[fx - 8, g - 3], [fx + 12, g - 3], [fx + 12, g], [fx - 8, g]]), { name: `${name}: sola` });
    cv.paint({ mat: 'couro', tone: 3 }, (m) => m.px(fx + 2, ank).px(fx + 4, ank + 1).px(fx + 4, ank).px(fx + 2, ank + 1)
        .px(fx + 5, ank + 3).px(fx + 7, ank + 4).px(fx + 7, ank + 3).px(fx + 5, ank + 4));
}

export function drawOrc (pose = IDLE_POSE) {
    const cv = new PixelCanvas(FRAME.w, FRAME.h);
    const b = pose.bob;
    const up = pose.lean;
    const hipY = 71 + b;

    // 1) braço de trás: grosso, pendurado, veias, punho fechado à direita
    const ba = up + pose.backArm;
    cv.part('pele', (m) => m.offset(ba, b).line(76, 41, 82, 59, 10).line(82, 59, 84, 65, 10), { name: 'braço de trás' });
    cv.paint({ mat: 'pele', tone: 1 }, (m) => m.offset(ba, b).line(78, 46, 80, 51).line(80, 51, 81, 55));
    cv.part('pele', (m) => m.offset(ba, b).ellipse(85, 68, 6.6, 6), { name: 'punho de trás' });
    cv.paint({ mat: 'pele', tone: 1 }, (m) => m.offset(ba, b).px(82, 67).px(85, 69).px(88, 67));

    // 2) perna de trás
    leg(cv, 48, hipY, pose.backLeg, 'perna de trás');

    // 3) tronco em placas: barriga em malha de aço escuro + peitoral de aço claro com rebites e riscos
    cv.part('aco', (m) => m.offset(0, b).poly([[36, 71], [34, 57], [42, 51], [74, 51], [80, 59], [78, 71]]), { name: 'barriga', texture: false });
    cv.paint({ mat: 'aco', tone: 0 }, (m) => {
        m.offset(0, b);
        for (let y = 55; y < 70; y += 3) {
            for (let x = 38 + (Math.floor(y / 3) % 2) * 2; x < 77; x += 4) { m.px(x, y).px(x + 1, y + 1); }
        }
    });
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[38, 55], [36, 43], [46, 33], [66, 31], [80, 37], [84, 49], [78, 57], [58, 60], [44, 59]]),
        { name: 'peitoral', specular: 3 });
    for (const [x, y] of [[42, 44], [48, 37], [76, 41], [80, 50], [46, 55]]) { cv.rivet(x, y, 'acoClaro', up, b); }
    cv.paint({ mat: 'acoClaro', tone: 4 }, (m) => m.offset(up, b).line(52, 41, 56, 45).line(70, 52, 74, 54));
    cv.paint({ mat: 'acoClaro', tone: 1 }, (m) => m.offset(up, b).line(53, 42, 57, 46));
    cv.emissive('ciano', (m) => m.offset(up, b).line(63, 43, 67, 49, 2).line(67, 49, 71, 43, 2), { halo: 1, core: 3 });

    // 4) perna da frente
    leg(cv, 68, hipY, pose.frontLeg, 'perna da frente');

    // 5) tanga curta, cinto com costura e fivela de aço com runa ciano
    cv.part('tecido', (m) => m.offset(0, b).poly([[53, 71], [63, 71], [63, 79], [58, 77], [53, 79]]), { name: 'tanga' });
    cv.part('couro', (m) => m.offset(0, b).poly([[36, 67], [78, 67], [78, 72], [36, 72]]), { name: 'cinto' });
    cv.paint({ mat: 'couro', tone: 4 }, (m) => {
        m.offset(0, b);
        for (let x = 38; x < 77; x += 3) { m.px(x, 68); m.px(x + 1, 71); }
    });
    cv.part('acoClaro', (m) => m.offset(0, b).rect(52, 65, 12, 9), { name: 'fivela', specular: 1 });
    cv.emissive('ciano', (m) => m.offset(0, b).ellipse(58, 69.5, 3, 2.5), { halo: 1 });

    // 6) cabeça: orelha, crânio, mandíbula saliente, dentes, 2 presas com volume, sobrancelha pesada
    cv.part('pele', (m) => m.offset(up, b).poly([[78, 31], [62, 15], [80, 41]]), { name: 'orelha' });
    cv.paint({ mat: 'pele', tone: 1 }, (m) => m.offset(up, b).line(68, 22, 76, 32));
    cv.part('pele', (m) => m.offset(up, b).ellipse(90, 39, 19, 17), { name: 'crânio' });
    cv.part('pele', (m) => m.offset(up, b).poly([[78, 47], [106, 41], [112, 51], [104, 61], [84, 59]]), { name: 'mandíbula' });
    for (const x of [86, 91, 96]) {
        cv.part('presa', (m) => m.offset(up, b).poly([[x, 51], [x + 3.5, 50], [x + 1.8, 46.5]]), { name: `dente ${x}`, outline: false });
    }
    cv.part('presa', (m) => m.offset(up, b).poly([[90, 50], [95, 38], [100, 49]]), { name: 'presa 1' });
    cv.part('presa', (m) => m.offset(up, b).poly([[102, 48], [109, 35], [111, 46]]), { name: 'presa 2' });
    cv.part('pele', (m) => m.offset(up, b).rect(74, 27, 30, 4), { outline: false, name: 'sobrancelha' });
    cv.paint({ mat: 'pele', tone: 1 }, (m) => m.offset(up, b).line(80, 32, 88, 33).line(84, 55, 94, 57));

    // 7) implante ocular vermelho grande (núcleo claro + halo), aro de aço com rebites e antena
    cv.part('aco', (m) => m.offset(up, b).ellipse(96, 38, 7.2, 7.2).line(100, 31, 106, 19, 2), { name: 'aro do olho', specular: 1 });
    cv.rivet(91, 33, 'aco', up, b);
    cv.rivet(101, 43, 'aco', up, b);
    cv.emissive('vermelho', (m) => m.offset(up, b).ellipse(EYE.x, EYE.y, 4.2, 4.2), { halo: 2 });
    cv.emissive('vermelho', (m) => m.offset(up, b).rect(105, 16, 2, 2), { halo: 1 });

    // 8) ombreira de aço escuro com UM espinho, runa ciano gravada, ferrugem e rebites
    cv.part('acoClaro', (m) => m.offset(up, b).poly([[32, 31], [24, 9], [44, 27]]), { name: 'espinho' });
    cv.part('aco', (m) => m.offset(up, b).poly([[26, 49], [26, 37], [34, 27], [52, 25], [62, 31], [60, 41], [46, 49]]),
        { name: 'ombreira', rust: 0.16, specular: 3 });
    for (const [x, y] of [[30, 44], [38, 47], [48, 45], [56, 36]]) { cv.rivet(x, y, 'aco', up, b); }
    cv.emissive('ciano', (m) => m.offset(up, b).line(44, 30, 49, 35).line(49, 35, 44, 40).line(44, 40, 39, 35).line(39, 35, 44, 30),
        { halo: 1, core: 3 });

    // 9) clava de ferro com espinhos, núcleo de plasma e runas ciano gravadas
    const cl = up + pose.club;
    cv.part('couro', (m) => m.offset(cl, b).line(24, 69, 18, 83, 4), { name: 'cabo' });
    cv.part('aco', (m) => m.offset(cl, b).poly([[16, 79], [17, 70], [21, 78]]), { name: 'espinho da clava 1' });
    cv.part('aco', (m) => m.offset(cl, b).poly([[30, 84], [37, 82], [31, 90]]), { name: 'espinho da clava 2' });
    cv.part('aco', (m) => m.offset(cl, b).poly([[10, 81], [24, 77], [32, 87], [28, 103], [14, 103], [8, 93]]),
        { name: 'cabeça da clava', rust: 0.1, specular: 2 });
    cv.emissive('ciano', (m) => m.offset(cl, b).poly([[16, 85], [24, 83], [26, 93], [20, 97], [14, 93]]), { halo: 2 });
    cv.emissive('ciano', (m) => m.offset(cl, b).line(12, 99, 16, 99).line(27, 91, 27, 95), { halo: 1, core: 3 });

    // 10) braço da frente grosso em diagonal, veias, bracelete com rebite, punho no cabo
    cv.part('pele', (m) => m.offset(cl, b).line(42, 41, 32, 55, 10).line(32, 55, 24, 65, 10), { name: 'braço da frente' });
    cv.paint({ mat: 'pele', tone: 1 }, (m) => m.offset(cl, b).line(40, 44, 36, 49).line(36, 49, 35, 52));
    cv.paint({ mat: 'pele', tone: 3 }, (m) => m.offset(cl, b).line(41, 44, 37, 49));
    cv.part('acoClaro', (m) => m.offset(cl, b).poly([[24, 53], [36, 55], [32, 63], [20, 61]]), { name: 'bracelete', specular: 1 });
    cv.rivet(29, 58, 'acoClaro', cl, b);
    cv.part('pele', (m) => m.offset(cl, b).ellipse(23, 69, 6.6, 6), { name: 'punho da frente' });
    cv.paint({ mat: 'pele', tone: 1 }, (m) => m.offset(cl, b).px(20, 68).px(23, 70).px(26, 68));

    return cv.finish();
}

// posição do olho em cada quadro (o brilho do olho no jogo acompanha o sobe-desce)
export function eyeAt (pose) {
    return { x: EYE.x + pose.lean, y: EYE.y + pose.bob };
}

const walkPoses = Array.from({ length: WALK_FRAMES }, (_, i) => walkPose(i / WALK_FRAMES));

export default {
    name: 'orc',
    frame: FRAME,
    sheets: [
        { file: 'orc-walk.png', frames: walkPoses.map((p) => drawOrc(p)), meta: { eye: walkPoses.map(eyeAt), idleEye: eyeAt(IDLE_POSE) } },
        { file: 'orc.png', frames: [drawOrc(IDLE_POSE)] }
    ]
};
