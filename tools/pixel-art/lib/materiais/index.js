// Biblioteca de materiais "à mão" (T22): peças desenhadas pixel a pixel como grades de caracteres, mapeadas para a
// paleta (tools/pixel-art/palette.js). Reutilizáveis em todas as torres e no castelo (compostas com lib/Grade.js).
//
// Convenção das chaves (quando não indicado): a = tom 4 (brilho), b = tom 3 (luz), c = tom 2 (base), d = tom 1 (sombra),
// e = tom 0 (sombra funda / rejunte / fresta), '.' = vazio. Letras maiúsculas = pixel protegido na limpeza (k).
// Luz sempre do canto superior esquerdo: bordas de cima/esquerda claras, de baixo/direita escuras — mas sem contornar
// todas as bordas (nada de "pillow shading").

// monta a tabela de uma peça: { a: [mat, 4], b: [mat, 3], ... } + extras
export function key (mat, extra = {}) {
    const k = { a: [mat, 4], b: [mat, 3], c: [mat, 2], d: [mat, 1], e: [mat, 0] };
    for (const [ch, v] of Object.entries(k)) { k[ch.toUpperCase()] = [v[0], v[1], { k: true }]; }
    return { ...k, ...extra };
}

const MUSGO = { m: ['musgo', 2], n: ['musgo', 3], o: ['musgo', 1] };

// ------------------------------------------------------------------------------------------ pedra
// Bloco da FRENTE de uma parede de pedra (12×7 com o rejunte na última coluna e na última linha). 3 variações.
// T22 R3: o rejunte horizontal fica no tom 1 com trechos no tom 0 (todo no tom 0 virava listras — banding).
export const pedraFrente = [
    { rows: [
        'abbbbbbbbbbe',
        'bcccccccccde',
        'bccdcccccdde',
        'bcccccccccde',
        'bcccccbcccde',
        'ccdddddddddE',
        'deeedddddeee'
    ], key: key('pedra', MUSGO) },
    { rows: [
        'abbbbbbbbbbe',
        'bccccccdccde',
        'bcccccdcccde',
        'bcccccccccde',
        'bccccccccdde',
        'ccddddddddnm',
        'dddeemmddeee'
    ], key: key('pedra', MUSGO) },
    { rows: [
        'abbbbbbbbbbe',
        'bcccccccccde',
        'bcbccccccdde',
        'bccccccccdde',
        'bcccccccccde',
        'ccdddddddddm',
        'eedddddeeene'
    ], key: key('pedra', MUSGO) }
];

// Bloco do TOPO de uma parede de pedra (face que recebe luz): claro, rejunte suave no tom 1.
export const pedraTopo = [
    { rows: [
        'bbbbbbbbbbbd',
        'babbbbbbbbbd',
        'bbbbbbbabbbd',
        'dddddddddddd'
    ], key: key('pedra') },
    { rows: [
        'bbbbbbbbbbbd',
        'bbbbbabbbbbd',
        'bbbbbbbbbabd',
        'dddddddddddd'
    ], key: key('pedra') }
];

// Bloco da LATERAL (face em sombra): escuro, rejunte no tom 0.
export const pedraLado = [
    { rows: [
        'dddde',
        'cddde',
        'dddde',
        'ddcde',
        'dddde',
        'dddde',
        'eeeee'
    ], key: key('pedra') }
];

// Ameia de pedra (merlão) com o topo visível, câmera 3/4 frontal (topo reto sobre a frente — revisão da besta-r3): 10×11.
export const ameia = { rows: [
    'abbbbbbbbd',
    'bbbbbbbbbd',
    'bbbbbbbbdd',
    'dddddddddd',
    'bccccccccd',
    'bccccccccd',
    'bccdccccdd',
    'bcccccccde',
    'bccccccdde',
    'cdddddddde',
    'eeeeeeeeee'
], key: key('pedra', MUSGO) };

// Tufo de musgo para frestas (3×2)
export const musgoFresta = { rows: ['.n.', 'mmo'], key: MUSGO };

// ------------------------------------------------------------------------------------------ madeira
// Tábuas VERTICAIS (parede): 6 de largura (5 de tábua + 1 de fresta) × 16, veio e um nó. T22 R3: a fresta alterna
// tom 0 e 1 e a tábua ficou 1 px mais larga (frestas a cada 5 px viravam "código de barras" no tamanho real).
export const tabuaV = { rows: [
    'bcccde', 'bcccdd', 'bccdde', 'bcccde', 'bcccdd', 'bdccde', 'bcccde', 'bcccdd',
    'bccdde', 'bcdDde', 'bcccde', 'bcccdd', 'bdccde', 'bcccde', 'bcccdd', 'bccdde'
], key: key('madeira') };

