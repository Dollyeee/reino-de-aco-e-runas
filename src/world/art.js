import { ART, artFormat } from '../config/art.js';
import { FONT, FONT_NUMBERS, PIXEL_SCALE, RENDER_SCALE, WORLD } from '../config/visual.js';

// Fator que converte pixels do ARQUIVO carregado em pixels LÓGICOS do mundo.
//   pixel art: 1 px do arquivo = PIXEL_SCALE px do mundo (escala inteira).
//   SVG: rasterizado em size × RENDER_SCALE → fator 1 / RENDER_SCALE.
//   PNG/WebP: carregado no tamanho nativo (size × scale) → fator 1 / scale.
export function artPixelFactor (key) {
    const def = ART[key];
    if (def.pixel) { return PIXEL_SCALE; }
    return artFormat(key) === 'svg' ? 1 / RENDER_SCALE : 1 / (def.scale || 1);
}

export function isPixelArt (key) {
    return !!ART[key].pixel;
}

function setupArt (img, key, scale) {
    const def = ART[key];
    img.setOrigin(def.pivot[0] / def.size[0], def.pivot[1] / def.size[1]);
    img.baseScale = artPixelFactor(key) * scale;
    img.setScale(img.baseScale);
    // pixel art: vértices sempre em pixels inteiros (também durante tremidas de câmera)
    if (def.pixel) { img.vertexRoundMode = 'full'; }
    return img;
}

// Cria uma imagem de arte com origem e escala corretas.
// `scale` é a escala visual desejada (1 = tamanho lógico do asset em pixels do mundo).
export function addArt (scene, x, y, key, scale = 1) {
    return setupArt(scene.add.image(x, y, key), key, scale);
}

// Mesma coisa, mas sem adicionar à cena (para colocar dentro de Containers).
export function makeArt (scene, x, y, key, scale = 1) {
    return setupArt(scene.make.image({ x, y, key }, false), key, scale);
}

// Sprite (com animações de sprite sheet), sem adicionar à cena.
export function makeSprite (scene, x, y, key, scale = 1) {
    return setupArt(scene.make.sprite({ x, y, key }, false), key, scale);
}

// Chave global da animação de um asset (criada no BootScene a partir de ART[key].anims).
export function animKey (key, name) {
    return `${key}:${name}`;
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
