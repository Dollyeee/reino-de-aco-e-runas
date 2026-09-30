// Kit C — "Floresta rúnica": árvores de casca escura com veias finas de ciano, cristais maiores brotando do chão,
// pedras com fissuras rúnicas; elemento temático: ruína de pilar medieval com circuito rúnico exposto.
// Encaixes em src/config/decor.js (DECOR_KITS.c).

import { DECOR_KITS } from '../../../../src/config/decor.js';
import { canopy, canvasFor, glints, runeGroove, shard } from './comum.js';

const K = DECOR_KITS.c.items;

// veia de ciano (1 px, sem halo) seguindo uma polilinha
function vein (cv, pts) {
    cv.emissive('ciano', (m) => { for (let i = 1; i < pts.length; i++) { m.line(...pts[i - 1], ...pts[i]); } }, { halo: 0, core: 3 });
}

export default {
    arvore1 () {
        const cv = canvasFor(K.arvore1, [5, 4]);
        cv.part('cascaEscura', (m) => m.line(44, 118, 28, 122, 5).line(64, 118, 80, 122, 5), { name: 'raízes' });
        cv.part('cascaEscura', (m) => m.poly([[40, 122], [68, 122], [62, 108], [58, 94], [64, 80], [57, 72], [49, 76], [47, 92], [45, 108]]), { name: 'tronco' });
        cv.part('cascaEscura', (m) => m.line(54, 82, 32, 64, 5).line(58, 78, 80, 60, 5), { name: 'galhos' });
        vein(cv, [[52, 121], [50, 108], [54, 96], [52, 84], [56, 76]]);
        vein(cv, [[52, 86], [42, 74]]);
        vein(cv, [[62, 121], [72, 118]]);
        canopy(cv, 'folhagemRunica', 'copa C1', [[54, 44, 46, 28, 10], [54, 28, 26, 17, 6], [30, 56, 17, 12, 5], [80, 52, 19, 13, 5]]);
        glints(cv, [[40, 40], [66, 34], [58, 52], [30, 58], [80, 50]]);
        return cv.finish();
    },
    arvore2 () {
        const cv = canvasFor(K.arvore2, [4, 4]);
        cv.part('cascaEscura', (m) => m.line(36, 111, 26, 114, 4).line(50, 111, 60, 114, 4), { name: 'raízes' });
        cv.part('cascaEscura', (m) => m.poly([[34, 114], [52, 114], [48, 100], [50, 82], [45, 70], [40, 82], [38, 100]]), { name: 'tronco' });
        cv.part('cascaEscura', (m) => m.line(46, 80, 60, 62, 4).line(44, 84, 28, 70, 3), { name: 'galhos em forquilha' });
        vein(cv, [[43, 113], [45, 98], [43, 84], [45, 74]]);
        vein(cv, [[46, 82], [56, 68]]);
        // copa alta e assimétrica: massa principal puxada para a direita, tufo alto à esquerda, pontas soltas
        canopy(cv, 'folhagemRunica', 'copa C2', [[48, 46, 28, 26, 9], [34, 28, 17, 17, 6], [60, 30, 17, 15, 6], [26, 60, 13, 9, 4], [66, 58, 12, 9, 4], [46, 16, 12, 10, 4]]);
        glints(cv, [[34, 36], [58, 28], [48, 56], [28, 58]]);
        return cv.finish();
    },
    arvore3 () {
        const cv = canvasFor(K.arvore3, [4, 4]);
        cv.part('cascaEscura', (m) => m.line(30, 88, 23, 90, 3).line(38, 88, 45, 90, 3), { name: 'raízes' });
        cv.part('cascaEscura', (m) => m.poly([[29, 90], [39, 90], [37, 74], [38, 60], [31, 60], [31, 74]]), { name: 'tronco' });
        cv.part('cascaEscura', (m) => m.line(35, 64, 22, 52, 3), { name: 'galho' });
        vein(cv, [[34, 89], [35, 76], [33, 66]]);
        canopy(cv, 'folhagemRunica', 'copa C3', [[33, 36, 27, 21, 8], [34, 24, 16, 11, 5], [20, 44, 11, 8, 4]]);
        glints(cv, [[26, 32], [42, 40]]);
        return cv.finish();
    },
    arbusto1 () {
        const cv = canvasFor(K.arbusto1, [3, 4]);
        canopy(cv, 'folhagemRunica', 'moita C1', [[21, 19, 18, 9, 6], [14, 15, 9, 7, 4], [28, 15, 9, 7, 4]]);
        glints(cv, [[16, 17], [27, 21]]);
        return cv.finish();
    },
    arbusto2 () {
        const cv = canvasFor(K.arbusto2, [3, 4]);
        canopy(cv, 'folhagemRunica', 'moita C2', [[29, 20, 26, 8, 8], [16, 16, 11, 7, 4], [42, 16, 12, 7, 4], [29, 13, 10, 6, 4]]);
        glints(cv, [[20, 19], [38, 18], [30, 23]]);
        return cv.finish();
    },
    pedraP () {
        const cv = canvasFor(K.pedraP);
        cv.part('pedraRunica', (m) => m.ellipse(13, 10.5, 11, 6.5), { name: 'pedra P', specular: 1 });
        runeGroove(cv, 'pedraRunica', [[8, 8, 12, 12], [12, 12, 17, 11]], 2);
        return cv.finish();
    },
    pedraM () {
        const cv = canvasFor(K.pedraM);
        cv.part('pedraRunica', (m) => m.poly([[3, 28], [5, 17], [12, 8], [24, 5], [34, 10], [39, 20], [37, 28]]), { name: 'pedra M', specular: 1 });
        runeGroove(cv, 'pedraRunica', [[14, 11, 18, 17], [18, 17, 26, 19], [26, 19, 28, 25]], 2);
        cv.part('pedraRunica', (m) => m.ellipse(9, 25.5, 6, 3.5), { name: 'pedrinha M', specular: 1 });
        return cv.finish();
    },
    pedraG () {
        const cv = canvasFor(K.pedraG);
        cv.part('pedraRunica', (m) => m.poly([[4, 44], [5, 30], [12, 16], [26, 7], [42, 6], [54, 14], [62, 28], [61, 44]]), { name: 'pedra G', specular: 2 });
        runeGroove(cv, 'pedraRunica', [[20, 14, 25, 24], [25, 24, 38, 26], [38, 26, 42, 36], [38, 26, 46, 18]], 2);
        cv.emissive('ciano', (m) => m.ellipse(25.5, 24.5, 1.6), { halo: 1 });
        cv.part('pedraRunica', (m) => m.ellipse(52, 39, 10, 6.5), { name: 'pedra G frente', specular: 1 });
        return cv.finish();
    },
    cristal () {
        const cv = canvasFor(K.cristal);
        cv.part('pedraRunica', (m) => m.poly([[6, 84], [10, 76], [24, 72], [44, 72], [58, 76], [62, 84]]), { name: 'chão rachado' });
        shard(cv, [[28, 80], [26, 30], [34, 6], [42, 30], [40, 80]], [34, 14, 34, 74], 'fragmento central');
        shard(cv, [[12, 80], [8, 50], [14, 36], [20, 50], [22, 80]], [14, 44, 17, 74], 'fragmento esquerdo');
        shard(cv, [[46, 80], [48, 46], [56, 34], [60, 50], [56, 80]], [55, 42, 51, 74], 'fragmento direito');
        shard(cv, [[20, 84], [19, 70], [24, 62], [29, 70], [28, 84]], [24, 66, 24, 80], 'fragmento da frente 1');
        shard(cv, [[40, 84], [41, 72], [46, 66], [50, 74], [48, 84]], [46, 70, 45, 80], 'fragmento da frente 2');
        return cv.finish();
    },
    tema () {
        const cv = canvasFor(K.tema);
        cv.part('pedra', (m) => m.rect(8, 86, 40, 7), { name: 'base do pilar' });
        cv.part('pedra', (m) => m.poly([[14, 86], [42, 86], [41, 30], [38, 24], [33, 28], [28, 18], [23, 27], [18, 23], [15, 30]]), { name: 'fuste quebrado', specular: 1 });
        cv.paint({ mat: 'pedra', tone: 1 }, (m) => m.line(21, 34, 21, 84).line(28, 32, 28, 84).line(35, 32, 35, 84));
        cv.paint({ mat: 'pedra', tone: 0 }, (m) => m.line(31, 60, 27, 70).line(27, 70, 29, 76));
        runeGroove(cv, 'pedra', [[23, 30, 23, 42], [23, 42, 30, 42], [30, 42, 30, 54], [34, 32, 34, 46]]);
        cv.emissive('ciano', (m) => m.ellipse(30.5, 55.5, 1.8), { halo: 1 });
        cv.part('pedra', (m) => m.poly([[42, 92], [44, 83], [50, 81], [53, 87], [52, 92]]), { name: 'bloco caído', specular: 1 });
        cv.emissive('ciano', (m) => m.line(46, 86, 49, 86), { halo: 0, core: 3 });
        return cv.finish();
    }
};