// Tábuas HORIZONTAIS (frente de viga/piso): 16 × 4 (3 de tábua + 1 de fresta).
export const tabuaH = { rows: [
    'bbbbbbbbbbbbbbbb',
    'ccccdcccccccdccc',
    'cccccccdcccccccc',
    'eeeeeeeeeeeeeeee'
], key: key('madeira') };

// Tábuas do PISO visto de cima (mais claras): 16 × 4.
export const tabuaTopo = { rows: [
    'bbbbbbbbbabbbbbb',
    'bbbbcbbbbbbbbcbb',
    'bbbbbbbcbbbbbbbb',
    'dddddddddddddddd'
], key: key('madeira') };

// Poste grosso (coluna 6 de largura, repete na vertical).
export const poste = { rows: [
    'bbcccd', 'bccccd', 'bccdcd', 'bccccd', 'bbcccd', 'bccccd', 'bcdccd', 'bccccd'
], key: key('madeira') };

// Ponta de tábua / de viga (cerne visto de frente): 4×3.
export const pontaTabua = { rows: ['bbad', 'bcbd', 'dddd'], key: key('cerne') };

// ------------------------------------------------------------------------------------------ ferro
// Cinta de ferro horizontal (12×3) — repete; rebite separado.
export const cintaH = { rows: [
    'bbbbbbbbbbbb',
    'cccccccccccc',
    'dddddddddddd'
], key: key('aco') };
// Rebite: 1 px de brilho + 1 px de sombra embaixo/à direita (protegidos na limpeza).
export const rebite = { rows: ['A.', '.E'], key: key('aco') };
// Cantoneira de ferro (canto de viga) 4×5 com rebite.
export const cantoneira = { rows: ['bbbd', 'bAcd', 'bcEd', 'bccd', 'dddd'], key: key('aco') };

// ------------------------------------------------------------------------------------------ corda
// Amarração de corda (voltas diagonais) 5×6.
export const corda = { rows: [
    'bcbcd', 'cdcdd', 'bcbcd', 'cdcdd', 'bcbcd', 'dddde'
], key: key('couro') };

// ------------------------------------------------------------------------------------------ estandarte
// Estandarte azul do reino com emblema claro e rabo bifurcado; 2 quadros (balanço de 1 px na barra de baixo).
// r = vara de madeira; y/Y = emblema (presa).
const EST = key('azul', { r: ['madeira', 3], s: ['madeira', 1], y: ['presa', 3, { k: true }], z: ['presa', 2, { k: true }] });
export const estandarte = [
    { rows: [
        'rrrrrrrrrrrs',
        '.bbcccccccd.',
        '.bcccccccdd.',
        '.bccyyyyccd.',
        '.bccyzzyccd.',
        '.bcccyycccd.',
        '.bcccyycccd.',
        '.bccccccccd.',
        '.bcccccccdd.',
        '.bccccccccd.',
        '.bcccccccdd.',
        '.bccccccccd.',
        '.bcccddcccd.',
        '.bccd..dccd.',
        '.bcd....ccd.',
        '.bd......cd.'
    ], key: EST },
    { rows: [
        'rrrrrrrrrrrs',
        '.bbcccccccd.',
        '.bcccccccdd.',
        '.bccyyyyccd.',
        '.bccyzzyccd.',
        '.bcccyycccd.',
        '.bcccyycccd.',
        '.bccccccccd.',
        '.bcccccccdd.',
        '.bccccccccd.',
        '..bcccccccdd',
        '..bccccccccd',
        '..bcccddcccd',
        '..bccd..dccd',
        '..bcd....ccd',
        '..bd......cd'
    ], key: EST }
];

// ------------------------------------------------------------------------------------------ janela
// Janela em arco com moldura de madeira escura e brilho ciano (emissivo); 2 quadros (fraco / forte).
const JAN = (glow) => key('madeira', {
    g: ['ciano', glow ? 2 : 1, { e: true }], h: ['ciano', glow ? 3 : 2, { e: true }], i: ['ciano', glow ? 4 : 2, { e: true }]
});
const JANELA_ROWS = [
    '..eddde..',
    '.edgggde.',
    'edghhhgde',
    'edghihgde',
    'edghihgde',
    'edghhhgde',
    'edgggggde',
    'eddddddde',
    'bbbbbbbbd'
];
export const janela = [{ rows: JANELA_ROWS, key: JAN(false) }, { rows: JANELA_ROWS, key: JAN(true) }];

