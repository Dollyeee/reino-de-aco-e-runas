// VERSÃO 2 CONGELADA da paleta (3 tons). Usada só no comparativo do preview.
// Paleta fixa da pixel art. Cada material é uma rampa de 3 tons: [escuro, médio, claro].
// A luz vem do canto superior esquerdo: claro em cima/esquerda, escuro embaixo/direita.

export const OUTLINE = '#1e1512';

export const MATERIALS = {
    pele: ['#3e5422', '#688434', '#92ae4e'],
    aco: ['#262a32', '#424a56', '#6e7886'],
    acoClaro: ['#424a56', '#6e7886', '#aab4c0'],   // mesmas cores do aço, um degrau acima (placas em destaque)
    couro: ['#342418', '#543a26', '#705034'],
    tecido: ['#54221a', '#803828', '#9c4e38'],
    ciano: ['#14788c', '#3ff5ff', '#c8fdff'],
    vermelho: ['#78101c', '#ff3b4e', '#ffd0c8'],
    presa: ['#aaa082', '#e8dcc0', '#fffaec']
};

// Cores avulsas (detalhes pintados por cima, sem sombreamento).
export const SINGLE = {
    acoDestaque: '#aab4c0',
    ferrugem: '#7a4a2c'
};

// Índices da rampa
export const DARK = 0;
export const MID = 1;
export const LIGHT = 2;
