// Peças comuns das torres em pixel art (T19/T20).

import { PixelCanvas } from '../../lib/PixelCanvas.js';
import { groundAngle } from '../../../../src/config/towerArt.js';

// (0, 0) do desenho = ponto de chão da base; a linha y = 0 é o contorno que encosta no chão
export function baseCanvas (def) {
    const [w, h] = def.base.frame;
    return new PixelCanvas(w, h, { origin: [def.base.pivot[0], def.base.pivot[1] - 1] });
}

// Chão embutido no sprite (terra, sombra de contato, capim): pintado DEPOIS do contorno e só nos pixels vazios,
// fica atrás da torre e sem contorno (elementos de chão não têm contorno — ART_SPEC).
export function groundDecal (cv, draw) {
    const [ox, oy] = cv.origin;
    const set = (x, y, c) => {
        const X = Math.round(x) + ox, Y = Math.round(y) + oy;
        if (X < 0 || Y < 0 || X >= cv.w || Y >= cv.h) { return; }
        const i = Y * cv.w + X;
        if (!cv.color[i]) { cv.color[i] = c; }
    };
    draw(set);
    return cv;
}

// peça que gira: (0, 0) do desenho = eixo de giro, no centro do quadro; a forma é redesenhada no ângulo pedido
// piece.foreshorten (T26): escorço 3/4 — `angle` é a direção NA TELA; o desenho gira no plano do chão e achata o y
export function spinCanvas (piece, angle) {
    const [w, h] = piece.frame;
    const sy = piece.foreshorten ?? 1;
    return new PixelCanvas(w, h, { origin: [piece.pivot[0], piece.pivot[1]], rotate: { angle: groundAngle(angle, sy), cx: 0, cy: 0, sy } });
}