// ------------------------------------------------------------------------------------------ runas
// Runas gravadas na pedra (3×5): sulco escuro + traço ciano DISCRETO. Quadros: apagada (tom 1) / acesa (tom 2) /
// forte (tom 3). Tons 3–4 só no pulso forte: runas quase brancas viram ruído no tamanho real (autocrítica T22).
const RUNA = (lvl) => ({
    x: ['ciano', [1, 2, 3][lvl], { e: lvl > 0, k: true }], s: ['pedra', 0, { k: true }]
});
const RUNAS_ROWS = [
    ['x.x', 'xsx', '.x.', 'xsx', 'x.x'],
    ['xx.', 'x.x', 'xx.', 'x.s', 'x..'],
    ['.x.', 'xxx', '.x.', 'x.x', 'x.x']
];
export const runas = RUNAS_ROWS.map((rows) => [0, 1, 2].map((lvl) => ({ rows, key: RUNA(lvl) })));

// ------------------------------------------------------------------------------------------ T24: peças novas
// Tronco vertical de paliçada (6 × 12, repete na vertical): casca com sulcos, luz à esquerda, sombra à direita.
export const tronco = { rows: [
    'bccccd', 'bcdccd', 'bccccd', 'bcccdd', 'bccccd', 'bdcccd',
    'bccccd', 'bccdcd', 'bccccd', 'bcccdd', 'bccccd', 'bcdccd'
], key: key('casca') };
// Ponta afiada do tronco (6 × 5) com o corte claro (cerne) de um lado.
export const pontaTronco = { rows: [
    '..ab..',
    '.abcd.',
    'abbccd',
    'bccccd',
    'bccccd'
], key: key('casca', { a: ['cerne', 3], b: ['cerne', 2] }) };
// Porta de madeira em arco com cintas de ferro (12 × 15).
export const porta = { rows: [
    '...eeeeee...',
    '..eddddcde..',
    '.edbccccdde.',
    'edbcccccdde.',
    'edbccccccdde',
    'eGGGGGGGGGGe',
    'edbccccccdde',
    'edbccccccdde',
    'edbccccHccde',
    'edbccccccdde',
    'eGGGGGGGGGGe',
    'edbccccccdde',
    'edbccccccdde',
    'edcccccccdde',
    'eeeeeeeeeeee'
], key: key('madeira', { G: ['aco', 2, { k: true }], H: ['aco', 4, { k: true }] }) };
// Seteira (fresta de flecha) com brilho ciano fraco/forte (3 × 9), 2 quadros.
const SET = (on) => ({ e: ['pedra', 0], g: ['ciano', on ? 2 : 1, { e: on, k: true }] });
const SETEIRA_ROWS = ['eee', 'ege', 'ege', 'ege', 'ege', 'ege', 'ege', 'ege', 'eee'];
export const seteira = [{ rows: SETEIRA_ROWS, key: SET(false) }, { rows: SETEIRA_ROWS, key: SET(true) }];
// Tocha: suporte de madeira + chama (fogo, emissiva) em 3 quadros (5 × 9).
const TOCHA = key('fogo', { w: ['madeira', 2], v: ['madeira', 1], r: ['aco', 2] });
for (const ch of ['a', 'b', 'c', 'd', 'e']) { TOCHA[ch] = [...TOCHA[ch].slice(0, 2), { e: true, k: true }]; }
export const tocha = [
    { rows: ['..a..', '.bab.', '.cbc.', 'dcbcd', '.ddd.', '.rrr.', '..w..', '..w..', '..v..'], key: TOCHA },
    { rows: ['.a...', '.bab.', 'cbbc.', 'dcbcd', '.ddd.', '.rrr.', '..w..', '..w..', '..v..'], key: TOCHA },
    { rows: ['...a.', '.bab.', '.cbbc', 'dcbcd', '.ddd.', '.rrr.', '..w..', '..w..', '..v..'], key: TOCHA }
];
// Cristal pequeno brotando (4 × 9): corpo 'cristal' + veio emissivo ciano; 2 quadros (brilho no topo).
const CRI = (on) => key('cristal', { g: ['ciano', on ? 3 : 2, { e: true, k: true }] });
const CRISTAL_ROWS = ['.g..', '.bc.', 'bbcd', 'bgcd', 'bgcd', 'bgdd', 'bgdd', 'bcdd', 'dddd'];
export const cristalPequeno = [{ rows: CRISTAL_ROWS, key: CRI(false) }, { rows: CRISTAL_ROWS, key: CRI(true) }];
