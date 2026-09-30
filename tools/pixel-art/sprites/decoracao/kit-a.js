// Kit A — "Bosque antigo": carvalhos largos e retorcidos, copas densas verde-musgo, pedras cobertas de musgo;
// elemento temático: toco de árvore cortado. Quadros e encaixes em src/config/decor.js (DECOR_KITS.a).

import { DECOR_KITS } from '../../../../src/config/decor.js';
import { canvasFor, canopy, mossCap, shard } from './comum.js';

const K = DECOR_KITS.a.items;

export default {
    arvore1 () {
        const cv = canvasFor(K.arvore1, [4, 4]);
        cv.part('casca', (m) => m.line(50, 114, 34, 118, 5).line(74, 114, 92, 118, 5), { name: 'raízes' });
        cv.part('casca', (m) => m.poly([[44, 118], [80, 118], [72, 106], [70, 92], [75, 78], [67, 70], [56, 72], [50, 86], [53, 104]]), { name: 'tronco' });
        cv.paint({ mat: 'casca', tone: 0 }, (m) => m.ellipse(66, 96, 2, 3));
        cv.paint({ mat: 'musgo', tone: 2 }, (m) => m.ellipse(48, 114, 4, 3));
        cv.part('casca', (m) => m.line(58, 80, 34, 60, 6).line(68, 78, 94, 58, 6).line(62, 74, 60, 50, 6), { name: 'galhos' });
        canopy(cv, 'folhagem', 'copa A1', [[62, 44, 54, 30, 10], [60, 26, 30, 18, 7], [34, 54, 22, 15, 6], [92, 52, 23, 15, 6], [74, 40, 18, 13, 5]]);
        return cv.finish();
    },
    arvore2 () {
        const cv = canvasFor(K.arvore2, [4, 4]);
        cv.part('casca', (m) => m.line(38, 103, 27, 106, 4).line(54, 103, 64, 106, 4), { name: 'raízes' });
        cv.part('casca', (m) => m.poly([[34, 106], [56, 106], [52, 96], [56, 82], [64, 70], [58, 63], [48, 74], [42, 88], [40, 98]]), { name: 'tronco torto' });
        cv.part('casca', (m) => m.line(58, 68, 78, 50, 5).line(50, 72, 32, 58, 4), { name: 'galhos' });
        canopy(cv, 'folhagem', 'copa A2', [[60, 40, 34, 25, 9], [58, 24, 22, 15, 6], [34, 52, 16, 12, 5], [80, 46, 16, 12, 5]]);
        return cv.finish();
    },
    arvore3 () {
        const cv = canvasFor(K.arvore3, [4, 4]);
        cv.part('casca', (m) => m.line(32, 84, 25, 86, 3).line(41, 84, 48, 86, 3), { name: 'raízes' });
        cv.part('casca', (m) => m.poly([[30, 86], [43, 86], [40, 70], [42, 56], [35, 56], [33, 70]]), { name: 'tronco' });
        cv.part('casca', (m) => m.line(38, 62, 24, 48, 3), { name: 'galho' });
        canopy(cv, 'folhagem', 'copa A3', [[36, 34, 30, 23, 8], [38, 22, 17, 12, 5], [21, 42, 12, 9, 4], [52, 40, 13, 10, 4]]);
        return cv.finish();
    },
    arbusto1 () {
        const cv = canvasFor(K.arbusto1, [3, 4]);
        canopy(cv, 'folhagem', 'moita A1', [[21, 19, 18, 9, 6], [14, 15, 9, 7, 4], [28, 15, 9, 7, 4]]);
        return cv.finish();
    },
    arbusto2 () {
        const cv = canvasFor(K.arbusto2, [3, 4]);
        canopy(cv, 'folhagem', 'moita A2', [[29, 20, 26, 8, 8], [16, 16, 11, 7, 4], [42, 16, 12, 7, 4], [29, 13, 10, 6, 4]]);
        return cv.finish();
    },
    pedraP () {
        const cv = canvasFor(K.pedraP);
        cv.part('pedra', (m) => m.ellipse(13, 10.5, 11, 6.5), { name: 'pedra P', specular: 1 });
        mossCap(cv, 11, 7, 7, 3, 3);
        return cv.finish();
    },
    pedraM () {
        const cv = canvasFor(K.pedraM);
        cv.part('pedra', (m) => m.poly([[3, 28], [5, 17], [12, 8], [24, 5], [34, 10], [39, 20], [37, 28]]), { name: 'pedra M', specular: 1 });
        cv.paint({ mat: 'pedra', tone: 1 }, (m) => m.line(27, 14, 31, 22).line(31, 22, 30, 26));
        mossCap(cv, 20, 10, 13, 4, 5);
        cv.part('pedra', (m) => m.ellipse(9, 25.5, 6, 3.5), { name: 'pedrinha M', specular: 1 });
        return cv.finish();
    },
    pedraG () {
        const cv = canvasFor(K.pedraG);
        cv.part('pedra', (m) => m.poly([[4, 44], [5, 30], [12, 16], [26, 7], [42, 6], [54, 14], [62, 28], [61, 44]]), { name: 'pedra G', specular: 2 });
        cv.paint({ mat: 'pedra', tone: 1 }, (m) => m.line(40, 18, 46, 30).line(46, 30, 44, 40).line(20, 30, 26, 38));
        mossCap(cv, 30, 12, 21, 6, 7);
        cv.paint({ mat: 'musgo', tone: 2 }, (m) => m.line(14, 16, 12, 24).line(48, 12, 52, 20));
        cv.part('pedra', (m) => m.ellipse(52, 39, 10, 6.5), { name: 'pedra G frente', specular: 1 });
        mossCap(cv, 50, 35, 6, 2, 9);
        return cv.finish();
    },
    cristal () {
        const cv = canvasFor(K.cristal);
        cv.part('pedra', (m) => m.ellipse(24, 51, 17, 4), { name: 'base' });
        shard(cv, [[20, 52], [18, 20], [23, 6], [28, 20], [27, 52]], [23, 12, 23, 46], 'fragmento central');
        shard(cv, [[9, 53], [6, 34], [10, 24], [15, 34], [17, 53]], [10, 30, 12, 48], 'fragmento esquerdo');
        shard(cv, [[30, 53], [32, 30], [38, 20], [42, 32], [38, 53]], [37, 26, 35, 48], 'fragmento direito');
        shard(cv, [[18, 54], [17, 44], [21, 38], [25, 44], [25, 54]], [21, 42, 21, 51], 'fragmento da frente');
        cv.part('pedra', (m) => m.ellipse(7, 53, 5, 2.5).ellipse(41, 53, 5, 2.5), { name: 'pedrinhas', specular: 1 });
        return cv.finish();
    },
    tema () {
        const cv = canvasFor(K.tema);
        cv.part('casca', (m) => m.line(12, 32, 4, 34, 4).line(36, 32, 44, 34, 4), { name: 'raízes do toco' });
        cv.part('casca', (m) => m.poly([[10, 34], [38, 34], [36, 22], [36, 14], [12, 14], [12, 22]]), { name: 'toco' });
        cv.paint({ mat: 'musgo', tone: 2 }, (m) => m.ellipse(14, 27, 3, 5));
        cv.part('cerne', (m) => m.ellipse(24, 14, 12.5, 5), { name: 'corte' });
        // anéis do tronco no corte
        cv.paint({ mat: 'cerne', tone: 1 }, (m) => m.ellipse(24, 14, 8.5, 3.2));
        cv.paint({ mat: 'cerne', tone: 2 }, (m) => m.ellipse(24, 14, 7.5, 2.3));
        cv.paint({ mat: 'cerne', tone: 1 }, (m) => m.ellipse(24, 14, 4.5, 1.6));
        cv.paint({ mat: 'cerne', tone: 2 }, (m) => m.ellipse(24, 14, 3.5, 0.8));
        cv.paint({ mat: 'cerne', tone: 0 }, (m) => m.px(24, 14).line(26, 13, 32, 11));
        cv.paint({ mat: 'casca', tone: 1 }, (m) => m.line(30, 20, 31, 30).line(18, 20, 17, 28));
        return cv.finish();
    }
};
