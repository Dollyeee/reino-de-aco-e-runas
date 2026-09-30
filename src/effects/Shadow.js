import { DEPTH, PIXEL_SCALE, SHADOW } from '../config/visual.js';

// Sombras elípticas no chão. Ficam todas numa camada abaixo dos objetos,
// deslocadas para baixo/direita (a luz vem do canto superior esquerdo).
// Duas versões: suave (gradiente, para a arte vetorial) e de pixels (elipse dura, para pixel art).
export default class ShadowLayer {
    constructor (scene) {
        this.scene = scene;
    }

    // (x, y) = ponto de contato com o chão do dono da sombra. width/height em pixels do mundo.
    // opts.pixel = true → elipse de pixels sem blur, em escala inteira (PIXEL_SCALE).
    add (x, y, width, height, opts = {}) {
        if (opts.pixel) { return this.addPixel(x, y, width, height); }
        const img = this.scene.add.image(x + SHADOW.offsetX, y + SHADOW.offsetY, 'shadow');
        img.setDepth(DEPTH.SHADOW);
        img.setAlpha(SHADOW.alpha);
        img.baseW = width;
        img.baseH = height;
        img.setDisplaySize(width, height);
        return img;
    }

    addPixel (x, y, width, height) {
        const aw = Math.max(2, Math.round(width / PIXEL_SCALE));
        const ah = Math.max(2, Math.round(height / PIXEL_SCALE));
        const key = `shadow-px-${aw}x${ah}`;
        if (!this.scene.textures.exists(key)) {
            const tex = this.scene.textures.createCanvas(key, aw, ah);
            const ctx = tex.getContext();
            ctx.fillStyle = 'rgb(30,14,40)';
            for (let py = 0; py < ah; py++) {
                for (let px = 0; px < aw; px++) {
                    const nx = (px + 0.5 - aw / 2) / (aw / 2), ny = (py + 0.5 - ah / 2) / (ah / 2);
                    if (nx * nx + ny * ny <= 1) { ctx.fillRect(px, py, 1, 1); }
                }
            }
            tex.refresh();
        }
        const img = this.scene.add.image(0, 0, key).setScale(PIXEL_SCALE).setDepth(DEPTH.SHADOW).setAlpha(SHADOW.alpha);
        img.pixel = true;
        img.vertexRoundMode = 'full';
        ShadowLayer.follow(img, x, y);
        return img;
    }

    // Atualiza posição/tamanho. `lift` = altura do dono acima do chão (encolhe e clareia a sombra).
    // Sombras de pixel só acompanham a posição, alinhadas à grade de pixels da arte (sem escala).
    static follow (shadow, x, y, lift = 0, sizeMul = 1) {
        if (shadow.pixel) {
            const g = PIXEL_SCALE;
            shadow.setPosition(Math.round((x + SHADOW.offsetX) / g) * g, Math.round((y + SHADOW.offsetY) / g) * g);
            return;
        }
        const k = Math.max(0.35, 1 - lift / 220);
        shadow.setPosition(x + SHADOW.offsetX + lift * 0.12, y + SHADOW.offsetY + lift * 0.05);
        shadow.setDisplaySize(shadow.baseW * k * sizeMul, shadow.baseH * k * sizeMul);
        shadow.setAlpha(SHADOW.alpha * (0.45 + 0.55 * k));
    }
}
