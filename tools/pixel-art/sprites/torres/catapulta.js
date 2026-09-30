// Catapulta de Plasma em pixel art 1× (T19): 3 versões. Cada versão = base (fixa) + braço (redesenhado em cada ângulo).
// Coordenadas do desenho: base com (0, 0) no centro do chão; braço com (0, 0) no eixo, EM PÉ (concha para cima).
// A bola de plasma não é desenhada no braço: o jogo coloca o projétil no ponto `orb`.
// Quadros e encaixes em src/config/towerArt.js (TOWER_ART.plasmaCatapult).

import { TOWER_ART } from '../../../../src/config/towerArt.js';
import { baseCanvas, spinCanvas } from './comum.js';

const T = TOWER_ART.plasmaCatapult;

// roda de madeira com aro de ferro, cubo e raios
function wheel (cv, cx, cy, r, name) {
    cv.part('aco', (m) => m.ellipse(cx, cy, r, r), { name: `${name}: aro`, specular: 1 });
    cv.part('madeira', (m) => m.ellipse(cx, cy, r - 2.5, r - 2.5), { name: `${name}: roda` });
    cv.paint({ mat: 'madeira', tone: 1 }, (m) => m.line(cx - r + 3, cy, cx + r - 3, cy).line(cx, cy - r + 3, cx, cy + r - 3));
    cv.part('aco', (m) => m.ellipse(cx, cy, 2.5, 2.5), { name: `${name}: cubo`, specular: 1 });
}

