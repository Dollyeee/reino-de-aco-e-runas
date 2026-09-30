// Paleta fixa da pixel art (1×). Cada material é uma rampa de 5 tons com hue shift:
//   [0 mais escuro, 1 escuro, 2 médio, 3 claro, 4 mais claro]
//   sombras puxam para roxo/azul frio; luzes puxam para amarelo quente.
// A luz vem do canto superior esquerdo.

export const OUTLINE = '#1e1512';     // contorno externo da silhueta

export const MATERIALS = {
    pele: ['#243028', '#3a5230', '#5f7f35', '#8aa845', '#c4d06a'],
    aco: ['#1c1a2a', '#2e3244', '#474f60', '#6f7886', '#b8b8ae'],
    acoClaro: ['#2e3244', '#474f60', '#6e7688', '#9ea6b0', '#dedcc8'],
    couro: ['#22161e', '#3c2a26', '#5a3e2a', '#7a5634', '#a67c46'],
    tecido: ['#2e1226', '#54202c', '#80352c', '#a24e36', '#c87c4a'],
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
