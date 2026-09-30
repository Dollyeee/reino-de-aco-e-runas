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

import { DECOR_ITEMS, DECOR_KITS } from './decor.js';
import { TOWER_ART } from './towerArt.js';
import { BALANCE } from './balance.js';

// ---------------------------------------------------------------------------------------------------------
// Versão das torres (T19): 'atual' (SVGs, padrão até a escolha) | 'a' | 'b' | 'c' (pixel art, src/config/towerArt.js).
// Para testar sem editar este arquivo: ?besta=a&catapulta=c na URL. Comparação: tools/pixel-art/escolha-torres.html.
export const TOWER_VARIANT = {
    laserCrossbow: 's',          // Besta solo (T26), aprovada pelo usuário; 'n' = Besta nova (T22), 'atual' = SVG
    plasmaCatapult: 'atual'
};

function pickTowerVariants () {
    const out = { ...TOWER_VARIANT };
    try {
        const q = new URLSearchParams(globalThis.location ? globalThis.location.search : '');
        for (const [tower, param] of [['laserCrossbow', 'besta'], ['plasmaCatapult', 'catapulta']]) {
            const v = q.get(param);
            if (v && (v === 'atual' || TOWER_ART[tower][v])) { out[tower] = v; }
        }
    } catch (e) { /* fora do navegador (gerador): usa TOWER_VARIANT */ }
    return out;
}
export const TOWER_ACTIVE = pickTowerVariants();

const TOWER_FILES = { laserCrossbow: ['besta', 'head', 'cabeca'], plasmaCatapult: ['catapulta', 'arm', 'braco'] };

// Torre em pixel art ativa (encaixes de towerArt.js + chaves de textura) ou null se for a arte atual (SVG).
export function towerPixel (tower) {
    const v = TOWER_ACTIVE[tower];
    if (!v || v === 'atual') { return null; }
    const [file, , pieceFile] = TOWER_FILES[tower];
    return { variant: v, ...TOWER_ART[tower][v], baseKey: `torre-${file}-${v}-base`, pieceKey: `torre-${file}-${v}-${pieceFile}` };
}

// raio ocupado no chão pela torre: o da arte ativa (TOWER_ART…footprintRadius, ex.: Besta solo) ou o de BALANCE
export function towerFootprint (tower) {
    return towerPixel(tower)?.footprintRadius ?? BALANCE.towers[tower].footprintRadius;
}

// ---------------------------------------------------------------------------------------------------------
// Kit de decoração (T15/T18): 'a' Bosque antigo (padrão, escolhido na T18) | 'b' Fronteira de pinheiros |
// 'c' Floresta rúnica. Cada mapa pode ter o seu (`decorKit` no arquivo do mapa) e trocar o kit de itens soltos
// (`kit` no item). Itens e encaixes: src/config/decor.js. Comparação dos kits: tools/pixel-art/escolha-decoracao.html.
export const DECOR_KIT = 'a';

// Teste: ?decor=b na URL força um kit no mapa inteiro (ignora `decorKit` e os `kit` dos itens).
function pickDecorForce () {
    try {
        const q = new URLSearchParams(globalThis.location ? globalThis.location.search : '').get('decor');
        if (q && DECOR_KITS[q]) { return q; }
    } catch (e) { /* fora do navegador (gerador) */ }
    return null;
}
export const DECOR_FORCE = pickDecorForce();

// kit base de um mapa
export function mapDecorKit (map) {
    return map.decorKit || DECOR_KIT;
}

// ---------------------------------------------------------------------------------------------------------
// Versão do Orc Cibernético usada no jogo: 'b' (padrão, "Saqueador", escolhida na T09 e ajustada na T10) | 'atual'
// (orc da T08, mantido como alternativa). As versões A e C viraram arte para inimigos futuros
// (tools/pixel-art/sprites/futuros/). Para testar sem editar este arquivo: ?orc=atual (ou ?orc=b) na URL.
export const ORC_VARIANT = 'b';

// Arquivos (gerados por `npm run pixel`, tools/pixel-art/sprites/) e pontos de encaixe de cada versão.
export const ORC_VARIANTS = {
    atual: { label: 'Atual (T08)', prefix: 'orc', frame: [116, 104], pivot: [58, 104],
             eye: { x: 39, y: -66 }, hit: { x: 0, y: -54 }, top: -96, shadow: [56, 16], walkCycle: 44 },
    // T13: redesenhado na grade 0,75 → ~80 px de altura (antes: quadro 136×110, ~107 px)
    b:     { label: 'Saqueador', prefix: 'orc-b', frame: [102, 83], pivot: [46, 83],
             eye: { x: 25, y: -65 }, hit: { x: 0, y: -45 }, top: -80, shadow: [42, 11], walkCycle: 33 }
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


    'projectile-bolt':      { file: 'projectile-bolt.svg', size: [52, 18], pivot: [26, 9] },
    'projectile-plasma':    { file: 'projectile-plasma.svg', size: [40, 40], pivot: [20, 20] },

    'icon-ether':           { file: 'icon-ether.svg', size: [48, 48], pivot: [24, 24] },
    'icon-core':            { file: 'icon-core.svg', size: [48, 48], pivot: [24, 24] },
    'icon-wave':            { file: 'icon-wave.svg', size: [48, 48], pivot: [24, 24] }
};

// torres em pixel art da versão ativa: base (imagem) + peça que gira (folha com um quadro por ângulo)
for (const [tower, [file, piece, pieceFile]] of Object.entries(TOWER_FILES)) {
    const v = TOWER_ACTIVE[tower];
    if (v === 'atual') { continue; }
    const d = TOWER_ART[tower][v];
    ART[`torre-${file}-${v}-base`] = d.base.frames > 1
        // base com idle (folha de quadros em loop)
        ? { file: `torre-${file}-${v}-base.png`, pixel: true, frame: d.base.frame, size: d.base.frame, pivot: d.base.pivot,
            anims: { idle: { start: 0, end: d.base.frames - 1, frameRate: d.base.fps || 6, repeat: -1 } } }
        : { file: `torre-${file}-${v}-base.png`, pixel: true, size: d.base.frame, pivot: d.base.pivot };
    const P = d[piece];
    ART[`torre-${file}-${v}-${pieceFile}`] = { file: `torre-${file}-${v}-${pieceFile}.png`, pixel: true, frame: P.frame, size: P.frame, pivot: P.pivot };
}

// decoração em pixel art: todos os itens de todos os kits (mapas misturam kits); chaves 'decor-<kit>-<item>'
for (const [kit, K] of Object.entries(DECOR_KITS)) {
    for (const item of DECOR_ITEMS) {
        const d = K.items[item];
        ART[`decor-${kit}-${item}`] = { file: `decor-${kit}-${item}.png`, pixel: true, size: d.frame, pivot: d.pivot, glow: d.glow };
    }
}

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
    'projectile-plasma': [34, 14],
    'projectile-bolt': [26, 9]
};