export default {
    // A — catapulta clássica de madeira sobre rodas reforçadas com ferro
    a: {
        base () {
            const cv = baseCanvas(T.a);
            cv.part('madeira', (m) => m.line(-10, -22, 2, -42, 5).line(14, -22, 2, -42, 5), { name: 'cavaletes' });
            cv.part('madeira', (m) => m.rect(-40, -24, 80, 7), { name: 'chassi' });
            cv.paint({ mat: 'madeira', tone: 1 }, (m) => m.line(-40, -21, 39, -21));
            cv.part('madeira', (m) => m.ellipse(-26, -29, 5, 5), { name: 'sarilho' });
            cv.part('borracha', (m) => m.line(-24, -32, -2, -40, 2), { name: 'corda', outline: false });
            cv.part('aco', (m) => m.rect(-4, -44, 12, 4), { name: 'eixo', specular: 1 });
            for (const x of [-36, -14, 14, 36]) { cv.rivet(x, -23, 'aco'); }
            wheel(cv, -28, -10, 10.5, 'roda traseira');
            wheel(cv, 28, -10, 10.5, 'roda dianteira');
            return cv.finish();
        },
        arm (angle) {
            const cv = spinCanvas(T.a.arm, angle);
            cv.part('madeira', (m) => m.line(0, 6, 0, -50, 6), { name: 'braço' });
            cv.part('aco', (m) => m.rect(-3.5, -22, 7, 2).rect(-3.5, -40, 7, 2), { name: 'cintas', specular: 1 });
            cv.part('aco', (m) => m.poly([[-10, -58], [10, -58], [7, -51], [-7, -51]]), { name: 'concha', specular: 2 });
            cv.paint({ mat: 'aco', tone: 0 }, (m) => m.line(-8, -57, 8, -57));
            cv.part('aco', (m) => m.ellipse(0, 0, 3.5, 3.5), { name: 'eixo do braço', specular: 1 });
            return cv.finish();
        }
    },

    // B — trabuco alto com contrapeso de pedra rúnica
    b: {
        base () {
            const cv = baseCanvas(T.b);
            cv.part('madeira', (m) => m.line(-30, -9, -2, -66, 6).line(30, -9, 2, -66, 6), { name: 'pernas do trabuco' });
            cv.part('madeira', (m) => m.line(-18, -36, 18, -36, 4), { name: 'travessa' });
            cv.part('madeira', (m) => m.rect(-40, -11, 80, 8), { name: 'estrado' });
            cv.part('pedra', (m) => m.rect(-44, -6, 11, 6).rect(33, -6, 11, 6), { name: 'blocos de apoio', specular: 1 });
            cv.part('aco', (m) => m.rect(-6, -70, 12, 7), { name: 'mancal', specular: 1 });
            cv.rivet(-3, -68, 'aco'); cv.rivet(3, -68, 'aco');
            return cv.finish();
        },
        arm (angle) {
            const cv = spinCanvas(T.b.arm, angle);
            cv.part('madeira', (m) => m.line(0, 16, 0, -58, 5), { name: 'braço longo' });
            cv.part('pedra', (m) => m.poly([[-11, 14], [11, 14], [13, 32], [-13, 32]]), { name: 'contrapeso', specular: 1 });
            cv.emissive('ciano', (m) => m.line(-6, 20, 6, 20).line(0, 20, 0, 28).line(-6, 26, -3, 29).line(6, 26, 3, 29), { halo: 1 });
            cv.part('aco', (m) => m.rect(-3, 12, 6, 3), { name: 'argola', specular: 1 });
            cv.part('aco', (m) => m.poly([[-8, -64], [8, -64], [5, -58], [-5, -58]]), { name: 'funda', specular: 1 });
            cv.paint({ mat: 'aco', tone: 0 }, (m) => m.line(-7, -63, 7, -63));
            cv.part('aco', (m) => m.ellipse(0, 0, 3.5, 3.5), { name: 'eixo do braço', specular: 1 });
            return cv.finish();
        }
    },

    // C — morteiro-forja: base de pedra e ferro, braço hidráulico, reator de plasma visível
    c: {
        base () {
            const cv = baseCanvas(T.c);
            cv.part('pedra', (m) => m.poly([[-44, 0], [44, 0], [40, -18], [-40, -18]]), { name: 'base de pedra', specular: 1 });
            cv.paint({ mat: 'pedra', tone: 1 }, (m) => m.line(-42, -9, 42, -9).line(-20, -17, -20, -10).line(12, -17, 12, -10).line(-4, -8, -4, -1).line(28, -8, 28, -1));
            cv.part('aco', (m) => m.rect(-38, -26, 76, 8), { name: 'chapa de ferro', rust: 0.1, specular: 2 });
            for (const x of [-34, -18, 2, 18, 34]) { cv.rivet(x, -24, 'aco'); }
            cv.part('aco', (m) => m.rect(-15, -46, 18, 20), { name: 'suporte do braço', specular: 1 });
            cv.part('aco', (m) => m.rect(14, -46, 22, 20), { name: 'reator', specular: 1 });
            cv.emissive('ciano', (m) => m.ellipse(25, -36, 5, 6), { halo: 1 });
            cv.paint({ mat: 'aco', tone: 1 }, (m) => m.line(22, -44, 22, -28).line(28, -44, 28, -28));
            cv.part('borracha', (m) => m.line(14, -34, 3, -38, 3), { name: 'mangueira', outline: false });
            return cv.finish();
        },
        arm (angle) {
            const cv = spinCanvas(T.c.arm, angle);
            cv.part('aco', (m) => m.line(0, 4, 0, -40, 8), { name: 'cilindro', rust: 0.05, specular: 1 });
            cv.part('acoClaro', (m) => m.line(0, -6, 0, -34, 3), { name: 'pistão', outline: false, specular: 1 });
            cv.part('borracha', (m) => m.line(5, 2, 5, -38, 2), { name: 'mangueira do braço', outline: false });
            cv.emissive('ciano', (m) => m.line(-3, -12, -3, -30), { halo: 0, core: 3 });
            cv.part('aco', (m) => m.poly([[-9, -48], [9, -48], [6, -41], [-6, -41]]), { name: 'caçamba', specular: 2 });
            cv.paint({ mat: 'aco', tone: 0 }, (m) => m.line(-8, -47, 8, -47));
            cv.part('acoClaro', (m) => m.ellipse(0, 0, 4, 4), { name: 'articulação', specular: 1 });
            return cv.finish();
        }
    }
};
