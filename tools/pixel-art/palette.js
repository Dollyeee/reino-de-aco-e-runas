// Paleta fixa da pixel art (1×). Cada material é uma rampa de 5 tons com hue shift:
//   [0 mais escuro, 1 escuro, 2 médio, 3 claro, 4 mais claro]
//   sombras puxam para roxo/azul frio; luzes puxam para amarelo quente.
// A luz vem do canto superior esquerdo.

export const OUTLINE = '#1e1512';     // contorno externo da silhueta

export const MATERIALS = {
    pele: ['#243028', '#3a5230', '#5f7f35', '#8aa845', '#c4d06a'],
    // variações de pele (versões do orc): oliva escura (A), verde claro (B), verde-acinzentada (C)
    peleOliva: ['#1e2226', '#2f3a2c', '#4a5a2e', '#6b7a3a', '#a0a45a'],
    peleClara: ['#26382e', '#3f6436', '#68963e', '#98c052', '#d6e67c'],
    peleCinza: ['#22282e', '#3a4644', '#5a6a5a', '#7f8f7a', '#b6bea2'],
    aco: ['#1c1a2a', '#2e3244', '#474f60', '#6f7886', '#b8b8ae'],
    acoClaro: ['#2e3244', '#474f60', '#6e7688', '#9ea6b0', '#dedcc8'],
    couro: ['#22161e', '#3c2a26', '#5a3e2a', '#7a5634', '#a67c46'],
    tecido: ['#2e1226', '#54202c', '#80352c', '#a24e36', '#c87c4a'],
    borracha: ['#16121c', '#261e2c', '#3a2e40', '#54445a', '#7e6c80'],   // cabos e mangueiras
    presa: ['#4e4656', '#8e8474', '#cbbd9c', '#e9ddbc', '#fffaec'],
    // emissivos (olho, runas, plasma): núcleo claro + halo nos tons da rampa
    ciano: ['#0c3252', '#14788c', '#3ff5ff', '#a8fcf0', '#f2fff0'],
    vermelho: ['#3a0a26', '#78101c', '#ff3b4e', '#ff9a78', '#fff0d8']
};

// Cores avulsas
export const SINGLE = {
    ferrugem: '#7a4a2c',
    ferrugemEscura: '#4e2c26'
};

// Índices da rampa
export const T0 = 0, T1 = 1, T2 = 2, T3 = 3, T4 = 4;
