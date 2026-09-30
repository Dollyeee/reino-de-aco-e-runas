// Manifesto de arte: cada asset em public/assets/ e seus pontos de encaixe.
// A especificação para quem produz a arte está em ART_SPEC.md (raiz do projeto).
//
// Formatos aceitos (pela extensão de `file`): .svg, .png, .webp
//
// Campos (todas as medidas em PIXELS LÓGICOS = pixels do mundo do jogo, independentes do arquivo):
//   size   [w, h]  tamanho lógico do asset no jogo.
//   pivot  [x, y]  ponto de ancoragem dentro do quadro (medido a partir do canto superior esquerdo).
//                  É o ponto que fica na posição do objeto (ex.: pés = borda inferior central).
//   scale          (opcional, só PNG/WebP) densidade do arquivo: 2 = arquivo com o dobro do tamanho lógico,
//                  4 = quádruplo... Padrão 1. SVG não precisa: é rasterizado já na resolução da tela.
//   pixel          (pixel art gerada por `npm run pixel`) 1 pixel do arquivo = PIXEL_SCALE px do mundo,
//                  filtro NEAREST; o código não aplica escala fracionada nem rotação nesses sprites.
//   frame [w, h]   (sprite sheet) tamanho de UM quadro em pixels do arquivo; os quadros ficam lado a lado.
//   anims          (sprite sheet) animações: { nome: { start, end, frameRate, repeat } }
//   demais pontos  (headMount, muzzle, cup, eye...) são deslocamentos em pixels lógicos a partir do pivot.
//
// Trocar SVG por PNG: mude só `file` (e `scale`, se o arquivo for em alta resolução). Mantendo `size`
// e `pivot`, todo o encaixe continua igual.

export const ART = {
    'build-slot':           { file: 'build-slot.svg', size: [100, 60], pivot: [50, 25] },

    'tower-crossbow-base':  { file: 'tower-crossbow-base.svg', size: [88, 88], pivot: [44, 88],
                              headMount: { x: 0, y: -61 } },
    'tower-crossbow-head':  { file: 'tower-crossbow-head.svg', size: [116, 66], pivot: [58, 33],
                              muzzle: { x: 54, y: 0 }, crystal: { x: -21, y: 0 } },

    'tower-catapult-base':  { file: 'tower-catapult-base.svg', size: [128, 104], pivot: [64, 104],
                              armPivot: { x: 0, y: -52 } },
    'tower-catapult-arm':   { file: 'tower-catapult-arm.svg', size: [52, 108], pivot: [26, 100],
                              cup: { x: 0, y: -88 }, orb: { x: 0, y: -94 } },

    // pixel art (tools/pixel-art/sprites/orc.js): quadro 60×52 → 120×104 no mundo
    'enemy-cyber-orc':      { file: 'orc-walk.png', pixel: true, frame: [60, 52], size: [120, 104], pivot: [60, 104],
                              anims: { walk: { start: 0, end: 7, frameRate: 10, repeat: -1 } },
                              idle: 'enemy-cyber-orc-idle',
                              eye: { x: 37, y: -68 }, hit: { x: 0, y: -44 }, top: -98 },
    'enemy-cyber-orc-idle': { file: 'orc.png', pixel: true, size: [120, 104], pivot: [60, 104] },

    'castle':               { file: 'castle.svg', size: [260, 272], pivot: [130, 272],
                              core: { x: 0, y: -178 }, pedestal: { x: 0, y: -122 } },
    'core-crystal':         { file: 'core-crystal.svg', size: [76, 124], pivot: [38, 62] },

    'tree':                 { file: 'tree.svg', size: [100, 122], pivot: [50, 122] },
    'rock':                 { file: 'rock.svg', size: [76, 56], pivot: [38, 56] },
    'crystal-cluster':      { file: 'crystal-cluster.svg', size: [84, 86], pivot: [42, 86],
                              glow: { x: 2, y: -46 } },

    'projectile-bolt':      { file: 'projectile-bolt.svg', size: [52, 18], pivot: [26, 9] },
    'projectile-plasma':    { file: 'projectile-plasma.svg', size: [40, 40], pivot: [20, 20] },

    'icon-ether':           { file: 'icon-ether.svg', size: [48, 48], pivot: [24, 24] },
    'icon-core':            { file: 'icon-core.svg', size: [48, 48], pivot: [24, 24] },
    'icon-wave':            { file: 'icon-wave.svg', size: [48, 48], pivot: [24, 24] }
};

export function artFormat (key) {
    return ART[key].file.split('.').pop().toLowerCase();
}

// Tamanho das sombras elípticas no chão (largura, altura) por tipo de objeto, em pixels do mundo.
export const SHADOWS = {
    'build-slot': [96, 34],
    'tower-crossbow': [84, 30],
    'tower-catapult': [124, 38],
    'enemy-cyber-orc': [56, 16],   // pixel art: elipse de pixels (28×8 px da arte)
    'castle': [270, 60],
    'tree': [80, 26],
    'rock': [66, 20],
    'crystal-cluster': [72, 22],
    'projectile-plasma': [34, 14],
    'projectile-bolt': [26, 9]
};
