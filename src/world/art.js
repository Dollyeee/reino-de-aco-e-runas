import { ART } from '../config/art.js';
import { FONT, FONT_NUMBERS, RENDER_SCALE, WORLD } from '../config/visual.js';

// Os SVGs são rasterizados em RENDER_SCALE. Este fator traz a imagem de volta ao tamanho do mundo.
export const ART_SCALE = 1 / RENDER_SCALE;

// Cria uma imagem de arte com origem e escala corretas.
// `scale` é a escala visual desejada (1 = tamanho do SVG em pixels do mundo).
export function addArt (scene, x, y, key, scale = 1) {
    const def = ART[key];
    const img = scene.add.image(x, y, key);
    img.setOrigin(def.origin[0], def.origin[1]);
    img.setScale(ART_SCALE * scale);
    img.baseScale = ART_SCALE * scale;
    return img;
}

// Mesma coisa, mas sem adicionar à cena (para colocar dentro de Containers).
export function makeArt (scene, x, y, key, scale = 1) {
    const def = ART[key];
    const img = scene.make.image({ x, y, key }, false);
    img.setOrigin(def.origin[0], def.origin[1]);
    img.setScale(ART_SCALE * scale);
    img.baseScale = ART_SCALE * scale;
    return img;
}

// Ponto de encaixe definido no manifesto (ex.: ART['castle'].core).
export function anchor (key, name) {
    return ART[key][name];
}

// Câmera que enxerga exatamente o mundo 1280×720, em qualquer RENDER_SCALE.
export function setupWorldCamera (camera) {
    camera.setZoom(RENDER_SCALE);
    camera.centerOn(WORLD.width / 2, WORLD.height / 2);
    return camera;
}

// Estilo de texto padrão (títulos, nomes, avisos): Cinzel com contorno marrom-escuro.
export function textStyle (size, color = '#f1e6cf', extra = {}) {
    return Object.assign({
        fontFamily: FONT,
        fontStyle: 'bold',
        fontSize: `${size}px`,
        color,
        stroke: '#1e1512',
        strokeThickness: Math.max(3, Math.round(size / 6)),
        resolution: RENDER_SCALE,
        shadow: { offsetX: 0, offsetY: Math.max(1, Math.round(size / 16)), color: '#1e1512', blur: 0, fill: true, stroke: true }
    }, extra);
}

// Estilo para números (HUD, custos, dano): Oxanium, mais técnico e legível em tamanhos pequenos.
export function numberStyle (size, color = '#f1e6cf', extra = {}) {
    return textStyle(size, color, Object.assign({ fontFamily: FONT_NUMBERS }, extra));
}
