import { DEPTH, SHADOW } from '../config/visual.js';

// Sombras elípticas no chão. Ficam todas numa camada abaixo dos objetos,
// deslocadas para baixo/direita (a luz vem do canto superior esquerdo).
export default class ShadowLayer {
    constructor (scene) {
        this.scene = scene;
    }

    // (x, y) = ponto de contato com o chão do dono da sombra.
    add (x, y, width, height) {
        const img = this.scene.add.image(x + SHADOW.offsetX, y + SHADOW.offsetY, 'shadow');
        img.setDepth(DEPTH.SHADOW);
        img.setAlpha(SHADOW.alpha);
        img.baseW = width;
        img.baseH = height;
        img.setDisplaySize(width, height);
        return img;
    }

    // Atualiza posição/tamanho. `lift` = altura do dono acima do chão (encolhe e clareia a sombra).
    static follow (shadow, x, y, lift = 0, sizeMul = 1) {
        const k = Math.max(0.35, 1 - lift / 220);
        shadow.setPosition(x + SHADOW.offsetX + lift * 0.12, y + SHADOW.offsetY + lift * 0.05);
        shadow.setDisplaySize(shadow.baseW * k * sizeMul, shadow.baseH * k * sizeMul);
        shadow.setAlpha(SHADOW.alpha * (0.45 + 0.55 * k));
    }
}
