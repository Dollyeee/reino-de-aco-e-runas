// Besta Laser versão A como estava na T19 (antes da passada de acabamento da T20) — congelada só para o comparativo
// "Besta A antes × depois" de tools/pixel-art/escolha-torres.html. Não vai para o jogo.

import { PixelCanvas } from '../lib/PixelCanvas.js';
import { HEAD_ANGLES } from '../../../src/config/towerArt.js';

export const BESTA_A_T19 = {
    name: 'Torre de vigia (T19, antes)',
    base: { frame: [80, 74], pivot: [40, 74] },
    head: { frame: [66, 66], pivot: [33, 33], angles: HEAD_ANGLES },
    headMount: { x: 0, y: -64 }, muzzle: { x: 28, y: 0 }, crystal: { x: -7, y: 0 },
    shadow: [72, 22]
};

const D = BESTA_A_T19;

export function baseT19 () {
    const [w, h] = D.base.frame;
    const cv = new PixelCanvas(w, h, { origin: [D.base.pivot[0], h - 1] });
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
}

export function headT19 (angle) {
    const [w, h] = D.head.frame;
    const cv = new PixelCanvas(w, h, { origin: [D.head.pivot[0], D.head.pivot[1]], rotate: { angle, cx: 0, cy: 0 } });
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
