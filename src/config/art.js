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
//   pixel          (pixel art gerada por `npm run pixel`) 1 pixel do arquivo = PIXEL_SCALE px do mundo (hoje 1×),
//                  filtro NEAREST; o código não aplica escala fracionada nem rotação nesses sprites.
//   frame [w, h]   (sprite sheet) tamanho de UM quadro em pixels do arquivo; os quadros ficam lado a lado.
//   anims          (sprite sheet) animações: { nome: { start, end, frameRate, repeat } }
//   meta           (sprite sheet) JSON gerado por `npm run pixel` com dados por quadro (ex.: posição do olho)
//   walkCycle      (inimigos com caminhada) px do mundo andados por ciclo; padrão ENEMY_ANIM.walkCycle
//   demais pontos  (headMount, muzzle, cup, eye...) são deslocamentos em pixels lógicos a partir do pivot.
//
// Trocar SVG por PNG: mude só `file` (e `scale`, se o arquivo for em alta resolução). Mantendo `size`
// e `pivot`, todo o encaixe continua igual.

// ---------------------------------------------------------------------------------------------------------
// Versão do Orc Cibernético usada no jogo: 'b' (padrão, "Saqueador", escolhida na T09 e ajustada na T10) | 'atual'
// (orc da T08, mantido como alternativa). As versões A e C viraram arte para inimigos futuros
// (tools/pixel-art/sprites/futuros/). Para testar sem editar este arquivo: ?orc=atual (ou ?orc=b) na URL.
export const ORC_VARIANT = 'b';

// Arquivos (gerados por `npm run pixel`, tools/pixel-art/sprites/) e pontos de encaixe de cada versão.
export const ORC_VARIANTS = {
    atual: { label: 'Atual (T08)', prefix: 'orc', frame: [116, 104], pivot: [58, 104],
             eye: { x: 39, y: -66 }, hit: { x: 0, y: -54 }, top: -96, shadow: [56, 16], walkCycle: 44 },
    b:     { label: 'Saqueador', prefix: 'orc-b', frame: [136, 110], pivot: [61, 110],
             eye: { x: 33, y: -86 }, hit: { x: 0, y: -60 }, top: -106, shadow: [56, 15], walkCycle: 44 }
};

function pickOrcVariant () {
    let v = ORC_VARIANT;
    try {
        const q = new URLSearchParams(globalThis.location ? globalThis.location.search : '').get('orc');
        if (q && ORC_VARIANTS[q]) { v = q; }
    } catch (e) { /* fora do navegador (gerador): usa ORC_VARIANT */ }
    return v;
}

export const ORC_ACTIVE = pickOrcVariant();
const ORC = ORC_VARIANTS[ORC_ACTIVE];

export const ART = {
    // chão do mapa 1 (pixel art 1×, 1280×720 = mundo inteiro); meta = dados do mapa usados no desenho
    'ground-map01':         { file: 'chao-map01.png', pixel: true, size: [1280, 720], pivot: [0, 0], meta: 'chao-map01.json' },

    'build-slot':           { file: 'build-slot.svg', size: [100, 60], pivot: [50, 25] },

    'tower-crossbow-base':  { file: 'tower-crossbow-base.svg', size: [88, 88], pivot: [44, 88],
                              headMount: { x: 0, y: -61 } },
    'tower-crossbow-head':  { file: 'tower-crossbow-head.svg', size: [116, 66], pivot: [58, 33],
                              muzzle: { x: 54, y: 0 }, crystal: { x: -21, y: 0 } },

    'tower-catapult-base':  { file: 'tower-catapult-base.svg', size: [128, 104], pivot: [64, 104],
                              armPivot: { x: 0, y: -52 } },
    'tower-catapult-arm':   { file: 'tower-catapult-arm.svg', size: [52, 108], pivot: [26, 100],
                              cup: { x: 0, y: -88 }, orb: { x: 0, y: -94 } },

    // pixel art 1× (tools/pixel-art/sprites/): quadro = tamanho no mundo; versão escolhida em ORC_VARIANT
    'enemy-cyber-orc':      { file: `${ORC.prefix}-walk.png`, pixel: true, frame: ORC.frame, size: ORC.frame, pivot: ORC.pivot,
                              anims: { walk: { start: 0, end: 7, frameRate: 10, repeat: -1 } },
                              meta: `${ORC.prefix}-walk.json`, idle: 'enemy-cyber-orc-idle', walkCycle: ORC.walkCycle,
                              eye: ORC.eye, hit: ORC.hit, top: ORC.top },
    'enemy-cyber-orc-idle': { file: `${ORC.prefix}.png`, pixel: true, size: ORC.frame, pivot: ORC.pivot },

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
    'enemy-cyber-orc': ORC.shadow,   // pixel art: elipse de pixels (depende da versão do orc)
    'castle': [270, 60],
    'tree': [80, 26],
    'rock': [66, 20],
    'crystal-cluster': [72, 22],
    'projectile-plasma': [34, 14],
    'projectile-bolt': [26, 9]
};
