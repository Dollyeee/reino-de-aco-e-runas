// Besta Laser em pixel art 1× (T19): 3 versões. Cada versão = base (fixa) + cabeça (redesenhada em cada ângulo de mira).
// Coordenadas do desenho: base com (0, 0) no centro do chão (y negativo para cima); cabeça com (0, 0) no eixo de giro,
// apontando para a DIREITA. Quadros e encaixes em src/config/towerArt.js (TOWER_ART.laserCrossbow).

import { PixelCanvas } from '../../lib/PixelCanvas.js';
import { TOWER_ART } from '../../../../src/config/towerArt.js';

const T = TOWER_ART.laserCrossbow;

export function baseCanvas (def) {
    const [w, h] = def.base.frame;
    return new PixelCanvas(w, h, { origin: [def.base.pivot[0], h - 1] });
}

export function spinCanvas (piece, angle) {
    const [w, h] = piece.frame;
    return new PixelCanvas(w, h, { origin: [piece.pivot[0], piece.pivot[1]], rotate: { angle, cx: 0, cy: 0 } });
}

export default {
    // A — torre de vigia de madeira e pedra; besta mecânica com cordas de energia ciano
    a: {
        base () {
            const cv = baseCanvas(T.a);
            cv.part('pedra', (m) => m.poly([[-34, 0], [34, 0], [31, -14], [-31, -14]]), { name: 'alicerce', specular: 1 });
            cv.paint({ mat: 'pedra', tone: 1 }, (m) => {
                m.line(-32, -7, 32, -7);
                for (const x of [-18, -2, 14]) { m.line(x, -13, x, -8); }
                for (const x of [-10, 6, 22]) { m.line(x, -6, x, -1); }
            });
            cv.part('madeira', (m) => m.line(-24, -15, -16, -58, 6).line(24, -15, 16, -58, 6), { name: 'pernas' });
            cv.part('madeira', (m) => m.line(-21, -19, 17, -50, 3).line(21, -19, -17, -50, 3).line(-20, -34, 20, -34, 3), { name: 'travessas' });
            cv.part('madeira', (m) => m.rect(-26, -64, 52, 7), { name: 'plataforma' });
            cv.paint({ mat: 'madeira', tone: 1 }, (m) => { for (let x = -20; x < 26; x += 6) { m.line(x, -63, x, -58); } });
            cv.part('aco', (m) => m.rect(-27, -57, 54, 2), { name: 'cinta de ferro', specular: 1 });
            cv.rivet(-22, -57, 'aco'); cv.rivet(0, -57, 'aco'); cv.rivet(21, -57, 'aco');
            cv.part('madeira', (m) => m.rect(-26, -70, 3, 6).rect(23, -70, 3, 6), { name: 'postes do parapeito' });
            return cv.finish();
        },
        head (angle) {
            const cv = spinCanvas(T.a.head, angle);
            cv.part('madeira', (m) => m.poly([[-26, -4], [-19, -4], [-19, 5], [-26, 6]]), { name: 'coronha' });
            cv.part('madeira', (m) => m.poly([[-22, -3], [16, -3], [18, 0], [16, 3], [-22, 3]]), { name: 'corpo' });
            cv.part('aco', (m) => m.rect(-16, -5, 8, 10), { name: 'mecanismo', specular: 1 });
            cv.part('aco', (m) => m.poly([[6, -3], [11, -10], [10, -19], [6, -22], [7, -12], [4, -3]]), { name: 'arco de cima', specular: 1 });
            cv.part('aco', (m) => m.poly([[6, 3], [11, 10], [10, 19], [6, 22], [7, 12], [4, 3]]), { name: 'arco de baixo', specular: 1 });
            cv.part('acoClaro', (m) => m.rect(-4, -1, 30, 2), { name: 'virote', specular: 1 });
            cv.emissive('ciano', (m) => m.line(6, -21, -6, 0).line(6, 21, -6, 0), { halo: 0, core: 3 });
            cv.emissive('ciano', (m) => m.ellipse(-7, 0, 2, 2), { halo: 1 });
            cv.emissive('ciano', (m) => m.px(26, 0), { halo: 0, core: 3 });
            return cv.finish();
        }
    },

    // B — pedestal rúnico flutuante; besta de metal escuro com cristal-mira ciano
    b: {
        base () {
            const cv = baseCanvas(T.b);
            cv.part('pedra', (m) => m.poly([[-26, 0], [26, 0], [22, -12], [-22, -12]]), { name: 'pedestal', specular: 1 });
            cv.part('pedra', (m) => m.poly([[-19, -12], [19, -12], [17, -18], [-17, -18]]), { name: 'degrau' });
            cv.emissive('ciano', (m) => m.line(-14, -5, -10, -9).line(-10, -9, -6, -5).line(2, -9, 2, -4).line(8, -5, 12, -9).line(12, -9, 15, -6), { halo: 0, core: 3 });
            // energia entre o degrau e o bloco flutuante (o bloco não encosta no pedestal)
            cv.emissive('ciano', (m) => m.ellipse(0, -21, 11, 1.4), { halo: 1, glow: true });
            cv.part('pedra', (m) => m.poly([[-16, -25], [16, -25], [21, -40], [15, -56], [-15, -56], [-21, -40]]), { name: 'bloco flutuante', specular: 2 });
            cv.paint({ mat: 'pedra', tone: 0 }, (m) => m.ellipse(0, -40, 9, 9));
            cv.paint({ mat: 'pedra', tone: 2 }, (m) => m.ellipse(0, -40, 7.5, 7.5));
            cv.emissive('ciano', (m) => m.px(0, -49).px(-9, -40).px(9, -40).px(0, -31).px(-6, -46).px(6, -34), { halo: 0, core: 3 });
            cv.part('aco', (m) => m.rect(-7, -61, 14, 5), { name: 'suporte', specular: 1 });
            return cv.finish();
        },
        head (angle) {
            const cv = spinCanvas(T.b.head, angle);
            cv.part('aco', (m) => m.poly([[4, -3], [13, -17], [9, -20], [0, -4]]), { name: 'asa de cima', specular: 1 });
            cv.part('aco', (m) => m.poly([[4, 3], [13, 17], [9, 20], [0, 4]]), { name: 'asa de baixo', specular: 1 });
            cv.part('borracha', (m) => m.line(10, -19, -4, 0).line(10, 19, -4, 0), { name: 'corda', outline: false });
            cv.part('aco', (m) => m.poly([[-24, 0], [-20, -4], [14, -4], [23, -1], [23, 1], [14, 4], [-20, 4]]), { name: 'corpo', specular: 2 });
            cv.part('acoClaro', (m) => m.rect(-14, -2, 30, 1), { name: 'trilho', outline: false, specular: 0 });
            cv.part('aco', (m) => m.rect(-6, -7, 6, 3), { name: 'garras do cristal' });
            cv.emissive('ciano', (m) => m.poly([[-2, -13], [1.5, -8], [-2, -4.5], [-5.5, -8]]), { halo: 1 });
            return cv.finish();
        }
    },

    // C — sentinela compacta de aço rebitado; trilho de plasma e visor ciano
    c: {
        base () {
            const cv = baseCanvas(T.c);
            cv.part('borracha', (m) => m.rect(-37, -7, 12, 7).rect(25, -7, 12, 7), { name: 'sapatas' });
            cv.part('aco', (m) => m.poly([[-33, 0], [33, 0], [30, -30], [20, -40], [-20, -40], [-30, -30]]), { name: 'bunker', rust: 0.08, specular: 2 });
            cv.part('acoClaro', (m) => m.poly([[-23, -6], [23, -6], [21, -28], [-21, -28]]), { name: 'placa frontal', specular: 1 });
            for (const [x, y] of [[-20, -25], [18, -25], [-20, -9], [18, -9]]) { cv.rivet(x, y, 'acoClaro'); }
            cv.paint({ mat: 'aco', tone: 0 }, (m) => m.line(-12, -16, 12, -16).line(-12, -13, 12, -13));
            cv.emissive('ciano', (m) => m.px(-26, -33).px(26, -33), { halo: 0, core: 3 });
            cv.part('acoClaro', (m) => m.ellipse(0, -43, 16, 5), { name: 'anel da torreta', specular: 1 });
            return cv.finish();
        },
        head (angle) {
            const cv = spinCanvas(T.c.head, angle);
            cv.part('acoClaro', (m) => m.rect(4, -6, 24, 3).rect(4, 3, 24, 3), { name: 'trilhos', specular: 1 });
            cv.emissive('ciano', (m) => m.line(6, 0, 26, 0), { halo: 1 });
            cv.part('aco', (m) => m.poly([[-22, 0], [-19, -8], [2, -8], [6, -4], [6, 4], [2, 8], [-19, 8]]), { name: 'carcaça', rust: 0.06, specular: 2 });
            cv.rivet(-16, -5, 'aco'); cv.rivet(-16, 4, 'aco'); cv.rivet(0, 4, 'aco');
            cv.part('borracha', (m) => m.rect(-13, -5, 9, 3), { name: 'moldura do visor' });
            cv.emissive('ciano', (m) => m.line(-12, -4, -6, -4), { halo: 0, core: 3 });
            cv.part('acoClaro', (m) => m.rect(26, -7, 4, 14), { name: 'boca', specular: 1 });
            return cv.finish();
        }
    }
};
