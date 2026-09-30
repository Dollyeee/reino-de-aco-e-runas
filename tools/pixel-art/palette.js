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
    vermelho: ['#3a0a26', '#78101c', '#ff3b4e', '#ff9a78', '#fff0d8'],
    fogo: ['#4a1020', '#a8321c', '#ec6a24', '#ffae3c', '#ffe8a0'],        // emissivo: explosões, brasas, forja

    // cenário (T12): mais escuro e dessaturado que os personagens, para eles se destacarem
    grama: ['#232d2c', '#35432f', '#4b5a36', '#627040', '#858b52'],
    // variação por região (T13): quase imperceptível, ± um passo pequeno em volta da grama base
    gramaSol: ['#242f2b', '#384630', '#4f5e38', '#667443', '#898f55'],
    gramaSombra: ['#222b2c', '#33412f', '#475634', '#5e6c3e', '#81884f'],
    // musgo (T13): entre os tons 1 e 2 da grama, mais oliva; manchas pequenas com folhinhas
    musgo: ['#1f292a', '#2e3b2d', '#404f31', '#55643a', '#74804a'],
    terra: ['#35272a', '#58443a', '#7a6049', '#977b5b', '#b59c76'],
    pedra: ['#23222c', '#3d3c46', '#5b5a5f', '#7c7a76', '#a5a18f'],
    madeira: ['#26161e', '#472a26', '#6e442c', '#946236', '#bf8e4c'],

    // decoração (T15): um pouco menos saturada e contrastada que orcs e torres, para não competir com eles
    folhagem: ['#1a2226', '#2a3930', '#3d5037', '#556b41', '#7a8a55'],        // copas de carvalho (verde-musgo)
    pinho: ['#131b21', '#1c2b2c', '#283d35', '#37523f', '#557050'],           // pinheiros e abetos (escuro)
    folhagemRunica: ['#15191f', '#1f2a2e', '#2b3c3b', '#3c534c', '#5b7466'],  // copas da floresta rúnica
    casca: ['#1f191e', '#352a29', '#4c3c33', '#665140', '#857056'],           // troncos
    cascaEscura: ['#141218', '#221d24', '#322a30', '#463a3e', '#62545a'],     // troncos da floresta rúnica
    cerne: ['#3a2a26', '#5c4535', '#7d6247', '#9c7f5c', '#bba07a'],           // madeira cortada (toco)
    pedraFria: ['#1b1d28', '#2e323d', '#474c57', '#646b73', '#8e949a'],       // pedras angulosas cinza-frias
    pedraRunica: ['#15151d', '#25242d', '#37363f', '#4d4b52', '#6e6b6c'],     // pedras escuras com fissuras
    cristal: ['#152238', '#1c3c55', '#2a6878', '#4a9aa2', '#9fdcd6'],         // corpo dos cristais (o brilho é o ciano)

    // T22: azul do reino (estandartes, tecidos do castelo) — fosco, para não competir com o ciano
    azul: ['#161a33', '#232f5c', '#304a86', '#4a6aa8', '#7f9ccc']
};

// Cores avulsas
export const SINGLE = {
    ferrugem: '#7a4a2c',
    ferrugemEscura: '#4e2c26',
    // flores do chão: pétalas dessaturadas + miolo
    florCreme: '#c4bd9c',
    florAmarela: '#b9a55e',
    florLilas: '#958aa4',
    florMiolo: '#e0cf82'
};

// Índices da rampa
export const T0 = 0, T1 = 1, T2 = 2, T3 = 3, T4 = 4;
