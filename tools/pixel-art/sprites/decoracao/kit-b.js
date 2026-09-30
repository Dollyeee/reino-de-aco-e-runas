// Kit B — "Fronteira de pinheiros": pinheiros e abetos altos e escuros, arbustos espinhosos, pedras angulosas
// cinza-frias; elemento temático: marco de pedra com runa ciano gravada. Encaixes em src/config/decor.js (DECOR_KITS.b).

import { DECOR_KITS } from '../../../../src/config/decor.js';
import { seedOf } from '../../lib/textures.js';
import { canvasFor, facet, runeGroove, shard, spiky, tier } from './comum.js';

const K = DECOR_KITS.b.items;

// pinheiro: tronco + camadas de baixo (mais larga, atrás) para cima (na frente)
function pine (cv, name, trunk, tiers) {
    cv.part('casca', (m) => m.rect(...trunk), { name: `${name}: tronco` });
    tiers.forEach(([cx, top, bottom, hw], i) => {
        cv.part('pinho', (m) => tier(m, cx, top, bottom, hw, seedOf(`${name}${i}`)), { name: `${name}: camada ${i}` });
    });
}

export default {
    arvore1 () {
        const cv = canvasFor(K.arvore1, [2, 2]);
        pine(cv, 'pinheiro alto', [30, 112, 7, 23], [[33, 70, 118, 31], [33, 52, 98, 26], [33, 36, 80, 21], [33, 22, 62, 16], [33, 10, 44, 11], [33, 2, 28, 6]]);
        return cv.finish();
    },
    arvore2 () {
        const cv = canvasFor(K.arvore2, [2, 2]);
        pine(cv, 'abeto largo', [42, 100, 9, 17], [[46, 58, 106, 44], [46, 40, 86, 36], [46, 24, 66, 27], [46, 10, 46, 18], [46, 2, 28, 9]]);
        return cv.finish();
    },
    arvore3 () {
        const cv = canvasFor(K.arvore3, [2, 2]);
        pine(cv, 'pinheiro jovem', [22, 68, 5, 15], [[24, 40, 72, 22], [24, 26, 56, 17], [24, 14, 40, 12], [24, 3, 24, 7]]);
        return cv.finish();
    },
    arbusto1 () {
        const cv = canvasFor(K.arbusto1, [2, 2]);
        cv.part('pinho', (m) => spiky(m, 23, 28, 21, 20, 7, seedOf('espinheiro')), { name: 'espinheiro' });
        cv.part('pinho', (m) => spiky(m, 15, 28, 12, 12, 5, seedOf('espinheiro e')), { name: 'espinheiro esquerda' });
        cv.part('pinho', (m) => spiky(m, 32, 28, 11, 11, 5, seedOf('espinheiro d')), { name: 'espinheiro direita' });
        return cv.finish();
    },
    arbusto2 () {
        const cv = canvasFor(K.arbusto2, [2, 2]);
        cv.part('pinho', (m) => spiky(m, 19, 22, 17, 16, 6, seedOf('espinheiro baixo')), { name: 'espinheiro baixo' });
        cv.part('pinho', (m) => spiky(m, 13, 22, 9, 9, 4, seedOf('espinheiro baixo f')), { name: 'espinheiro baixo frente' });
        return cv.finish();
    },
    pedraP () {
        const cv = canvasFor(K.pedraP);
        cv.part('pedraFria', (m) => m.poly([[2, 18], [3, 11], [8, 4], [15, 2], [22, 7], [24, 14], [20, 18]]), { name: 'pedra P', specular: 1 });
        facet(cv, 'pedraFria', 3, [[3, 11], [8, 4], [15, 2], [12, 9], [6, 12]]);
        facet(cv, 'pedraFria', 1, [[16, 11], [22, 7], [24, 14], [20, 18], [17, 18]]);
        return cv.finish();
    },
    pedraM () {
        const cv = canvasFor(K.pedraM);
        cv.part('pedraFria', (m) => m.poly([[3, 32], [4, 18], [10, 8], [20, 3], [30, 6], [38, 16], [39, 32]]), { name: 'pedra M', specular: 1 });
        facet(cv, 'pedraFria', 3, [[4, 18], [10, 8], [20, 3], [17, 14], [8, 20]]);
        facet(cv, 'pedraFria', 1, [[28, 18], [30, 6], [38, 16], [39, 32], [30, 32]]);
        cv.paint({ mat: 'pedraFria', tone: 0 }, (m) => m.line(20, 14, 24, 26));
        return cv.finish();
    },
    pedraG () {
        const cv = canvasFor(K.pedraG);
        cv.part('pedraFria', (m) => m.poly([[20, 52], [18, 20], [26, 4], [38, 2], [46, 14], [46, 52]]), { name: 'laje', specular: 2 });
        facet(cv, 'pedraFria', 3, [[18, 20], [26, 4], [30, 5], [26, 22]]);
        facet(cv, 'pedraFria', 1, [[38, 2], [46, 14], [46, 52], [40, 52], [38, 18]]);
        cv.part('pedraFria', (m) => m.poly([[40, 52], [42, 36], [52, 28], [62, 34], [63, 52]]), { name: 'bloco', specular: 1 });
        facet(cv, 'pedraFria', 3, [[42, 36], [52, 28], [54, 32], [46, 40]]);
        facet(cv, 'pedraFria', 1, [[55, 38], [62, 34], [63, 52], [56, 52]]);
        cv.part('pedraFria', (m) => m.poly([[4, 52], [6, 44], [14, 40], [22, 44], [22, 52]]), { name: 'lasca', specular: 1 });
        facet(cv, 'pedraFria', 3, [[6, 44], [14, 40], [15, 43], [8, 47]]);
        cv.paint({ mat: 'pedraFria', tone: 0 }, (m) => m.line(30, 24, 34, 36).line(34, 36, 32, 44));
        return cv.finish();
    },
    cristal () {
        const cv = canvasFor(K.cristal);
        cv.part('pedraFria', (m) => m.poly([[4, 56], [8, 50], [20, 48], [34, 48], [42, 52], [42, 56]]), { name: 'base' });
        shard(cv, [[19, 52], [20, 18], [24, 4], [29, 18], [28, 52]], [24, 10, 24, 46], 'fragmento central');
        shard(cv, [[10, 53], [5, 32], [6, 22], [13, 30], [17, 53]], [8, 28, 13, 48], 'fragmento esquerdo');
        shard(cv, [[30, 53], [33, 28], [40, 20], [41, 34], [37, 53]], [38, 26, 34, 48], 'fragmento direito');
        shard(cv, [[20, 56], [19, 46], [23, 40], [27, 46], [27, 56]], [23, 44, 23, 53], 'fragmento da frente');
        return cv.finish();
    },
    tema () {
        const cv = canvasFor(K.tema);
        cv.part('pedraFria', (m) => m.poly([[6, 60], [5, 24], [9, 8], [17, 3], [25, 8], [28, 26], [28, 60]]), { name: 'marco', specular: 1 });
        facet(cv, 'pedraFria', 3, [[5, 24], [9, 8], [12, 9], [10, 26], [6, 40]]);
        facet(cv, 'pedraFria', 1, [[24, 24], [25, 8], [28, 26], [28, 60], [24, 60]]);
        runeGroove(cv, 'pedraFria', [[16, 14, 16, 46], [16, 20, 21, 25], [16, 30, 11, 35], [16, 40, 20, 44]]);
        cv.part('pedraFria', (m) => m.ellipse(5.5, 59, 3, 2).ellipse(29.5, 59, 2.5, 2), { name: 'pedrinhas' });
        return cv.finish();
    }
};
